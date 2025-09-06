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
 * Route lead to best available advisor based on criteria
 */
export async function routeLeadToAdvisor(
  location?: string,
  specialties?: string[]
): Promise<string | null> {
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
    },
    orderBy: [
      { subscription: { plan: { priority: 'desc' } } }, // Higher tier plans first
      { rating: 'desc' }, // Better ratings first
      { reviewCount: 'desc' } // More reviews first
    ]
  })

  // Filter advisors who can receive more leads
  const availableAdvisors = []
  for (const advisor of advisors) {
    if (await canReceiveMoreLeads(advisor.id)) {
      availableAdvisors.push(advisor)
    }
  }

  if (availableAdvisors.length === 0) return null

  // TODO: Add more sophisticated matching based on location and specialties
  // For now, return the highest priority available advisor
  return availableAdvisors[0].id
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