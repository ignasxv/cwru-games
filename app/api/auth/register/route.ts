import { NextRequest, NextResponse } from 'next/server'
import { registerUser } from '@/lib/actions/game-actions'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, phoneNumber } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Username, email, and password are required' },
        { status: 400 }
      )
    }

    // Normalize username to lowercase
    const normalizedUsername = username.toLowerCase().trim()

    const result = await registerUser(normalizedUsername, email, password, phoneNumber)

    if (result.success) {
      return NextResponse.json(result, { status: 201 })
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
