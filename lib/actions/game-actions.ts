"use server";

import { db } from "@/lib/db";
import { users, games, gameplays, type NewUser, type NewGame, type NewGameplay } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// User actions
export async function createUser(userData: Omit<NewUser, "id" | "createdAt">) {
  try {
    const [user] = await db.insert(users).values(userData).returning();
    return { success: true, user };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Failed to create user" };
  }
}

export async function getUserByUsername(username: string) {
  try {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}

export async function getAllUsers() {
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

// Game actions
export async function createGame(gameData: Omit<NewGame, "id" | "createdAt">) {
  try {
    const [game] = await db.insert(games).values(gameData).returning();
    revalidatePath("/admin");
    return { success: true, game };
  } catch (error) {
    console.error("Error creating game:", error);
    return { success: false, error: "Failed to create game" };
  }
}

export async function getAllGames() {
  try {
    return await db.select().from(games).orderBy(desc(games.createdAt));
  } catch (error) {
    console.error("Error getting games:", error);
    return [];
  }
}

export async function getActiveGames() {
  try {
    return await db.select().from(games).where(eq(games.active, true)).orderBy(desc(games.createdAt));
  } catch (error) {
    console.error("Error getting active games:", error);
    return [];
  }
}

export async function toggleGameActive(gameId: number) {
  try {
    const [game] = await db.select().from(games).where(eq(games.id, gameId));
    if (!game) return { success: false, error: "Game not found" };

    const [updatedGame] = await db
      .update(games)
      .set({ active: !game.active })
      .where(eq(games.id, gameId))
      .returning();

    revalidatePath("/admin");
    return { success: true, game: updatedGame };
  } catch (error) {
    console.error("Error toggling game active:", error);
    return { success: false, error: "Failed to update game" };
  }
}

// Gameplay actions
export async function createGameplay(gameplayData: Omit<NewGameplay, "id" | "createdAt">) {
  try {
    const [gameplay] = await db.insert(gameplays).values(gameplayData).returning();
    return { success: true, gameplay };
  } catch (error) {
    console.error("Error creating gameplay:", error);
    return { success: false, error: "Failed to create gameplay" };
  }
}

export async function getUserGameplays(userId: number) {
  try {
    return await db
      .select({
        gameplay: gameplays,
        game: games,
      })
      .from(gameplays)
      .leftJoin(games, eq(gameplays.gameId, games.id))
      .where(eq(gameplays.userId, userId))
      .orderBy(desc(gameplays.createdAt));
  } catch (error) {
    console.error("Error getting user gameplays:", error);
    return [];
  }
}

export async function getGameStats() {
  try {
    const totalUsers = await db.select().from(users);
    const totalGames = await db.select().from(games);
    const totalGameplays = await db.select().from(gameplays);
    const completedGameplays = await db.select().from(gameplays).where(eq(gameplays.completed, true));

    return {
      totalUsers: totalUsers.length,
      totalGames: totalGames.length,
      totalGameplays: totalGameplays.length,
      completedGameplays: completedGameplays.length,
    };
  } catch (error) {
    console.error("Error getting game stats:", error);
    return {
      totalUsers: 0,
      totalGames: 0,
      totalGameplays: 0,
      completedGameplays: 0,
    };
  }
}
