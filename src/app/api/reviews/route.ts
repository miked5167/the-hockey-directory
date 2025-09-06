import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      advisorId,
      parentName,
      rating,
      title,
      comment
    } = body

    // Validation
    if (!advisorId || !parentName || !rating) {
      return NextResponse.json(
        { error: 'Missing required fields: advisorId, parentName, rating' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
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

    // Create the review
    const review = await prisma.review.create({
      data: {
        advisorId,
        parentName,
        rating,
        title,
        comment,
        verified: false // Reviews start unverified
      }
    })

    // Update advisor's aggregate rating and review count
    const reviews = await prisma.review.findMany({
      where: { advisorId },
      select: { rating: true }
    })

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0)
    const averageRating = totalRating / reviews.length
    const reviewCount = reviews.length

    await prisma.advisor.update({
      where: { id: advisorId },
      data: {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
      reviewId: review.id,
      newRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviewCount
    })

  } catch (error) {
    console.error('Error creating review:', error)
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
    const limit = searchParams.get('limit')
    const verified = searchParams.get('verified')

    if (!advisorId) {
      return NextResponse.json(
        { error: 'advisorId parameter is required' },
        { status: 400 }
      )
    }

    const reviews = await prisma.review.findMany({
      where: {
        advisorId,
        ...(verified === 'true' && { verified: true })
      },
      orderBy: [
        { verified: 'desc' }, // Verified reviews first
        { createdAt: 'desc' }
      ],
      ...(limit && { take: parseInt(limit) }),
      select: {
        id: true,
        parentName: true,
        rating: true,
        title: true,
        comment: true,
        verified: true,
        helpful: true,
        createdAt: true
      }
    })

    // Calculate review statistics
    const stats = {
      totalReviews: reviews.length,
      averageRating: reviews.length > 0 
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
        : 0,
      ratingDistribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length,
      },
      verifiedCount: reviews.filter(r => r.verified).length
    }

    return NextResponse.json({
      reviews,
      stats
    })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}