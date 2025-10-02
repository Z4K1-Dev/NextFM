import { NextRequest, NextResponse } from 'next/server'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    const workingDir = process.cwd()
    const folders = [''] // Include root folder
    
    function scanDirectory(dirPath: string, relativePath: string = '') {
      try {
        const items = readdirSync(join(workingDir, dirPath))
        
        for (const item of items) {
          const fullPath = join(workingDir, dirPath, item)
          const relativeItemPath = relativePath ? join(relativePath, item) : item
          
          try {
            const stats = statSync(fullPath)
            if (stats.isDirectory()) {
              folders.push(relativeItemPath)
              // Recursively scan subdirectories (limit depth to prevent infinite recursion)
              if (relativeItemPath.split('/').length < 3) {
                scanDirectory(relativeItemPath, relativeItemPath)
              }
            }
          } catch (error) {
            // Skip items that can't be accessed
            continue
          }
        }
      } catch (error) {
        // Skip directories that can't be accessed
        return
      }
    }
    
    scanDirectory('')
    
    return NextResponse.json({ 
      success: true, 
      folders: folders.sort((a, b) => {
        // Sort by depth, then alphabetically
        const aDepth = a.split('/').length
        const bDepth = b.split('/').length
        if (aDepth !== bDepth) {
          return aDepth - bDepth
        }
        return a.localeCompare(b)
      })
    })
  } catch (error) {
    console.error('Error listing folders:', error)
    return NextResponse.json({ error: 'Failed to list folders' }, { status: 500 })
  }
}