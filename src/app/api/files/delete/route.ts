import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, isDirectory } = await request.json()
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
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
    
    // Check if the item exists
    try {
      await fs.access(resolvedPath)
    } catch {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }
    
    // Delete the item
    if (isDirectory) {
      // For directories, use rm -rf to remove recursively
      await execAsync(`rm -rf "${resolvedPath}"`)
    } else {
      // For files, use unlink
      await fs.unlink(resolvedPath)
    }
    
    return NextResponse.json({ 
      message: 'Item deleted successfully',
      path: filePath
    })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}