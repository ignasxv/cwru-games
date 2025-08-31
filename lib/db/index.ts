import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const sqlite = new Database(path.join(process.cwd(), "sqlite.db"));
export const db = drizzle(sqlite, { schema });

// Initialize database with some sample data if empty
export async function initializeDatabase() {
  try {
    // Check if there are any games
    const gameCount = await db.select().from(schema.games);
    
    if (gameCount.length === 0) {
      // Insert some sample games
      const sampleGames = [
        { word: "CWRU", hint: "it's just and abbreviation" },
      ];

      await db.insert(schema.games).values(sampleGames);
      console.log("Sample games inserted into database");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
