import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ObjectId } from "mongodb";

import { config } from "./config.js";
import { connectToDatabase, getDatabase } from "./db.js";
import { verifyPassword } from "./services/authService.js";
import {
  advanceWithOption,
  buildLiveView,
  buildTestSession,
  calculateReport,
  initializeNextScenario,
} from "./services/testEngine.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const SCENARIO_TIER_SELECTION = [
  { tier: "high", count: 1 },
  { tier: "medium", count: 2 },
  { tier: "low", count: 2 },
];
const ACTIVE_SCENARIO_TIERS = SCENARIO_TIER_SELECTION.map(({ tier }) => tier);


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


function shuffleArray(items) {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}


function selectScenariosForTest(allScenarios) {
  const scenariosByTier = Object.fromEntries(
    ACTIVE_SCENARIO_TIERS.map((tier) => [tier, []]),
  );

  for (const scenario of allScenarios) {
    if (ACTIVE_SCENARIO_TIERS.includes(scenario.scenarioTier)) {
      scenariosByTier[scenario.scenarioTier].push(scenario);
    }
  }

  for (const { tier, count } of SCENARIO_TIER_SELECTION) {
    if (scenariosByTier[tier].length < count) {
      throw new Error(`Not enough scenarios in tier "${tier}".`);
    }
  }

  const selectedScenarios = SCENARIO_TIER_SELECTION.flatMap(({ tier, count }) =>
    shuffleArray(scenariosByTier[tier]).slice(0, count),
  );

  return shuffleArray(selectedScenarios);
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
      scenarioTier: {
        $in: ACTIVE_SCENARIO_TIERS,
      },
    };
  }

  async function getScenarioPool() {
    return db.collection("scenarios").find(getScenarioPoolQuery()).sort({ order: 1, code: 1 }).toArray();
  }

  async function countAvailableScenarios() {
    return db.collection("scenarios").countDocuments(getScenarioPoolQuery());
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
      totalScenarios: await countAvailableScenarios(),
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
        totalScenarios: 0,
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
        totalScenarios: scenarioPool.length,
        error:
          "Има проблем с конфигурацията на тестовите сценарии. Нужни са 1 high, 2 medium и 2 low сценария.",
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
      report: calculateReport(sessionDoc, config.passThreshold),
      sessionDoc,
    });
  });

  app.listen(config.port, () => {
    console.log(`${config.appName} is running on http://localhost:${config.port}`);
  });
}


startServer().catch((error) => {
  console.error("Failed to start the server:", error);
  process.exit(1);
});
