import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";
import "dotenv/config";

let client: ReturnType<typeof postgres> | null = null;
function createDatabase() {
  return drizzle(sqlClient(), { schema });
}

let database: ReturnType<typeof createDatabase> | null = null;

export function sqlClient() {
  if (client) return client;

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured");

  client = postgres(url, {
    max: 2,
    prepare: false,
    idle_timeout: 20,
  });

  return client;
}

export function db() {
  if (database) return database;
  database = createDatabase();
  return database;
}
