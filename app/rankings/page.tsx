"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Crown, Star, TrendingUp, ArrowLeft, Users, Target } from "lucide-react";
import { getOverallRankings, getGameRankingsWithoutWord } from "@/lib/actions/game-actions";
import Link from "next/link";

interface OverallRanking {
  userId: number | null;
  username: string;
  fullName: string | null;
  totalPoints: number;
  gamesCompleted: number;
  averageScore: number;
  bestScore: number;
}

interface GameRankingWithoutWord {
  gameId: number;
  hint: string | null;
  createdAt: Date | string | null;
  topScore: number;
  averageScore: number;
  totalPlayers: number;
  completions: number;
}

export default function RankingsPage() {
  const [overallRankings, setOverallRankings] = useState<OverallRanking[]>([]);
  const [gameRankings, setGameRankings] = useState<GameRankingWithoutWord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRankingsData();
  }, []);

  const loadRankingsData = async () => {
    setLoading(true);
    try {
      // Load overall rankings
      const overallResult = await getOverallRankings(20);
      if (overallResult.success) {
        setOverallRankings(overallResult.rankings);
      }

      // Load game performance rankings
      const gamesResult = await getGameRankingsWithoutWord(20);
      if (gamesResult.success) {
        setGameRankings(gamesResult.rankings);
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

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800 font-mono">
            <TabsTrigger value="overall" className="font-mono">Overall Rankings</TabsTrigger>
            <TabsTrigger value="games" className="font-mono">Game Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
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
                      <TableHead className="text-right font-mono">Games Won</TableHead>
                      <TableHead className="text-right font-mono">Average Score</TableHead>
                      <TableHead className="text-right font-mono">Best Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overallRankings.map((player, index) => (
                      <TableRow key={player.userId || `player-${index}`} className="border-gray-700">
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
                          {player.averageScore && typeof player.averageScore === 'number' ? player.averageScore.toFixed(1) : '0.0'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-300">
                          {player.bestScore || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {overallRankings.length === 0 && (
                  <div className="text-center py-8 text-gray-400 font-mono">
                    No rankings available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-400 font-mono">
                  <Target className="h-5 w-5" />
                  Game Performance
                </CardTitle>
                <CardDescription className="text-gray-400 font-mono">
                  Individual game statistics and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700">
                      <TableHead className="font-mono">Game</TableHead>
                      <TableHead className="text-right font-mono">Top Score</TableHead>
                      <TableHead className="text-right font-mono">Average Score</TableHead>
                      <TableHead className="text-right font-mono">Players</TableHead>
                      <TableHead className="text-right font-mono">Completed</TableHead>
                      <TableHead className="text-right font-mono">Date Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameRankings.map((game, index) => (
                      <TableRow key={game.gameId} className="border-gray-700">
                        <TableCell>
                          <div>
                            <div className="font-medium font-mono text-yellow-400">
                              Game #{game.gameId}
                            </div>
                            {game.hint && (
                              <div className="text-sm text-gray-400 font-mono">
                                Hint: {game.hint}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold font-mono text-yellow-400">
                          {game.topScore || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-300">
                          {game.averageScore && typeof game.averageScore === 'number' ? game.averageScore.toFixed(1) : '0.0'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-300">
                          <div className="flex items-center justify-end gap-1">
                            <Users className="h-3 w-3" />
                            {game.totalPlayers || 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-300">
                          {game.completions || 0}
                        </TableCell>
                        <TableCell className="text-right font-mono text-gray-400">
                          {game.createdAt ? new Date(game.createdAt).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {gameRankings.length === 0 && (
                  <div className="text-center py-8 text-gray-400 font-mono">
                    No games available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
