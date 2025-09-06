'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Shield,
  CheckCircle,
  AlertTriangle,
  Upload,
  Award,
  Star,
  TrendingUp,
  Users,
  Calendar,
  Trophy,
  Medal,
  Target,
  FileText,
  Link,
  Instagram,
  Linkedin,
  Twitter,
  Globe,
  Verified,
  Clock,
  ThumbsUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialProofProps {
  advisorId: string
  currentData?: SocialProofData
  onUpdate?: (data: SocialProofData) => void
  className?: string
}

interface SocialProofData {
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'premium'
  achievements: Achievement[]
  testimonials: Testimonial[]
  credentials: Credential[]
  socialStats: {
    totalStudents: number
    successStories: number
    yearsActive: number
    endorsements: number
  }
  trustSignals: TrustSignal[]
}

interface Achievement {
  id: string
  type: 'certification' | 'award' | 'milestone' | 'recognition'
  title: string
  description: string
  date: string
  verified: boolean
  icon: string
}

interface Testimonial {
  id: string
  parentName: string
  playerName: string
  content: string
  rating: number
  date: string
  featured: boolean
  verified: boolean
}

interface Credential {
  id: string
  name: string
  issuer: string
  date: string
  expiryDate?: string
  verificationUrl?: string
  status: 'pending' | 'verified' | 'expired'
}

interface TrustSignal {
  id: string
  type: 'background_check' | 'insurance' | 'references' | 'social_media'
  label: string
  status: 'verified' | 'pending' | 'not_provided'
  description: string
}

const DEFAULT_TRUST_SIGNALS: TrustSignal[] = [
  {
    id: '1',
    type: 'background_check',
    label: 'Background Check',
    status: 'not_provided',
    description: 'Criminal background check completed'
  },
  {
    id: '2',
    type: 'insurance',
    label: 'Liability Insurance',
    status: 'not_provided',
    description: 'Professional liability insurance coverage'
  },
  {
    id: '3',
    type: 'references',
    label: 'Professional References',
    status: 'not_provided',
    description: 'Verified professional references'
  },
  {
    id: '4',
    type: 'social_media',
    label: 'Social Media Verified',
    status: 'not_provided',
    description: 'Social media accounts verified'
  }
]

export function SocialProof({ advisorId, currentData, onUpdate, className }: SocialProofProps) {
  const [data, setData] = useState<SocialProofData>(currentData || {
    verificationStatus: 'unverified',
    achievements: [],
    testimonials: [],
    credentials: [],
    socialStats: {
      totalStudents: 0,
      successStories: 0,
      yearsActive: 0,
      endorsements: 0
    },
    trustSignals: DEFAULT_TRUST_SIGNALS
  })

  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showAchievementModal, setShowAchievementModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getVerificationBadge = () => {
    switch (data.verificationStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified Advisor
          </Badge>
        )
      case 'premium':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className="h-3 w-3 mr-1" />
            Premium Verified
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Verification Pending
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Not Verified
          </Badge>
        )
    }
  }

  const getTrustScore = () => {
    const verifiedSignals = data.trustSignals.filter(signal => signal.status === 'verified').length
    return Math.round((verifiedSignals / data.trustSignals.length) * 100)
  }

  const getCredibilityScore = () => {
    let score = 0
    
    // Verification status
    switch (data.verificationStatus) {
      case 'premium': score += 40; break
      case 'verified': score += 30; break
      case 'pending': score += 10; break
    }

    // Trust signals
    score += (getTrustScore() * 0.3)

    // Achievements and credentials
    score += Math.min(20, data.achievements.length * 2)
    score += Math.min(10, data.credentials.filter(c => c.status === 'verified').length * 2)

    return Math.min(100, Math.round(score))
  }

  const handleStartVerification = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/advisors/${advisorId}/verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'identity_verification' })
      })

      if (!response.ok) {
        throw new Error('Failed to start verification process')
      }

      const result = await response.json()
      
      setData(prev => ({
        ...prev,
        verificationStatus: 'pending'
      }))

      setShowVerificationModal(false)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const addAchievement = (achievement: Omit<Achievement, 'id'>) => {
    const newAchievement = {
      ...achievement,
      id: Date.now().toString()
    }

    setData(prev => ({
      ...prev,
      achievements: [...prev.achievements, newAchievement]
    }))
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Social Proof & Verification</h2>
          <p className="text-gray-600">Build trust and credibility with parents</p>
        </div>
        {getVerificationBadge()}
      </div>

      {/* Trust Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trust & Credibility Score
          </CardTitle>
          <CardDescription>
            Your overall credibility score based on verification and social proof
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl font-bold">{getCredibilityScore()}/100</div>
            <Badge className={cn({
              "bg-green-100 text-green-800": getCredibilityScore() >= 80,
              "bg-yellow-100 text-yellow-800": getCredibilityScore() >= 60,
              "bg-red-100 text-red-800": getCredibilityScore() < 60
            })}>
              {getCredibilityScore() >= 80 ? 'Excellent' : 
               getCredibilityScore() >= 60 ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>

          <Progress value={getCredibilityScore()} className="mb-4" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold">{data.socialStats.totalStudents}</div>
              <div className="text-gray-600">Students Coached</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{data.socialStats.successStories}</div>
              <div className="text-gray-600">Success Stories</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{data.socialStats.yearsActive}</div>
              <div className="text-gray-600">Years Active</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{data.socialStats.endorsements}</div>
              <div className="text-gray-600">Endorsements</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Verified className="h-5 w-5" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.verificationStatus === 'unverified' && (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Get Verified to Build Trust
              </h3>
              <p className="text-gray-600 mb-6">
                Verified advisors receive 3x more inquiries from parents
              </p>
              <Button onClick={() => setShowVerificationModal(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Start Verification Process
              </Button>
            </div>
          )}

          {data.verificationStatus === 'pending' && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Verification In Progress
              </h3>
              <p className="text-gray-600">
                Your verification is being reviewed. This typically takes 2-3 business days.
              </p>
            </div>
          )}

          {(data.verificationStatus === 'verified' || data.verificationStatus === 'premium') && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {data.verificationStatus === 'premium' ? 'Premium Verified Advisor' : 'Verified Advisor'}
              </h3>
              <p className="text-gray-600">
                Your identity and credentials have been verified
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trust Signals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Trust Signals
          </CardTitle>
          <CardDescription>
            Additional verification steps that build parent confidence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.trustSignals.map(signal => (
              <div key={signal.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", {
                    "bg-green-100": signal.status === 'verified',
                    "bg-yellow-100": signal.status === 'pending',
                    "bg-gray-100": signal.status === 'not_provided'
                  })}>
                    {signal.status === 'verified' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {signal.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                    {signal.status === 'not_provided' && <AlertTriangle className="h-4 w-4 text-gray-600" />}
                  </div>
                  
                  <div>
                    <div className="font-medium">{signal.label}</div>
                    <div className="text-sm text-gray-600">{signal.description}</div>
                  </div>
                </div>

                {signal.status === 'not_provided' && (
                  <Button size="sm" variant="outline">
                    Provide
                  </Button>
                )}

                {signal.status === 'verified' && (
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                )}

                {signal.status === 'pending' && (
                  <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements & Awards */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements & Awards
              </CardTitle>
              <CardDescription>
                Showcase your accomplishments and recognition
              </CardDescription>
            </div>
            <Button onClick={() => setShowAchievementModal(true)} size="sm">
              <Award className="h-4 w-4 mr-2" />
              Add Achievement
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.achievements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No achievements added yet</p>
              <p className="text-sm">Add your certifications, awards, and milestones</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {data.achievements.map(achievement => (
                <div key={achievement.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Award className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{achievement.title}</h4>
                      {achievement.verified && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="h-2 w-2 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                    <div className="text-xs text-gray-500">
                      {new Date(achievement.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Modal */}
      <Dialog open={showVerificationModal} onOpenChange={setShowVerificationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Verification Process</DialogTitle>
            <DialogDescription>
              Get verified to build trust with parents and increase your lead conversion rate
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Verification Benefits</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 3x more profile views</li>
                <li>• Higher search ranking</li>
                <li>• Increased parent trust</li>
                <li>• Priority customer support</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Required Documents</h4>
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Government-issued photo ID
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Coaching certifications
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Professional references
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowVerificationModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleStartVerification}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Starting...' : 'Start Verification'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Achievement Modal */}
      <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Achievement</DialogTitle>
            <DialogDescription>
              Add certifications, awards, or professional milestones
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="achievement-title">Title</Label>
              <Input
                id="achievement-title"
                placeholder="e.g. Level 4 Hockey Canada Certification"
              />
            </div>

            <div>
              <Label htmlFor="achievement-description">Description</Label>
              <Textarea
                id="achievement-description"
                placeholder="Brief description of this achievement..."
              />
            </div>

            <div>
              <Label htmlFor="achievement-date">Date Achieved</Label>
              <Input
                id="achievement-date"
                type="date"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowAchievementModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1">
                Add Achievement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}