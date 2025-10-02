'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { 
  FolderIcon, 
  FileIcon, 
  UploadIcon, 
  DownloadIcon, 
  EditIcon, 
  ArchiveIcon,
  RefreshCwIcon,
  HomeIcon,
  Trash2Icon,
  FileTextIcon,
  PackageIcon,
  FileArchiveIcon,
  CodeIcon,
  FileJsonIcon,
  SettingsIcon,
  FolderPlusIcon,
  CopyIcon,
  MoveIcon
} from 'lucide-react'
import { formatFileSize, formatDate } from '@/lib/utils'

interface FileItem {
  name: string
  path: string
  isDirectory: boolean
  size: number
  modified: string | Date
  type?: string
}

const getFileTypeInfo = (fileName: string) => {
  const extension = fileName.toLowerCase().split('.').pop()
  
  // TypeScript files
  if (extension === 'ts' || extension === 'tsx') {
    return {
      icon: CodeIcon,
      color: 'text-blue-400',
      bgColor: 'bg-blue-50'
    }
  }
  
  // JavaScript files
  if (extension === 'js' || extension === 'mjs' || extension === 'jsx') {
    return {
      icon: FileJsonIcon,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50'
    }
  }
  
  // JSON files
  if (extension === 'json') {
    return {
      icon: SettingsIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    }
  }
  
  // Compressed files
  if (extension === 'zip' || extension === 'tar' || extension === 'gz' || fileName.toLowerCase().endsWith('.tar.gz')) {
    return {
      icon: FileArchiveIcon,
      color: 'text-red-500',
      bgColor: 'bg-red-50'
    }
  }
  
  // Default
  return {
    icon: FileIcon,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50'
  }
}

export default function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentPath, setCurrentPath] = useState('')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [editingFile, setEditingFile] = useState<FileItem | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [compressDialogOpen, setCompressDialogOpen] = useState(false)
  const [compressName, setCompressName] = useState('')
  const [compressType, setCompressType] = useState<'tar' | 'zip'>('tar')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [copyDialogOpen, setCopyDialogOpen] = useState(false)
  const [targetPath, setTargetPath] = useState('')
  const [availableFolders, setAvailableFolders] = useState<string[]>([])
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null)
  const [newName, setNewName] = useState('')
  const { toast } = useToast()

  const loadFiles = async (path: string = '') => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/filemanager/api/files/list?path=${encodeURIComponent(path)}`)
      if (!response.ok) {
        throw new Error('Failed to load files')
      }
      const data = await response.json()
      // Convert ISO strings back to Date objects
      const processedFiles = data.files.map((file: any) => ({
        ...file,
        modified: new Date(file.modified)
      }))
      setFiles(processedFiles)
      setCurrentPath(path)
      
      // Clean up selected items that no longer exist
      const currentFilePaths = processedFiles.map(file => file.path)
      setSelectedItems(prev => prev.filter(itemPath => currentFilePaths.includes(itemPath)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadProgress(0)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', currentPath)

    try {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100
          setUploadProgress(progress)
        }
      }

      xhr.onload = async () => {
        if (xhr.status === 200) {
          toast({
            title: "Success",
            description: "File uploaded successfully",
          })
          await loadFiles(currentPath)
        } else {
          throw new Error('Upload failed')
        }
        setIsUploading(false)
        setUploadProgress(0)
      }

      xhr.onerror = () => {
        toast({
          title: "Error",
          description: "Upload failed",
          variant: "destructive",
        })
        setIsUploading(false)
        setUploadProgress(0)
      }

      xhr.open('POST', '/filemanager/api/files/upload')
      xhr.send(formData)
    } catch (err) {
      toast({
        title: "Error",
        description: "Upload failed",
        variant: "destructive",
      })
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/filemanager/api/files/download?path=${encodeURIComponent(file.path)}`)
      if (!response.ok) {
        throw new Error('Download failed')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "Success",
        description: "File downloaded successfully",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Download failed",
        variant: "destructive",
      })
    }
  }

  const handleFileEdit = async (file: FileItem) => {
    if (file.isDirectory) return

    try {
      const response = await fetch(`/filemanager/api/files/read?path=${encodeURIComponent(file.path)}`)
      if (!response.ok) {
        throw new Error('Failed to read file')
      }
      const data = await response.json()
      setFileContent(data.content)
      setEditingFile(file)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to read file",
        variant: "destructive",
      })
    }
  }

  const saveFileEdit = async () => {
    if (!editingFile) return

    try {
      const response = await fetch('/filemanager/api/files/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: editingFile.path,
          content: fileContent,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save file')
      }

      toast({
        title: "Success",
        description: "File saved successfully",
      })
      setEditingFile(null)
      setFileContent('')
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save file",
        variant: "destructive",
      })
    }
  }

  const handleCompress = async () => {
    if (!compressName || selectedItems.length === 0) return

    try {
      const response = await fetch('/filemanager/api/files/compress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: compressName,
          items: selectedItems,
          path: currentPath,
          type: compressType,
        }),
      })

      if (!response.ok) {
        throw new Error('Compression failed')
      }

      toast({
        title: "Success",
        description: `Files compressed successfully as ${compressType.toUpperCase()}`,
      })
      setCompressDialogOpen(false)
      setCompressName('')
      setCompressType('tar')
      setSelectedItems([])
      await loadFiles(currentPath)
    } catch (err) {
      toast({
        title: "Error",
        description: "Compression failed",
        variant: "destructive",
      })
    }
  }

  const handleExtract = async (file: FileItem) => {
    try {
      const response = await fetch('/filemanager/api/files/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: file.path,
          targetPath: currentPath,
        }),
      })

      if (!response.ok) {
        throw new Error('Extraction failed')
      }

      toast({
        title: "Success",
        description: "Archive extracted successfully",
      })
      await loadFiles(currentPath)
    } catch (err) {
      toast({
        title: "Error",
        description: "Extraction failed",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${file.name}?`)) return

    try {
      const response = await fetch('/filemanager/api/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: file.path,
          isDirectory: file.isDirectory,
        }),
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      // Remove the deleted file from selected items
      setSelectedItems(prev => prev.filter(itemPath => itemPath !== file.path))

      toast({
        title: "Success",
        description: "Item deleted successfully",
      })
      await loadFiles(currentPath)
    } catch (err) {
      toast({
        title: "Error",
        description: "Delete failed",
        variant: "destructive",
      })
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/filemanager/api/files/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          path: currentPath,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create folder')
      }

      toast({
        title: "Success",
        description: "Folder created successfully",
      })
      setCreateFolderDialogOpen(false)
      setNewFolderName('')
      await loadFiles(currentPath)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      })
    }
  }

  const handleMove = async () => {
    if (!targetPath || selectedItems.length === 0) return

    try {
      const response = await fetch('/filemanager/api/files/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: selectedItems,
          targetPath: targetPath,
          currentPath: currentPath,
        }),
      })

      if (!response.ok) {
        throw new Error('Move failed')
      }

      toast({
        title: "Success",
        description: `Moved ${selectedItems.length} item(s) successfully`,
      })
      setMoveDialogOpen(false)
      setTargetPath('')
      setSelectedItems([])
      await loadFiles(currentPath)
    } catch (err) {
      toast({
        title: "Error",
        description: "Move failed",
        variant: "destructive",
      })
    }
  }

  const handleCopy = async () => {
    if (!targetPath || selectedItems.length === 0) return

    try {
      const response = await fetch('/filemanager/api/files/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: selectedItems,
          targetPath: targetPath,
          currentPath: currentPath,
        }),
      })

      if (!response.ok) {
        throw new Error('Copy failed')
      }

      toast({
        title: "Success",
        description: `Copied ${selectedItems.length} item(s) successfully`,
      })
      setCopyDialogOpen(false)
      setTargetPath('')
      setSelectedItems([])
      await loadFiles(currentPath)
    } catch (err) {
      toast({
        title: "Error",
        description: "Copy failed",
        variant: "destructive",
      })
    }
  }

  const loadAvailableFolders = async () => {
    try {
      const response = await fetch('/filemanager/api/files/list-folders')
      if (!response.ok) {
        throw new Error('Failed to load folders')
      }
      const data = await response.json()
      setAvailableFolders(data.folders)
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load available folders",
        variant: "destructive",
      })
    }
  }

  const startRename = (file: FileItem) => {
    setRenamingFile(file)
    setNewName(file.name)
  }

  const handleRename = async () => {
    if (!renamingFile || !newName.trim()) return

    // Check if name actually changed
    if (newName.trim() === renamingFile.name) {
      cancelRename()
      return
    }

    try {
      const response = await fetch('/filemanager/api/files/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPath: renamingFile.path,
          newName: newName.trim(),
          isDirectory: renamingFile.isDirectory,
        }),
      })

      if (!response.ok) {
        throw new Error('Rename failed')
      }

      toast({
        title: "Success",
        description: `${renamingFile.isDirectory ? 'Folder' : 'File'} renamed successfully`,
      })
      setRenamingFile(null)
      setNewName('')
      await loadFiles(currentPath)
    } catch (err) {
      toast({
        title: "Error",
        description: "Rename failed",
        variant: "destructive",
      })
    }
  }

  const cancelRename = () => {
    setRenamingFile(null)
    setNewName('')
  }

  const toggleItemSelection = (itemPath: string) => {
    setSelectedItems(prev => 
      prev.includes(itemPath) 
        ? prev.filter(p => p !== itemPath)
        : [...prev, itemPath]
    )
  }

  const toggleSelectAll = () => {
    const allFilePaths = files.map(file => file.path)
    const allSelected = allFilePaths.every(path => selectedItems.includes(path))
    
    if (allSelected) {
      // Deselect all
      setSelectedItems([])
    } else {
      // Select all
      setSelectedItems(allFilePaths)
    }
  }

  const getSelectAllState = () => {
    if (files.length === 0) return 'unchecked'
    const allFilePaths = files.map(file => file.path)
    const selectedCount = allFilePaths.filter(path => selectedItems.includes(path)).length
    
    if (selectedCount === 0) return 'unchecked'
    if (selectedCount === files.length) return 'checked'
    return 'indeterminate'
  }

  const navigateToFolder = (folder: FileItem) => {
    setCurrentPath(folder.path)
    setSelectedItems([]) // Clear selection when navigating to a new folder
    loadFiles(folder.path)
  }

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/')
    setSelectedItems([]) // Clear selection when navigating up
    loadFiles(parentPath)
  }

  const navigateHome = () => {
    setSelectedItems([]) // Clear selection when navigating home
    loadFiles('')
  }

  useEffect(() => {
    loadFiles()
  }, [])

  useEffect(() => {
    if (moveDialogOpen || copyDialogOpen) {
      loadAvailableFolders()
      setTargetPath(currentPath)
    }
  }, [moveDialogOpen, copyDialogOpen, currentPath])

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderIcon className="w-6 h-6" />
              File Manager
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Button variant="ghost" size="sm" onClick={navigateHome}>
                <HomeIcon className="w-4 h-4" />
              </Button>
              <span>/</span>
              {currentPath.split('/').map((part, index) => (
                <span key={index}>
                  {index > 0 && <span>/</span>}
                  {part}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Action Bar */}
              <div className="flex items-center justify-between gap-4">
                {/* Left side - Main actions */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadFiles(currentPath)}
                    disabled={loading}
                  >
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>

                  <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <FolderPlusIcon className="w-4 h-4 mr-2" />
                        New Folder
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="folder-name">Folder Name</Label>
                          <Input
                            id="folder-name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="Enter folder name"
                          />
                        </div>
                        <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                          Create Folder
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {selectedItems.length > 0 && (
                    <>
                      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoveIcon className="w-4 h-4 mr-2" />
                            Move ({selectedItems.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Move Items</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="move-target">Target Location</Label>
                              <select
                                id="move-target"
                                value={targetPath}
                                onChange={(e) => setTargetPath(e.target.value)}
                                className="w-full p-2 border rounded-md"
                              >
                                {availableFolders.map(folder => (
                                  <option key={folder} value={folder}>
                                    {folder || 'Root'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button onClick={handleMove} disabled={!targetPath}>
                              Move to {targetPath || 'Root'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <CopyIcon className="w-4 h-4 mr-2" />
                            Copy ({selectedItems.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Copy Items</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="copy-target">Target Location</Label>
                              <select
                                id="copy-target"
                                value={targetPath}
                                onChange={(e) => setTargetPath(e.target.value)}
                                className="w-full p-2 border rounded-md"
                              >
                                {availableFolders.map(folder => (
                                  <option key={folder} value={folder}>
                                    {folder || 'Root'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button onClick={handleCopy} disabled={!targetPath}>
                              Copy to {targetPath || 'Root'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={compressDialogOpen} onOpenChange={setCompressDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <ArchiveIcon className="w-4 h-4 mr-2" />
                            Compress ({selectedItems.length})
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Compress Files</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="compress-name">Archive Name</Label>
                              <Input
                                id="compress-name"
                                value={compressName}
                                onChange={(e) => setCompressName(e.target.value)}
                                placeholder={compressType === 'tar' ? 'archive.tar' : 'archive.zip'}
                              />
                            </div>
                            <div>
                              <Label>Compression Type</Label>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" className="w-full justify-between">
                                    {compressType === 'tar' ? 'TAR Archive' : 'ZIP Archive'}
                                    <PackageIcon className="w-4 h-4 ml-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem onClick={() => setCompressType('tar')}>
                                    <ArchiveIcon className="w-4 h-4 mr-2" />
                                    TAR Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setCompressType('zip')}>
                                    <FileArchiveIcon className="w-4 h-4 mr-2" />
                                    ZIP Archive
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <Button onClick={handleCompress} disabled={!compressName}>
                              Compress as {compressType.toUpperCase()}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {currentPath && (
                    <Button variant="outline" size="sm" onClick={navigateUp}>
                      <FolderIcon className="w-4 h-4 mr-2" />
                      Up
                    </Button>
                  )}
                </div>

                {/* Right side - Upload only */}
                <div className="relative">
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Button variant="outline" size="sm" disabled={isUploading}>
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* File List */}
              <div className="border rounded-lg flex-1 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={getSelectAllState() === 'checked'}
                          ref={(el) => {
                            if (el) {
                              el.indeterminate = getSelectAllState() === 'indeterminate'
                            }
                          }}
                          onChange={toggleSelectAll}
                          className="custom-checkbox"
                          disabled={files.length === 0}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Modified</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : files.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No files found
                        </TableCell>
                      </TableRow>
                    ) : (
                      files.map((file) => {
                        const fileInfo = file.isDirectory ? null : getFileTypeInfo(file.name)
                        const IconComponent = fileInfo ? fileInfo.icon : (file.isDirectory ? FolderIcon : FileIcon)
                        const iconColor = file.isDirectory ? 'text-blue-500' : (fileInfo?.color || 'text-gray-500')
                        
                        return (
                          <TableRow key={file.path}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(file.path)}
                                onChange={() => toggleItemSelection(file.path)}
                                className="custom-checkbox"
                              />
                            </TableCell>
                            <TableCell>
                              {renamingFile?.path === file.path ? (
                                <div className="flex items-center gap-1">
                                  <IconComponent className={`w-4 h-4 ${iconColor}`} />
                                  <Input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleRename()
                                      } else if (e.key === 'Escape') {
                                        cancelRename()
                                      }
                                    }}
                                    onBlur={handleRename}
                                    className="h-7 text-sm"
                                    autoFocus
                                    ref={(el) => el?.select()}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <IconComponent 
                                    className={`w-4 h-4 ${iconColor} cursor-pointer hover:opacity-80`}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (file.isDirectory) {
                                        navigateToFolder(file)
                                      }
                                    }}
                                    title={file.isDirectory ? "Open folder" : "File"}
                                  />
                                  <span
                                    className={`cursor-pointer hover:underline ${iconColor} ${
                                      file.isDirectory ? 'font-medium' : ''
                                    }`}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation()
                                      startRename(file)
                                    }}
                                  >
                                    {file.name}
                                  </span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {file.isDirectory ? '-' : formatFileSize(file.size)}
                            </TableCell>
                            <TableCell>
                              {formatDate(file.modified)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {renamingFile?.path !== file.path && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startRename(file)}
                                      title="Rename"
                                    >
                                      <EditIcon className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {!file.isDirectory && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFileDownload(file)}
                                    >
                                      <DownloadIcon className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFileEdit(file)}
                                    >
                                      <FileTextIcon className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {(file.type === 'tar' || file.type === 'zip') && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleExtract(file)}
                                  >
                                    <PackageIcon className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(file)}
                                >
                                  <Trash2Icon className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Edit Dialog */}
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileTextIcon className="w-5 h-5" />
                Edit: {editingFile?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="File content..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingFile(null)}>
                  Cancel
                </Button>
                <Button onClick={saveFileEdit}>
                  Save
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}