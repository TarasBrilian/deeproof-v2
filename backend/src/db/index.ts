import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.LOCAL_DATABASE!;

// Connection pool for queries
const queryClient = postgres(connectionString);

// Drizzle instance with schema
export const db = drizzle(queryClient, { schema });
