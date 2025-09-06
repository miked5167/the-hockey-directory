import { prisma } from '../database'
import type { AdvisorSubscription, SubscriptionPlan } from '@prisma/client'

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'suspended'

export interface AdvisorWithSubscription {
  id: string
  name: string
  subscription?: (AdvisorSubscription & { plan: SubscriptionPlan }) | null
}

/**
 * Check if an advisor's subscription is active and valid
 */
export async function isSubscriptionActive(advisorId: string): Promise<boolean> {
  const subscription = await prisma.advisorSubscription.findUnique({
    where: { advisorId },
    include: { plan: true }
  })

  if (!subscription) return false
  if (subscription.status !== 'active') return false
  if (subscription.endDate && subscription.endDate < new Date()) return false

  return true
}

/**
 * Check if an advisor has a featured listing
 */
export async function isFeaturedListing(advisorId: string): Promise<boolean> {
  const subscription = await prisma.advisorSubscription.findUnique({
    where: { advisorId },
    include: { plan: true }
  })

  return subscription?.plan?.featured === true && await isSubscriptionActive(advisorId)
}

/**
 * Get subscription plan priority for sorting
 */
export async function getSubscriptionPriority(advisorId: string): Promise<number> {
  const subscription = await prisma.advisorSubscription.findUnique({
    where: { advisorId },
    include: { plan: true }
  })

  if (!subscription || !await isSubscriptionActive(advisorId)) return 0
  return subscription.plan.priority
}

/**
 * Check if advisor can receive more leads this month
 */
export async function canReceiveMoreLeads(advisorId: string): Promise<boolean> {
  const subscription = await prisma.advisorSubscription.findUnique({
    where: { advisorId },
    include: { plan: true }
  })

  if (!subscription || !await isSubscriptionActive(advisorId)) return false
  
  // Premium plans have unlimited leads
  if (!subscription.plan.maxLeads) return true

  // Check leads this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const leadsThisMonth = await prisma.lead.count({
    where: {
      advisorId,
      createdAt: { gte: startOfMonth }
    }
  })

  return leadsThisMonth < subscription.plan.maxLeads
}

/**
 * Get all active subscription plans
 */
export async function getActiveSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return prisma.subscriptionPlan.findMany({
    where: { active: true },
    orderBy: { priority: 'desc' }
  })
}

/**
 * Get advisors with their subscription status for admin dashboard
 */
export async function getAdvisorsWithSubscriptions(): Promise<AdvisorWithSubscription[]> {
  return prisma.advisor.findMany({
    select: {
      id: true,
      name: true,
      subscription: {
        include: { plan: true }
      }
    }
  })
}