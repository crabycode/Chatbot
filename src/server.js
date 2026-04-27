import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ObjectId } from "mongodb";

import { config } from "./config.js";
import { closeDatabase, connectToDatabase, getDatabase } from "./db.js";
import { verifyPassword } from "./services/authService.js";
import {
  advanceWithOption,
  buildLiveView,
  buildTestSession,
  calculateReport,
  initializeNextScenario,
} from "./services/testEngine.js";
import { getGuideBySlug, guides } from "./data/guides.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const FIXED_TEST_SCENARIO_CODES = [
  "ex-employee-001",
  "ceo-fraud-002",
  "personal-data-001",
];


function toObjectId(value) {
  if (!value) {
    return null;
  }

  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}


function saveSessionAndRedirect(req, res, redirectPath) {
  req.session.save((error) => {
    if (error) {
      console.error("Failed to save session before redirect:", error);
    }

    res.redirect(redirectPath);
  });
}


function selectScenariosForTest(allScenarios) {
  const scenariosByCode = new Map(
    allScenarios.map((scenario) => [scenario.code, scenario]),
  );

  return FIXED_TEST_SCENARIO_CODES.map((scenarioCode) => {
    const scenario = scenariosByCode.get(scenarioCode);

    if (!scenario) {
      throw new Error(`Required scenario "${scenarioCode}" was not found.`);
    }

    return scenario;
  });
}


async function startServer() {
  await connectToDatabase();
  const db = getDatabase();
  const app = express();
  const passThresholdPercentage = Number((config.passThreshold * 100).toFixed(1));

  app.set("view engine", "ejs");
  app.set("views", path.join(rootDir, "views"));
  app.disable("x-powered-by");

  app.use("/static", express.static(path.join(rootDir, "public")));
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: config.mongoUri,
        dbName: config.databaseName,
        collectionName: "web_sessions",
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 8,
      },
    }),
  );

  app.use(async (req, res, next) => {
    const userId = toObjectId(req.session.userId);
    req.currentUser = userId
      ? await db.collection("users").findOne({ _id: userId, isActive: true })
      : null;

    if (!req.currentUser) {
      delete req.session.userId;
      delete req.session.activeTestSessionId;
    }

    res.locals.appName = config.appName;
    res.locals.currentUser = req.currentUser;
    res.locals.flashError = req.session.flashError || null;
    delete req.session.flashError;
    next();
  });

  async function getActiveSession(req) {
    if (!req.currentUser) {
      return null;
    }

    const sessionId = toObjectId(req.session.activeTestSessionId);
    if (!sessionId) {
      return null;
    }

    const sessionDoc = await db.collection("test_sessions").findOne({
      _id: sessionId,
      userId: req.currentUser._id,
    });

    if (!sessionDoc) {
      delete req.session.activeTestSessionId;
    }

    return sessionDoc;
  }

  function getScenarioPoolQuery() {
    return {
      code: {
        $in: FIXED_TEST_SCENARIO_CODES,
      },
    };
  }

  async function getScenarioPool() {
    return db.collection("scenarios").find(getScenarioPoolQuery()).toArray();
  }

  async function getCurrentScenario(sessionDoc) {
    const scenarioId = sessionDoc.scenarioIds[sessionDoc.currentScenarioIndex];
    if (!scenarioId) {
      return null;
    }

    return db.collection("scenarios").findOne({ _id: scenarioId });
  }

  function renderPage(res, viewName, params = {}) {
    const hasExplicitError = Object.prototype.hasOwnProperty.call(params, "error");

    return res.render(viewName, {
      appName: config.appName,
      currentUser: res.locals.currentUser,
      guides,
      passThresholdPercentage,
      hasActiveInProgressTest: false,
      error: hasExplicitError ? params.error : res.locals.flashError,
      ...params,
    });
  }

  app.get("/", (req, res) => {
    if (req.currentUser) {
      return res.redirect("/dashboard");
    }

    return res.redirect("/login");
  });

  app.get("/login", (req, res) => {
    if (req.currentUser) {
      return res.redirect("/dashboard");
    }

    return renderPage(res, "login", { error: null });
  });

  app.post("/login", async (req, res) => {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await db.collection("users").findOne({ username, isActive: true });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return renderPage(res, "login", {
        error: "Невалидни данни за вход. Провери предоставените данни.",
      });
    }

    req.session.userId = user._id.toString();
    delete req.session.activeTestSessionId;
    return saveSessionAndRedirect(req, res, "/dashboard");
  });

  app.post("/logout", (req, res) => {
    req.session.destroy(() => {
      res.redirect("/login");
    });
  });

  app.get("/dashboard", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    const activeSession = await getActiveSession(req);
    const hasActiveInProgressTest = Boolean(
      activeSession && activeSession.status === "in_progress",
    );
    const latestCompleted = await db.collection("test_sessions").findOne(
      {
        userId: req.currentUser._id,
        status: "completed",
      },
      {
        sort: { finishedAt: -1 },
      },
    );

    const latestReport = latestCompleted
      ? calculateReport(latestCompleted, config.passThreshold)
      : null;

    return renderPage(res, "dashboard", {
      activeSession,
      hasActiveInProgressTest,
      latestReport,
    });
  });

  app.get("/guides", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    return res.redirect("/report");
  });

  app.get("/guides/:slug", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    const guide = getGuideBySlug(req.params.slug);
    if (!guide) {
      req.session.flashError = "Търсеният guide не беше намерен.";
      return res.redirect("/report");
    }

    const activeSession = await getActiveSession(req);
    const hasActiveInProgressTest = Boolean(
      activeSession && activeSession.status === "in_progress",
    );

    return renderPage(res, "guide", {
      guide,
      hasActiveInProgressTest,
    });
  });

  app.post("/test/start", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    const scenarioPool = await getScenarioPool();
    if (!scenarioPool.length) {
      return renderPage(res, "dashboard", {
        activeSession: null,
        latestReport: null,
        error: "Няма налични сценарии в базата данни.",
      });
    }

    let sessionDoc;

    try {
      const scenarios = selectScenariosForTest(scenarioPool);
      sessionDoc = buildTestSession(req.currentUser._id, scenarios);
    } catch (error) {
      console.error("Failed to start test session:", error);
      return renderPage(res, "dashboard", {
        activeSession: null,
        latestReport: null,
        error:
          "Има проблем с конфигурацията на тестовите сценарии. Нужни са ex-employee-001, ceo-fraud-002 и personal-data-001.",
      });
    }

    const result = await db.collection("test_sessions").insertOne(sessionDoc);
    req.session.activeTestSessionId = result.insertedId.toString();
    return saveSessionAndRedirect(req, res, "/test/current");
  });

  app.get("/test/current", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    const sessionDoc = await getActiveSession(req);
    if (!sessionDoc) {
      return res.redirect("/dashboard");
    }

    if (sessionDoc.awaitingContinue) {
      return renderPage(res, "round-result", {
        outcome: sessionDoc.lastOutcome,
        answeredCount: sessionDoc.answeredScenarios.length,
        totalScenarios: sessionDoc.scenarioIds.length,
        isCompleted: sessionDoc.status === "completed",
      });
    }

    if (sessionDoc.status === "completed") {
      return res.redirect("/report");
    }

    const scenario = await getCurrentScenario(sessionDoc);
    if (!scenario) {
      req.session.flashError = "Текущият сценарий не може да бъде намерен.";
      return res.redirect("/dashboard");
    }

    try {
      return renderPage(res, "test", {
        view: buildLiveView(sessionDoc, scenario),
      });
    } catch (error) {
      console.error("Failed to build live view:", error);
      req.session.flashError = "Открит е проблем със сценария. Провери seed данните.";
      return res.redirect("/dashboard");
    }
  });

  app.post("/test/answer", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    const sessionDoc = await getActiveSession(req);
    if (!sessionDoc) {
      return res.redirect("/dashboard");
    }

    if (sessionDoc.awaitingContinue || sessionDoc.status === "completed") {
      return res.redirect("/test/current");
    }

    const scenario = await getCurrentScenario(sessionDoc);
    if (!scenario) {
      req.session.flashError = "Текущият сценарий не може да бъде намерен.";
      return res.redirect("/dashboard");
    }

    try {
      const updatedSession = advanceWithOption(sessionDoc, scenario, req.body.optionId);
      await db
        .collection("test_sessions")
        .replaceOne({ _id: updatedSession._id }, updatedSession);
    } catch (error) {
      console.error("Failed to process answer:", error);
      req.session.flashError = "Има проблем при обработката на избрания отговор.";
      return res.redirect("/dashboard");
    }

    return res.redirect("/test/current");
  });

  app.post("/test/continue", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    const sessionDoc = await getActiveSession(req);
    if (!sessionDoc) {
      return res.redirect("/dashboard");
    }

    if (!sessionDoc.awaitingContinue) {
      return res.redirect("/test/current");
    }

    if (sessionDoc.status === "completed") {
      return res.redirect("/report");
    }

    const scenario = await getCurrentScenario(sessionDoc);
    if (!scenario) {
      sessionDoc.status = "completed";
      sessionDoc.finishedAt = new Date();
      await db.collection("test_sessions").replaceOne({ _id: sessionDoc._id }, sessionDoc);
      return res.redirect("/report");
    }

    let updatedSession;

    try {
      updatedSession = initializeNextScenario(sessionDoc, scenario);
    } catch (error) {
      console.error("Failed to initialize next scenario:", error);
      req.session.flashError = "Следващият сценарий не може да бъде зареден.";
      return res.redirect("/dashboard");
    }

    await db.collection("test_sessions").replaceOne({ _id: updatedSession._id }, updatedSession);
    return res.redirect("/test/current");
  });

  app.get("/report", async (req, res) => {
    if (!req.currentUser) {
      return res.redirect("/login");
    }

    let sessionDoc = await getActiveSession(req);
    if (!sessionDoc) {
      sessionDoc = await db.collection("test_sessions").findOne(
        {
          userId: req.currentUser._id,
          status: "completed",
        },
        {
          sort: { finishedAt: -1 },
        },
      );
    }

    if (!sessionDoc) {
      return res.redirect("/dashboard");
    }

    if (sessionDoc.status !== "completed") {
      return res.redirect("/test/current");
    }

    return renderPage(res, "report", {
      guides,
      report: calculateReport(sessionDoc, config.passThreshold),
      sessionDoc,
    });
  });

  const server = app.listen(config.port, () => {
    console.log(`${config.appName} is running on http://localhost:${config.port}`);
  });

  server.on("error", async (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${config.port} is already in use. Stop the existing server process or change PORT in .env.`,
      );
    } else {
      console.error("Failed to start HTTP server:", error);
    }

    await closeDatabase().catch((closeError) => {
      console.error("Failed to close database after server startup error:", closeError);
    });
    process.exit(1);
  });
}


startServer().catch((error) => {
  console.error("Failed to start the server:", error);
  closeDatabase()
    .catch((closeError) => {
      console.error("Failed to close database after startup failure:", closeError);
    })
    .finally(() => {
      process.exit(1);
    });
});
