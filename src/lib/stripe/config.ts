import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is not set')
}

// Initialize Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true
})

// Hockey Directory Subscription Plans
export const SUBSCRIPTION_PLANS = {
  BASIC: {
    id: 'basic',
    name: 'Basic',
    description: 'Essential visibility for growing your hockey advisory business',
    price: 49,
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_BASIC_PRICE_ID || '',
    features: [
      'Basic profile listing',
      'Up to 5 leads per month',
      'Email support',
      'Basic analytics',
      'Contact form integration'
    ],
    leadLimit: 5,
    priority: 1,
    profileBoost: false,
    featuredPlacement: false
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    description: 'Advanced features and priority placement for serious advisors',
    price: 99,
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID || '',
    features: [
      'Premium profile with enhanced visibility',
      'Up to 15 leads per month',
      'Priority email & phone support',
      'Advanced analytics & insights',
      'Calendar integration',
      'Video introduction support',
      'Social media verification',
      'Higher search ranking'
    ],
    leadLimit: 15,
    priority: 2,
    profileBoost: true,
    featuredPlacement: false,
    popular: true
  },
  FEATURED: {
    id: 'featured',
    name: 'Featured',
    description: 'Maximum exposure and unlimited leads for top-tier advisors',
    price: 199,
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_FEATURED_PRICE_ID || '',
    features: [
      'Featured profile placement',
      'Unlimited leads',
      'White-glove concierge support',
      'Premium analytics dashboard',
      'Custom profile URL',
      'Featured badge on profile',
      'Homepage carousel placement',
      'Priority customer success manager',
      'Custom branding options'
    ],
    leadLimit: -1, // -1 means unlimited
    priority: 3,
    profileBoost: true,
    featuredPlacement: true
  }
} as const

export type SubscriptionPlanId = keyof typeof SUBSCRIPTION_PLANS
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[SubscriptionPlanId]

// Helper functions
export function getPlanById(planId: string): SubscriptionPlan | null {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.id === planId)
  return plan || null
}

export function getPlanByStripePrice(stripePriceId: string): SubscriptionPlan | null {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.stripePriceId === stripePriceId)
  return plan || null
}

export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS)
}

export function getPlansForDisplay(): SubscriptionPlan[] {
  return getAllPlans().sort((a, b) => a.price - b.price)
}

// Stripe webhook events we handle
export const STRIPE_WEBHOOK_EVENTS = {
  CUSTOMER_SUBSCRIPTION_CREATED: 'customer.subscription.created',
  CUSTOMER_SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  CUSTOMER_SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAYMENT_SUCCEEDED: 'invoice.payment_succeeded',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated'
} as const

// Subscription status mapping
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  PAST_DUE: 'past_due',
  TRIALING: 'trialing',
  UNPAID: 'unpaid'
} as const

export type SubscriptionStatus = typeof SUBSCRIPTION_STATUS[keyof typeof SUBSCRIPTION_STATUS]