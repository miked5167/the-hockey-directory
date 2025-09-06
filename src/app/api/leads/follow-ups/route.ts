import { NextRequest, NextResponse } from 'next/server'
import { getLeadsRequiringFollowUp } from '@/lib/business/leads'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const advisorId = searchParams.get('advisorId')

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

    // Get leads requiring follow-up
    const leadsNeedingFollowUp = await getLeadsRequiringFollowUp()
    
    // Filter for this specific advisor
    const advisorLeads = leadsNeedingFollowUp.filter(lead => lead.advisorId === advisorId)

    // Transform leads into follow-up items with priority scoring
    const followUps = advisorLeads.map(lead => {
      const now = new Date()
      const createdDate = new Date(lead.createdAt)
      const daysOld = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Calculate priority based on age and lead quality
      let priority: 'high' | 'medium' | 'low' = 'low'
      let suggestedAction = 'Send initial follow-up message'

      if (daysOld >= 5) {
        priority = 'high'
        suggestedAction = 'Urgent: Send final follow-up or close lead'
      } else if (daysOld >= 3) {
        priority = 'medium'
        suggestedAction = 'Send second follow-up message'
      } else if (lead.parentPhone) {
        priority = 'medium' // Phone provided = higher intent
        suggestedAction = 'Call or send personalized message'
      }

      return {
        id: `followup-${lead.id}`,
        leadId: lead.id,
        parentName: lead.parentName,
        parentEmail: lead.parentEmail,
        parentPhone: lead.parentPhone,
        playerName: lead.playerName,
        playerAge: lead.playerAge,
        message: lead.message,
        status: lead.status,
        createdAt: lead.createdAt.toISOString(),
        daysOld,
        priority,
        suggestedAction,
        lastContactDate: lead.updatedAt !== lead.createdAt ? lead.updatedAt.toISOString() : undefined
      }
    })

    // Sort by priority (high -> medium -> low) then by age (oldest first)
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    followUps.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return b.daysOld - a.daysOld
    })

    return NextResponse.json({
      followUps,
      summary: {
        total: followUps.length,
        high: followUps.filter(f => f.priority === 'high').length,
        medium: followUps.filter(f => f.priority === 'medium').length,
        low: followUps.filter(f => f.priority === 'low').length
      }
    })

  } catch (error) {
    console.error('Error fetching follow-ups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}