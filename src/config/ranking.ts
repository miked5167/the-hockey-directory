/**
 * Hockey Directory - Advisor Ranking Algorithm Configuration
 * 
 * This file defines the ranking formula and weights used to determine
 * advisor search result ordering and featured placement eligibility.
 */

export interface RankingWeights {
  /** Verification badge weight (3.0) - Strong trust signal */
  verified: number
  
  /** Profile completeness weight (0.02) - Encourages complete profiles */
  completeness: number
  
  /** Recent activity weight (1.0) - Active advisors ranked higher */
  recentActivity: number
  
  /** Response rate weight (2.0) - Fast response times prioritized */
  responseRate: number
  
  /** Review average weight (2.0) - Quality of service */
  reviewAverage: number
  
  /** Review count weight (0.2) - More reviews = more experience */
  reviewCount: number
  
  /** Featured boost weight (10.0) - Premium tier advantage */
  featuredBoost: number
  
  /** Premium boost weight (15.0) - Highest tier advantage */
  premiumBoost: number
}

/**
 * Default ranking weights based on business priorities
 * These weights have been calibrated to optimize for:
 * 1. Trust and verification (highest priority)
 * 2. Service quality and responsiveness
 * 3. Experience and track record
 * 4. Subscription tier benefits
 */
export const DEFAULT_RANKING_WEIGHTS: RankingWeights = {
  verified: 3.0,        // Verified advisors get significant boost
  completeness: 0.02,   // Profile completeness (0-100 scale)
  recentActivity: 1.0,  // Recent login/update activity
  responseRate: 2.0,    // Lead response rate (0-1 scale)
  reviewAverage: 2.0,   // Average review rating (1-5 scale)
  reviewCount: 0.2,     // Number of reviews (logarithmic scaling)
  featuredBoost: 10.0,  // Featured tier boost
  premiumBoost: 15.0    // Premium tier boost
}

/**
 * Advisor ranking data interface
 */
export interface AdvisorRankingData {
  id: string
  verified: boolean
  completeness: number      // 0-100
  recentActivityScore: number // 0-1 based on last activity
  responseRate: number      // 0-1 based on lead response history
  reviewAverage: number     // 1-5 average rating
  reviewCount: number       // Total number of reviews
  subscriptionTier: 'basic' | 'featured' | 'premium' | null
  featuredUntil?: Date | null
}

/**
 * Calculate advisor ranking score
 * Higher scores appear first in search results
 */
export function calculateAdvisorScore(
  advisor: AdvisorRankingData,
  weights: RankingWeights = DEFAULT_RANKING_WEIGHTS
): number {
  const baseScore = (
    (advisor.verified ? weights.verified : 0) +
    (advisor.completeness * weights.completeness) +
    (advisor.recentActivityScore * weights.recentActivity) +
    (advisor.responseRate * weights.responseRate) +
    (advisor.reviewAverage * weights.reviewAverage) +
    (Math.log(advisor.reviewCount + 1) * weights.reviewCount) // Logarithmic scaling
  )

  // Apply subscription tier boosts
  let tierBoost = 0
  if (advisor.subscriptionTier === 'premium') {
    tierBoost = weights.premiumBoost
  } else if (advisor.subscriptionTier === 'featured') {
    tierBoost = weights.featuredBoost
  }

  // Apply temporary featured boost if still active
  if (advisor.featuredUntil && new Date() < advisor.featuredUntil) {
    tierBoost = Math.max(tierBoost, weights.featuredBoost)
  }

  return baseScore + tierBoost
}

/**
 * Calculate recent activity score based on last activity
 * Returns 0-1 score where 1 = very recent activity
 */
export function calculateRecentActivityScore(lastActivity: Date): number {
  const now = Date.now()
  const lastActivityTime = lastActivity.getTime()
  const daysSinceActivity = (now - lastActivityTime) / (1000 * 60 * 60 * 24)

  // Score decreases exponentially with time
  // Full score for activity within 7 days, half score at 30 days
  const decayRate = 0.05 // Decay per day
  return Math.exp(-decayRate * daysSinceActivity)
}

/**
 * Calculate response rate based on lead response history
 * Returns 0-1 score where 1 = perfect response rate
 */
export function calculateResponseRate(
  totalLeads: number,
  respondedLeads: number,
  avgResponseTimeHours: number
): number {
  if (totalLeads === 0) return 0.5 // Neutral score for new advisors

  const responseRatio = respondedLeads / totalLeads
  
  // Time penalty: responses over 48 hours get reduced score
  const timePenalty = Math.min(1, 48 / Math.max(avgResponseTimeHours, 1))
  
  return responseRatio * timePenalty
}

/**
 * Profile completeness scoring criteria
 */
export const COMPLETENESS_CRITERIA = {
  name: 5,              // Basic info
  bio: 15,              // Profile description
  headshot: 10,         // Profile photo
  specialties: 10,      // Service categories
  levels: 10,           // Experience levels
  certifications: 15,   // Professional credentials
  website: 5,           // External website
  socials: 5,           // Social media links
  responseTime: 10,     // Stated response time
  yearsExperience: 10,  // Experience duration
  location: 5           // Geographic coverage
} as const

/**
 * Calculate profile completeness score (0-100)
 */
export function calculateCompletenessScore(profile: {
  name?: string
  bio?: string
  headshot?: string
  specialties?: string[] | string
  levels?: string[] | string
  certifications?: string[] | string
  website?: string
  socials?: string
  responseTimeMs?: number
  yearsExperience?: number
  city?: string
  province?: string
}): number {
  let score = 0

  // Check each completeness criteria
  if (profile.name?.trim()) score += COMPLETENESS_CRITERIA.name
  if (profile.bio && profile.bio.length > 50) score += COMPLETENESS_CRITERIA.bio
  if (profile.headshot?.trim()) score += COMPLETENESS_CRITERIA.headshot
  
  // Handle JSON string arrays
  const getArrayLength = (field: string[] | string | undefined): number => {
    if (!field) return 0
    if (Array.isArray(field)) return field.length
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  }

  if (getArrayLength(profile.specialties) > 0) score += COMPLETENESS_CRITERIA.specialties
  if (getArrayLength(profile.levels) > 0) score += COMPLETENESS_CRITERIA.levels
  if (getArrayLength(profile.certifications) > 0) score += COMPLETENESS_CRITERIA.certifications
  
  if (profile.website?.trim()) score += COMPLETENESS_CRITERIA.website
  if (profile.socials?.trim()) score += COMPLETENESS_CRITERIA.socials
  if (profile.responseTimeMs && profile.responseTimeMs > 0) score += COMPLETENESS_CRITERIA.responseTime
  if (profile.yearsExperience && profile.yearsExperience > 0) score += COMPLETENESS_CRITERIA.yearsExperience
  if (profile.city?.trim() && profile.province?.trim()) score += COMPLETENESS_CRITERIA.location

  return Math.min(score, 100) // Cap at 100%
}

/**
 * Sorting function for advisor arrays
 * Sorts in descending order (highest score first)
 */
export function sortAdvisorsByRanking(
  advisors: AdvisorRankingData[],
  weights?: RankingWeights
): AdvisorRankingData[] {
  return advisors.sort((a, b) => {
    const scoreA = calculateAdvisorScore(a, weights)
    const scoreB = calculateAdvisorScore(b, weights)
    return scoreB - scoreA // Descending order
  })
}

/**
 * Featured carousel eligibility criteria
 */
export const FEATURED_ELIGIBILITY = {
  minCompleteness: 80,    // Minimum profile completeness
  minRating: 4.0,         // Minimum average rating
  minReviews: 3,          // Minimum number of reviews
  maxDaysSinceActivity: 30, // Must be active within 30 days
  requireVerified: true   // Must be verified
}

/**
 * Check if advisor is eligible for featured placement
 */
export function isEligibleForFeatured(advisor: AdvisorRankingData): boolean {
  // Must be verified
  if (FEATURED_ELIGIBILITY.requireVerified && !advisor.verified) {
    return false
  }

  // Must meet minimum completeness
  if (advisor.completeness < FEATURED_ELIGIBILITY.minCompleteness) {
    return false
  }

  // Must meet minimum rating (if has reviews)
  if (advisor.reviewCount > 0 && advisor.reviewAverage < FEATURED_ELIGIBILITY.minRating) {
    return false
  }

  // Must have minimum review count
  if (advisor.reviewCount < FEATURED_ELIGIBILITY.minReviews) {
    return false
  }

  // Must be recently active
  if (advisor.recentActivityScore < calculateRecentActivityScore(
    new Date(Date.now() - FEATURED_ELIGIBILITY.maxDaysSinceActivity * 24 * 60 * 60 * 1000)
  )) {
    return false
  }

  return true
}

/**
 * Configuration for A/B testing ranking weights
 */
export const RANKING_EXPERIMENTS = {
  control: DEFAULT_RANKING_WEIGHTS,
  
  // Experiment: Higher weight on reviews
  reviewFocused: {
    ...DEFAULT_RANKING_WEIGHTS,
    reviewAverage: 3.0,
    reviewCount: 0.4
  },
  
  // Experiment: Higher weight on responsiveness
  responseFocused: {
    ...DEFAULT_RANKING_WEIGHTS,
    responseRate: 3.0,
    recentActivity: 2.0
  },
  
  // Experiment: Reduced tier boost
  tierReduced: {
    ...DEFAULT_RANKING_WEIGHTS,
    featuredBoost: 5.0,
    premiumBoost: 8.0
  }
} as const

export type RankingExperiment = keyof typeof RANKING_EXPERIMENTS