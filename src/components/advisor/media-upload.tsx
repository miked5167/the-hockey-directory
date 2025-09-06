'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  X,
  Star,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaItem {
  id: string
  type: 'image' | 'video' | 'document'
  url: string
  title: string
  description?: string
  featured: boolean
  fileSize: number
  uploadDate: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  progress?: number
}

interface MediaUploadProps {
  advisorId: string
  existingMedia: MediaItem[]
  onMediaUpdate: (media: MediaItem[]) => void
  className?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES]

export function MediaUpload({ advisorId, existingMedia, onMediaUpdate, className }: MediaUploadProps) {
  const [media, setMedia] = useState<MediaItem[]>(existingMedia)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const validateFile = (file: File): string | null => {
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Unsupported file type. Allowed types: JPG, PNG, WebP, MP4, WebM, MOV, PDF`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: File too large. Maximum size is 10MB`
    }

    return null
  }

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) return 'image'
    if (ALLOWED_VIDEO_TYPES.includes(file.type)) return 'video'
    return 'document'
  }

  const handleFiles = async (files: File[]) => {
    setError(null)
    
    // Validate all files first
    const validationErrors = []
    for (const file of files) {
      const error = validateFile(file)
      if (error) validationErrors.push(error)
    }

    if (validationErrors.length > 0) {
      setError(validationErrors.join('\n'))
      return
    }

    // Check total media limit (max 10 items)
    if (media.length + files.length > 10) {
      setError('Maximum 10 media items allowed per profile')
      return
    }

    setIsUploading(true)

    try {
      const newMediaItems: MediaItem[] = []

      for (const file of files) {
        const mediaItem: MediaItem = {
          id: `temp-${Date.now()}-${Math.random()}`,
          type: getFileType(file),
          url: URL.createObjectURL(file), // Temporary URL for preview
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          featured: media.length === 0 && newMediaItems.length === 0, // First item is featured
          fileSize: file.size,
          uploadDate: new Date().toISOString(),
          status: 'uploading',
          progress: 0
        }

        newMediaItems.push(mediaItem)
        setMedia(prev => [...prev, mediaItem])

        // Simulate upload with progress
        await uploadFile(file, mediaItem)
      }

      onMediaUpdate([...media, ...newMediaItems])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  const uploadFile = async (file: File, mediaItem: MediaItem): Promise<void> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('advisorId', advisorId)
    formData.append('type', mediaItem.type)
    formData.append('title', mediaItem.title)

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        updateMediaItem(mediaItem.id, { progress })
      }

      // In a real implementation, this would be an actual API call
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      
      // Update with final URL and mark as ready
      updateMediaItem(mediaItem.id, {
        url: result.url,
        status: 'ready',
        id: result.id
      })

    } catch (error) {
      updateMediaItem(mediaItem.id, { status: 'error' })
      throw error
    }
  }

  const updateMediaItem = (id: string, updates: Partial<MediaItem>) => {
    setMedia(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  const deleteMediaItem = (id: string) => {
    const updatedMedia = media.filter(item => item.id !== id)
    setMedia(updatedMedia)
    onMediaUpdate(updatedMedia)
  }

  const setFeatured = (id: string) => {
    const updatedMedia = media.map(item => ({
      ...item,
      featured: item.id === id
    }))
    setMedia(updatedMedia)
    onMediaUpdate(updatedMedia)
  }

  const updateItemDetails = (id: string, title: string, description?: string) => {
    const updatedMedia = media.map(item => 
      item.id === id ? { ...item, title, description } : item
    )
    setMedia(updatedMedia)
    onMediaUpdate(updatedMedia)
    setEditingItem(null)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return ImageIcon
      case 'video': return Video
      case 'document': return FileText
      default: return FileText
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600'
      case 'uploading': return 'text-blue-600'
      case 'processing': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className={className}>
      {/* Upload Area */}
      <Card className={cn("border-2 border-dashed transition-colors", {
        "border-blue-500 bg-blue-50": dragActive,
        "border-gray-300": !dragActive
      })}>
        <CardContent
          className="p-8"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className={cn("h-12 w-12 mx-auto mb-4", {
              "text-blue-500": dragActive,
              "text-gray-400": !dragActive
            })} />
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Media Files
            </h3>
            
            <p className="text-gray-600 mb-4">
              Drag and drop files here, or click to browse
            </p>

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="mb-4"
            >
              <Plus className="h-4 w-4 mr-2" />
              Choose Files
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Supported formats: JPG, PNG, WebP, MP4, WebM, MOV, PDF</p>
              <p>Maximum file size: 10MB • Maximum {10 - media.length} more files</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALL_ALLOWED_TYPES.join(',')}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* Media Grid */}
      {media.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {media.map((item) => {
            const TypeIcon = getTypeIcon(item.type)
            
            return (
              <Card key={item.id} className={cn("relative", {
                "ring-2 ring-yellow-400": item.featured
              })}>
                <CardContent className="p-4">
                  {/* Media Preview */}
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 relative overflow-hidden">
                    {item.type === 'image' && (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {item.type === 'video' && (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        controls={item.status === 'ready'}
                      />
                    )}
                    
                    {item.type === 'document' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="h-12 w-12 text-gray-400" />
                      </div>
                    )}

                    {/* Status Overlay */}
                    {item.status !== 'ready' && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          {item.status === 'uploading' && (
                            <>
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Uploading...</p>
                              {item.progress && (
                                <Progress value={item.progress} className="w-24 mt-2 mx-auto" />
                              )}
                            </>
                          )}
                          
                          {item.status === 'processing' && (
                            <>
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                              <p className="text-sm">Processing...</p>
                            </>
                          )}
                          
                          {item.status === 'error' && (
                            <>
                              <X className="h-6 w-6 mx-auto mb-2" />
                              <p className="text-sm">Upload failed</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Featured Badge */}
                    {item.featured && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  {/* Media Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TypeIcon className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm truncate">{item.title}</span>
                    </div>

                    {item.description && (
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{(item.fileSize / 1024 / 1024).toFixed(1)}MB</span>
                      <span className={getStatusColor(item.status)}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between mt-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingItem(item)}
                        disabled={item.status !== 'ready'}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      {!item.featured && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setFeatured(item.id)}
                          disabled={item.status !== 'ready'}
                        >
                          <Star className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteMediaItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Media Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Media Details</DialogTitle>
            <DialogDescription>
              Update the title and description for this media item
            </DialogDescription>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  defaultValue={editingItem.title}
                  onChange={(e) => setEditingItem({...editingItem, title: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this media shows..."
                  defaultValue={editingItem.description}
                  onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateItemDetails(
                    editingItem.id, 
                    editingItem.title, 
                    editingItem.description
                  )}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}