import { NextRequest, NextResponse } from 'next/server'
import { getAdvisorsByPriority, getFeaturedAdvisors, searchAdvisorsWithPriority } from '@/lib/business/featured-listings'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const location = searchParams.get('location')
    const featured = searchParams.get('featured') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const minRating = searchParams.get('minRating')
    const specialties = searchParams.get('specialties')
    const limit = searchParams.get('limit')

    // Parse specialties from comma-separated string
    const specialtyArray = specialties ? specialties.split(',').map(s => s.trim()) : undefined

    // Build filters object
    const filters = {
      ...(location && { location }),
      ...(minRating && { minRating: parseFloat(minRating) }),
      ...(specialtyArray && { specialties: specialtyArray }),
      ...(verified && { verified: true })
    }

    let advisors

    if (featured) {
      // Return only featured advisors
      const limitNum = limit ? parseInt(limit) : undefined
      advisors = await getFeaturedAdvisors(limitNum)
    } else if (query && query.length >= 2) {
      // Perform search with business logic
      const limitNum = limit ? parseInt(limit) : undefined
      advisors = await searchAdvisorsWithPriority(query, filters, limitNum)
    } else {
      // Return all advisors sorted by priority
      advisors = await getAdvisorsByPriority(filters)
      
      // Apply limit if specified
      if (limit) {
        const limitNum = parseInt(limit)
        advisors = advisors.slice(0, limitNum)
      }
    }

    // Transform response to include computed fields for frontend
    const response = advisors.map(advisor => {
      const subscriptionTier = advisor.subscription?.plan?.name || 'none'
      const isFeatured = advisor.subscription?.plan?.featured || false
      const priority = advisor.subscription?.plan?.priority || 0

      return {
        id: advisor.id,
        name: advisor.name,
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
        // Business logic fields
        subscriptionTier,
        isFeatured,
        priority,
        // Don't expose sensitive information
        subscription: advisor.subscription ? {
          plan: {
            name: advisor.subscription.plan.name,
            displayName: advisor.subscription.plan.displayName,
            featured: advisor.subscription.plan.featured,
            priority: advisor.subscription.plan.priority
          }
        } : null
      }
    })

    return NextResponse.json({
      advisors: response,
      total: response.length,
      query: query || null,
      filters
    })

  } catch (error) {
    console.error('Error fetching advisors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for future admin functionality (creating advisors)
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Advisor creation not implemented via API' },
    { status: 501 }
  )
}