'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Bell,
  Clock,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  TrendingUp,
  User,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FollowUpItem {
  id: string
  leadId: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  playerName?: string
  playerAge?: number
  message: string
  status: string
  createdAt: string
  daysOld: number
  priority: 'high' | 'medium' | 'low'
  suggestedAction: string
  lastContactDate?: string
}

interface FollowUpSystemProps {
  advisorId: string
  className?: string
}

const PRIORITY_CONFIG = {
  high: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  low: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Bell }
}

const ACTION_TEMPLATES = {
  'initial_followup': {
    title: 'Send Initial Follow-up',
    description: 'Thank them for their interest and ask follow-up questions',
    template: `Hi {parentName},\n\nThank you for reaching out about hockey development for {playerName}. I'd love to learn more about your goals and how I can help.\n\nWhen would be a good time for a brief call to discuss your needs?\n\nBest regards`
  },
  'second_followup': {
    title: 'Second Follow-up',
    description: 'Check if they received your first message and reiterate value',
    template: `Hi {parentName},\n\nI wanted to follow up on my previous message about {playerName}'s hockey development. I know how important it is to find the right advisor.\n\nWould you like to schedule a quick call to discuss how I can help {playerName} reach their goals?\n\nBest regards`
  },
  'final_followup': {
    title: 'Final Follow-up',
    description: 'Last attempt with clear call to action',
    template: `Hi {parentName},\n\nI don't want to keep bothering you, but I wanted to reach out one more time about {playerName}'s hockey development.\n\nIf you're still interested, please let me know. If not, I completely understand.\n\nBest regards`
  }
}

export function FollowUpSystem({ advisorId, className }: FollowUpSystemProps) {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchFollowUps = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/leads/follow-ups?advisorId=${advisorId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch follow-ups')
      }
      
      const result = await response.json()
      setFollowUps(result.followUps || [])
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const markAsContacted = async (leadId: string) => {
    setProcessingId(leadId)
    
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'contacted' })
      })

      if (!response.ok) {
        throw new Error('Failed to update lead status')
      }

      // Remove from follow-up list
      setFollowUps(prev => prev.filter(item => item.leadId !== leadId))
    } catch (error: any) {
      setError(error.message)
    } finally {
      setProcessingId(null)
    }
  }

  const dismissFollowUp = async (leadId: string) => {
    setFollowUps(prev => prev.filter(item => item.leadId !== leadId))
  }

  useEffect(() => {
    if (advisorId) {
      fetchFollowUps()
    }
  }, [advisorId])

  const getPriorityConfig = (priority: string) => {
    return PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG] || PRIORITY_CONFIG.low
  }

  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return '1 day ago'
    return `${diffDays} days ago`
  }

  const generateEmailLink = (followUp: FollowUpItem, actionType: string) => {
    const action = ACTION_TEMPLATES[actionType as keyof typeof ACTION_TEMPLATES]
    if (!action) return '#'

    const template = action.template
      .replace('{parentName}', followUp.parentName)
      .replace('{playerName}', followUp.playerName || 'your child')
      .replace('{playerName}', followUp.playerName || 'your child') // Replace second occurrence

    const subject = `Follow-up: Hockey Development for ${followUp.playerName || 'Your Child'}`
    const mailtoLink = `mailto:${followUp.parentEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(template)}`
    
    return mailtoLink
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-48">
            <div className="flex items-center gap-2 text-gray-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Loading follow-ups...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="h-6 w-6 text-blue-600" />
            Follow-up System
          </h2>
          <p className="text-gray-600">Leads that need your attention</p>
        </div>
        <Button onClick={fetchFollowUps} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {followUps.filter(f => f.priority === 'high').length}
                </p>
                <p className="text-sm text-gray-600">High Priority</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {followUps.filter(f => f.priority === 'medium').length}
                </p>
                <p className="text-sm text-gray-600">Medium Priority</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-600">{followUps.length}</p>
                <p className="text-sm text-gray-600">Total Follow-ups</p>
              </div>
              <Bell className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Items */}
      <div className="space-y-4">
        {followUps.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                All caught up!
              </h3>
              <p className="text-gray-600">
                No leads require follow-up at this time. Great job staying on top of your communications!
              </p>
            </CardContent>
          </Card>
        ) : (
          followUps.map((followUp) => {
            const priorityConfig = getPriorityConfig(followUp.priority)
            const PriorityIcon = priorityConfig.icon
            const actionType = followUp.daysOld <= 2 ? 'initial_followup' : 
                             followUp.daysOld <= 5 ? 'second_followup' : 'final_followup'
            const action = ACTION_TEMPLATES[actionType]

            return (
              <Card key={followUp.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-xs", priorityConfig.color)}>
                        <PriorityIcon className="h-3 w-3 mr-1" />
                        {followUp.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {followUp.daysOld} days old • Created {getTimeAgo(followUp.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Lead Information */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {followUp.parentName}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {followUp.parentEmail}
                        </div>
                        
                        {followUp.parentPhone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {followUp.parentPhone}
                          </div>
                        )}

                        {followUp.playerName && (
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Player: {followUp.playerName}
                            {followUp.playerAge && ` (${followUp.playerAge} years old)`}
                          </div>
                        )}
                      </div>

                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          "{followUp.message}"
                        </p>
                      </div>
                    </div>

                    {/* Suggested Actions */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {action.title}
                      </h4>
                      
                      <p className="text-sm text-gray-600 mb-4">
                        {action.description}
                      </p>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          className="w-full"
                          asChild
                        >
                          <a href={generateEmailLink(followUp, actionType)}>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Email
                          </a>
                        </Button>

                        {followUp.parentPhone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            asChild
                          >
                            <a href={`tel:${followUp.parentPhone}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Call Now
                            </a>
                          </Button>
                        )}

                        <Separator className="my-2" />

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsContacted(followUp.leadId)}
                            disabled={processingId === followUp.leadId}
                            className="flex-1"
                          >
                            {processingId === followUp.leadId ? (
                              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            )}
                            Mark as Contacted
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => dismissFollowUp(followUp.leadId)}
                            className="flex-1"
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}