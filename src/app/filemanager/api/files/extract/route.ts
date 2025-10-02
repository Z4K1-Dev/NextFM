import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, targetPath } = await request.json()
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }
    
    // Get the current working directory
    const baseDir = process.cwd()
    
    // Construct the full file path
    const fullPath = path.join(baseDir, filePath)
    
    // Security check: ensure the path is within the base directory
    const resolvedPath = path.resolve(fullPath)
    if (!resolvedPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Construct the target directory path
    const targetDir = path.join(baseDir, targetPath || '')
    
    // Security check: ensure the target path is within the base directory
    const resolvedTargetPath = path.resolve(targetDir)
    if (!resolvedTargetPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Ensure the target directory exists
    await fs.mkdir(targetDir, { recursive: true })
    
    // Get the file extension
    const fileExt = path.extname(filePath).toLowerCase()
    
    let command: string
    
    if (fileExt === '.tar') {
      // Extract tar archive
      command = `tar -xf "${resolvedPath}" -C "${targetDir}"`
    } else if (fileExt === '.zip') {
      // Extract zip archive using Python
      const pythonScript = `
import zipfile
import os
import sys

def extract_zip(zip_path, extract_to):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_to)

if __name__ == "__main__":
    zip_path = sys.argv[1]
    extract_to = sys.argv[2]
    extract_zip(zip_path, extract_to)
`
      
      // Write the Python script to a temporary file
      const scriptPath = path.join(baseDir, 'temp_extract_script.py')
      await fs.writeFile(scriptPath, pythonScript)
      
      try {
        // Execute the Python script
        command = `python3 "${scriptPath}" "${resolvedPath}" "${targetDir}"`
        await execAsync(command, { cwd: targetDir })
      } finally {
        // Clean up the temporary script
        try {
          await fs.unlink(scriptPath)
        } catch {
          // Ignore cleanup errors
        }
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported archive format' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ 
      message: 'Archive extracted successfully',
      path: targetPath || '',
      extractedTo: targetDir
    })
  } catch (error) {
    console.error('Error extracting archive:', error)
    return NextResponse.json(
      { error: 'Failed to extract archive' },
      { status: 500 }
    )
  }
}