"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, User, LogIn, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { 
  createUser, 
  getUserByUsername, 
  getActiveGames, 
  createGameplay 
} from "@/lib/actions/game-actions"
import type { User as UserType, Game } from "@/lib/db/schema"

interface LoginFormProps {
  onLogin: (user: UserType) => void
}

function LoginForm({ onLogin }: LoginFormProps) {
  const { toast } = useToast()
  const [username, setUsername] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isNewUser, setIsNewUser] = useState(false)

  // Focus management
  useEffect(() => {
    // Focus the username input when component mounts or when switching back to login
    const usernameInput = document.getElementById("username")
    if (usernameInput) {
      usernameInput.focus()
    }
  }, [isNewUser])

  const handleBackToLogin = () => {
    setIsNewUser(false)
    // Clear the additional form fields when going back
    setFullName("")
    setEmail("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setIsSubmitting(true)
    try {
      // Try to find existing user
      const existingUser = await getUserByUsername(username)
      
      if (existingUser) {
        onLogin(existingUser)
        toast({
          title: "Welcome back!",
          description: `Hello ${existingUser.fullName || existingUser.username}!`,
        })
      } else {
        // Create new user
        if (!isNewUser) {
          setIsNewUser(true)
          setIsSubmitting(false)
          // Focus the first additional field after state update
          setTimeout(() => {
            const fullNameInput = document.getElementById("fullName")
            if (fullNameInput) {
              fullNameInput.focus()
            }
          }, 0)
          return
        }

        const result = await createUser({
          username: username.trim(),
          fullName: fullName.trim() || undefined,
          email: email.trim() || undefined,
        })

        if (result.success && result.user) {
          onLogin(result.user)
          toast({
            title: "Account created!",
            description: "Welcome to Wordle!",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create account",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 bg-gray-800 border-gray-700" tabIndex={-1}>
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-green-400 mb-2 font-mono">WORDLE</h1>
          <p className="text-gray-300">{isNewUser ? "Create Account" : "Login to Play"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-gray-200">Username *</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="bg-gray-700 border-gray-600 text-gray-100"
              required
              autoFocus
              autoComplete="username"
            />
          </div>

          {isNewUser && (
            <>
              <div>
                <Label htmlFor="fullName" className="text-gray-200">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-200">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="bg-gray-700 border-gray-600 text-gray-100"
                  autoComplete="email"
                />
              </div>
            </>
          )}

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {isSubmitting ? "..." : isNewUser ? "Create Account" : "Login"}
          </Button>

          {isNewUser && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToLogin}
              className="w-full text-gray-300 hover:text-gray-100"
            >
              Back to Login
            </Button>
          )}
        </form>
      </Card>
    </div>
  )
}

interface WordleGameWithAuthProps {
  title?: string
  subtitle?: string
}

export default function WordleGameWithAuth({
  title = "WORDLE",
  subtitle = "Guess the word in 6 tries!",
}: WordleGameWithAuthProps) {
  const { toast } = useToast()
  const [user, setUser] = useState<UserType | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [currentGame, setCurrentGame] = useState<Game | null>(null)
  const [currentGameIndex, setCurrentGameIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Game state
  const [gameState, setGameState] = useState({
    currentGuess: "",
    guesses: [] as string[],
    gameStatus: "playing" as "playing" | "won" | "lost",
    currentRow: 0,
  })
  const [showHint, setShowHint] = useState(false)
  const [letterStates, setLetterStates] = useState<Record<string, "correct" | "present" | "absent" | "empty">>({})
  const [animatingRow, setAnimatingRow] = useState<number | null>(null)

  // Initialize
  useEffect(() => {
    loadGames()
  }, [])

  const loadGames = async () => {
    setIsLoading(true)
    try {
      const activeGames = await getActiveGames()
      setGames(activeGames)
      if (activeGames.length > 0 && !currentGame) {
        setCurrentGame(activeGames[0]) // Start with first game
        setCurrentGameIndex(0)
      }
    } catch (error) {
      console.error("Error loading games:", error)
      toast({
        title: "Error",
        description: "Failed to load games",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const startNewGame = () => {
    setGameState({
      currentGuess: "",
      guesses: [],
      gameStatus: "playing",
      currentRow: 0,
    })
    setLetterStates({})
    setShowHint(false)
    setAnimatingRow(null)
  }

  const goToNextGame = () => {
    if (currentGameIndex < games.length - 1) {
      const nextIndex = currentGameIndex + 1
      setCurrentGameIndex(nextIndex)
      setCurrentGame(games[nextIndex])
      startNewGame()
      toast({
        title: "Next Level!",
        description: `Level ${nextIndex + 1}: ${games[nextIndex].word.length} letter word`,
      })
    }
  }

  const goToPreviousGame = () => {
    if (currentGameIndex > 0) {
      const prevIndex = currentGameIndex - 1
      setCurrentGameIndex(prevIndex)
      setCurrentGame(games[prevIndex])
      startNewGame()
      toast({
        title: "Previous Level",
        description: `Level ${prevIndex + 1}: ${games[prevIndex].word.length} letter word`,
      })
    }
  }

  const goToLevel = (index: number) => {
    if (index >= 0 && index < games.length) {
      setCurrentGameIndex(index)
      setCurrentGame(games[index])
      startNewGame()
      toast({
        title: `Level ${index + 1}`,
        description: `${games[index].word.length} letter word`,
      })
    }
  }

  const saveGameplay = async (completed: boolean, numTries: number, pointsEarned: number) => {
    if (!user || !currentGame) return

    try {
      await createGameplay({
        userId: user.id,
        gameId: currentGame.id,
        numTries,
        pointsEarned,
        guessSequence: JSON.stringify(gameState.guesses),
        completed,
      })
    } catch (error) {
      console.error("Error saving gameplay:", error)
    }
  }

  const getLetterState = (letter: string, position: number): "correct" | "present" | "absent" => {
    if (!currentGame) return "absent"
    if (currentGame.word[position] === letter) return "correct"
    if (currentGame.word.includes(letter)) return "present"
    return "absent"
  }

  const updateLetterStates = (guess: string) => {
    const newStates = { ...letterStates }
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i]
      const state = getLetterState(letter, i)

      if (
        !newStates[letter] ||
        (newStates[letter] === "absent" && state !== "absent") ||
        (newStates[letter] === "present" && state === "correct")
      ) {
        newStates[letter] = state
      }
    }
    setLetterStates(newStates)
  }

  const submitGuess = async () => {
    if (!currentGame || gameState.gameStatus !== "playing") return

    if (gameState.currentGuess.length !== currentGame.word.length) {
      toast({
        title: "Invalid guess",
        description: `Please enter a ${currentGame.word.length}-letter word`,
        variant: "destructive",
      })
      setAnimatingRow(gameState.currentRow)
      setTimeout(() => setAnimatingRow(null), 500)
      return
    }

    const newGuesses = [...gameState.guesses, gameState.currentGuess]
    updateLetterStates(gameState.currentGuess)

    setAnimatingRow(gameState.currentRow)
    setTimeout(() => setAnimatingRow(null), 600)

    if (gameState.currentGuess === currentGame.word) {
      const numTries = newGuesses.length
      const pointsEarned = Math.max(100 - (numTries - 1) * 10, 10)
      
      setGameState({
        ...gameState,
        guesses: newGuesses,
        gameStatus: "won",
        currentGuess: "",
      })
      
      await saveGameplay(true, numTries, pointsEarned)
      
      setTimeout(() => {
        if (currentGameIndex < games.length - 1) {
          toast({
            title: "🎉 Congratulations!",
            description: `You guessed "${currentGame.word}" in ${numTries} tries! (+${pointsEarned} points). Ready for the next level?`,
          })
        } else {
          toast({
            title: "🎉 Congratulations!",
            description: `You guessed "${currentGame.word}" in ${numTries} tries! (+${pointsEarned} points). You've completed all levels!`,
          })
        }
      }, 1000)
    } else if (newGuesses.length >= 6) {
      setGameState({
        ...gameState,
        guesses: newGuesses,
        gameStatus: "lost",
        currentGuess: "",
      })
      
      await saveGameplay(false, 6, 0)
      
      toast({
        title: "Game Over",
        description: `The word was "${currentGame.word}"`,
        variant: "destructive",
      })
    } else {
      setGameState({
        ...gameState,
        guesses: newGuesses,
        currentGuess: "",
        currentRow: gameState.currentRow + 1,
      })
    }
  }

  const handleKeyPress = (key: string) => {
    if (!currentGame || gameState.gameStatus !== "playing") return

    if (key === "ENTER") {
      submitGuess()
    } else if (key === "BACKSPACE") {
      setGameState((prev) => ({
        ...prev,
        currentGuess: prev.currentGuess.slice(0, -1),
      }))
    } else if (key.match(/[A-Z]/) && gameState.currentGuess.length < currentGame.word.length) {
      setGameState((prev) => ({
        ...prev,
        currentGuess: prev.currentGuess + key,
      }))
    }
  }

  // Keyboard event listener - only active when user is logged in and game is active
  useEffect(() => {
    // Don't add keyboard listeners if user is not authenticated or no current game
    if (!user || !currentGame) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with form inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      if (!e.key) return
      const key = e.key.toUpperCase()
      if (key === "ENTER" || key === "BACKSPACE" || key.match(/[A-Z]/)) {
        e.preventDefault()
        handleKeyPress(key)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState, currentGame, user])

  const logout = () => {
    setUser(null)
    setCurrentGame(null)
    setCurrentGameIndex(0)
    setGameState({
      currentGuess: "",
      guesses: [],
      gameStatus: "playing",
      currentRow: 0,
    })
    setLetterStates({})
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading game...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!user) {
    return <LoginForm onLogin={setUser} />
  }

  // Show no games message if no games available
  if (!currentGame) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 p-4 flex items-center justify-center">
        <Card className="p-6 bg-gray-800 border-gray-700 text-center">
          <h2 className="text-2xl font-bold text-green-400 mb-4">No Games Available</h2>
          <p className="text-gray-300 mb-4">Please contact the administrator to add games.</p>
          <Button onClick={logout} variant="outline" className="border-gray-600 text-gray-300">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    )
  }

  // Rest of the game rendering logic (similar to original but using currentGame)
  const renderGrid = () => {
    const rows = []

    for (let i = 0; i < 6; i++) {
      const guess = gameState.guesses[i] || ""
      const isCurrentRow = i === gameState.currentRow
      const isAnimating = animatingRow === i
      const isInvalidGuess = isAnimating && gameState.gameStatus === "playing" && gameState.currentGuess.length > 0
      const isFlipping = isAnimating && !isInvalidGuess

      const row = []
      for (let j = 0; j < currentGame.word.length; j++) {
        let letter = ""
        let state: "correct" | "present" | "absent" | "empty" = "empty"

        if (i < gameState.guesses.length) {
          letter = guess[j] || ""
          state = getLetterState(letter, j)
        } else if (isCurrentRow) {
          letter = gameState.currentGuess[j] || ""
        }

        const cellClass = `
          w-14 h-14 border-2 flex items-center justify-center text-xl font-bold rounded-md font-mono
          transition-all duration-300 
          ${isFlipping ? "flip-animation" : ""}
          ${isInvalidGuess ? "shake" : ""}
          ${state === "correct" ? "bg-green-500 text-black border-green-500" : ""}
          ${state === "present" ? "bg-yellow-500 text-black border-yellow-500" : ""}
          ${state === "absent" ? "bg-gray-600 text-gray-200 border-gray-600" : ""}
          ${state === "empty" ? "bg-gray-800 border-gray-600 text-gray-200" : ""}
          ${letter && state === "empty" ? "border-gray-400 bg-gray-700" : ""}
        `

        row.push(
          <div key={j} className={cellClass}>
            {letter}
          </div>,
        )
      }

      rows.push(
        <div key={i} className="flex gap-2 justify-center">
          {row}
        </div>,
      )
    }

    return rows
  }

  const renderKeyboard = () => {
    const rows = [
      ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
      ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
      ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "BACKSPACE"],
    ]

    return rows.map((row, i) => (
      <div key={i} className="flex gap-1 justify-center">
        {row.map((key) => {
          const state = letterStates[key] || "empty"
          const isSpecial = key === "ENTER" || key === "BACKSPACE"

          const buttonClass = `
            h-12 font-semibold rounded text-sm transition-all duration-200 font-mono
            ${isSpecial ? "px-4" : "w-10"}
            ${state === "correct" ? "bg-green-500 text-black hover:bg-green-600" : ""}
            ${state === "present" ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""}
            ${state === "absent" ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : ""}
            ${state === "empty" ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600" : ""}
          `

          return (
            <Button
              key={key}
              className={buttonClass}
              onClick={() => handleKeyPress(key)}
              disabled={gameState.gameStatus !== "playing"}
            >
              {key === "BACKSPACE" ? "⌫" : key}
            </Button>
          )
        })}
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 font-mono">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-blue-400">{user.fullName || user.username}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={logout}
              className="text-gray-400 hover:text-gray-200"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          
          <h1 className="text-4xl font-bold text-green-400 mb-2 font-mono">{title}</h1>
          <p className="text-gray-300 font-mono">{subtitle}</p>

          {/* Controls */}
          <div className="flex justify-center gap-2 mt-4 mb-4">
            <Popover open={showHint} onOpenChange={setShowHint}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono"
                >
                  <InfoIcon className="w-4 h-4 mr-1" />
                  Hint
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-gray-800 border-gray-600 text-gray-200">
                <div className="space-y-2">
                  <h4 className="font-semibold font-mono">Hint:</h4>
                  <p className="text-sm text-gray-300 font-mono">{currentGame.hint || "No hint available"}</p>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              onClick={startNewGame}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono"
            >
              Reset
            </Button>
          </div>

          {/* Level Info */}
          <div className="text-center mb-2">
            <Badge variant="outline" className="bg-blue-800 border-blue-600 text-blue-200 font-mono text-lg px-3 py-1">
              Level {currentGameIndex + 1} of {games.length}
            </Badge>
          </div>
        </div>

        {/* Game Grid */}
        <div className="space-y-2 mb-8">{renderGrid()}</div>

        {/* Keyboard */}
        <div className="space-y-2">{renderKeyboard()}</div>

        {/* Game Stats */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4 mb-6">
            <Badge variant="outline" className="bg-gray-800 border-gray-600 text-gray-200 font-mono">
              Guess {gameState.currentRow + 1}/6
            </Badge>
            <Badge variant="outline" className="bg-gray-800 border-gray-600 text-gray-200 font-mono">
              Word: {currentGame.word.length} letters
            </Badge>
          </div>

          {/* Level Navigation */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousGame}
              disabled={currentGameIndex === 0}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="text-sm text-gray-400 font-mono min-w-[120px]">
              Level {currentGameIndex + 1} of {games.length}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextGame}
              disabled={currentGameIndex === games.length - 1}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* Level Dots Indicator */}
          {games.length > 1 && (
            <div className="flex justify-center gap-1 flex-wrap">
              {games.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToLevel(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentGameIndex 
                      ? 'bg-green-400' 
                      : 'bg-gray-600 hover:bg-gray-500'
                  }`}
                  title={`Go to Level ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
