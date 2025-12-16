"use client"

import { Button } from "@/components/ui/button"
import { Trophy } from "lucide-react"
import WordleGame from "./wordle-game"
import { useAuth } from "@/lib/auth/AuthContext"
import Link from "next/link"

export default function WordleGameWithAuth() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="font-mono min-h-screen flex items-center justify-center bg-gray-900 text-gray-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-yellow-400 font-mono">Initializing Game...</p>
        </div>
      </div>
    )
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
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gray-900 pb-safe">
      {/* Top navigation bar */}
      <div className="flex justify-between items-center p-3 max-w-sm mx-auto bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
        <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">Player</span>
            <span className="text-xs text-yellow-400 font-mono font-bold truncate max-w-[120px]" title={user.username}>
                {user.username}
            </span>
        </div>
        
        <div className="flex items-center gap-1">
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
        <WordleGame userId={user.id} />
      </main>
    </div>
  )
}
