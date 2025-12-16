"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function claimUserProfile(userId: number, igHandle: string, email: string) {
  try {
    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();

    // Only check if email is already taken by another user
    // (We don't check IG handle because we're keeping the anonymous username)
    const existingEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingEmail.length > 0 && existingEmail[0].id !== userId) {
      return { success: false, message: "Email already taken" };
    }

    // Update user with email and IG handle (keep anonymous username)
    const [updatedUser] = await db
      .update(users)
      .set({ 
        email: normalizedEmail,
        fullName: igHandle // Store IG handle in fullName
      })
      .where(eq(users.id, userId))
      .returning();

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error claiming profile:", error);
    return { success: false, message: "Failed to claim profile" };
  }
}
