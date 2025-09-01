import { NextRequest, NextResponse } from 'next/server'
import { loginUser } from '@/lib/actions/game-actions'

export async function POST(request: NextRequest) {
  try {
    const { usernameOrEmail, password } = await request.json()

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { success: false, message: 'Username/email and password are required' },
        { status: 400 }
      )
    }

    // Normalize username/email input to lowercase
    const normalizedInput = usernameOrEmail.toLowerCase().trim()

    const result = await loginUser(normalizedInput, password)

    if (result.success) {
      return NextResponse.json(result, { status: 200 })
    } else {
      return NextResponse.json(result, { status: 401 })
    }
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
