import { NextRequest, NextResponse } from 'next/server'
import { copyFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync, lstatSync, readdirSync } from 'fs'

async function copyRecursive(source: string, target: string): Promise<void> {
  const stats = lstatSync(source)
  
  if (stats.isDirectory()) {
    // Create target directory
    await mkdir(target, { recursive: true })
    
    // Read directory contents
    const items = readdirSync(source)
    
    // Copy each item recursively
    for (const item of items) {
      await copyRecursive(join(source, item), join(target, item))
    }
  } else {
    // Copy file
    await copyFile(source, target)
  }
}

export async function POST(request: NextRequest) {
  try {
    const { items, targetPath, currentPath } = await request.json()
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to copy' }, { status: 400 })
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

        // Check if source exists
        if (!existsSync(sourceFullPath)) {
          results.push({ item: itemPath, success: false, error: 'Source not found' })
          continue
        }

        // Ensure target directory exists
        const targetDir = targetFullPath ? dirname(targetFullPath) : workingDir
        if (!existsSync(targetDir)) {
          await mkdir(targetDir, { recursive: true })
        }

        // Copy the file/folder recursively
        await copyRecursive(sourceFullPath, targetFullPath)
        results.push({ item: itemPath, success: true })
      } catch (error) {
        console.error(`Error copying ${itemPath}:`, error)
        results.push({ item: itemPath, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    return NextResponse.json({ 
      success: failureCount === 0,
      message: `Copied ${successCount} item(s) successfully${failureCount > 0 ? `, ${failureCount} failed` : ''}`,
      results 
    })
  } catch (error) {
    console.error('Error in copy operation:', error)
    return NextResponse.json({ error: 'Copy operation failed' }, { status: 500 })
  }
}