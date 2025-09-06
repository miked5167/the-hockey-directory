'use client'

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js'

// Ensure we have the publishable key
if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
}

// Singleton Stripe promise
let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Client-side utilities for payment processing
export class StripeClient {
  private stripe: Stripe | null = null
  private elements: StripeElements | null = null

  async initialize(): Promise<void> {
    this.stripe = await getStripe()
    if (!this.stripe) {
      throw new Error('Failed to initialize Stripe')
    }
  }

  createElements(options?: any): StripeElements | null {
    if (!this.stripe) return null
    
    this.elements = this.stripe.elements({
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#2563eb', // Blue-600
          colorBackground: '#ffffff',
          colorText: '#1f2937', // Gray-800
          colorDanger: '#dc2626', // Red-600
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '8px'
        }
      },
      ...options
    })
    
    return this.elements
  }

  createPaymentElement(options = {}): any {
    if (!this.elements) {
      throw new Error('Elements not initialized')
    }
    
    return this.elements.create('payment', {
      layout: 'tabs',
      ...options
    })
  }

  async confirmPayment(clientSecret: string, elements: StripeElements, returnUrl: string) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized')
    }

    return await this.stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: returnUrl
      }
    })
  }

  async createPaymentMethod(elements: StripeElements, billingDetails: any) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized')
    }

    return await this.stripe.createPaymentMethod({
      elements,
      params: {
        billing_details: billingDetails
      }
    })
  }

  async retrievePaymentIntent(clientSecret: string) {
    if (!this.stripe) {
      throw new Error('Stripe not initialized')
    }

    return await this.stripe.retrievePaymentIntent(clientSecret)
  }

  // Format currency for display
  static formatCurrency(amount: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount / 100)
  }

  // Format amount in cents
  static formatAmountInCents(dollarAmount: number): number {
    return Math.round(dollarAmount * 100)
  }
}

// Hockey Directory specific payment utilities
export class HockeyPaymentUtils {
  static formatSubscriptionAmount(monthlyAmount: number): {
    monthly: string
    annually: string
    monthlyCents: number
    annuallyCents: number
  } {
    const monthlyCents = StripeClient.formatAmountInCents(monthlyAmount)
    const annuallyCents = monthlyCents * 12 * 0.85 // 15% annual discount
    
    return {
      monthly: StripeClient.formatCurrency(monthlyCents),
      annually: StripeClient.formatCurrency(annuallyCents),
      monthlyCents,
      annuallyCents
    }
  }

  static calculateProration(
    currentAmount: number,
    newAmount: number,
    daysRemaining: number,
    totalDaysInPeriod: number
  ): {
    prorationAmount: number
    immediateCharge: number
    nextBillingAmount: number
  } {
    const currentProration = (currentAmount * daysRemaining) / totalDaysInPeriod
    const newProration = (newAmount * daysRemaining) / totalDaysInPeriod
    const prorationAmount = newProration - currentProration
    
    return {
      prorationAmount,
      immediateCharge: Math.max(0, prorationAmount),
      nextBillingAmount: newAmount
    }
  }

  static getTrialDaysRemaining(trialEndDate: Date): number {
    const now = new Date()
    const diffTime = trialEndDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  static isSubscriptionActive(status: string): boolean {
    return ['active', 'trialing'].includes(status.toLowerCase())
  }

  static getSubscriptionStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      active: 'text-green-600 bg-green-50',
      trialing: 'text-blue-600 bg-blue-50',
      past_due: 'text-yellow-600 bg-yellow-50',
      canceled: 'text-gray-600 bg-gray-50',
      incomplete: 'text-orange-600 bg-orange-50',
      unpaid: 'text-red-600 bg-red-50'
    }
    return statusColors[status.toLowerCase()] || 'text-gray-600 bg-gray-50'
  }

  static getSubscriptionStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      active: 'Active',
      trialing: 'Trial',
      past_due: 'Past Due',
      canceled: 'Canceled',
      incomplete: 'Incomplete',
      unpaid: 'Unpaid',
      incomplete_expired: 'Expired'
    }
    return statusLabels[status.toLowerCase()] || status
  }
}

// Export singleton instance
export const stripeClient = new StripeClient()