"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Star, Users, Target, TrendingUp, Medal, Award, Crown } from "lucide-react";
import { getGameRankings, getUserStats, getUserRankPosition } from "@/lib/actions/game-actions";
import Link from "next/link";

interface GameRanking {
  id: number;
  userId: number | null;
  username: string;
  fullName: string | null;
  pointsEarned: number | null;
  numTries: number | null;
  completed: boolean | null;
  createdAt: Date | null;
}

interface UserStats {
  totalPoints: number | null;
  gamesCompleted: number | null;
  gamesPlayed: number | null;
  averageScore: number | null;
  bestScore: number | null;
  winRate: number | null;
}

interface GameStatsProps {
  userId: number;
  currentGameId: number | null;
  gameStatus: "playing" | "won" | "lost";
  pointsEarned?: number;
  refreshTrigger?: number; // Add trigger to force refresh
}

export default function GameStats({ userId, currentGameId, gameStatus, pointsEarned = 0, refreshTrigger }: GameStatsProps) {
  const [gameRankings, setGameRankings] = useState<GameRanking[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentGameId) {
      loadGameData();
    }
  }, [currentGameId, userId]);

  // Refresh when refreshTrigger changes (after game completion)
  useEffect(() => {
    if (refreshTrigger && currentGameId) {
      setRefreshing(true);
      loadGameData().finally(() => setRefreshing(false));
    }
  }, [refreshTrigger, currentGameId, userId]);

  // Auto-scroll to stats after game completion
  useEffect(() => {
    if (gameStatus !== "playing" && sectionRef.current) {
      setTimeout(() => {
        sectionRef.current?.scrollIntoView({ 
          behavior: "smooth",
          block: "start"
        });
      }, 1000); // Wait a bit for the game completion animation
    }
  }, [gameStatus]);

  const loadGameData = async () => {
    if (!currentGameId) return;
    
    setLoading(true);
    try {
      // Load game rankings
      const rankingsResult = await getGameRankings(currentGameId, 10);
      if (rankingsResult.success) {
        setGameRankings(rankingsResult.rankings);
      }

      // Load user stats
      const statsResult = await getUserStats(userId);
      if (statsResult.success && statsResult.stats) {
        setUserStats(statsResult.stats);
      }

      // Load user rank position
      const rankResult = await getUserRankPosition(userId);
      if (rankResult.success) {
        setUserRank(rankResult.position);
        setTotalPlayers(rankResult.totalPlayers);
      }
    } catch (error) {
      console.error("Error loading game data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Trophy className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Medal className="h-4 w-4 text-amber-600" />;
      default:
        return <Award className="h-4 w-4 text-blue-500" />;
    }
  };

  const getRankBadgeColor = (position: number, isCurrentUser: boolean = false) => {
    if (isCurrentUser) return "bg-green-500 text-white";
    
    switch (position) {
      case 1:
        return "bg-yellow-500 text-black";
      case 2:
        return "bg-gray-400 text-black";
      case 3:
        return "bg-amber-600 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  if (loading) {
    return (
      <div ref={sectionRef} className="mt-6 space-y-4">
        <div className="text-center text-gray-400 font-mono">Loading stats...</div>
      </div>
    );
  }

  return (
    <div ref={sectionRef} className="mt-6 space-y-4" id="game-stats-section">
      {/* Current Game Results */}
      {gameStatus !== "playing" && pointsEarned > 0 && (
        <Card className="bg-green-900/20 border-green-500/50">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold font-mono">{pointsEarned} Points Earned!</span>
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <p className="text-gray-300 text-sm font-mono">
              Great job! Your score has been recorded.
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Stats Summary */}
      {userStats && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-400 font-mono text-lg">
              <TrendingUp className="h-5 w-5" />
              Your Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400 font-mono">
                  {userStats.totalPoints?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-400 font-mono">Total Points</div>
              </div>
              
              <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400 font-mono">
                  {userStats.gamesCompleted || 0}
                </div>
                <div className="text-xs text-gray-400 font-mono">Games Played</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-blue-400 font-mono">
                  {userStats.averageScore && typeof userStats.averageScore === 'number' ? userStats.averageScore.toFixed(1) : '0.0'}
                </div>
                <div className="text-xs text-gray-400 font-mono">Avg Score</div>
              </div>
              
              <div>
                <div className="text-lg font-bold text-purple-400 font-mono">
                  {userStats.bestScore || 0}
                </div>
                <div className="text-xs text-gray-400 font-mono">Best Score</div>
              </div>

              <div>
                <div className="text-lg font-bold text-orange-400 font-mono">
                  {userStats.winRate && typeof userStats.winRate === 'number' ? userStats.winRate.toFixed(1) : '0.0'}%
                </div>
                <div className="text-xs text-gray-400 font-mono">Win Rate</div>
              </div>
            </div>

            {userRank && (
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg text-center">
                <div className="text-sm text-gray-300 font-mono">
                  Overall Rank: <span className="text-blue-400 font-bold">#{userRank}</span> of {totalPlayers} players
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Current Game Leaderboard */}
      {currentGameId && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-yellow-400 font-mono text-lg">
              <Users className="h-5 w-5" />
              Current Game Leaderboard
              {refreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400"></div>
              )}
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Top players for this game
            </CardDescription>
          </CardHeader>
          <CardContent>
            {gameRankings.length === 0 ? (
              <div className="text-center py-4 text-gray-400 font-mono">
                No completed games yet. Be the first!
              </div>
            ) : (
              <div className="space-y-2">
                {gameRankings.slice(0, 5).map((player, index) => {
                  const isCurrentUser = userId === player.userId;
                  return (
                    <div 
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isCurrentUser ? "bg-green-900/30 border border-green-500/50" : "bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(index + 1)}
                          <Badge variant="outline" className={`text-xs font-mono ${getRankBadgeColor(index + 1, isCurrentUser)}`}>
                            #{index + 1}
                          </Badge>
                        </div>
                        
                        <div>
                          <div className={`font-medium font-mono text-sm ${
                            isCurrentUser ? "text-green-400" : "text-gray-200"
                          }`}>
                            {player.username}
                            {isCurrentUser && " (You)"}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {player.numTries || 0} tries
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-bold font-mono ${
                          isCurrentUser ? "text-green-400" : "text-yellow-400"
                        }`}>
                          {player.pointsEarned || 0}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">points</div>
                      </div>
                    </div>
                  );
                })}

                {gameRankings.length > 5 && (
                  <div className="text-center pt-2">
                    <Badge variant="outline" className="text-gray-400 font-mono">
                      +{gameRankings.length - 5} more players
                    </Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Full Leaderboard Button */}
      <div className="text-center mt-6">
        <Link href="/rankings">
          <Button className="bg-yellow-600 hover:bg-yellow-700 text-black font-mono font-semibold px-6 py-2">
            <Trophy className="w-4 h-4 mr-2" />
            View Full Leaderboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
