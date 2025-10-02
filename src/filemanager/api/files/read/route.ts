import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedPath = searchParams.get('path')
    
    if (!requestedPath) {
      return NextResponse.json(
        { error: 'No file path provided' },
        { status: 400 }
      )
    }
    
    // Get the current working directory
    const baseDir = process.cwd()
    
    // Construct the full path, ensuring it stays within the base directory
    const fullPath = path.join(baseDir, requestedPath)
    
    // Security check: ensure the path is within the base directory
    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Check if the file exists and is a file (not a directory)
    const stats = await fs.stat(resolvedPath)
    if (stats.isDirectory()) {
      return NextResponse.json(
        { error: 'Cannot read a directory' },
        { status: 400 }
      )
    }
    
    // Check if the file is too large (limit to 1MB)
    if (stats.size > 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large to edit (max 1MB)' },
        { status: 400 }
      )
    }
    
    // Read the file content
    const content = await fs.readFile(resolvedPath, 'utf-8')
    
    return NextResponse.json({ 
      content,
      filename: path.basename(resolvedPath),
      size: stats.size
    })
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}