import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export function AdminLink() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <Link href="/admin">
        <Button
          variant="ghost"
          size="sm"
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-gray-100"
        >
          <Settings className="w-4 h-4 mr-1" />
          Admin
        </Button>
      </Link>
    </div>
  )
}
