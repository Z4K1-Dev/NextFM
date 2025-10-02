import { NextRequest, NextResponse } from 'next/server'

// Mirror the app directory API route
export async function POST(request: NextRequest) {
  try {
    const appResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/app/filemanager/api/files/move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(await request.json()),
    })

    const data = await appResponse.json()
    return NextResponse.json(data, { status: appResponse.status })
  } catch (error) {
    console.error('Error in mirror move API:', error)
    return NextResponse.json({ error: 'Move operation failed' }, { status: 500 })
  }
}