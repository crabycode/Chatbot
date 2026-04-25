import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env") });


function getNumberEnv(name, fallback) {
  const rawValue = process.env[name];
  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}


function getListEnv(name) {
  const rawValue = String(process.env[name] || "").trim();
  if (!rawValue) {
    return [];
  }

  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}


export const config = {
  appName: process.env.APP_NAME || "CYBREACH",
  port: getNumberEnv("PORT", 3000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017",
  databaseName: process.env.DATABASE_NAME || "cyber_training_bot",
  sessionSecret:
    process.env.SESSION_SECRET ||
    process.env.SECRET_KEY ||
    "change-me-before-production",
  passThreshold: getNumberEnv("PASS_THRESHOLD", 0.7),
  scenarioCodeFilter: getListEnv("SCENARIO_CODES"),
  rootDir,
};
