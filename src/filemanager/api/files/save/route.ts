import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, content } = await request.json()
    
    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'File path and content are required' },
        { status: 400 }
      )
    }
    
    // Get the current working directory
    const baseDir = process.cwd()
    
    // Construct the full path, ensuring it stays within the base directory
    const fullPath = path.join(baseDir, filePath)
    
    // Security check: ensure the path is within the base directory
    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Ensure the directory exists
    const directory = path.dirname(resolvedPath)
    await fs.mkdir(directory, { recursive: true })
    
    // Write the file content
    await fs.writeFile(resolvedPath, content, 'utf-8')
    
    return NextResponse.json({ 
      message: 'File saved successfully',
      path: filePath
    })
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    )
  }
}