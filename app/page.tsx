import WordleGame from "@/components/wordle-game"
import cwruWords from "@/data/cwru-words.json"

export default function CWRUWordle() {
  return <WordleGame words={cwruWords.words} title="CWRU WORDLE" subtitle="Guess the CWRU word in 6 tries!" />
}
