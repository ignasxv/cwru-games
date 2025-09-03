"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, GamepadIcon, BarChart3, ToggleLeft, ToggleRight, Calendar, Trash2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AdminAuth from "@/components/admin-auth";
import { 
  createGame, 
  getAllGames, 
  getAllUsers, 
  toggleGameActive, 
  getGameStats,
  deleteGame,
  deleteUser,
  verifyAdminToken
} from "@/lib/actions/game-actions";
import type { Game, User } from "@/lib/db/schema";

interface GameStats {
  totalUsers: number;
  totalGames: number;
  totalGameplays: number;
  completedGameplays: number;
}

export default function AdminPage() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<GameStats>({
    totalUsers: 0,
    totalGames: 0,
    totalGameplays: 0,
    completedGameplays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New game form state
  const [newGame, setNewGame] = useState({
    word: "",
    hint: "",
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        const result = await verifyAdminToken(token);
        if (result.success) {
          setIsAuthenticated(true);
          setAdminToken(token);
        } else {
          localStorage.removeItem('adminToken');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('adminToken');
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleAuthenticated = (token: string) => {
    setAdminToken(token);
    setIsAuthenticated(true);
    setIsCheckingAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setAdminToken(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [gamesData, usersData, statsData] = await Promise.all([
        getAllGames(),
        getAllUsers(),
        getGameStats(),
      ]);
      
      setGames(gamesData);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGame.word.trim()) {
      toast({
        title: "Error",
        description: "Word is required",
        variant: "destructive",
      });
      return;
    }

    if (newGame.word.length > 7) {
      toast({
        title: "Error",
        description: "Word cannot be longer than 7 letters",
        variant: "destructive",
      });
      return;
    }

    if (newGame.word.length < 3) {
      toast({
        title: "Error",
        description: "Word must be at least 3 letters long",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createGame({
        word: newGame.word.toUpperCase(),
        hint: newGame.hint.trim() || undefined,
        active: true,
      });

      if (result.success) {
        setNewGame({ word: "", hint: "" });
        loadData(); // Reload data
        toast({
          title: "Success",
          description: "Game created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create game",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleGameActive = async (gameId: number) => {
    try {
      const result = await toggleGameActive(gameId);
      if (result.success) {
        loadData(); // Reload data
        toast({
          title: "Success",
          description: "Game status updated",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update game",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update game",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGame = async (gameId: number, word: string) => {
    try {
      const result = await deleteGame(gameId);
      
      if (result.success) {
        await loadData();
        toast({
          title: "Success",
          description: `Game "${word}" deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete game",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting game:", error);
      toast({
        title: "Error",
        description: "Failed to delete game",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    try {
      const result = await deleteUser(userId);
      
      if (result.success) {
        await loadData();
        toast({
          title: "Success",
          description: `User "${username}" deleted successfully`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Show auth loading state
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show auth component if not authenticated
  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={handleAuthenticated} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-4xl font-bold text-yellow-400 mb-2 font-mono">Admin Dashboard</h1>
              <p className="text-gray-300">Manage your Wordle games and view player statistics</p>
            </div>
            <div className="flex gap-2">
              <Link href="/">
                <Button
                  variant="outline" 
                  className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700"
                >
                  ← Back to Game
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="bg-red-800 border-red-600 text-red-200 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Total Games</CardTitle>
              <GamepadIcon className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.totalGames}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Total Plays</CardTitle>
              <BarChart3 className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{stats.totalGameplays}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">Completed</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">{stats.completedGameplays}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="games" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="games" className="data-[state=active]:bg-gray-700">Games Management</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">Users</TabsTrigger>
          </TabsList>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            {/* Add New Game Form */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-400 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Game
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Create a new Wordle puzzle for players to solve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateGame} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="word" className="text-gray-200">Word *</Label>
                      <Input
                        id="word"
                        type="text"
                        value={newGame.word}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewGame({ ...newGame, word: e.target.value.toUpperCase() })}
                        placeholder="EXAMPLE"
                        className="bg-gray-700 border-gray-600 text-gray-100 font-mono"
                        maxLength={7}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hint" className="text-gray-200">Hint (Optional)</Label>
                      <Textarea
                        id="hint"
                        value={newGame.hint}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewGame({ ...newGame, hint: e.target.value })}
                        placeholder="A popular JavaScript library..."
                        className="bg-gray-700 border-gray-600 text-gray-100"
                        rows={3}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-yellow-400 hover:bg-yellow-600"
                  >
                    {isSubmitting ? "Creating..." : "Create Game"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Games List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">All Games</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your Wordle puzzles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {games.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No games found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Level</TableHead>
                        <TableHead className="text-gray-300">Word</TableHead>
                        <TableHead className="text-gray-300">Hint</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Created</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {games
                        .sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())
                        .map((game, index) => (
                        <TableRow key={game.id} className="border-gray-700">
                          <TableCell className="font-mono font-semibold text-blue-400">
                            {index + 1}
                          </TableCell>
                          <TableCell className="font-mono font-semibold text-yellow-400">
                            {game.word}
                          </TableCell>
                          <TableCell className="text-gray-300 max-w-xs truncate">
                            {game.hint || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={game.active ? "default" : "secondary"}
                              className={game.active ? "bg-green-600" : "bg-gray-600"}
                            >
                              {game.active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {game.createdAt && formatDate(game.createdAt as Date | string)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleGameActive(game.id)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                {game.active ? (
                                  <ToggleRight className="h-4 w-4" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4" />
                                )}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-600">
                                      Delete Game
                                    </AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-300">
                                      Are you sure you want to delete the game "{game.word}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel asChild>
                                      <Button className="text-gray-400 hover:bg-gray-700">
                                        Cancel
                                      </Button>
                                    </AlertDialogCancel>
                                    <AlertDialogAction asChild>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleDeleteGame(game.id, game.word)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </Button>
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-gray-200">All Users</CardTitle>
                <CardDescription className="text-gray-300">
                  View all registered players
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No users found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700">
                        <TableHead className="text-gray-300">Username</TableHead>
                        <TableHead className="text-gray-300">Full Name</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Phone Number</TableHead>
                        <TableHead className="text-gray-300">Date Joined</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-gray-700">
                          <TableCell className="font-semibold text-blue-400">
                            {user.username}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.fullName || "-"}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.email || "-"}
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {user.phoneNumber || "-"}
                          </TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {user.createdAt ? formatDate(user.createdAt as Date | string) : "-"}
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-red-600">
                                    Delete User
                                  </AlertDialogTitle>
                                  <AlertDialogDescription className="text-gray-300">
                                    Are you sure you want to delete the user "{user.username}"? This will permanently delete all their game data and progress. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel asChild>
                                    <Button className="text-gray-400 hover:bg-gray-700">
                                      Cancel
                                    </Button>
                                  </AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDeleteUser(user.id, user.username)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete User
                                    </Button>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
