import { NextRequest, NextResponse } from 'next/server'
import { getMonthlyLeadStats } from '@/lib/business/leads'
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

    // Get monthly stats
    const monthlyStats = await getMonthlyLeadStats(advisorId)

    // Calculate trending data (compare with previous month)
    const previousMonth = new Date()
    previousMonth.setMonth(previousMonth.getMonth() - 1)
    const previousMonthStart = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1)
    const previousMonthEnd = new Date(previousMonth.getFullYear(), previousMonth.getMonth() + 1, 0)

    const previousMonthLeads = await prisma.lead.count({
      where: {
        advisorId,
        createdAt: {
          gte: previousMonthStart,
          lte: previousMonthEnd
        }
      }
    })

    const currentMonthLeads = monthlyStats.thisMonth.total
    let trending = { direction: 'stable' as const, percentage: 0 }

    if (previousMonthLeads > 0) {
      const change = ((currentMonthLeads - previousMonthLeads) / previousMonthLeads) * 100
      trending = {
        direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
        percentage: Math.abs(Math.round(change))
      }
    } else if (currentMonthLeads > 0) {
      trending = { direction: 'up', percentage: 100 }
    }

    // Get lead sources
    const leadSources = await prisma.lead.groupBy({
      by: ['source'],
      where: { advisorId },
      _count: { source: true }
    })

    const totalLeads = leadSources.reduce((sum, source) => sum + source._count.source, 0)
    const formattedSources = leadSources.map(source => ({
      source: source.source,
      count: source._count.source,
      percentage: totalLeads > 0 ? (source._count.source / totalLeads) * 100 : 0
    }))

    // Calculate average response time (placeholder - would need actual response tracking)
    const responseTime = {
      average: Math.random() * 20 + 4, // 4-24 hours simulation
      target: 24
    }

    const analyticsData = {
      thisMonth: monthlyStats.thisMonth,
      allTime: monthlyStats.allTime,
      trending,
      leadSources: formattedSources,
      responseTime: {
        average: Math.round(responseTime.average),
        target: responseTime.target
      }
    }

    return NextResponse.json(analyticsData)

  } catch (error) {
    console.error('Error fetching lead analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}