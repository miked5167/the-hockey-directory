import { prisma } from '../database'
import type { Payment, Lead } from '@prisma/client'

export const COMMISSION_RATES = {
  basic: 0.10,    // 10% commission
  featured: 0.15, // 15% commission  
  premium: 0.20   // 20% commission
} as const

export interface CommissionData {
  leadId: string
  advisorId: string
  leadValue: number
  commissionRate: number
  commissionAmount: number
}

/**
 * Calculate commission amount based on subscription tier
 */
export async function calculateCommission(
  advisorId: string, 
  leadValue: number
): Promise<number> {
  const subscription = await prisma.advisorSubscription.findUnique({
    where: { advisorId },
    include: { plan: true }
  })

  if (!subscription) return 0

  const planName = subscription.plan.name as keyof typeof COMMISSION_RATES
  const rate = COMMISSION_RATES[planName] || COMMISSION_RATES.basic

  return leadValue * rate
}

/**
 * Record a commission payment when lead converts
 */
export async function recordCommission(data: CommissionData): Promise<Payment> {
  return prisma.payment.create({
    data: {
      advisorId: data.advisorId,
      type: 'commission',
      amount: data.commissionAmount,
      description: `Commission for converted lead - ${data.commissionRate * 100}% of $${data.leadValue}`,
      leadId: data.leadId,
      status: 'pending'
    }
  })
}

/**
 * Process lead conversion and calculate commission
 */
export async function processLeadConversion(
  leadId: string,
  leadValue: number
): Promise<{ lead: Lead; commission?: Payment }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  })

  if (!lead) throw new Error('Lead not found')
  if (lead.status === 'converted') throw new Error('Lead already converted')

  // Update lead
  const updatedLead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: 'converted',
      conversionDate: new Date(),
      leadValue
    }
  })

  // Calculate and record commission
  const commissionRate = await getCommissionRate(lead.advisorId)
  const commissionAmount = leadValue * commissionRate

  let commission: Payment | undefined

  if (commissionAmount > 0) {
    commission = await recordCommission({
      leadId,
      advisorId: lead.advisorId,
      leadValue,
      commissionRate,
      commissionAmount
    })
  }

  return { lead: updatedLead, commission }
}

/**
 * Get commission rate for advisor
 */
export async function getCommissionRate(advisorId: string): Promise<number> {
  const subscription = await prisma.advisorSubscription.findUnique({
    where: { advisorId },
    include: { plan: true }
  })

  if (!subscription) return 0

  const planName = subscription.plan.name as keyof typeof COMMISSION_RATES
  return COMMISSION_RATES[planName] || COMMISSION_RATES.basic
}

/**
 * Get total commissions for advisor
 */
export async function getAdvisorCommissions(advisorId: string) {
  const [totalEarned, pendingPayments, paidPayments] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        advisorId,
        type: 'commission'
      },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: {
        advisorId,
        type: 'commission',
        status: 'pending'
      },
      _sum: { amount: true }
    }),
    prisma.payment.aggregate({
      where: {
        advisorId,
        type: 'commission',
        status: 'completed'
      },
      _sum: { amount: true }
    })
  ])

  return {
    totalEarned: totalEarned._sum.amount || 0,
    pendingAmount: pendingPayments._sum.amount || 0,
    paidAmount: paidPayments._sum.amount || 0
  }
}

/**
 * Get monthly commission summary
 */
export async function getMonthlyCommissionSummary() {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [thisMonth, allTime] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        type: 'commission',
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true },
      _count: true
    }),
    prisma.payment.aggregate({
      where: {
        type: 'commission'
      },
      _sum: { amount: true },
      _count: true
    })
  ])

  return {
    thisMonth: {
      totalCommissions: thisMonth._sum.amount || 0,
      transactionCount: thisMonth._count
    },
    allTime: {
      totalCommissions: allTime._sum.amount || 0,
      transactionCount: allTime._count
    }
  }
}