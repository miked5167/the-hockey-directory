import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_EVENTS, getPlanByStripePrice } from '@/lib/stripe/config'
import { db } from '@/lib/db'
import type { SubscriptionStatus } from '@/lib/stripe/config'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set')
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = headers().get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Processing Stripe webhook: ${event.type}`)

    // Handle the event
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_CREATED:
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_UPDATED:
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_SUBSCRIPTION_DELETED:
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_SUCCEEDED:
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_CREATED:
        await handleCustomerCreated(event.data.object as Stripe.Customer)
        break

      case STRIPE_WEBHOOK_EVENTS.CUSTOMER_UPDATED:
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const advisorId = subscription.metadata.advisorId
  if (!advisorId) {
    console.error('No advisorId in subscription metadata')
    return
  }

  const stripePriceId = subscription.items.data[0]?.price.id
  const plan = getPlanByStripePrice(stripePriceId)
  
  if (!plan) {
    console.error(`Unknown price ID: ${stripePriceId}`)
    return
  }

  try {
    // Create or update subscription record
    await db.subscription.upsert({
      where: { advisorId },
      create: {
        advisorId,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        stripePriceId,
        planId: plan.id,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        leadLimit: plan.leadLimit,
        leadsUsedThisMonth: 0
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripePriceId,
        planId: plan.id,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        leadLimit: plan.leadLimit,
        updatedAt: new Date()
      }
    })

    // Update advisor record with subscription info
    await db.advisor.update({
      where: { id: advisorId },
      data: {
        subscriptionPlan: plan.id,
        subscriptionStatus: subscription.status,
        isPremium: plan.id !== 'basic',
        isFeatured: plan.id === 'featured',
        updatedAt: new Date()
      }
    })

    console.log(`Subscription created for advisor ${advisorId} with plan ${plan.name}`)
  } catch (error) {
    console.error('Failed to handle subscription created:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const advisorId = subscription.metadata.advisorId
  if (!advisorId) {
    console.error('No advisorId in subscription metadata')
    return
  }

  const stripePriceId = subscription.items.data[0]?.price.id
  const plan = getPlanByStripePrice(stripePriceId)
  
  if (!plan) {
    console.error(`Unknown price ID: ${stripePriceId}`)
    return
  }

  try {
    // Update subscription record
    await db.subscription.update({
      where: { advisorId },
      data: {
        stripePriceId,
        planId: plan.id,
        status: subscription.status as SubscriptionStatus,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        leadLimit: plan.leadLimit,
        updatedAt: new Date()
      }
    })

    // Update advisor record
    await db.advisor.update({
      where: { id: advisorId },
      data: {
        subscriptionPlan: plan.id,
        subscriptionStatus: subscription.status,
        isPremium: plan.id !== 'basic',
        isFeatured: plan.id === 'featured',
        updatedAt: new Date()
      }
    })

    console.log(`Subscription updated for advisor ${advisorId} - Status: ${subscription.status}`)
  } catch (error) {
    console.error('Failed to handle subscription updated:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const advisorId = subscription.metadata.advisorId
  if (!advisorId) {
    console.error('No advisorId in subscription metadata')
    return
  }

  try {
    // Update subscription status
    await db.subscription.update({
      where: { advisorId },
      data: {
        status: 'canceled',
        updatedAt: new Date()
      }
    })

    // Downgrade advisor to basic/free tier
    await db.advisor.update({
      where: { id: advisorId },
      data: {
        subscriptionPlan: 'basic',
        subscriptionStatus: 'canceled',
        isPremium: false,
        isFeatured: false,
        updatedAt: new Date()
      }
    })

    console.log(`Subscription canceled for advisor ${advisorId}`)
  } catch (error) {
    console.error('Failed to handle subscription deleted:', error)
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  try {
    // Find subscription by customer ID
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (subscription) {
      // Reset lead usage if this is a new billing period
      const isNewBillingPeriod = invoice.billing_reason === 'subscription_cycle'
      
      await db.subscription.update({
        where: { id: subscription.id },
        data: {
          ...(isNewBillingPeriod && { leadsUsedThisMonth: 0 }),
          updatedAt: new Date()
        }
      })

      // Log payment success
      console.log(`Payment succeeded for subscription ${subscription.id}`)
    }
  } catch (error) {
    console.error('Failed to handle payment succeeded:', error)
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string
  
  try {
    const subscription = await db.subscription.findFirst({
      where: { stripeCustomerId: customerId }
    })

    if (subscription) {
      // Update status to past_due if not already
      if (subscription.status !== 'past_due') {
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'past_due',
            updatedAt: new Date()
          }
        })

        // Update advisor status
        await db.advisor.update({
          where: { id: subscription.advisorId },
          data: {
            subscriptionStatus: 'past_due',
            updatedAt: new Date()
          }
        })
      }

      console.log(`Payment failed for subscription ${subscription.id}`)
    }
  } catch (error) {
    console.error('Failed to handle payment failed:', error)
  }
}

async function handleCustomerCreated(customer: Stripe.Customer) {
  const advisorId = customer.metadata.advisorId
  if (!advisorId) return

  try {
    // Update advisor with Stripe customer ID
    await db.advisor.update({
      where: { id: advisorId },
      data: {
        stripeCustomerId: customer.id,
        updatedAt: new Date()
      }
    })

    console.log(`Customer created for advisor ${advisorId}`)
  } catch (error) {
    console.error('Failed to handle customer created:', error)
  }
}

async function handleCustomerUpdated(customer: Stripe.Customer) {
  // Handle customer updates if needed
  console.log(`Customer updated: ${customer.id}`)
}