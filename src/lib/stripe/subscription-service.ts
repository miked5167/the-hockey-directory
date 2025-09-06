import { stripe, SUBSCRIPTION_PLANS, getPlanById, getPlanByStripePrice } from './config'
import type { SubscriptionPlan, SubscriptionStatus } from './config'
import { db } from '@/lib/db'

export interface CreateSubscriptionParams {
  advisorId: string
  planId: string
  paymentMethodId: string
  email: string
  name: string
}

export interface SubscriptionInfo {
  id: string
  advisorId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripePriceId: string
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  leadLimit: number
  leadsUsedThisMonth: number
  createdAt: Date
  updatedAt: Date
}

class SubscriptionService {
  // Create new subscription for advisor
  async createSubscription({
    advisorId,
    planId,
    paymentMethodId,
    email,
    name
  }: CreateSubscriptionParams): Promise<SubscriptionInfo> {
    const plan = getPlanById(planId)
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`)
    }

    try {
      // Create or retrieve Stripe customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          advisorId,
          plan: planId
        }
      })

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id
      })

      // Set as default payment method
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      })

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: plan.stripePriceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          advisorId,
          planId
        }
      })

      // Store subscription in database
      const subscriptionRecord = await db.subscription.create({
        data: {
          advisorId,
          stripeCustomerId: customer.id,
          stripeSubscriptionId: subscription.id,
          stripePriceId: plan.stripePriceId,
          planId: plan.id,
          status: subscription.status as SubscriptionStatus,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          leadLimit: plan.leadLimit,
          leadsUsedThisMonth: 0
        }
      })

      return this.formatSubscriptionInfo(subscriptionRecord, plan)
    } catch (error) {
      console.error('Failed to create subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  // Get subscription by advisor ID
  async getSubscriptionByAdvisorId(advisorId: string): Promise<SubscriptionInfo | null> {
    const subscription = await db.subscription.findFirst({
      where: { advisorId }
    })

    if (!subscription) return null

    const plan = getPlanById(subscription.planId)
    if (!plan) return null

    return this.formatSubscriptionInfo(subscription, plan)
  }

  // Update subscription plan
  async updateSubscriptionPlan(advisorId: string, newPlanId: string): Promise<SubscriptionInfo> {
    const currentSubscription = await this.getSubscriptionByAdvisorId(advisorId)
    if (!currentSubscription) {
      throw new Error('No active subscription found')
    }

    const newPlan = getPlanById(newPlanId)
    if (!newPlan) {
      throw new Error(`Invalid plan ID: ${newPlanId}`)
    }

    try {
      // Update Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(
        currentSubscription.stripeSubscriptionId
      )

      const updatedSubscription = await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPlan.stripePriceId
          }],
          proration_behavior: 'create_prorations',
          metadata: {
            advisorId,
            planId: newPlanId
          }
        }
      )

      // Update database record
      const updatedRecord = await db.subscription.update({
        where: { advisorId },
        data: {
          stripePriceId: newPlan.stripePriceId,
          planId: newPlan.id,
          leadLimit: newPlan.leadLimit,
          updatedAt: new Date()
        }
      })

      return this.formatSubscriptionInfo(updatedRecord, newPlan)
    } catch (error) {
      console.error('Failed to update subscription:', error)
      throw new Error('Failed to update subscription')
    }
  }

  // Cancel subscription
  async cancelSubscription(advisorId: string, immediately: boolean = false): Promise<SubscriptionInfo> {
    const subscription = await this.getSubscriptionByAdvisorId(advisorId)
    if (!subscription) {
      throw new Error('No active subscription found')
    }

    try {
      const updatedStripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        immediately 
          ? { cancel_at_period_end: false }
          : { cancel_at_period_end: true }
      )

      if (immediately) {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
      }

      // Update database
      const updatedRecord = await db.subscription.update({
        where: { advisorId },
        data: {
          cancelAtPeriodEnd: updatedStripeSubscription.cancel_at_period_end,
          status: updatedStripeSubscription.status as SubscriptionStatus,
          updatedAt: new Date()
        }
      })

      const plan = getPlanById(updatedRecord.planId)!
      return this.formatSubscriptionInfo(updatedRecord, plan)
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  // Reactivate canceled subscription
  async reactivateSubscription(advisorId: string): Promise<SubscriptionInfo> {
    const subscription = await this.getSubscriptionByAdvisorId(advisorId)
    if (!subscription) {
      throw new Error('No subscription found')
    }

    try {
      const updatedStripeSubscription = await stripe.subscriptions.update(
        subscription.stripeSubscriptionId,
        { cancel_at_period_end: false }
      )

      const updatedRecord = await db.subscription.update({
        where: { advisorId },
        data: {
          cancelAtPeriodEnd: false,
          status: updatedStripeSubscription.status as SubscriptionStatus,
          updatedAt: new Date()
        }
      })

      const plan = getPlanById(updatedRecord.planId)!
      return this.formatSubscriptionInfo(updatedRecord, plan)
    } catch (error) {
      console.error('Failed to reactivate subscription:', error)
      throw new Error('Failed to reactivate subscription')
    }
  }

  // Track lead usage
  async incrementLeadUsage(advisorId: string): Promise<{ success: boolean; leadsRemaining: number }> {
    const subscription = await this.getSubscriptionByAdvisorId(advisorId)
    if (!subscription) {
      throw new Error('No active subscription found')
    }

    // Featured plan has unlimited leads
    if (subscription.leadLimit === -1) {
      return { success: true, leadsRemaining: -1 }
    }

    // Check if limit exceeded
    if (subscription.leadsUsedThisMonth >= subscription.leadLimit) {
      return { success: false, leadsRemaining: 0 }
    }

    // Increment usage
    const updatedRecord = await db.subscription.update({
      where: { advisorId },
      data: {
        leadsUsedThisMonth: { increment: 1 },
        updatedAt: new Date()
      }
    })

    const leadsRemaining = subscription.leadLimit - updatedRecord.leadsUsedThisMonth
    return { success: true, leadsRemaining }
  }

  // Reset monthly lead usage (called by cron job)
  async resetMonthlyLeadUsage(): Promise<void> {
    await db.subscription.updateMany({
      data: {
        leadsUsedThisMonth: 0,
        updatedAt: new Date()
      }
    })
  }

  // Get billing history for advisor
  async getBillingHistory(advisorId: string): Promise<any[]> {
    const subscription = await this.getSubscriptionByAdvisorId(advisorId)
    if (!subscription) {
      return []
    }

    try {
      const invoices = await stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit: 100
      })

      return invoices.data.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: invoice.status,
        created: new Date(invoice.created * 1000),
        paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
        hostedInvoiceUrl: invoice.hosted_invoice_url,
        invoicePdf: invoice.invoice_pdf,
        description: invoice.lines.data[0]?.description || 'Subscription payment'
      }))
    } catch (error) {
      console.error('Failed to get billing history:', error)
      return []
    }
  }

  // Private helper to format subscription data
  private formatSubscriptionInfo(record: any, plan: SubscriptionPlan): SubscriptionInfo {
    return {
      id: record.id,
      advisorId: record.advisorId,
      stripeCustomerId: record.stripeCustomerId,
      stripeSubscriptionId: record.stripeSubscriptionId,
      stripePriceId: record.stripePriceId,
      plan,
      status: record.status,
      currentPeriodStart: record.currentPeriodStart,
      currentPeriodEnd: record.currentPeriodEnd,
      cancelAtPeriodEnd: record.cancelAtPeriodEnd,
      leadLimit: record.leadLimit,
      leadsUsedThisMonth: record.leadsUsedThisMonth,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()