"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Lock, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { checkIfAdminExists, createAdmin, loginAdmin } from "@/lib/actions/game-actions"

interface AdminAuthProps {
  onAuthenticated: (token: string) => void
}

export default function AdminAuth({ onAuthenticated }: AdminAuthProps) {
  const { toast } = useToast()
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  })

  useEffect(() => {
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    try {
      const result = await checkIfAdminExists()
      if (result.success) {
        setHasAdmin(result.hasAdmin)
      }
    } catch (error) {
      console.error("Error checking admin status:", error)
      toast({
        title: "Error",
        description: "Failed to check admin status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (formData.password.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createAdmin(formData.username, formData.password)
      if (result.success) {
        toast({
          title: "Success",
          description: "Admin account created successfully",
        })
        setHasAdmin(true)
        setFormData({ username: "", password: "", confirmPassword: "" })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create admin account",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating admin:", error)
      toast({
        title: "Error",
        description: "Failed to create admin account",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      const result = await loginAdmin(formData.username, formData.password)
      if (result.success && result.token) {
        toast({
          title: "Success",
          description: "Admin login successful",
        })
        // Store token in localStorage or cookie for session management
        localStorage.setItem('adminToken', result.token)
        onAuthenticated(result.token)
      } else {
        toast({
          title: "Error",
          description: result.message || "Login failed",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error logging in:", error)
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    // Normalize username to lowercase automatically
    if (field === 'username') {
      value = value.toLowerCase().trim()
    }
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-800 border-gray-700">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Checking admin status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-yellow-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-gray-100">
            {hasAdmin ? "Admin Login" : "Create Admin Account"}
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {hasAdmin 
              ? "Enter your admin credentials to access the dashboard" 
              : "No admin account found. Create one to access the admin dashboard"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={hasAdmin ? handleLogin : handleCreateAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                <User className="inline w-4 h-4 mr-1" />
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleInputChange("username")}
                required
                className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                <Lock className="inline w-4 h-4 mr-1" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleInputChange("password")}
                required
                className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
              />
            </div>

            {!hasAdmin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  <Lock className="inline w-4 h-4 mr-1" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange("confirmPassword")}
                  required
                  className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : hasAdmin ? "Login" : "Create Admin Account"}
            </Button>
          </form>

          {hasAdmin && (
            <div className="text-center pt-4">
              <p className="text-sm text-gray-400">
                Need to create a new admin account? Contact system administrator.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
