import WordleGameWithAuth from "@/components/wordle-game-with-auth"
import { initializeDatabase } from "@/lib/db"

export default async function CWRUWordle() {
  // Initialize database on page load
  await initializeDatabase()
  
  return (
    <>
      <WordleGameWithAuth />
    </>
  )
}
