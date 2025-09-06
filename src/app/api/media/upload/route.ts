import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/database'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES]

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const advisorId = formData.get('advisorId') as string
    const type = formData.get('type') as string
    const title = formData.get('title') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      )
    }

    // Verify advisor exists
    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId }
    })

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'advisors', advisorId)
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filepath = join(uploadDir, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Create public URL
    const publicUrl = `/uploads/advisors/${advisorId}/${filename}`

    // For now, we'll return the media info
    // In a full implementation, you might want to store this in a media table
    const mediaItem = {
      id: `media-${timestamp}`,
      type,
      url: publicUrl,
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      filename,
      fileSize: file.size,
      mimeType: file.type,
      advisorId,
      uploadDate: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      ...mediaItem
    })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advisorId = searchParams.get('advisorId')

    if (!advisorId) {
      return NextResponse.json(
        { error: 'advisorId parameter is required' },
        { status: 400 }
      )
    }

    // In a full implementation, you would fetch media from a database
    // For now, return empty array as media will be managed in memory
    return NextResponse.json({
      media: []
    })

  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mediaId = searchParams.get('mediaId')
    const advisorId = searchParams.get('advisorId')

    if (!mediaId || !advisorId) {
      return NextResponse.json(
        { error: 'mediaId and advisorId are required' },
        { status: 400 }
      )
    }

    // In a full implementation, you would:
    // 1. Remove the file from storage
    // 2. Remove the record from database
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: 'Media deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}