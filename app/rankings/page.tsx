"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award, Crown, Star, TrendingUp, ArrowLeft } from "lucide-react";
import { getOverallRankings } from "@/lib/actions/game-actions";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";

interface OverallRanking {
  userId: number | null;
  username: string;
  fullName: string | null;
  totalPoints: number;
  gamesCompleted: number;
  averageScore: number;
  bestScore: number;
}

export default function RankingsPage() {
  const { user } = useAuth();
  const [overallRankings, setOverallRankings] = useState<OverallRanking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankingsData();
  }, []);

  const loadRankingsData = async () => {
    setLoading(true);
    try {
      // Load overall rankings - unlimited
      const overallResult = await getOverallRankings();
      if (overallResult.success) {
        setOverallRankings(overallResult.rankings);
      }
    } catch (error) {
      console.error("Error loading rankings:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Trophy className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Award className="h-5 w-5 text-blue-500" />;
    }
  };

  const getRankBadgeColor = (position: number) => {
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
      <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading rankings...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200 font-mono">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Game
              </Button>
            </Link>
          </div>
          
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2 text-yellow-400 font-mono">
            <TrendingUp className="h-8 w-8" />
            Game Rankings
          </h1>
          <p className="text-gray-300 font-mono">
            View top players and game performance statistics
          </p>
        </div>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400 font-mono">
              <Star className="h-5 w-5" />
              Overall Leaderboard
            </CardTitle>
            <CardDescription className="text-gray-400 font-mono">
              Top players ranked by total points earned across all games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="w-16 font-mono">Rank</TableHead>
                  <TableHead className="font-mono">Player</TableHead>
                  <TableHead className="text-right font-mono">Total Points</TableHead>
                  <TableHead className="text-right font-mono">Games Played</TableHead>

                  <TableHead className="text-right font-mono">Best Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overallRankings.map((player, index) => {
                  const isCurrentUser = user && player.userId === user.id;
                  return (
                  <TableRow 
                    key={player.userId || `player-${index}`} 
                    className={`border-gray-700 ${isCurrentUser ? 'bg-yellow-400/10 border-yellow-400/50 hover:bg-yellow-400/20' : ''}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getRankIcon(index + 1)}
                        <Badge variant="outline" className={`font-mono ${getRankBadgeColor(index + 1)}`}>
                          #{index + 1}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium font-mono text-yellow-400">{player.username}</div>
                        {player.fullName && (
                          <div className="text-sm text-gray-400 font-mono">
                            {player.fullName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono text-yellow-400">
                      {player.totalPoints?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-300">
                      {player.gamesCompleted || 0}
                    </TableCell>

                    <TableCell className="text-right font-mono text-gray-300">
                      {player.bestScore || 0}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {overallRankings.length === 0 && (
              <div className="text-center py-8 text-gray-400 font-mono">
                No rankings available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
