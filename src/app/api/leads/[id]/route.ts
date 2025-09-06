import { NextRequest, NextResponse } from 'next/server'
import { updateLeadStatus, getLeadTimeline } from '@/lib/business/leads'
import { prisma } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const timeline = await getLeadTimeline(leadId)

    if (!timeline) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(timeline)

  } catch (error) {
    console.error('Error fetching lead details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id
    const body = await request.json()
    const { status, notes } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    const validStatuses = ['new', 'contacted', 'qualified', 'converted', 'closed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const updatedLead = await updateLeadStatus(leadId, status, notes)

    return NextResponse.json({
      success: true,
      lead: updatedLead
    })

  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const leadId = params.id

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    // Check if lead exists first
    const existingLead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Delete the lead
    await prisma.lead.delete({
      where: { id: leadId }
    })

    return NextResponse.json({
      success: true,
      message: 'Lead deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}