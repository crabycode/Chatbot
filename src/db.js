import { MongoClient } from "mongodb";

import { config } from "./config.js";


const client = new MongoClient(config.mongoUri);
let database;


async function ensureIndexes(db) {
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("scenarios").createIndex({ code: 1 }, { unique: true });
  await db.collection("scenarios").createIndex({ order: 1, code: 1 });
  await db.collection("test_sessions").createIndex({ userId: 1, startedAt: -1 });
}


export async function connectToDatabase() {
  if (!database) {
    await client.connect();
    database = client.db(config.databaseName);
    await ensureIndexes(database);
  }

  return database;
}


export function getDatabase() {
  if (!database) {
    throw new Error("Database has not been initialized yet.");
  }

  return database;
}


export async function closeDatabase() {
  if (database) {
    await client.close();
    database = null;
  }
}
