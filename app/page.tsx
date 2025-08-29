import WordleGameWithAuth from "@/components/wordle-game-with-auth"
import { AdminLink } from "@/components/admin-link"
import { initializeDatabase } from "@/lib/db"

export default async function CWRUWordle() {
  // Initialize database on page load
  await initializeDatabase()
  
  return (
    <>
      <AdminLink />
      <WordleGameWithAuth title="CWRU WORDLE" subtitle="Guess the CWRU word in 6 tries!" />
    </>
  )
}
