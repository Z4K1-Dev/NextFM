import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { name, items, path: currentPath } = await request.json()
    
    if (!name || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Archive name and items are required' },
        { status: 400 }
      )
    }
    
    // Get the current working directory
    const baseDir = process.cwd()
    
    // Construct the current directory path
    const currentDir = path.join(baseDir, currentPath)
    
    // Security check: ensure the path is within the base directory
    const resolvedPath = path.resolve(currentDir)
    if (!resolvedPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Ensure the archive name ends with .tar
    const archiveName = name.endsWith('.tar') ? name : `${name}.tar`
    const archivePath = path.join(currentDir, archiveName)
    
    // Security check: ensure the archive path is within the base directory
    const resolvedArchivePath = path.resolve(archivePath)
    if (!resolvedArchivePath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Build the tar command
    const tarCommand = `tar -cf "${archivePath}" ${items.map(item => `"${item}"`).join(' ')}`
    
    // Execute the tar command
    try {
      await execAsync(tarCommand, { cwd: currentDir })
    } catch (execError) {
      console.error('Tar command failed:', execError)
      return NextResponse.json(
        { error: 'Failed to create archive' },
        { status: 500 }
      )
    }
    
    // Verify the archive was created
    try {
      await fs.access(archivePath)
    } catch {
      return NextResponse.json(
        { error: 'Archive was not created' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Archive created successfully',
      archiveName,
      path: path.join(currentPath, archiveName)
    })
  } catch (error) {
    console.error('Error compressing files:', error)
    return NextResponse.json(
      { error: 'Failed to compress files' },
      { status: 500 }
    )
  }
}