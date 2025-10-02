import { NextRequest, NextResponse } from 'next/server'

// Mirror the app directory API route
export async function GET(request: NextRequest) {
  try {
    const appResponse = await fetch(`${process.env.BASE_URL || 'http://localhost:3000'}/app/filemanager/api/files/list-folders`)
    const data = await appResponse.json()
    return NextResponse.json(data, { status: appResponse.status })
  } catch (error) {
    console.error('Error in mirror list-folders API:', error)
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 })
  }
}