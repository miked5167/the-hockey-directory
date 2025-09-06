import { NextRequest, NextResponse } from 'next/server'
import { createLead } from '@/lib/business/leads'
import { isSubscriptionActive } from '@/lib/business/subscriptions'
import { prisma } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      advisorId,
      parentName,
      parentEmail,
      parentPhone,
      playerName,
      playerAge,
      location,
      message,
      source = 'website'
    } = body

    // Validation
    if (!advisorId || !parentName || !parentEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: advisorId, parentName, parentEmail' },
        { status: 400 }
      )
    }

    // Verify advisor exists and has active subscription
    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
      include: {
        subscription: {
          include: { plan: true }
        }
      }
    })

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    if (!advisor.verified) {
      return NextResponse.json(
        { error: 'Advisor is not verified' },
        { status: 400 }
      )
    }

    // Check if advisor has active subscription and can receive leads
    const hasActiveSubscription = await isSubscriptionActive(advisorId)
    if (!hasActiveSubscription) {
      return NextResponse.json(
        { error: 'Advisor subscription is not active' },
        { status: 400 }
      )
    }

    // Create the lead with business logic validation
    const lead = await createLead({
      advisorId,
      parentName,
      parentEmail,
      parentPhone,
      playerName,
      playerAge,
      location,
      message,
      source
    })

    if (!lead) {
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    // Send notification email to advisor (placeholder for future implementation)
    // await sendLeadNotificationEmail(advisor, lead)

    // Return success response without exposing sensitive data
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to the advisor',
      leadId: lead.id
    })

  } catch (error) {
    console.error('Error creating lead:', error)

    // Handle specific business logic errors
    if (error instanceof Error && error.message.includes('monthly lead limit')) {
      return NextResponse.json(
        { error: 'This advisor has reached their monthly lead limit. Please try another advisor.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve leads (for advisor dashboard - future feature)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advisorId = searchParams.get('advisorId')
    const status = searchParams.get('status')

    if (!advisorId) {
      return NextResponse.json(
        { error: 'advisorId parameter is required' },
        { status: 400 }
      )
    }

    // For now, just return basic lead count for the advisor
    const leadCount = await prisma.lead.count({
      where: {
        advisorId,
        ...(status && { status })
      }
    })

    const thisMonthCount = await prisma.lead.count({
      where: {
        advisorId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })

    return NextResponse.json({
      totalLeads: leadCount,
      thisMonthLeads: thisMonthCount
    })

  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}