'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye,
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  MessageSquare,
  BarChart3,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Search,
  Award,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileAnalyticsProps {
  advisorId: string
  className?: string
}

interface AnalyticsData {
  profileViews: {
    total: number
    thisMonth: number
    previousMonth: number
    trend: 'up' | 'down' | 'stable'
    trendPercentage: number
  }
  leadGeneration: {
    totalLeads: number
    thisMonth: number
    conversionRate: number
    responseRate: number
  }
  engagement: {
    profileCompleteness: number
    averageRating: number
    totalReviews: number
    socialClicks: number
  }
  searchRanking: {
    averagePosition: number
    keywordMatches: string[]
    competitorComparison: 'above' | 'below' | 'average'
  }
  optimization: {
    score: number
    improvements: OptimizationTip[]
  }
  timeMetrics: {
    lastUpdated: string
    profileAge: number
    averageResponseTime: number
  }
}

interface OptimizationTip {
  category: 'profile' | 'media' | 'engagement' | 'seo'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  action: string
}

export function ProfileAnalytics({ advisorId, className }: ProfileAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/advisors/${advisorId}/analytics`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const result = await response.json()
      setData(result.analytics)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (advisorId) {
      fetchAnalytics()
    }
  }, [advisorId])

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'up') return <ArrowUp className="h-4 w-4 text-green-500" />
    if (trend === 'down') return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-500" />
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'profile': return Users
      case 'media': return Eye
      case 'engagement': return MessageSquare
      case 'seo': return Search
      default: return Target
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading analytics...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Failed to load analytics data'}
            </AlertDescription>
          </Alert>
          <Button onClick={fetchAnalytics} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Analytics</h2>
          <p className="text-gray-600">Track your profile performance and optimization opportunities</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Profile Views */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Profile Views
              </CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.profileViews.thisMonth}</div>
            <div className="flex items-center mt-1">
              {getTrendIcon(data.profileViews.trend, data.profileViews.trendPercentage)}
              <span className={cn("text-xs font-medium ml-1", getTrendColor(data.profileViews.trend))}>
                {data.profileViews.trendPercentage}% vs last month
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {data.profileViews.total} total views
            </div>
          </CardContent>
        </Card>

        {/* Lead Conversion */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Lead Conversion
              </CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leadGeneration.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">
              {data.leadGeneration.thisMonth} leads this month
            </div>
            <Progress value={data.leadGeneration.conversionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Profile Score */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Profile Score
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.optimization.score}/100</div>
            <div className="text-xs text-gray-600 mt-1">
              Completeness: {data.engagement.profileCompleteness}%
            </div>
            <Progress value={data.optimization.score} className="mt-2 h-2" />
          </CardContent>
        </Card>

        {/* Search Ranking */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Search Ranking
              </CardTitle>
              <Search className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{data.searchRanking.averagePosition}</div>
            <div className="text-xs text-gray-600 mt-1">
              {data.searchRanking.competitorComparison} average
            </div>
            <Badge variant="secondary" className="mt-1 text-xs">
              {data.searchRanking.keywordMatches.length} keywords
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Views Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  View Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">This Month</span>
                    <span className="font-semibold">{data.profileViews.thisMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Month</span>
                    <span className="font-semibold">{data.profileViews.previousMonth}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">All Time</span>
                    <span className="font-semibold">{data.profileViews.total}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lead Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Lead Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Leads</span>
                    <span className="font-semibold">{data.leadGeneration.totalLeads}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-semibold">{data.leadGeneration.conversionRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Response Rate</span>
                    <span className="font-semibold">{data.leadGeneration.responseRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Response Time */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Response Time Analysis
              </CardTitle>
              <CardDescription>
                How quickly you respond to leads affects conversion rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold">{data.timeMetrics.averageResponseTime}h</div>
                  <div className="text-sm text-gray-600">Average response time</div>
                </div>
                <div className="text-right">
                  {data.timeMetrics.averageResponseTime <= 24 ? (
                    <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                  ) : data.timeMetrics.averageResponseTime <= 48 ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Rating & Reviews */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Reviews & Ratings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold">{data.engagement.averageRating.toFixed(1)}</div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn("h-4 w-4", {
                            "text-yellow-400 fill-current": star <= data.engagement.averageRating,
                            "text-gray-300": star > data.engagement.averageRating
                          })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Based on {data.engagement.totalReviews} reviews
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Engagement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Social Engagement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Social Media Clicks</span>
                    <span className="font-semibold">{data.engagement.socialClicks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Profile Completeness</span>
                    <span className="font-semibold">{data.engagement.profileCompleteness}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Search Keywords</CardTitle>
              <CardDescription>
                Keywords that bring visitors to your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.searchRanking.keywordMatches.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          {/* Optimization Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimization Score: {data.optimization.score}/100
              </CardTitle>
              <CardDescription>
                Your profile optimization score based on completeness and best practices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={data.optimization.score} className="mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span>Profile Completeness</span>
                  <span className="font-medium">{data.engagement.profileCompleteness}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Media Portfolio</span>
                  <span className="font-medium">Good</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SEO Optimization</span>
                  <span className="font-medium">Fair</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Engagement Level</span>
                  <span className="font-medium">Excellent</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Optimization Tips */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Optimization Recommendations
            </h3>
            
            {data.optimization.improvements.map((tip, index) => {
              const CategoryIcon = getCategoryIcon(tip.category)
              
              return (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CategoryIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{tip.title}</h4>
                          <Badge className={cn("text-xs", getPriorityColor(tip.priority))}>
                            {tip.priority} priority
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          {tip.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-green-600 font-medium">
                            Expected impact: {tip.impact}
                          </span>
                          <Button size="sm" variant="outline">
                            {tip.action}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}