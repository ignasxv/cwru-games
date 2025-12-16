"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, games, gameplays, gameStats, admins, type NewUser, type NewGame, type NewGameplay, type NewAdmin } from "@/lib/db/schema";
import { eq, desc, or, and, asc, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { signJWT, verifyJWT, getCurrentUserFromToken } from "@/lib/auth/jwt";
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';
import { headers } from "next/headers";

// User actions
export async function createUser(username: string, password: string, email?: string) {
  // Normalize username to lowercase
  const normalizedUsername = username.toLowerCase().trim()
  
  try {
    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1)

    if (existingUser.length > 0) {
      return { success: false, message: "User already exists" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create new user with normalized username
    const [newUser] = await db.insert(users).values({
      username: normalizedUsername,
      password: hashedPassword,
      email: email || null
    }).returning()

    return { success: true, user: newUser }
  } catch (error) {
    console.error("Error creating user:", error)
    return { success: false, message: "Failed to create user" }
  }
}

export async function createAnonymousUser() {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Unknown";
  try {
    // Generate a random name: adjective_animal (e.g., happy_capybara)
    const randomName = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '_',
      length: 2
    });

    // Ensure uniqueness
    let username = randomName;
    let retries = 0;
    while (retries < 5) {
      const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existing.length === 0) break;
      username = `${randomName}_${Math.floor(Math.random() * 1000)}`;
      retries++;
    }

    // Create new user with no password/email
    const [newUser] = await db.insert(users).values({
      username: username,
      deviceInfo: [userAgent],
      // email, password, phoneNumber are null
    }).returning();

    // Initialize game stats
    await db.insert(gameStats).values({
      userId: newUser.id,
      gamesPlayed: 0,
      gamesWon: 0,
      currentStreak: 0,
      maxStreak: 0,
      guessDistribution: "{}"
    });

    // Generate JWT
    const token = signJWT({
      userId: newUser.id,
      username: newUser.username,
      type: 'user'
    });

    return { success: true, user: newUser, token };
  } catch (error) {
    console.error("Error creating anonymous user:", error);
    return { success: false, message: "Failed to create anonymous user" };
  }
}

export async function getUserByUsername(username: string) {
  // Normalize username to lowercase for lookup
  const normalizedUsername = username.toLowerCase().trim()
  
  try {
    const user = await db.select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1)

    return user[0] || null
  } catch (error) {
    console.error("Error getting user by username:", error)
    return null
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

export async function deleteUser(userId: number) {
  try {
    // First, delete all associated gameplays
    await db.delete(gameplays).where(eq(gameplays.userId, userId));
    
    // Delete game stats if they exist
    await db.delete(gameStats).where(eq(gameStats.userId, userId));
    
    // Then delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting user:", error);
    return { success: false, error: "Failed to delete user" };
  }
}

export async function updateUserPhoneNumber(userId: number, phoneNumber: string) {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ phoneNumber })
      .where(eq(users.id, userId))
      .returning();

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating phone number:", error);
    return { success: false, error: "Failed to update phone number" };
  }
}

// Game actions
export async function createGame(gameData: Omit<NewGame, "id" | "createdAt">) {
  try {
    // Validate word length
    if (!gameData.word || gameData.word.length < 3) {
      return { success: false, error: "Word must be at least 3 letters long" };
    }
    
    if (gameData.word.length > 7) {
      return { success: false, error: "Word cannot be longer than 7 letters" };
    }
    
    // Validate word contains only letters
    if (!/^[A-Za-z]+$/.test(gameData.word)) {
      return { success: false, error: "Word can only contain letters" };
    }
    
    // Check if word already exists
    const existingGame = await db.select().from(games).where(eq(games.word, gameData.word.toUpperCase())).limit(1);
    if (existingGame.length > 0) {
      return { success: false, error: "Word already exists in the database" };
    }
    
    const [game] = await db.insert(games).values({
      word: gameData.word.toUpperCase(),
      hint: gameData.hint,
      active: gameData.active ?? true
    }).returning();
    revalidatePath("/admin");
    return { success: true, game };
  } catch (error) {
    console.error("Error creating game:", error);
    return { success: false, error: "Failed to create game" };
  }
}

export async function deleteGame(gameId: number) {
  try {
    // First, delete all associated gameplays
    await db.delete(gameplays).where(eq(gameplays.gameId, gameId));
    
    // Then delete the game
    await db.delete(games).where(eq(games.id, gameId));
    
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Error deleting game:", error);
    return { success: false, error: "Failed to delete game" };
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
    // Normalize username to lowercase
    const normalizedUsername = username.toLowerCase().trim()
    
    // Check if username or email already exists
    const existingUser = await db.select().from(users).where(
      or(eq(users.username, normalizedUsername), eq(users.email, email))
    ).limit(1);

    if (existingUser.length > 0) {
      return { success: false, message: "Username or email already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await db.insert(users).values({
      username: normalizedUsername,
      email,
      password: hashedPassword,
      phoneNumber,
      // Remove createdAt - let PostgreSQL handle it with defaultNow()
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      phoneNumber: users.phoneNumber,
      createdAt: users.createdAt
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
    // Normalize input for consistent searching (lowercase and trim)
    const normalizedInput = usernameOrEmail.toLowerCase().trim()
    
    // Find user by username or email
    const user = await db.select().from(users).where(
      or(eq(users.username, normalizedInput), eq(users.email, normalizedInput))
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
      phoneNumber: user[0].phoneNumber,
      type: 'user'
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
    if (!userPayload || !userPayload.userId) return null;

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
    if (!payload || !payload.userId) return { success: false, message: "Invalid token" };

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

// Check if user has already played a specific game
export async function getUserGameplay(userId: number, gameId: number) {
  try {
    const [gameplay] = await db
      .select()
      .from(gameplays)
      .where(and(eq(gameplays.userId, userId), eq(gameplays.gameId, gameId)))
      .limit(1);
    
    return gameplay || null;
  } catch (error) {
    console.error("Error getting user gameplay:", error);
    return null;
  }
}

// Get random game that user hasn't played yet
export async function getRandomUnplayedGame(userId: number) {
  try {
    // Get all active games
    const activeGames = await db.select().from(games).where(eq(games.active, true));
    
    // Get games the user has already played
    const playedGameIds = await db
      .select({ gameId: gameplays.gameId })
      .from(gameplays)
      .where(eq(gameplays.userId, userId));
    
    const playedIds = playedGameIds.map((pg: { gameId: number | null }) => pg.gameId);
    
    // Filter out played games
    const unplayedGames = activeGames.filter((game: any) => !playedIds.includes(game.id));
    
    if (unplayedGames.length === 0) {
      return null; // All games have been played
    }
    
    // Return random unplayed game
    const randomIndex = Math.floor(Math.random() * unplayedGames.length);
    return unplayedGames[randomIndex];
  } catch (error) {
    console.error("Error getting random unplayed game:", error);
    return null;
  }
}

// Get user's current level (highest completed level + 1, or 1 if none completed)
export async function getUserCurrentLevel(userId: number) {
  try {
    // Get all active games in order
    const allGames = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.active, true))
      .orderBy(asc(games.createdAt));
    
    // Get user's completed gameplays
    const completedGameplays = await db
      .select({ gameId: gameplays.gameId })
      .from(gameplays)
      .where(and(eq(gameplays.userId, userId), eq(gameplays.completed, true)));
    
    const completedGameIds = new Set(completedGameplays.map((gp: { gameId: number | null }) => gp.gameId));
    
    // Find the highest completed level (1-indexed)
    let maxCompletedLevel = 0;
    allGames.forEach((game: any, index: number) => {
      if (completedGameIds.has(game.id)) {
        maxCompletedLevel = Math.max(maxCompletedLevel, index + 1);
      }
    });
    
    // User's current level is the next level after their highest completed level
    return Math.min(maxCompletedLevel + 1, allGames.length);
  } catch (error) {
    console.error("Error getting user current level:", error);
    return 1;
  }
}

// Get next available game for user (current level or replay mode)
export async function getGameForUser(userId: number, requestedLevel?: number) {
  try {
    const currentLevel = await getUserCurrentLevel(userId);
    const targetLevel = requestedLevel || currentLevel;
    
    // Get all active games ordered by creation date to determine dynamic levels
    const allGames = await db
      .select()
      .from(games)
      .where(eq(games.active, true))
      .orderBy(asc(games.createdAt));
    
    // Find the game at the target level (1-indexed)
    const game = allGames[targetLevel - 1];
    let actualLevel = targetLevel;
    
    // If no game found for target level, try user's current level
    if (!game && targetLevel !== currentLevel && currentLevel <= allGames.length) {
      const fallbackGame = allGames[currentLevel - 1];
      if (fallbackGame) {
        actualLevel = currentLevel;
        return await getGameDetails(userId, fallbackGame, actualLevel, currentLevel);
      }
    }
    
    // If still no game, get the first available game
    if (!game && allGames.length > 0) {
      actualLevel = 1;
      return await getGameDetails(userId, allGames[0], actualLevel, currentLevel);
    }
    
    if (!game) {
      return { game: null, isReplay: false, currentLevel, actualLevel: targetLevel, existingGameplay: null };
    }
    
    return await getGameDetails(userId, game, actualLevel, currentLevel);
  } catch (error) {
    console.error("Error getting game for user:", error);
    return { game: null, isReplay: false, currentLevel: 1, actualLevel: requestedLevel || 1, existingGameplay: null };
  }
}

async function getGameDetails(userId: number, game: any, level: number, currentLevel: number) {
  // Check if user has already played this game
  const existingGameplay = await getUserGameplay(userId, game.id);
  const isReplay = !!existingGameplay;
  
  return { game, isReplay, currentLevel, actualLevel: level, existingGameplay };
}

// Get all available levels (for navigation) - now based on number of active games
export async function getAvailableLevels() {
  try {
    const gameCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(games)
      .where(eq(games.active, true));
    
    const totalGames = gameCount[0]?.count || 0;
    return Array.from({ length: totalGames }, (_, i) => i + 1);
  } catch (error) {
    console.error("Error getting available levels:", error);
    return [];
  }
}

// Get user's completed levels - now based on dynamic level calculation
export async function getUserCompletedLevels(userId: number) {
  try {
    // Get all active games in order
    const allGames = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.active, true))
      .orderBy(asc(games.createdAt));
    
    // Get user's completed gameplays
    const completedGameplays = await db
      .select({ gameId: gameplays.gameId })
      .from(gameplays)
      .where(and(eq(gameplays.userId, userId), eq(gameplays.completed, true)));
    
    const completedGameIds = new Set(completedGameplays.map((gp: { gameId: number | null }) => gp.gameId));
    const completedLevels: number[] = [];
    
    // Map game IDs to their dynamic levels
    allGames.forEach((game: any, index: number) => {
      if (completedGameIds.has(game.id)) {
        completedLevels.push(index + 1); // 1-indexed levels
      }
    });
    
    return completedLevels.sort((a, b) => a - b);
  } catch (error) {
    console.error("Error getting user completed levels:", error);
    return [];
  }
}

// Save or update gameplay progress
export async function saveGameplayProgress(
  userId: number, 
  gameId: number, 
  guesses: string[], 
  completed: boolean, 
  won: boolean
) {
  try {
    const numTries = guesses.length;
    const pointsEarned = won ? Math.max(100 - (numTries - 1) * 10, 10) : 0;
    const guessSequence = JSON.stringify(guesses);

    // Check if gameplay already exists for this user and game
    const existingGameplay = await db
      .select()
      .from(gameplays)
      .where(and(eq(gameplays.userId, userId), eq(gameplays.gameId, gameId)))
      .limit(1);

    let gameplay;
    if (existingGameplay.length > 0) {
      // Update existing gameplay
      [gameplay] = await db
        .update(gameplays)
        .set({
          numTries,
          pointsEarned,
          guessSequence,
          completed
        })
        .where(eq(gameplays.id, existingGameplay[0].id))
        .returning();
    } else {
      // Insert new gameplay
      [gameplay] = await db
        .insert(gameplays)
        .values({
          userId,
          gameId,
          numTries,
          pointsEarned,
          guessSequence,
          completed
        })
        .returning();
    }
     try {
      await fetch('https://k-switch.onrender.com/toggle', {
        method: 'POST',
      });
    } catch (fetchError) {
      console.error("Error hitting toggle endpoint:", fetchError);
      // Continue execution even if the endpoint fails
    }
    return { success: true, gameplay };
  } catch (error) {
    console.error("Error saving gameplay progress:", error);
    return { success: false, error: "Failed to save gameplay" };
  }
}

// Admin authentication functions
export async function checkIfAdminExists() {
  try {
    const existingAdmins = await db.select().from(admins).limit(1);
    return { success: true, hasAdmin: existingAdmins.length > 0 };
  } catch (error) {
    console.error("Error checking admin existence:", error);
    return { success: false, hasAdmin: false };
  }
}

export async function createAdmin(username: string, password: string) {
  try {
    // Normalize admin username to lowercase
    const normalizedUsername = username.toLowerCase().trim()
    
    // Check if any admin already exists
    const existingAdmins = await db.select().from(admins).limit(1);
    if (existingAdmins.length > 0) {
      return { success: false, message: "Admin already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin with normalized username
    const [newAdmin] = await db.insert(admins).values({
      username: normalizedUsername,
      password: hashedPassword,
      // Remove createdAt - let PostgreSQL handle it with defaultNow()
    }).returning({
      id: admins.id,
      username: admins.username,
      createdAt: admins.createdAt
    });

    return { success: true, admin: newAdmin };
  } catch (error) {
    console.error("Error creating admin:", error);
    return { success: false, message: "Failed to create admin" };
  }
}

export async function loginAdmin(username: string, password: string) {
  try {
    // Normalize admin username to lowercase
    const normalizedUsername = username.toLowerCase().trim()
    
    const [admin] = await db.select().from(admins).where(eq(admins.username, normalizedUsername));

    if (!admin) {
      return { success: false, message: "Invalid credentials" };
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return { success: false, message: "Invalid credentials" };
    }

    // Create a JWT token for admin session
    const token = await signJWT({ adminId: admin.id, username: admin.username, type: 'admin' });

    return { 
      success: true, 
      admin: { id: admin.id, username: admin.username },
      token
    };
  } catch (error) {
    console.error("Error logging in admin:", error);
    return { success: false, message: "Login failed" };
  }
}

export async function verifyAdminToken(token: string) {
  try {
    const payload = await verifyJWT(token);
    if (payload && payload.type === 'admin' && payload.adminId) {
      return { success: true, adminId: payload.adminId, username: payload.username };
    }
    return { success: false, message: "Invalid admin token" };
  } catch (error) {
    console.error("Error verifying admin token:", error);
    return { success: false, message: "Token verification failed" };
  }
}

// Ranking and points functions
export async function getGameRankings(gameId: number, limit: number = 10) {
  try {
    const rankings = await db
      .select({
        id: gameplays.id,
        userId: gameplays.userId,
        username: users.username,
        fullName: users.fullName,
        pointsEarned: gameplays.pointsEarned,
        numTries: gameplays.numTries,
        completed: gameplays.completed,
        createdAt: gameplays.createdAt
      })
      .from(gameplays)
      .innerJoin(users, eq(gameplays.userId, users.id))
      .where(and(eq(gameplays.gameId, gameId), eq(gameplays.completed, true)))
      .orderBy(desc(gameplays.pointsEarned), asc(gameplays.numTries), asc(gameplays.createdAt))
      .limit(limit);

    return { success: true, rankings };
  } catch (error) {
    console.error("Error getting game rankings:", error);
    return { success: false, rankings: [] };
  }
}

export async function getOverallRankings(limit?: number) {
  try {
    let query = db
      .select({
        userId: gameplays.userId,
        username: users.username,
        fullName: users.fullName,
        totalPoints: sql<number>`sum(${gameplays.pointsEarned})`,
        gamesCompleted: sql<number>`count(case when ${gameplays.completed} = true then 1 end)`,
        averageScore: sql<number>`round(avg(${gameplays.pointsEarned}), 1)`,
        bestScore: sql<number>`max(${gameplays.pointsEarned})`
      })
      .from(gameplays)
      .innerJoin(users, eq(gameplays.userId, users.id))
      .where(eq(gameplays.completed, true))
      .groupBy(gameplays.userId, users.username, users.fullName)
      .orderBy(desc(sql`sum(${gameplays.pointsEarned})`), desc(sql`count(case when ${gameplays.completed} = true then 1 end)`));

    if (limit) {
      // @ts-ignore - offset/limit dynamic application
      const results = await query.limit(limit);
      return { success: true, rankings: results };
    }

    const rankings = await query;
    return { success: true, rankings };
  } catch (error) {
    console.error("Error getting overall rankings:", error);
    return { success: false, rankings: [] };
  }
}

export async function getUserStats(userId: number) {
  try {
    const [userStats] = await db
      .select({
        totalPoints: sql<number>`coalesce(sum(${gameplays.pointsEarned}), 0)::integer`,
        gamesCompleted: sql<number>`count(case when ${gameplays.completed} = true then 1 end)::integer`,
        gamesPlayed: sql<number>`count(*)::integer`,
        averageScore: sql<number>`case when count(*) > 0 then round(avg(${gameplays.pointsEarned}), 1)::numeric else 0::numeric end`,
        bestScore: sql<number>`coalesce(max(${gameplays.pointsEarned}), 0)::integer`,
        winRate: sql<number>`case when count(*) > 0 then round(count(case when ${gameplays.completed} = true then 1 end) * 100.0 / count(*), 1)::numeric else 0::numeric end`
      })
      .from(gameplays)
      .where(eq(gameplays.userId, userId));

    return { success: true, stats: userStats };
  } catch (error) {
    console.error("Error getting user stats:", error);
    return { success: false, stats: null };
  }
}

export async function getUserRankPosition(userId: number) {
  try {
    // Get all users ranked by total points
    const allRankings = await db
      .select({
        userId: gameplays.userId,
        totalPoints: sql<number>`sum(${gameplays.pointsEarned})`
      })
      .from(gameplays)
      .where(eq(gameplays.completed, true))
      .groupBy(gameplays.userId)
      .orderBy(desc(sql`sum(${gameplays.pointsEarned})`));

    const userPosition = allRankings.findIndex(ranking => ranking.userId === userId) + 1;
    
    return { 
      success: true, 
      position: userPosition || null, 
      totalPlayers: allRankings.length 
    };
  } catch (error) {
    console.error("Error getting user rank position:", error);
    return { success: false, position: null, totalPlayers: 0 };
  }
}

export async function getGameRankingsWithoutWord(limit: number = 20) {
  try {
    const rankings = await db
      .select({
        gameId: games.id,
        hint: games.hint,
        createdAt: games.createdAt,
        topScore: sql<number>`max(${gameplays.pointsEarned})`,
        averageScore: sql<number>`round(avg(${gameplays.pointsEarned}), 1)`,
        totalPlayers: sql<number>`count(distinct ${gameplays.userId})`,
        completions: sql<number>`count(case when ${gameplays.completed} = true then 1 end)`
      })
      .from(games)
      .leftJoin(gameplays, eq(games.id, gameplays.gameId))
      .where(eq(games.active, true))
      .groupBy(games.id, games.hint, games.createdAt)
      .orderBy(desc(games.createdAt))
      .limit(limit);

    return { success: true, rankings };
  } catch (error) {
    console.error("Error getting game rankings without word:", error);
    return { success: false, rankings: [] };
  }
}
