import { sql } from "drizzle-orm";
import { text, integer, sqliteTable, blob } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  email: text("email").unique(),
  password: text("password"),
  phoneNumber: text("phone_number"),
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

export const gameStats = sqliteTable("game_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  currentStreak: integer("current_streak").default(0),
  maxStreak: integer("max_streak").default(0),
  guessDistribution: text("guess_distribution").default("{}"),
  lastPlayedAt: text("last_played_at").default("CURRENT_TIMESTAMP"),
});

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`),
});

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;
export type Gameplay = typeof gameplays.$inferSelect;
export type NewGameplay = typeof gameplays.$inferInsert;
export type GameStats = typeof gameStats.$inferSelect;
export type NewGameStats = typeof gameStats.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
