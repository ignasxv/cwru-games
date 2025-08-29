"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { InfoIcon, RotateCcw, Trophy, Share2 } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import cwruWords from "@/data/cwru-words.json"

type LetterState = "correct" | "present" | "absent" | "empty"

interface GameState {
  currentGuess: string
  guesses: string[]
  gameStatus: "playing" | "won" | "lost"
  currentRow: number
}

interface WordleGameProps {
  userId?: number
  title?: string
  subtitle?: string
}

export default function WordleGame({ userId, title = "CWRU WORDLE", subtitle = "Guess the CWRU word in 6 tries!" }: WordleGameProps) {
  const { toast } = useToast()
  const words = cwruWords.words
  const [gameState, setGameState] = useState<GameState>({
    currentGuess: "",
    guesses: [],
    gameStatus: "playing",
    currentRow: 0,
  })
  const [targetWord, setTargetWord] = useState("")
  const [targetHint, setTargetHint] = useState("")
  const [showHint, setShowHint] = useState(false)
  const [letterStates, setLetterStates] = useState<Record<string, LetterState>>({})
  const [animatingRow, setAnimatingRow] = useState<number | null>(null)

  // Initialize game
  useEffect(() => {
    startNewGame()
  }, [])

  const startNewGame = useCallback(() => {
    const randomWord = words[Math.floor(Math.random() * words.length)]
    setTargetWord(randomWord.word)
    setTargetHint(randomWord.hint)
    setGameState({
      currentGuess: "",
      guesses: [],
      gameStatus: "playing",
      currentRow: 0,
    })
    setLetterStates({})
    setShowHint(false)
    setAnimatingRow(null)
  }, [words])

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

  const submitGuess = useCallback(() => {
    if (gameState.currentGuess.length !== targetWord.length) {
      toast({
        title: "Invalid guess",
        description: `Please enter a ${targetWord.length}-letter word`,
        variant: "destructive",
      })
      setAnimatingRow(gameState.currentRow)
      setTimeout(() => setAnimatingRow(null), 500)
      return
    }

    const newGuesses = [...gameState.guesses, gameState.currentGuess]
    updateLetterStates(gameState.currentGuess)

    // Trigger animation
    setAnimatingRow(gameState.currentRow)
    setTimeout(() => setAnimatingRow(null), 600)

    if (gameState.currentGuess === targetWord) {
      setGameState({
        ...gameState,
        guesses: newGuesses,
        gameStatus: "won",
        currentGuess: "",
      })
      toast({
        title: "🎉 Congratulations!",
        description: `You guessed "${targetWord}" correctly!`,
      })
    } else if (newGuesses.length >= 6) {
      setGameState({
        ...gameState,
        guesses: newGuesses,
        gameStatus: "lost",
        currentGuess: "",
      })
      toast({
        title: "Game Over",
        description: `The word was "${targetWord}"`,
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
  }, [gameState, targetWord, toast])

  const handleKeyPress = useCallback(
    (key: string) => {
      if (gameState.gameStatus !== "playing") return

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
    [gameState, submitGuess, targetWord.length],
  )

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()
      if (key === "ENTER" || key === "BACKSPACE" || key.match(/[A-Z]/)) {
        e.preventDefault()
        handleKeyPress(key)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyPress])

  const renderGrid = () => {
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

  const shareResults = () => {
    const guessCount = gameState.gameStatus === "won" ? gameState.guesses.length : "X"
    const text = `${title} ${guessCount}/6\n\n${gameState.guesses
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
    toast({
      title: "Results copied!",
      description: "Share your Wordle results",
    })
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 font-mono">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2 font-mono">{title}</h1>
          <p className="text-gray-300 font-mono">{subtitle}</p>

          <div className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2 text-sm text-gray-200 font-mono">How to Play:</h3>
            <div className="flex justify-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-black font-bold font-mono">
                  A
                </div>
                <span className="text-gray-300">Correct</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-yellow-500 rounded flex items-center justify-center text-black font-bold font-mono">
                  B
                </div>
                <span className="text-gray-300">Wrong spot</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-gray-600 rounded flex items-center justify-center text-gray-200 font-bold font-mono">
                  C
                </div>
                <span className="text-gray-300">Not in word</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-4">
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

            <Button
              variant="outline"
              size="sm"
              onClick={startNewGame}
              className="bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 font-mono"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              New Game
            </Button>

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
          <Card className="p-4 mb-6 text-center bg-green-900/30 border-green-500">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-green-400 font-mono">Congratulations!</span>
            </div>
            <p className="text-sm text-gray-300 font-mono">
              You guessed "{targetWord}" in {gameState.guesses.length} tries!
            </p>
          </Card>
        )}

        {gameState.gameStatus === "lost" && (
          <Card className="p-4 mb-6 text-center bg-red-900/30 border-red-500">
            <div className="font-semibold text-red-400 mb-2 font-mono">Game Over!</div>
            <p className="text-sm text-gray-300 font-mono">The word was "{targetWord}"</p>
          </Card>
        )}

        {/* Game Grid */}
        <div className="space-y-2 mb-8">{renderGrid()}</div>

        {/* Keyboard */}
        <div className="space-y-2">{renderKeyboard()}</div>

        {/* Game Stats */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-4">
            <Badge variant="outline" className="bg-gray-800 border-gray-600 text-gray-200 font-mono">
              Guess {gameState.currentRow + 1}/6
            </Badge>
            <Badge variant="outline" className="bg-gray-800 border-gray-600 text-gray-200 font-mono">
              Word: {targetWord.length} letters
            </Badge>
          </div>
        </div>
      </div>
    </div>
  )
}
