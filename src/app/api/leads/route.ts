import { NextRequest, NextResponse } from 'next/server'
import { createLead, routeLeadToAdvisor, calculateLeadQualificationScore } from '@/lib/business/leads'
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
      specialties,
      message,
      source = 'website'
    } = body

    // Validation
    if (!parentName || !parentEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: parentName, parentEmail' },
        { status: 400 }
      )
    }

    // If no specific advisor provided, use smart routing
    let targetAdvisorId = advisorId
    let routingScore = 0

    if (!targetAdvisorId) {
      const routingResult = await routeLeadToAdvisor(location, specialties, playerAge)
      if (!routingResult) {
        return NextResponse.json(
          { error: 'No available advisors found at this time. Please try again later.' },
          { status: 404 }
        )
      }
      targetAdvisorId = routingResult.advisorId
      routingScore = routingResult.score
    }

    // Verify advisor exists and has active subscription
    const advisor = await prisma.advisor.findUnique({
      where: { id: targetAdvisorId },
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
    const hasActiveSubscription = await isSubscriptionActive(targetAdvisorId)
    if (!hasActiveSubscription) {
      return NextResponse.json(
        { error: 'Advisor subscription is not active' },
        { status: 400 }
      )
    }

    // Calculate lead qualification score
    const qualificationScore = calculateLeadQualificationScore({
      parentEmail,
      parentPhone,
      playerAge,
      location,
      message,
      source
    })

    // Create the lead with business logic validation
    const lead = await createLead({
      advisorId: targetAdvisorId,
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

    // Return success response with enhanced data (non-sensitive)
    return NextResponse.json({
      success: true,
      message: 'Your message has been sent to the advisor',
      leadId: lead.id,
      advisorName: advisor.name,
      qualificationScore,
      ...(routingScore > 0 && { matchScore: routingScore }),
      estimatedResponseTime: '24 hours'
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

// GET endpoint to retrieve leads for advisor dashboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advisorId = searchParams.get('advisorId')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!advisorId) {
      return NextResponse.json(
        { error: 'advisorId parameter is required' },
        { status: 400 }
      )
    }

    // Verify advisor exists
    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId }
    })

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Fetch leads with filtering
    const leads = await prisma.lead.findMany({
      where: {
        advisorId,
        ...(status && { status })
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.lead.count({
      where: {
        advisorId,
        ...(status && { status })
      }
    })

    // Get this month's count
    const thisMonthCount = await prisma.lead.count({
      where: {
        advisorId,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    })

    return NextResponse.json({
      leads,
      totalCount,
      thisMonthLeads: thisMonthCount,
      hasMore: offset + limit < totalCount
    })

  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}