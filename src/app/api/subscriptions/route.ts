import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subscriptionService } from '@/lib/stripe/subscription-service'
import { stripe } from '@/lib/stripe/config'

// GET /api/subscriptions - Get current subscription
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await subscriptionService.getSubscriptionByAdvisorId(session.user.id)
    
    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Failed to get subscription:', error)
    return NextResponse.json({ error: 'Failed to get subscription' }, { status: 500 })
  }
}

// POST /api/subscriptions - Create new subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId, paymentMethodId } = await req.json()

    if (!planId || !paymentMethodId) {
      return NextResponse.json(
        { error: 'Missing planId or paymentMethodId' },
        { status: 400 }
      )
    }

    const subscription = await subscriptionService.createSubscription({
      advisorId: session.user.id,
      planId,
      paymentMethodId,
      email: session.user.email!,
      name: session.user.name || session.user.email!
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Failed to create subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}

// PUT /api/subscriptions - Update subscription plan
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await req.json()

    if (!planId) {
      return NextResponse.json({ error: 'Missing planId' }, { status: 400 })
    }

    const subscription = await subscriptionService.updateSubscriptionPlan(
      session.user.id,
      planId
    )

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Failed to update subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

// DELETE /api/subscriptions - Cancel subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const immediately = searchParams.get('immediately') === 'true'

    const subscription = await subscriptionService.cancelSubscription(
      session.user.id,
      immediately
    )

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}