import { NextRequest, NextResponse } from 'next/server'
import { mkdirSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { name, path } = await request.json()
    
    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Security: Sanitize folder name and prevent path traversal
    const sanitizedName = name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const folderPath = path ? join(process.cwd(), path, sanitizedName) : join(process.cwd(), sanitizedName)
    
    // Ensure the path is within the working directory
    const workingDir = process.cwd()
    if (!folderPath.startsWith(workingDir)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    mkdirSync(folderPath, { recursive: true })

    return NextResponse.json({ success: true, message: 'Folder created successfully' })
  } catch (error) {
    console.error('Error creating folder:', error)
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 })
  }
}