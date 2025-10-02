import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestedPath = searchParams.get('path') || ''
    
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
    
    // Read the directory
    const items = await fs.readdir(resolvedPath)
    const files = []
    
    for (const item of items) {
      const itemPath = path.join(resolvedPath, item)
      const stats = await fs.stat(itemPath)
      
      // Skip hidden files and directories
      if (item.startsWith('.')) {
        continue
      }
      
      const fileInfo = {
        name: item,
        path: path.join(requestedPath, item),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime.toISOString(),
        type: stats.isDirectory() ? 'folder' : path.extname(item).slice(1) || 'file'
      }
      
      files.push(fileInfo)
    }
    
    // Sort files: directories first, then files, both by name
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1
      if (!a.isDirectory && b.isDirectory) return 1
      return a.name.localeCompare(b.name)
    })
    
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error listing files:', error)
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    )
  }
}