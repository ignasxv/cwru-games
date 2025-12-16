"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function claimUserProfile(userId: number, username: string, email: string) {
  try {
    // Normalize username
    const normalizedUsername = username.toLowerCase().trim();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if username or email is already taken by another user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return { success: false, message: "Username already taken" };
    }

    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingEmail.length > 0 && existingEmail[0].id !== userId) {
      return { success: false, message: "Email already taken" };
    }

    // Update user with email (keep anonymous username)
    const [updatedUser] = await db
      .update(users)
      .set({ 
        email: normalizedEmail,
        fullName: username // Store Case username in fullName
      })
      .where(eq(users.id, userId))
      .returning();

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error claiming profile:", error);
    return { success: false, message: "Failed to claim profile" };
  }
}
