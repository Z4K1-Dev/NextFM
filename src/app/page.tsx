import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FolderIcon, FileTextIcon, UploadIcon, DownloadIcon, ArchiveIcon } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              File Manager
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              A powerful file management system with upload, download, editing, and compression capabilities. 
              Manage your files and directories with ease in a modern dark mode interface.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderIcon className="w-5 h-5 text-blue-500" />
                  Browse Files
                </CardTitle>
                <CardDescription>
                  Navigate through directories and view your files with an intuitive interface
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5 text-green-500" />
                  Upload Files
                </CardTitle>
                <CardDescription>
                  Upload any file type with progress tracking and drag-and-drop support
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DownloadIcon className="w-5 h-5 text-purple-500" />
                  Download Files
                </CardTitle>
                <CardDescription>
                  Download files with a single click, preserving file integrity
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="w-5 h-5 text-orange-500" />
                  Edit Files
                </CardTitle>
                <CardDescription>
                  Edit text files directly in your browser with syntax highlighting
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArchiveIcon className="w-5 h-5 text-red-500" />
                  Compress Files
                </CardTitle>
                <CardDescription>
                  Create tar archives from multiple files and folders
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderIcon className="w-5 h-5 text-indigo-500" />
                  Dark Mode
                </CardTitle>
                <CardDescription>
                  Modern dark theme interface for comfortable extended use
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Link href="/filemanager">
              <Button size="lg" className="text-lg px-8 py-6">
                Open File Manager
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">
              Access your files at <code className="bg-muted px-2 py-1 rounded">/filemanager</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}