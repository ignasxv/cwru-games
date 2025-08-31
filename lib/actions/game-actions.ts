"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, games, gameplays, gameStats, type NewUser, type NewGame, type NewGameplay } from "@/lib/db/schema";
import { eq, desc, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { signJWT, verifyJWT, getCurrentUserFromToken } from "@/lib/auth/jwt";

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

export async function getRandomActiveGame() {
  try {
    const activeGames = await db.select().from(games).where(eq(games.active, true));
    if (activeGames.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * activeGames.length);
    return activeGames[randomIndex];
  } catch (error) {
    console.error("Error getting random active game:", error);
    return null;
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

// Authentication functions
export async function registerUser(username: string, email: string, password: string, phoneNumber?: string) {
  try {
    // Check if username or email already exists
    const existingUser = await db.select().from(users).where(
      or(eq(users.username, username), eq(users.email, email))
    ).limit(1);

    if (existingUser.length > 0) {
      return { success: false, message: "Username or email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.insert(users).values({
      username,
      email,
      password: hashedPassword,
      phoneNumber
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      phoneNumber: users.phoneNumber
    });

    // Initialize game stats for the new user
    await db.insert(gameStats).values({
      userId: newUser[0].id,
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: "{}"
    });

    // Generate JWT token
    const token = signJWT({
      userId: newUser[0].id,
      username: newUser[0].username,
      email: newUser[0].email,
      phoneNumber: newUser[0].phoneNumber
    });

    return { success: true, user: newUser[0], token };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, message: "Registration failed" };
  }
}

export async function loginUser(usernameOrEmail: string, password: string) {
  try {
    // Find user by username or email
    const user = await db.select().from(users).where(
      or(eq(users.username, usernameOrEmail), eq(users.email, usernameOrEmail))
    ).limit(1);

    if (user.length === 0) {
      return { success: false, message: "User not found" };
    }

    // Check if user has a password set
    if (!user[0].password) {
      return { success: false, message: "Account has no password set" };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user[0].password);
    if (!isValidPassword) {
      return { success: false, message: "Invalid password" };
    }

    // Generate JWT token
    const token = signJWT({
      userId: user[0].id,
      username: user[0].username,
      email: user[0].email,
      phoneNumber: user[0].phoneNumber
    });

    return {
      success: true,
      user: {
        id: user[0].id,
        username: user[0].username,
        email: user[0].email,
        phoneNumber: user[0].phoneNumber
      },
      token
    };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, message: "Login failed" };
  }
}

export async function getCurrentUser() {
  try {
    const userPayload = await getCurrentUserFromToken();
    if (!userPayload) return null;

    // Verify the user still exists in the database
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      phoneNumber: users.phoneNumber
    }).from(users).where(eq(users.id, userPayload.userId)).limit(1);

    return user || null;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function verifyToken(token: string) {
  try {
    const payload = verifyJWT(token);
    if (!payload) return { success: false, message: "Invalid token" };

    // Verify the user still exists
    const [user] = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      phoneNumber: users.phoneNumber
    }).from(users).where(eq(users.id, payload.userId)).limit(1);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Token verification error:", error);
    return { success: false, message: "Token verification failed" };
  }
}
