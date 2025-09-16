"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy } from "lucide-react"
import WordleGame from "./wordle-game"
import { loginUser, registerUser } from "@/lib/actions/game-actions"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth/AuthContext"
import Link from "next/link"

export default function WordleGameWithAuth() {
  const { user, isLoading, login, logout } = useAuth()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const usernameOrEmail = (formData.get('usernameOrEmail') as string).toLowerCase().trim()
    const password = formData.get('password') as string

    try {
      const result = await loginUser(usernameOrEmail, password)
      if (result.success && result.user && result.token) {
        login(result.token, result.user)
        toast({
          title: "Login successful",
          description: `Welcome back, ${result.user.username}!`,
        })
      } else {
        toast({
          title: "Login failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Login error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const username = (formData.get('username') as string).toLowerCase().trim()
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string
    const phoneNumber = formData.get('phoneNumber') as string

    if (password !== confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await registerUser(username, email, password, phoneNumber)
      if (result.success && result.user && result.token) {
        login(result.token, result.user)
        toast({
          title: "Registration successful",
          description: `Welcome, ${result.user.username}!`,
        })
      } else {
        toast({
          title: "Registration failed",
          description: result.message || "Failed to create account",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Registration error",
        description: "An error occurred during registration",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
  }

  if (isLoading) {
    return (
      <div className="font-mono min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="font-mono min-h-screen bg-gradient-to-br from-gray-800  to-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-900/90 border-gray-800">
          <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold font-mono text-yellow-400">CWRU Games</CardTitle>
        <CardDescription className="text-gray-300">campus-specific games</CardDescription>
          </CardHeader>
          <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="login" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900">Login</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-yellow-400 data-[state=active]:text-gray-900">Register</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="usernameOrEmail" className="text-gray-200">Username or Email</Label>
            <Input
              id="usernameOrEmail"
              name="usernameOrEmail"
              type="text"
              placeholder="enter username or email"
              required
              className="bg-gray-800 border-gray-700 text-gray-200"
              onChange={(e) => {
                // Automatically normalize username input to lowercase
                e.target.value = e.target.value.toLowerCase().trim()
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-200">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              required
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
          </div>
          <Button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold">
            Login
          </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-200">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="choose a username"
              required
              className="bg-gray-800 border-gray-700 text-gray-200"
              onChange={(e) => {
                // Automatically normalize username input to lowercase
                e.target.value = e.target.value.toLowerCase().trim()
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              required
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="registerPassword" className="text-gray-200">Password</Label>
            <Input
              id="registerPassword"
              name="password"
              type="password"
              placeholder="Create a password"
              required
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-200">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              className="bg-gray-800 border-gray-700 text-gray-200"
            />
          </div>
          <Button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold">
            Register
          </Button>
            </form>
          </TabsContent>
        </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gray-900 pb-safe">
      {/* Top navigation bar */}
      <div className="flex justify-between items-center p-3 max-w-sm mx-auto bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
        <span className="text-sm text-gray-400 font-mono">👋 Hi, {user.username}!</span>
        
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-yellow-400 font-mono">CWRWORDLE</h1>
          <Link href="/rankings">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-400 hover:text-yellow-400 hover:bg-gray-800 p-2"
              title="View Rankings"
            >
              <Trophy className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleLogout}
          className="text-gray-400 hover:text-gray-200 hover:bg-gray-800 font-mono text-xs"
        >
          Logout
        </Button>
      </div>
      
      <main className="pt-2">
        <WordleGame userId={user.id} />
      </main>
    </div>
  )
}
