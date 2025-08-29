import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").unique().notNull(),
  fullName: text("full_name"),
  email: text("email").unique(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

export const games = sqliteTable("games", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  word: text("word").notNull(),
  hint: text("hint"),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
  active: integer("active", { mode: "boolean" }).default(true),
});

export const gameplays = sqliteTable("gameplays", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id),
  gameId: integer("game_id").references(() => games.id),
  numTries: integer("num_tries"),
  pointsEarned: integer("points_earned"),
  guessSequence: text("guess_sequence"), // JSON string
  completed: integer("completed", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Gameplay = typeof gameplays.$inferSelect;
export type NewGameplay = typeof gameplays.$inferInsert;
