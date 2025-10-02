import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const requestedPath = formData.get('path') as string || ''
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }
    
    // Get the current working directory
    const baseDir = process.cwd()
    
    // Construct the full path, ensuring it stays within the base directory
    const targetDir = path.join(baseDir, requestedPath)
    
    // Security check: ensure the path is within the base directory
    const resolvedPath = path.resolve(targetDir)
    if (!resolvedPath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Ensure the target directory exists
    await fs.mkdir(targetDir, { recursive: true })
    
    // Construct the full file path
    const filePath = path.join(targetDir, file.name)
    
    // Security check: ensure the file path is within the base directory
    const resolvedFilePath = path.resolve(filePath)
    if (!resolvedFilePath.startsWith(baseDir)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    // Convert the file to a buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Write the file
    await fs.writeFile(filePath, buffer)
    
    return NextResponse.json({ 
      message: 'File uploaded successfully',
      filename: file.name,
      path: requestedPath
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}