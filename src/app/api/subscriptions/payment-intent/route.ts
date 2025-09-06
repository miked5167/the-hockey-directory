import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, getPlanById } from '@/lib/stripe/config'

// POST /api/subscriptions/payment-intent - Create payment intent for subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, paymentMethodId } = await req.json()

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    const plan = getPlanById(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create or retrieve customer
    let customer
    try {
      const customers = await stripe.customers.list({
        email: session.user.email!,
        limit: 1
      })
      
      if (customers.data.length > 0) {
        customer = customers.data[0]
      } else {
        customer = await stripe.customers.create({
          email: session.user.email!,
          name: session.user.name || session.user.email!,
          metadata: {
            advisorId: session.user.id
          }
        })
      }
    } catch (error) {
      console.error('Failed to create/retrieve customer:', error)
      return NextResponse.json({ error: 'Failed to setup customer' }, { status: 500 })
    }

    // If payment method provided, attach it to customer
    if (paymentMethodId) {
      try {
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: customer.id
        })
      } catch (error) {
        console.error('Failed to attach payment method:', error)
      }
    }

    // Create setup intent for subscription
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        advisorId: session.user.id,
        planId: planId
      }
    })

    return NextResponse.json({ 
      setupIntent: {
        id: setupIntent.id,
        client_secret: setupIntent.client_secret,
        status: setupIntent.status
      },
      customer: {
        id: customer.id
      }
    })
  } catch (error) {
    console.error('Failed to create payment intent:', error)
    return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
  }
}