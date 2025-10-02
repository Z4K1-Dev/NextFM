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
        { error: 'Cannot download a directory' },
        { status: 400 }
      )
    }
    
    // Read the file
    const fileBuffer = await fs.readFile(resolvedPath)
    
    // Get the filename from the path
    const filename = path.basename(resolvedPath)
    
    // Create response with proper headers
    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', 'application/octet-stream')
    response.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    response.headers.set('Content-Length', fileBuffer.length.toString())
    
    return response
  } catch (error) {
    console.error('Error downloading file:', error)
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    )
  }
}