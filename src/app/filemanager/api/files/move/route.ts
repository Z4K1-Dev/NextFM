import { NextRequest, NextResponse } from 'next/server'
import { renameSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { existsSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { items, targetPath, currentPath } = await request.json()
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to move' }, { status: 400 })
    }

    if (targetPath === undefined || targetPath === null) {
      return NextResponse.json({ error: 'Target path is required' }, { status: 400 })
    }

    const workingDir = process.cwd()
    const results = []

    for (const itemPath of items) {
      try {
        // Security: Ensure paths are within working directory
        const sourceFullPath = join(workingDir, itemPath)
        const targetFullPath = targetPath 
          ? join(workingDir, targetPath, itemPath.split('/').pop() || '')
          : join(workingDir, itemPath.split('/').pop() || '')

        if (!sourceFullPath.startsWith(workingDir) || !targetFullPath.startsWith(workingDir)) {
          results.push({ item: itemPath, success: false, error: 'Invalid path' })
          continue
        }

        // Ensure target directory exists
        const targetDir = targetFullPath ? dirname(targetFullPath) : workingDir
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true })
        }

        // Move the file/folder
        renameSync(sourceFullPath, targetFullPath)
        results.push({ item: itemPath, success: true })
      } catch (error) {
        console.error(`Error moving ${itemPath}:`, error)
        results.push({ item: itemPath, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({ 
      success: failureCount === 0,
      message: `Moved ${successCount} item(s) successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results 
    })
  } catch (error) {
    console.error('Error in move operation:', error)
    return NextResponse.json({ error: 'Move operation failed' }, { status: 500 })
  }
}