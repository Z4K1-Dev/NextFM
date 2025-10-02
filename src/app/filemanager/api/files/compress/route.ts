import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { name, items, path: currentPath, type = 'tar' } = await request.json()
    
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
    
    // Ensure the archive name has the correct extension
    const archiveName = name.endsWith(`.${type}`) ? name : `${name}.${type}`
    const archivePath = path.join(currentDir, archiveName)
    
    // Security check: ensure the archive path is within the base directory
    const resolvedArchivePath = path.resolve(archivePath)
    if (!resolvedArchivePath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    let command: string
    
    if (type === 'tar') {
      // Build the tar command
      command = `tar -cf "${archivePath}" ${items.map(item => `"${item}"`).join(' ')}`
    } else if (type === 'zip') {
      // Build the zip command using Python
      const pythonScript = `
import zipfile
import os
import sys

def create_zip(zip_path, files_to_zip, base_dir):
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_item in files_to_zip:
            full_path = os.path.join(base_dir, file_item)
            if os.path.isdir(full_path):
                for root, dirs, files in os.walk(full_path):
                    for file in files:
                        file_path = os.path.join(root, file)
                        arcname = os.path.relpath(file_path, base_dir)
                        zipf.write(file_path, arcname)
            else:
                arcname = file_item
                zipf.write(full_path, arcname)

if __name__ == "__main__":
    zip_path = sys.argv[1]
    base_dir = sys.argv[2]
    files_to_zip = sys.argv[3:]
    create_zip(zip_path, files_to_zip, base_dir)
`
      
      // Write the Python script to a temporary file
      const scriptPath = path.join(baseDir, 'temp_zip_script.py')
      await fs.writeFile(scriptPath, pythonScript)
      
      try {
        // Execute the Python script
        command = `python3 "${scriptPath}" "${archivePath}" "${currentDir}" ${items.map(item => `"${item}"`).join(' ')}`
        await execAsync(command, { cwd: currentDir })
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
        { error: 'Unsupported compression type' },
        { status: 400 }
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
      path: path.join(currentPath, archiveName),
      type
    })
  } catch (error) {
    console.error('Error compressing files:', error)
    return NextResponse.json(
      { error: 'Failed to compress files' },
      { status: 500 }
    )
  }
}