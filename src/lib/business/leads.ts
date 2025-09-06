import { prisma } from '../database'
import type { Lead } from '@prisma/client'
import { canReceiveMoreLeads } from './subscriptions'

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'

export interface CreateLeadData {
  advisorId: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  playerName?: string
  playerAge?: number
  location?: string
  message?: string
  source?: string
}

export interface LeadWithAdvisor extends Lead {
  advisor: {
    id: string
    name: string
    email: string
  }
}

/**
 * Create a new lead and assign to advisor
 */
export async function createLead(data: CreateLeadData): Promise<Lead | null> {
  // Check if advisor can receive more leads
  const canReceive = await canReceiveMoreLeads(data.advisorId)
  if (!canReceive) {
    throw new Error('Advisor has reached their monthly lead limit')
  }

  return prisma.lead.create({
    data: {
      ...data,
      status: 'new'
    }
  })
}

/**
 * Enhanced lead routing with priority-based scoring algorithm
 */
export async function routeLeadToAdvisor(
  location?: string,
  specialties?: string[],
  playerAge?: number
): Promise<{ advisorId: string; score: number } | null> {
  const advisors = await prisma.advisor.findMany({
    where: {
      verified: true,
      subscription: {
        status: 'active'
      }
    },
    include: {
      subscription: {
        include: { plan: true }
      },
      _count: {
        select: { leads: true }
      }
    }
  })

  // Filter advisors who can receive more leads and calculate scores
  const scoredAdvisors = []
  
  for (const advisor of advisors) {
    if (await canReceiveMoreLeads(advisor.id)) {
      const score = await calculateAdvisorScore(advisor, location, specialties, playerAge)
      scoredAdvisors.push({ advisor, score })
    }
  }

  if (scoredAdvisors.length === 0) return null

  // Sort by score (highest first) and return best match
  scoredAdvisors.sort((a, b) => b.score - a.score)
  return {
    advisorId: scoredAdvisors[0].advisor.id,
    score: scoredAdvisors[0].score
  }
}

/**
 * Calculate advisor priority score based on multiple factors
 */
async function calculateAdvisorScore(
  advisor: any,
  location?: string,
  specialties?: string[],
  playerAge?: number
): Promise<number> {
  let totalScore = 0

  // 1. Subscription Tier Score (40% weight)
  const tierScore = getSubscriptionTierScore(advisor.subscription?.plan?.id)
  totalScore += tierScore * 0.4

  // 2. Geographic Proximity Score (25% weight)
  const locationScore = calculateLocationScore(advisor, location)
  totalScore += locationScore * 0.25

  // 3. Specialty Match Score (20% weight)
  const specialtyScore = calculateSpecialtyScore(advisor, specialties, playerAge)
  totalScore += specialtyScore * 0.2

  // 4. Performance Metrics Score (15% weight)
  const performanceScore = await calculatePerformanceScore(advisor.id)
  totalScore += performanceScore * 0.15

  return Math.round(totalScore)
}

/**
 * Get score based on subscription tier
 */
function getSubscriptionTierScore(planId?: string): number {
  switch (planId) {
    case 'featured': return 100
    case 'premium': return 70
    case 'basic': return 40
    default: return 0
  }
}

/**
 * Calculate location proximity score
 */
function calculateLocationScore(advisor: any, requestLocation?: string): number {
  if (!requestLocation) return 50 // Neutral score if no location provided
  
  const advisorLocation = `${advisor.city}, ${advisor.province}`.toLowerCase()
  const reqLocation = requestLocation.toLowerCase()
  
  // Extract city and province from request
  const [reqCity, reqProvince] = reqLocation.split(',').map(s => s.trim())
  
  // Same city match
  if (advisorLocation.includes(reqCity || '')) {
    return 100
  }
  
  // Same province match
  if (reqProvince && advisorLocation.includes(reqProvince)) {
    return 60
  }
  
  // Same country (assume Canada for now)
  return 30
}

/**
 * Calculate specialty and age group match score
 */
function calculateSpecialtyScore(
  advisor: any, 
  requestedSpecialties?: string[], 
  playerAge?: number
): number {
  let specialtyScore = 0
  let ageScore = 0
  
  // Specialty matching
  if (requestedSpecialties && requestedSpecialties.length > 0 && advisor.specialties) {
    const advisorSpecialties = advisor.specialties.toLowerCase().split(',').map((s: string) => s.trim())
    const reqSpecialties = requestedSpecialties.map(s => s.toLowerCase().trim())
    
    let exactMatches = 0
    let partialMatches = 0
    
    for (const reqSpecialty of reqSpecialties) {
      if (advisorSpecialties.some(advSpec => advSpec.includes(reqSpecialty))) {
        exactMatches++
      } else if (advisorSpecialties.some(advSpec => 
        reqSpecialty.includes(advSpec) || advSpec.includes(reqSpecialty)
      )) {
        partialMatches++
      }
    }
    
    if (exactMatches > 0) {
      specialtyScore = 100
    } else if (partialMatches > 0) {
      specialtyScore = 50
    }
  }
  
  // Age group matching
  if (playerAge && advisor.levels) {
    const levels = advisor.levels.toLowerCase()
    if (playerAge <= 12 && levels.includes('youth')) {
      ageScore = 100
    } else if (playerAge <= 17 && levels.includes('junior')) {
      ageScore = 100  
    } else if (playerAge <= 22 && levels.includes('college')) {
      ageScore = 100
    } else if (levels.includes('pro')) {
      ageScore = 80 // Pro coaches can work with any age
    }
  }
  
  // Return weighted average of specialty and age scores
  return Math.round((specialtyScore * 0.7) + (ageScore * 0.3))
}

/**
 * Calculate performance score based on conversion rate and response time
 */
async function calculatePerformanceScore(advisorId: string): Promise<number> {
  try {
    const conversionRate = await getLeadConversionRate(advisorId)
    let score = 20 // Base score
    
    if (conversionRate >= 50) {
      score = 100
    } else if (conversionRate >= 20) {
      score = 60
    } else if (conversionRate > 0) {
      score = 40
    }
    
    return score
  } catch (error) {
    return 20 // Default score if calculation fails
  }
}

/**
 * Update lead status
 */
export async function updateLeadStatus(
  leadId: string, 
  status: LeadStatus, 
  notes?: string
): Promise<Lead> {
  const updateData: any = { status }
  
  if (notes) updateData.notes = notes
  if (status === 'converted') updateData.conversionDate = new Date()

  return prisma.lead.update({
    where: { id: leadId },
    data: updateData
  })
}

/**
 * Get leads for an advisor
 */
export async function getAdvisorLeads(
  advisorId: string,
  status?: LeadStatus
): Promise<Lead[]> {
  return prisma.lead.findMany({
    where: {
      advisorId,
      ...(status && { status })
    },
    orderBy: { createdAt: 'desc' }
  })
}

/**
 * Get lead conversion rate for an advisor
 */
export async function getLeadConversionRate(advisorId: string): Promise<number> {
  const totalLeads = await prisma.lead.count({
    where: { advisorId }
  })

  if (totalLeads === 0) return 0

  const convertedLeads = await prisma.lead.count({
    where: {
      advisorId,
      status: 'converted'
    }
  })

  return (convertedLeads / totalLeads) * 100
}

/**
 * Get monthly lead analytics
 */
export async function getMonthlyLeadStats(advisorId: string) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [totalThisMonth, convertedThisMonth, totalAllTime, convertedAllTime] = await Promise.all([
    prisma.lead.count({
      where: {
        advisorId,
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.lead.count({
      where: {
        advisorId,
        status: 'converted',
        createdAt: { gte: startOfMonth }
      }
    }),
    prisma.lead.count({
      where: { advisorId }
    }),
    prisma.lead.count({
      where: {
        advisorId,
        status: 'converted'
      }
    })
  ])

  return {
    thisMonth: {
      total: totalThisMonth,
      converted: convertedThisMonth,
      conversionRate: totalThisMonth > 0 ? (convertedThisMonth / totalThisMonth) * 100 : 0
    },
    allTime: {
      total: totalAllTime,
      converted: convertedAllTime,
      conversionRate: totalAllTime > 0 ? (convertedAllTime / totalAllTime) * 100 : 0
    }
  }
}

/**
 * Smart lead distribution - prevents advisor overload
 */
export async function getOptimalLeadDistribution(
  location?: string,
  specialties?: string[],
  playerAge?: number,
  maxAdvisors: number = 3
): Promise<{ advisorId: string; score: number }[]> {
  const advisors = await prisma.advisor.findMany({
    where: {
      verified: true,
      subscription: {
        status: 'active'
      }
    },
    include: {
      subscription: {
        include: { plan: true }
      }
    }
  })

  const scoredAdvisors = []
  
  for (const advisor of advisors) {
    if (await canReceiveMoreLeads(advisor.id)) {
      const score = await calculateAdvisorScore(advisor, location, specialties, playerAge)
      
      // Add load balancing factor to prevent single advisor from getting all leads
      const currentMonthLeads = await prisma.lead.count({
        where: {
          advisorId: advisor.id,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
      
      // Reduce score based on current load (diminishing returns)
      const loadFactor = Math.max(0.5, 1 - (currentMonthLeads * 0.05))
      const adjustedScore = score * loadFactor
      
      scoredAdvisors.push({ advisorId: advisor.id, score: Math.round(adjustedScore) })
    }
  }

  // Return top matches sorted by score
  return scoredAdvisors
    .sort((a, b) => b.score - a.score)
    .slice(0, maxAdvisors)
}

/**
 * Lead qualification scoring
 */
export interface LeadQualificationData {
  parentEmail: string
  parentPhone?: string
  playerAge?: number
  location?: string
  message?: string
  source?: string
}

export function calculateLeadQualificationScore(data: LeadQualificationData): number {
  let score = 0
  
  // Email provided (required)
  if (data.parentEmail) score += 25
  
  // Phone number provided (high intent)
  if (data.parentPhone) score += 20
  
  // Player age provided (shows specificity)
  if (data.playerAge && data.playerAge > 0) score += 15
  
  // Location provided (improves matching)
  if (data.location) score += 10
  
  // Detailed message (shows engagement)
  if (data.message && data.message.length > 50) score += 20
  else if (data.message && data.message.length > 20) score += 10
  
  // Source quality
  switch (data.source) {
    case 'referral':
      score += 10
      break
    case 'website':
      score += 5
      break
    case 'social':
      score += 3
      break
  }
  
  return Math.min(100, score)
}

/**
 * Get lead activity timeline
 */
export async function getLeadTimeline(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      advisor: {
        select: { name: true, email: true }
      }
    }
  })
  
  if (!lead) return null
  
  const timeline = [
    {
      event: 'Lead Created',
      timestamp: lead.createdAt,
      description: `Lead from ${lead.parentName} for ${lead.playerAge ? `${lead.playerAge}-year-old` : ''} player`,
      type: 'creation'
    }
  ]
  
  if (lead.status !== 'new') {
    timeline.push({
      event: 'Status Updated',
      timestamp: lead.updatedAt,
      description: `Status changed to ${lead.status}`,
      type: 'status_change'
    })
  }
  
  if (lead.conversionDate) {
    timeline.push({
      event: 'Lead Converted',
      timestamp: lead.conversionDate,
      description: 'Lead successfully converted to client',
      type: 'conversion'
    })
  }
  
  return {
    lead,
    timeline: timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }
}

/**
 * Lead follow-up reminders
 */
export async function getLeadsRequiringFollowUp(): Promise<Lead[]> {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  
  return prisma.lead.findMany({
    where: {
      status: {
        in: ['new', 'contacted']
      },
      createdAt: {
        lte: twoDaysAgo,
        gte: oneWeekAgo
      }
    },
    include: {
      advisor: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  })
}