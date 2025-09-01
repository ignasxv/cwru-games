import 'dotenv/config';
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const connectionString = process.env.DATABASE_URL;
// Disable prefetch as it is not supported for "Transaction" pool mode
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });

// Initialize database with some sample data if empty
export async function initializeDatabase() {
  try {
    // Check if there are any games
    const gameCount = await db.select().from(schema.games);
    
    if (gameCount.length === 0) {
      // Insert some sample games
      const sampleGames = [
        { word: "CWRU", hint: "it's just an abbreviation" },
      ];

      await db.insert(schema.games).values(sampleGames);
      console.log("Sample games inserted into database");
    }

    console.log("Database initialization completed");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
