
import { sql } from "drizzle-orm";
import { text, integer, pgTable, boolean, timestamp, serial, json } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  fullName: text("full_name"),
  email: text("email").unique(),
  password: text("password"),
  phoneNumber: text("phone_number"),
  deviceInfo: json("last_device_info").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  word: text("word").notNull(),
  hint: text("hint"),
  createdAt: timestamp("created_at").defaultNow(),
  active: boolean("active").default(true),
});

export const gameplays = pgTable("gameplays", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  gameId: integer("game_id").references(() => games.id),
  numTries: integer("num_tries"),
  pointsEarned: integer("points_earned"),
  guessSequence: text("guess_sequence"), // JSON string
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gameStats = pgTable("game_stats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  gamesPlayed: integer("games_played").default(0),
  gamesWon: integer("games_won").default(0),
  currentStreak: integer("current_streak").default(0),
  maxStreak: integer("max_streak").default(0),
  guessDistribution: text("guess_distribution").default("{}"),
  lastPlayedAt: timestamp("last_played_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
