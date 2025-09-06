import { prisma } from '../database'
import type { Advisor, AdvisorSubscription, SubscriptionPlan } from '@prisma/client'
import { isSubscriptionActive, isFeaturedListing } from './subscriptions'

export type AdvisorWithSubscriptionPlan = Advisor & {
  subscription?: (AdvisorSubscription & { plan: SubscriptionPlan }) | null
}

/**
 * Get advisors sorted by subscription priority (featured listings first)
 */
export async function getAdvisorsByPriority(
  filters?: {
    location?: string
    specialties?: string[]
    verified?: boolean
  }
): Promise<AdvisorWithSubscriptionPlan[]> {
  const whereClause: any = {
    ...(filters?.verified && { verified: filters.verified })
  }

  // Add location filter if provided
  if (filters?.location) {
    whereClause.location = {
      contains: filters.location,
      mode: 'insensitive'
    }
  }

  const advisors = await prisma.advisor.findMany({
    where: whereClause,
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  })

  // Filter out inactive subscriptions and sort by priority
  const activeAdvisors = []
  
  for (const advisor of advisors) {
    if (advisor.subscription && await isSubscriptionActive(advisor.id)) {
      activeAdvisors.push(advisor)
    } else if (!advisor.subscription) {
      // Include advisors without subscriptions at the bottom
      activeAdvisors.push(advisor)
    }
  }

  // Sort by priority (highest first), then by rating
  return activeAdvisors.sort((a, b) => {
    const aPriority = a.subscription?.plan.priority || 0
    const bPriority = b.subscription?.plan.priority || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    // If same priority, sort by rating
    const aRating = a.rating || 0
    const bRating = b.rating || 0
    return bRating - aRating
  })
}

/**
 * Get only featured advisors
 */
export async function getFeaturedAdvisors(limit?: number): Promise<AdvisorWithSubscriptionPlan[]> {
  const advisors = await prisma.advisor.findMany({
    where: {
      verified: true,
      subscription: {
        status: 'active',
        plan: {
          featured: true
        }
      }
    },
    include: {
      subscription: {
        include: { plan: true }
      }
    },
    orderBy: [
      { subscription: { plan: { priority: 'desc' } } },
      { rating: 'desc' }
    ],
    ...(limit && { take: limit })
  })

  // Double-check subscription status
  const featuredAdvisors = []
  for (const advisor of advisors) {
    if (await isSubscriptionActive(advisor.id)) {
      featuredAdvisors.push(advisor)
    }
  }

  return featuredAdvisors
}

/**
 * Check if advisor should be displayed as featured
 */
export async function shouldDisplayAsFeatured(advisorId: string): Promise<boolean> {
  return await isFeaturedListing(advisorId)
}

/**
 * Get advisor search results with featured listings prioritized
 */
export async function searchAdvisorsWithPriority(
  query?: string,
  filters?: {
    location?: string
    specialties?: string[]
    minRating?: number
  },
  limit?: number
): Promise<AdvisorWithSubscriptionPlan[]> {
  const whereClause: any = {
    verified: true
  }

  // Add search query
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { bio: { contains: query, mode: 'insensitive' } },
      { location: { contains: query, mode: 'insensitive' } }
    ]
  }

  // Add filters
  if (filters?.location) {
    whereClause.location = {
      contains: filters.location,
      mode: 'insensitive'
    }
  }

  if (filters?.minRating) {
    whereClause.rating = { gte: filters.minRating }
  }

  const advisors = await prisma.advisor.findMany({
    where: whereClause,
    include: {
      subscription: {
        include: { plan: true }
      }
    },
    ...(limit && { take: limit * 2 }) // Get more to account for filtering
  })

  // Filter by specialties if provided (since it's stored as JSON)
  let filteredAdvisors = advisors
  if (filters?.specialties && filters.specialties.length > 0) {
    filteredAdvisors = advisors.filter(advisor => {
      if (!advisor.specialties) return false
      
      try {
        const advisorSpecialties = JSON.parse(advisor.specialties) as string[]
        return filters.specialties!.some(specialty => 
          advisorSpecialties.some(as => 
            as.toLowerCase().includes(specialty.toLowerCase())
          )
        )
      } catch {
        return false
      }
    })
  }

  // Sort by subscription priority and filter active subscriptions
  const prioritizedAdvisors = []
  
  for (const advisor of filteredAdvisors) {
    if (advisor.subscription && await isSubscriptionActive(advisor.id)) {
      prioritizedAdvisors.push(advisor)
    } else if (!advisor.subscription) {
      // Include free listings but with lower priority
      prioritizedAdvisors.push(advisor)
    }
  }

  const sorted = prioritizedAdvisors.sort((a, b) => {
    const aPriority = a.subscription?.plan.priority || 0
    const bPriority = b.subscription?.plan.priority || 0
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority
    }
    
    return (b.rating || 0) - (a.rating || 0)
  })

  return limit ? sorted.slice(0, limit) : sorted
}