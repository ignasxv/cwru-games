"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { InfoIcon, RotateCcw, Trophy, Share2, ChevronLeft, ChevronRight, Gift } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getGameForUser, getUserCurrentLevel, getAvailableLevels, getUserCompletedLevels, saveGameplayProgress, updateUserPhoneNumber } from "@/lib/actions/game-actions"

import { useAuth } from "@/lib/auth/AuthContext"

type LetterState = "correct" | "present" | "absent" | "empty"

interface GameState {
  currentGuess: string
  guesses: string[]
  gameStatus: "playing" | "won" | "lost"
  currentRow: number
}

interface WordleGameProps {
  userId?: number
  onGameComplete?: () => void
}

export default function WordleGame({ userId, onGameComplete }: WordleGameProps) {
  const { user, refreshUser } = useAuth()
  const [gameState, setGameState] = useState<GameState>({
    currentGuess: "",
    guesses: [],
    gameStatus: "playing",
    currentRow: 0,
  })
  const [targetWord, setTargetWord] = useState("")
  const [targetHint, setTargetHint] = useState("")
  const [currentGameId, setCurrentGameId] = useState<number | null>(null)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [userMaxLevel, setUserMaxLevel] = useState(1)
  const [availableLevels, setAvailableLevels] = useState<number[]>([])
  const [completedLevels, setCompletedLevels] = useState<number[]>([])
  const [showHint, setShowHint] = useState(false)
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({})
  const [animatingRow, setAnimatingRow] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [isReplayMode, setIsReplayMode] = useState(false)
  const [currentGamePoints, setCurrentGamePoints] = useState<number>(0)
  const [showPhoneDialog, setShowPhoneDialog] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmittingPhone, setIsSubmittingPhone] = useState(false)
  const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0)

  // Initialize game
  useEffect(() => {
    initializeGameData()
  }, [])

  const initializeGameData = useCallback(async () => {
    if (!userId) return
    
    setLoading(true)
    try {
      // Get user's current level and available levels
      const [userCurrentLevel, levels, completed] = await Promise.all([
        getUserCurrentLevel(userId),
        getAvailableLevels(),
        getUserCompletedLevels(userId)
      ])
      
      setUserMaxLevel(userCurrentLevel)
      setAvailableLevels(levels)
      setCompletedLevels(completed)
      
      // Load the game for user's current level
      await loadGameForLevel(userCurrentLevel)
    } catch (error) {
      console.error("Error initializing game data:", error)
    }
  }, [userId])

  const loadGameForLevel = useCallback(async (level: number) => {
    if (!userId) return
    
    setLoading(true)
    try {
      const { game, isReplay, currentLevel: userLevel, actualLevel, existingGameplay } = await getGameForUser(userId, level)
      
      if (!game) {
        console.error("No games available in database - this should not happen")
        setLoading(false)
        return
      }

      // Use actualLevel if it was returned (indicates the server found a different level)
      const levelToUse = actualLevel !== undefined ? actualLevel : level
      setCurrentLevel(levelToUse)
      setCurrentGameId(game.id)
      
      if (isReplay && existingGameplay) {
        loadPreviousGameplay(game, existingGameplay)
      } else {
        // New game for the user
        setTargetWord(game.word.toUpperCase())
        setTargetHint(game.hint || "No hint available")
        setGameState({
          currentGuess: "",
          guesses: [],
          gameStatus: "playing",
          currentRow: 0,
        })
        setLetterStates({})
        setShowHint(false)
        setAnimatingRow(null)
        setIsReplayMode(false)
        setCurrentGamePoints(0)
      }
    } catch (error) {
      console.error("Error loading game for level:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const startNewGame = useCallback(async () => {
    await loadGameForLevel(userMaxLevel)
  }, [loadGameForLevel, userMaxLevel])

  const navigateToLevel = useCallback(async (level: number) => {
    if (!availableLevels.includes(level)) return
    await loadGameForLevel(level)
  }, [loadGameForLevel, availableLevels])

  const goToPreviousLevel = useCallback(() => {
    const currentIndex = availableLevels.indexOf(currentLevel)
    if (currentIndex > 0) {
      const prevLevel = availableLevels[currentIndex - 1]
      navigateToLevel(prevLevel)
    }
  }, [availableLevels, currentLevel, navigateToLevel])

  const handlePhoneSubmit = useCallback(async () => {
    if (!userId || !phoneNumber.trim()) return

    setIsSubmittingPhone(true)
    try {
      const result = await updateUserPhoneNumber(userId, phoneNumber.trim())
      if (result.success && refreshUser) {
        // Refresh user data from server to get updated phone number
        await refreshUser()
        setShowPhoneDialog(false)
        setPhoneNumber("")
      }
    } catch (error) {
      console.error("Error updating phone number:", error)
    } finally {
      setIsSubmittingPhone(false)
    }
  }, [userId, phoneNumber, refreshUser])

  const goToNextLevel = useCallback(() => {
    const currentIndex = availableLevels.indexOf(currentLevel)
    if (currentIndex < availableLevels.length - 1) {
      const nextLevel = availableLevels[currentIndex + 1]
      navigateToLevel(nextLevel)
    }
  }, [availableLevels, currentLevel, navigateToLevel])

  const loadPreviousGameplay = (game: any, gameplay: any) => {
    setTargetWord(game.word.toUpperCase())
    setTargetHint(game.hint || "No hint available")
    setCurrentGameId(game.id)
    
    // Parse the guess sequence from the stored gameplay
    const guesses = JSON.parse(gameplay.guessSequence || "[]")
    
    // Determine game status
    let finalStatus: "playing" | "won" | "lost" = "playing"
    if (gameplay.completed) {
      finalStatus = guesses.some((guess: string) => guess.toUpperCase() === game.word.toUpperCase()) ? "won" : "lost"
      setIsReplayMode(true) // Only set replay mode for completed games
    } else {
      // Game is still in progress, don't set replay mode
      setIsReplayMode(false)
    }
    
    setGameState({
      currentGuess: "",
      guesses,
      gameStatus: finalStatus,
      currentRow: guesses.length,
    })

    // Reconstruct letter states from the guesses
    const newLetterStates: Record<string, LetterState> = {}
    guesses.forEach((guess: string) => {
      updateLetterStatesFromGuess(guess.toUpperCase(), newLetterStates, game.word.toUpperCase())
    })
    setLetterStates(newLetterStates)
    setShowHint(false)
    setAnimatingRow(null)
    
    // Set points if game was completed and won
    if (gameplay.completed && finalStatus === "won") {
      setCurrentGamePoints(gameplay.pointsEarned || 0)
    } else {
      setCurrentGamePoints(0)
    }
  }

  const getLetterState = (letter: string, position: number, word: string): LetterState => {
    if (targetWord[position] === letter) return "correct"
    if (targetWord.includes(letter)) return "present"
    return "absent"
  }

  const updateLetterStates = (guess: string) => {
    const newStates = { ...letterStates }
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i]
      const state = getLetterState(letter, i, guess)

      // Only update if current state is worse than new state
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

  const updateLetterStatesFromGuess = (guess: string, states: Record<string, LetterState>, word: string) => {
    for (let i = 0; i < guess.length; i++) {
      const letter = guess[i]
      // Create a temporary version of getLetterState for this specific word
      const getStateForWord = (letter: string, position: number): LetterState => {
        if (word[position] === letter) return "correct"
        if (word.includes(letter)) return "present"
        return "absent"
      }
      const state = getStateForWord(letter, i)

      // Only update if current state is worse than new state
      if (
        !states[letter] ||
        (states[letter] === "absent" && state !== "absent") ||
        (states[letter] === "present" && state === "correct")
      ) {
        states[letter] = state
      }
    }
  }

  const submitGuess = useCallback(async () => {
    if (!targetWord || isReplayMode) return
    
    if (gameState.currentGuess.length !== targetWord.length) {
      setAnimatingRow(gameState.currentRow)
      setTimeout(() => setAnimatingRow(null), 500)
      return
    }

    const newGuesses = [...gameState.guesses, gameState.currentGuess]
    updateLetterStates(gameState.currentGuess)

    // Trigger animation
    setAnimatingRow(gameState.currentRow)
    setTimeout(() => setAnimatingRow(null), 600)

    const isCorrectGuess = gameState.currentGuess === targetWord
    const isGameComplete = isCorrectGuess || newGuesses.length >= 6

    // Calculate points for this game
    let pointsEarned = 0;
    if (isCorrectGuess) {
      pointsEarned = Math.max(100 - (newGuesses.length - 1) * 10, 10);
      setCurrentGamePoints(pointsEarned);
    }

    if (isCorrectGuess) {
      setGameState({
        ...gameState,
        guesses: newGuesses,
        gameStatus: "won",
        currentGuess: "",
      })
    } else if (newGuesses.length >= 6) {
      setGameState({
        ...gameState,
        guesses: newGuesses,
        gameStatus: "lost",
        currentGuess: "",
      })
    } else {
      setGameState({
        ...gameState,
        guesses: newGuesses,
        currentGuess: "",
        currentRow: gameState.currentRow + 1,
      })
    }

    // Save gameplay progress after EVERY guess (to prevent refresh cheating)
    if (userId && currentGameId) {
      try {
        await saveGameplayProgress(
          userId,
          currentGameId,
          newGuesses,
          isGameComplete, // completed only if game is actually done
          isCorrectGuess // won only if they got it right
        )

        // Only do completion actions if game is actually complete
        if (isGameComplete) {
          // Refresh the game stats/leaderboard to show updated results
          setTimeout(() => {
            setStatsRefreshTrigger(prev => prev + 1)
          }, 500)
          
          // If user completed their current level, update their progress
          if (isCorrectGuess && currentLevel === userMaxLevel) {
            setUserMaxLevel(currentLevel + 1)
            setCompletedLevels(prev => [...prev, currentLevel])
          }

          // Notify parent component that game is complete
          if (onGameComplete) {
            onGameComplete();
          }

          // // Show phone number dialog if user won and doesn't have phone number
          // if (isCorrectGuess && user && (!user.phoneNumber || user.phoneNumber.trim() === "")) {
          //   setShowPhoneDialog(true)
          // }
        }
      } catch (error) {
        console.error("Error saving gameplay:", error)
      }
    }
  }, [gameState, targetWord, isReplayMode, userId, currentGameId])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState.gameStatus !== "playing" || !targetWord || isReplayMode) return

      if (key === "ENTER") {
        submitGuess()
      } else if (key === "BACKSPACE") {
        setGameState((prev) => ({
          ...prev,
          currentGuess: prev.currentGuess.slice(0, -1),
        }))
      } else if (key.match(/[A-Z]/) && gameState.currentGuess.length < targetWord.length) {
        setGameState((prev) => ({
          ...prev,
          currentGuess: prev.currentGuess + key,
        }))
      }
    },
    [gameState, submitGuess, targetWord, isReplayMode],
  )

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field or dialog
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || key.match(/[A-Z]/)) {
        e.preventDefault();
        handleKeyPress(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyPress]);

  const renderGrid = () => {
    if (!targetWord) return null
    
    const rows = []

    for (let i = 0; i < 6; i++) {
      const guess = gameState.guesses[i] || ""
      const isCurrentRow = i === gameState.currentRow
      const isAnimating = animatingRow === i
      const isInvalidGuess = isAnimating && gameState.gameStatus === "playing" && gameState.currentGuess.length > 0
      const isFlipping = isAnimating && !isInvalidGuess

      const row = []
      for (let j = 0; j < targetWord.length; j++) {
        let letter = ""
        let state: LetterState = "empty"

        if (i < gameState.guesses.length) {
          letter = guess[j] || ""
          state = getLetterState(letter, j, guess)
        } else if (isCurrentRow) {
          letter = gameState.currentGuess[j] || ""
        }

        const cellClass = `
          ${targetWord.length <= 5 ? "w-14 h-14" : targetWord.length === 6 ? "w-12 h-12" : "w-10 h-10"} 
          border-2 flex items-center justify-center 
          ${targetWord.length <= 5 ? "text-xl" : targetWord.length === 6 ? "text-lg" : "text-base"} 
          font-bold rounded-md font-mono
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
        <div key={i} className={`flex ${targetWord.length <= 5 ? "gap-2" : targetWord.length === 6 ? "gap-1.5" : "gap-1"} justify-center`}>
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
      <div key={i} className={`flex gap-0.5 justify-center px-1 ${i === 1 ? 'px-6' : ''}`}>
        {row.map((key) => {
          const state = letterStates[key] || "empty"
          const isSpecial = key === "ENTER" || key === "BACKSPACE"
          const isEnter = key === "ENTER"
          const isBackspace = key === "BACKSPACE"

          const buttonClass = `
            h-11 font-semibold rounded transition-all duration-200 font-mono flex items-center justify-center
            ${isEnter ? "px-2 min-w-[54px] bg-green-600 text-white hover:bg-green-700 text-xs" : ""}
            ${isBackspace ? "px-1 min-w-[36px] bg-red-400 text-white hover:bg-red-500 text-xs" : ""}
            ${!isSpecial ? "flex-1 min-w-[28px] max-w-[34px] text-xs" : ""}
            ${!isEnter && !isBackspace && state === "correct" ? "bg-green-500 text-black hover:bg-green-600" : ""}
            ${!isEnter && !isBackspace && state === "present" ? "bg-yellow-500 text-black hover:bg-yellow-600" : ""}
            ${!isEnter && !isBackspace && state === "absent" ? "bg-gray-600 text-gray-200 hover:bg-gray-500" : ""}
            ${!isEnter && !isBackspace && state === "empty" && !isSpecial ? "bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600" : ""}
          `

          return (
            <Button
              key={key}
              className={buttonClass}
              onClick={() => handleKeyPress(key)}
              disabled={gameState.gameStatus !== "playing" || isReplayMode}
            >
              {key === "BACKSPACE" ? "⌫" : key === "ENTER" ? "ENTER" : key}
            </Button>
          )
        })}
      </div>
    ))
  }

  const shareResults = () => {
    const guessCount = gameState.gameStatus === "won" ? gameState.guesses.length : "X"
    const text = `CWRU Wordle ${guessCount}/6\n\n${gameState.guesses
      .map((guess) =>
        guess
          .split("")
          .map((letter, i) => {
            const state = getLetterState(letter, i, guess)
            return state === "correct" ? "🟩" : state === "present" ? "🟨" : "⬜"
          })
          .join(""),
      )
      .join("\n")}`

    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-[100dvh] bg-gray-900 text-gray-100 font-mono">
      <div className={`${targetWord && targetWord.length > 5 ? "max-w-md" : "max-w-sm"} mx-auto px-2 pb-4 w-full`}>
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-300 font-mono">Loading game...</p>
          </div>
        )}

        {/* Game Content */}
        {!loading && targetWord && (
          <>
            {/* Level Navigation and Actions */}
            <div className="space-y-3 mb-6">
              {/* Level indicator with navigation */}
              <div className="flex justify-center items-center gap-3">
                {/* Previous level button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousLevel}
                  disabled={availableLevels.indexOf(currentLevel) === 0}
                  className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {/* Level indicator */}
                <Badge variant="outline" className="bg-gray-800 border-gray-600 text-gray-200 font-mono px-4 py-1">
                  Level {currentLevel}
                  {completedLevels.includes(currentLevel) && " ✓"}
                  {currentLevel === userMaxLevel && !completedLevels.includes(currentLevel) && " (Current)"}
                </Badge>

                {/* Next level button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextLevel}
                  disabled={availableLevels.indexOf(currentLevel) === availableLevels.length - 1}
                  className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-center items-center gap-2">
                {/* Hint button */}
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
                      <p className="text-sm text-gray-300 font-mono">{targetHint}</p>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Current level button (only show if not at current level) */}
                {currentLevel !== userMaxLevel && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startNewGame}
                    className="bg-yellow-800 border-yellow-600 text-yellow-200 hover:bg-yellow-700 font-mono"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Current
                  </Button>
                )}

                {/* Share button */}
                {gameState.gameStatus !== "playing" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareResults}
                    className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                )}
              </div>
            </div>

        {/* Game Status */}
        {gameState.gameStatus === "won" && (
          <Card className="p-3 mb-4 text-center bg-yellow-900/30 border-yellow-500">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400 font-mono">Congratulations!</span>
            </div>
            <p className="text-sm text-gray-300 font-mono mb-3">
              You guessed "{targetWord}" in {gameState.guesses.length} tries!
            </p>
            {availableLevels.indexOf(currentLevel) < availableLevels.length - 1 && (
              <Button
                onClick={goToNextLevel}
                className="bg-yellow-600 hover:bg-yellow-700 text-black font-mono font-semibold"
                size="sm"
              >
                Next Challenge
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </Card>
        )}

        {gameState.gameStatus === "lost" && (
          <Card className="p-3 mb-4 text-center bg-red-900/30 border-red-500">
            <div className="font-semibold text-red-400 mb-2 font-mono">Game Over!</div>
            <p className="text-sm text-gray-300 font-mono">The word was "{targetWord}"</p>
          </Card>
        )}

        {/* Game Grid */}
        <div className="space-y-1.5 mb-4">{renderGrid()}</div>

        {/* Keyboard */}
        <div className="space-y-1 mb-4 w-full">{renderKeyboard()}</div>



        </>
        )}

        {/* No Games Available State */}
        {!loading && !targetWord && (
          <div className="text-center py-20">
            <p className="text-gray-300 font-mono mb-2">⚠️ No games found</p>
            <p className="text-gray-400 font-mono text-sm mb-4">
              Please contact an administrator to add games to the database.
            </p>
            <Button
              onClick={initializeGameData}
              className="bg-gray-700 hover:bg-gray-600 text-gray-200"
            >
              Retry Loading
            </Button>
          </div>
        )}
      </div>

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-400 font-mono">
              <Gift className="h-5 w-5" />
              Congratulations! You're eligible for prizes!
            </DialogTitle>
            <DialogDescription className="text-gray-300 font-mono">
              Enter your phone number to contact you about the prize and rewards!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber" className="text-gray-200 font-mono">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                className="bg-gray-700 border-gray-600 text-gray-100 font-mono"
                disabled={isSubmittingPhone}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPhoneDialog(false)
                setPhoneNumber("")
              }}
              disabled={isSubmittingPhone}
              className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 font-mono"
            >
              Skip
            </Button>
            <Button
              onClick={handlePhoneSubmit}
              disabled={!phoneNumber.trim() || isSubmittingPhone}
              className="bg-yellow-600 hover:bg-yellow-700  font-mono font-semibold"
            >
              {isSubmittingPhone ? "Saving..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
