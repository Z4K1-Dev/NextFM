import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { oldPath, newName, isDirectory } = await request.json()
    
    if (!oldPath || !newName) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Validate new name (prevent path traversal)
    if (newName.includes('/') || newName.includes('\\') || newName.includes('..')) {
      return NextResponse.json(
        { error: 'Invalid file name' },
        { status: 400 }
      )
    }

    // Get the directory path
    const dirPath = path.dirname(oldPath)
    const newPath = path.join(dirPath, newName)

    // Check if source exists
    try {
      await fs.access(oldPath)
    } catch {
      return NextResponse.json(
        { error: 'Source file/folder not found' },
        { status: 404 }
      )
    }

    // Check if destination already exists
    try {
      await fs.access(newPath)
      return NextResponse.json(
        { error: 'A file/folder with this name already exists' },
        { status: 409 }
      )
    } catch {
      // Destination doesn't exist, which is good
    }

    // Rename the file/folder
    await fs.rename(oldPath, newPath)

    return NextResponse.json({
      success: true,
      message: `${isDirectory ? 'Folder' : 'File'} renamed successfully`,
      oldPath,
      newPath
    })

  } catch (error) {
    console.error('Rename error:', error)
    return NextResponse.json(
      { error: 'Failed to rename file/folder' },
      { status: 500 }
    )
  }
}