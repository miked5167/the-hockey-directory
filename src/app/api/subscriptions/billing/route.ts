import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { subscriptionService } from '@/lib/stripe/subscription-service'

// GET /api/subscriptions/billing - Get billing history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const billingHistory = await subscriptionService.getBillingHistory(session.user.id)
    
    return NextResponse.json({ invoices: billingHistory })
  } catch (error) {
    console.error('Failed to get billing history:', error)
    return NextResponse.json({ error: 'Failed to get billing history' }, { status: 500 })
  }
}