'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  Calendar,
  BarChart3,
  RefreshCw,
  Award,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeadAnalyticsProps {
  advisorId: string
  className?: string
}

interface AnalyticsData {
  thisMonth: {
    total: number
    converted: number
    conversionRate: number
  }
  allTime: {
    total: number
    converted: number
    conversionRate: number
  }
  trending: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
  leadSources: {
    source: string
    count: number
    percentage: number
  }[]
  responseTime: {
    average: number
    target: number
  }
}

export function LeadAnalytics({ advisorId, className }: LeadAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/leads/analytics?advisorId=${advisorId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      
      const result = await response.json()
      setData(result)
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

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return 'text-green-600 bg-green-50 border-green-200'
      case 'down': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Analytics</h2>
          <p className="text-gray-600">Track your lead generation performance</p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads This Month */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Leads This Month
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.thisMonth.total}</div>
            <div className="flex items-center mt-1">
              {getTrendIcon(data.trending.direction)}
              <span className={cn("text-xs font-medium ml-1", getTrendColor(data.trending.direction))}>
                {data.trending.percentage}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Conversion Rate
              </CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.thisMonth.conversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600 mt-1">
              {data.thisMonth.converted} of {data.thisMonth.total} converted
            </div>
            <Progress 
              value={data.thisMonth.conversionRate} 
              className="mt-2 h-2" 
            />
          </CardContent>
        </Card>

        {/* All Time Stats */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                All Time Leads
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.allTime.total}</div>
            <div className="text-xs text-gray-600 mt-1">
              {data.allTime.conversionRate.toFixed(1)}% conversion rate
            </div>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Response Time
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.responseTime.average}h</div>
            <div className="text-xs text-gray-600 mt-1">
              Target: {data.responseTime.target}h
            </div>
            {data.responseTime.average <= data.responseTime.target ? (
              <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700">
                <Award className="h-3 w-3 mr-1" />
                On Track
              </Badge>
            ) : (
              <Badge variant="secondary" className="mt-1 text-xs bg-orange-100 text-orange-700">
                <Clock className="h-3 w-3 mr-1" />
                Needs Attention
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Your lead conversion performance compared to averages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">This Month</span>
                <span className="text-sm text-gray-600">
                  {data.thisMonth.converted}/{data.thisMonth.total}
                </span>
              </div>
              <Progress value={data.thisMonth.conversionRate} className="h-3" />
              <div className="text-xs text-gray-600 mt-1">
                {data.thisMonth.conversionRate.toFixed(1)}% conversion rate
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">All Time Average</span>
                <span className="text-sm text-gray-600">
                  {data.allTime.converted}/{data.allTime.total}
                </span>
              </div>
              <Progress value={data.allTime.conversionRate} className="h-3" />
              <div className="text-xs text-gray-600 mt-1">
                {data.allTime.conversionRate.toFixed(1)}% conversion rate
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-blue-50 rounded-lg p-4 mt-4">
            <h4 className="font-medium text-blue-900 mb-2">Performance Insights</h4>
            <div className="space-y-2 text-sm text-blue-800">
              {data.thisMonth.conversionRate > data.allTime.conversionRate ? (
                <p>✅ Your conversion rate is above your average this month!</p>
              ) : (
                <p>📈 Focus on follow-up to improve your conversion rate</p>
              )}
              
              {data.responseTime.average <= 24 ? (
                <p>⚡ Great response time - leads prefer quick responses</p>
              ) : (
                <p>⏰ Consider responding to leads faster for better results</p>
              )}

              {data.thisMonth.total > 5 ? (
                <p>🎯 Strong lead volume this month</p>
              ) : (
                <p>📊 Consider upgrading your plan for more leads</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Sources */}
      {data.leadSources && data.leadSources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>
              Where your leads are coming from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.leadSources.map((source, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium capitalize">{source.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{source.count} leads</span>
                    <Badge variant="secondary" className="text-xs">
                      {source.percentage.toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}