"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Gift } from "lucide-react";
import WordleGame from "./wordle-game";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import { ClaimPrizeDialog } from "./claim-prize-dialog";
import { getUserStats } from "@/lib/actions/game-actions";

export default function WordleGameWithAuth() {
  const { user, isLoading, refreshUser } = useAuth();
  const [showClaimPrize, setShowClaimPrize] = useState(false);
  const [gamesCompleted, setGamesCompleted] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Function to refresh user stats and check eligibility
  const refreshStatsAndCheckEligibility = useCallback(async () => {
    if (user && user.id) {
      // Refresh user data to get latest email status
      if (refreshUser) {
        await refreshUser();
      }

      // Load user stats to check games completed
      const result = await getUserStats(user.id);
      if (result.success && result.stats) {
        setGamesCompleted(result.stats.gamesCompleted || 0);
      }
    }
  }, [user, refreshUser]);

  // Initial load
  useEffect(() => {
    refreshStatsAndCheckEligibility();
  }, [refreshStatsAndCheckEligibility]);

  // Check eligibility whenever games completed or user changes
  useEffect(() => {
    // Show claim prize if user has completed 3+ games and hasn't provided email yet
    if (gamesCompleted >= 3 && user && !user.email) {
      setShowClaimPrize(true);
    } else {
      setShowClaimPrize(false);
    }
  }, [gamesCompleted, user]);

  if (isLoading) {
    return (
      <div className="font-mono min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-yellow-400 font-mono">Initializing Game...</p>
        </div>
      </div>
    );
  }

  // Fallback if user creation failed (shouldn't happen often)
  if (!user) {
    return (
      <div className="font-mono min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
        <div className="text-center p-4">
          <p className="text-red-400 mb-4">Failed to initialize guest session.</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-yellow-400 text-gray-900 hover:bg-yellow-500"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-900 pb-safe">
      {/* Top navigation bar */}
      <div className="flex justify-between items-center p-3 max-w-sm mx-auto bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
        <div className="flex flex-col flex-1">
          <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
            Player
          </span>
          <span
            className="text-xs text-yellow-400 font-mono font-bold truncate max-w-[120px]"
            title={user.username}
          >
            {user.username}
          </span>
        </div>

        {/* Center: Claim Prize Button */}
        <div className="flex-1 flex justify-center">
          {showClaimPrize && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-400 text-gray-900 font-bold px-3 py-1.5 rounded-lg shadow-lg hover:shadow-yellow-500/50 hover:scale-105 transition-transform"
              style={{
                animation: "shake 2s infinite, pulse 2s infinite",
                boxShadow: "0 0 20px rgba(250, 204, 21, 0.5)",
              }}
            >
              <Gift className="h-4 w-4 mr-1 inline-block" />
              <span className="text-xs">Claim Prize</span>
            </Button>
          )}
        </div>

        {/* Right: Rankings Button */}
        <div className="flex items-center justify-end flex-1">
          <Link href="/rankings">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 h-8 w-8 p-0"
              title="View Rankings"
            >
              <Trophy className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <main className="pt-2">
        <WordleGame 
          userId={user.id} 
          onGameComplete={refreshStatsAndCheckEligibility}
        />
      </main>

      {/* Claim Prize Dialog */}
      <ClaimPrizeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={user.id}
        currentUsername={user.username}
      />

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  );
}
