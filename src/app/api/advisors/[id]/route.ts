import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { isSubscriptionActive, isFeaturedListing } from '@/lib/business/subscriptions'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const advisor = await prisma.advisor.findUnique({
      where: { id },
      include: {
        subscription: {
          include: { plan: true }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20,
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
        },
        leads: {
          where: { status: 'converted' },
          select: { id: true }
        }
      }
    })

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Check business logic status
    const [hasActiveSubscription, isFeatured] = await Promise.all([
      isSubscriptionActive(advisor.id),
      isFeaturedListing(advisor.id)
    ])

    // Transform response
    const response = {
      id: advisor.id,
      name: advisor.name,
      email: advisor.email, // Only expose email if needed for contact
      phone: advisor.phone, // Only expose phone if needed for contact
      bio: advisor.bio,
      location: advisor.location,
      specialties: advisor.specialties,
      certifications: advisor.certifications,
      yearsExperience: advisor.yearsExperience,
      rating: advisor.rating,
      reviewCount: advisor.reviewCount,
      verified: advisor.verified,
      imageUrl: advisor.imageUrl,
      website: advisor.website,
      linkedIn: advisor.linkedIn,
      createdAt: advisor.createdAt,
      updatedAt: advisor.updatedAt,
      
      // Business logic fields
      hasActiveSubscription,
      isFeatured,
      subscriptionTier: advisor.subscription?.plan?.name || 'none',
      
      // Subscription details (limited exposure)
      subscription: advisor.subscription ? {
        plan: {
          name: advisor.subscription.plan.name,
          displayName: advisor.subscription.plan.displayName,
          featured: advisor.subscription.plan.featured,
          priority: advisor.subscription.plan.priority
        }
      } : null,
      
      // Reviews
      reviews: advisor.reviews,
      
      // Success metrics
      successfulPlacements: advisor.leads.length,
      
      // Computed fields for display
      experienceLevel: advisor.yearsExperience 
        ? advisor.yearsExperience >= 15 ? 'Senior' 
        : advisor.yearsExperience >= 8 ? 'Experienced' 
        : 'Developing'
        : 'Not specified',
        
      responseTime: isFeatured ? 'Within 24 hours' : 'Within 48 hours'
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching advisor:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT endpoint for updating advisor profiles (future admin feature)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Advisor updates not implemented via API' },
    { status: 501 }
  )
}

// DELETE endpoint for removing advisors (future admin feature)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'Advisor deletion not implemented via API' },
    { status: 501 }
  )
}