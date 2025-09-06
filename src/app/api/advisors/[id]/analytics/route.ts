import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const advisorId = params.id

    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 400 }
      )
    }

    // Verify advisor exists
    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
      include: {
        leads: {
          orderBy: { createdAt: 'desc' }
        },
        reviews: true,
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

    // Calculate date ranges
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Calculate lead metrics
    const totalLeads = advisor.leads.length
    const thisMonthLeads = advisor.leads.filter(lead => new Date(lead.createdAt) >= thisMonth).length
    const lastMonthLeads = advisor.leads.filter(lead => 
      new Date(lead.createdAt) >= lastMonth && new Date(lead.createdAt) <= lastMonthEnd
    ).length
    
    const convertedLeads = advisor.leads.filter(lead => lead.status === 'converted').length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
    
    const contactedLeads = advisor.leads.filter(lead => 
      ['contacted', 'qualified', 'converted'].includes(lead.status)
    ).length
    const responseRate = totalLeads > 0 ? (contactedLeads / totalLeads) * 100 : 0

    // Simulate profile views (in production, this would come from analytics tracking)
    const profileViewsThisMonth = Math.floor(thisMonthLeads * 8 + Math.random() * 50) // Simulate 8:1 view-to-lead ratio
    const profileViewsLastMonth = Math.floor(lastMonthLeads * 8 + Math.random() * 50)
    const totalProfileViews = Math.floor(totalLeads * 12 + Math.random() * 200)
    
    const viewTrendPercentage = lastMonthLeads > 0 
      ? Math.round(((thisMonthLeads - lastMonthLeads) / lastMonthLeads) * 100) 
      : 100
    const viewTrend = viewTrendPercentage > 5 ? 'up' : viewTrendPercentage < -5 ? 'down' : 'stable'

    // Review metrics
    const averageRating = advisor.reviews.length > 0 
      ? advisor.reviews.reduce((sum, review) => sum + review.rating, 0) / advisor.reviews.length 
      : 0

    // Calculate search ranking (simulated)
    const averagePosition = Math.max(1, Math.floor(10 - (advisor.completeness / 10) - (averageRating * 2)))
    const competitorComparison = averagePosition <= 5 ? 'above' : averagePosition <= 8 ? 'average' : 'below'

    // Generate optimization tips
    const optimizationTips = generateOptimizationTips(advisor)

    // Calculate overall optimization score
    const optimizationScore = Math.min(100, Math.round(
      (advisor.completeness * 0.4) + 
      (conversionRate * 0.3) + 
      (averageRating * 20 * 0.2) + 
      (responseRate * 0.1)
    ))

    // Generate keywords based on specialties
    const specialties = advisor.specialties ? JSON.parse(advisor.specialties) : []
    const keywordMatches = [
      ...specialties.slice(0, 3),
      `${advisor.city} hockey`,
      'hockey advisor',
      'hockey coaching'
    ].filter(Boolean)

    // Simulate response time (in production, this would be calculated from actual response data)
    const averageResponseTime = Math.floor(Math.random() * 48) + 2 // 2-50 hours

    const analyticsData = {
      profileViews: {
        total: totalProfileViews,
        thisMonth: profileViewsThisMonth,
        previousMonth: profileViewsLastMonth,
        trend: viewTrend,
        trendPercentage: Math.abs(viewTrendPercentage)
      },
      leadGeneration: {
        totalLeads,
        thisMonth: thisMonthLeads,
        conversionRate: Math.round(conversionRate * 10) / 10,
        responseRate: Math.round(responseRate * 10) / 10
      },
      engagement: {
        profileCompleteness: advisor.completeness,
        averageRating,
        totalReviews: advisor.reviews.length,
        socialClicks: Math.floor(Math.random() * 50) + 10 // Simulated
      },
      searchRanking: {
        averagePosition,
        keywordMatches,
        competitorComparison
      },
      optimization: {
        score: optimizationScore,
        improvements: optimizationTips
      },
      timeMetrics: {
        lastUpdated: advisor.updatedAt.toISOString(),
        profileAge: Math.floor((now.getTime() - advisor.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        averageResponseTime
      }
    }

    return NextResponse.json({ analytics: analyticsData })

  } catch (error) {
    console.error('Error fetching advisor analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateOptimizationTips(advisor: any) {
  const tips = []
  const specialties = advisor.specialties ? JSON.parse(advisor.specialties) : []
  const certifications = advisor.certifications ? JSON.parse(advisor.certifications) : []

  // Profile completeness tips
  if (advisor.completeness < 80) {
    tips.push({
      category: 'profile',
      priority: 'high',
      title: 'Complete Your Profile',
      description: 'Your profile is missing key information that parents look for.',
      impact: '+25% more leads',
      action: 'Complete Profile'
    })
  }

  if (!advisor.bio || advisor.bio.length < 200) {
    tips.push({
      category: 'profile',
      priority: 'medium',
      title: 'Expand Your Bio',
      description: 'A detailed bio helps parents understand your coaching approach.',
      impact: '+15% lead conversion',
      action: 'Update Bio'
    })
  }

  // Media tips
  if (!advisor.headshot) {
    tips.push({
      category: 'media',
      priority: 'high',
      title: 'Add Professional Headshot',
      description: 'Profiles with photos receive 40% more inquiries.',
      impact: '+40% profile views',
      action: 'Upload Photo'
    })
  }

  // Specialty tips
  if (specialties.length < 3) {
    tips.push({
      category: 'profile',
      priority: 'medium',
      title: 'Add More Specialties',
      description: 'Advisors with 3+ specialties appear in more search results.',
      impact: '+20% visibility',
      action: 'Add Specialties'
    })
  }

  // Certification tips
  if (certifications.length < 2) {
    tips.push({
      category: 'profile',
      priority: 'low',
      title: 'Add Certifications',
      description: 'Certifications build trust and credibility with parents.',
      impact: '+10% conversion rate',
      action: 'Add Credentials'
    })
  }

  // Engagement tips
  if (advisor.reviews.length < 3) {
    tips.push({
      category: 'engagement',
      priority: 'medium',
      title: 'Request More Reviews',
      description: 'Reviews are the top factor parents consider when choosing an advisor.',
      impact: '+30% lead conversion',
      action: 'Request Reviews'
    })
  }

  // SEO tips
  if (!advisor.website && !advisor.socials) {
    tips.push({
      category: 'seo',
      priority: 'low',
      title: 'Add Online Presence',
      description: 'Social media links and websites improve your search ranking.',
      impact: '+5% search visibility',
      action: 'Add Links'
    })
  }

  return tips.slice(0, 5) // Return top 5 tips
}