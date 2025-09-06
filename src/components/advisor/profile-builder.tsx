'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Save,
  Upload,
  Image as ImageIcon,
  Video,
  FileText,
  User,
  MapPin,
  Award,
  Globe,
  Phone,
  Mail,
  Star,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  X,
  Eye,
  TrendingUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileBuilderProps {
  advisorId: string
  initialData?: AdvisorProfileData
  className?: string
}

interface AdvisorProfileData {
  name: string
  bio: string
  city: string
  province: string
  country: string
  phone?: string
  website?: string
  yearsExperience?: number
  specialties: string[]
  certifications: string[]
  levels: string[]
  headshot?: string
  portfolio: MediaItem[]
  socials: {
    linkedin?: string
    twitter?: string
    instagram?: string
  }
}

interface MediaItem {
  id: string
  type: 'image' | 'video' | 'document'
  url: string
  title: string
  description?: string
  featured: boolean
}

const HOCKEY_SPECIALTIES = [
  'Power Skating',
  'Skill Development', 
  'Shooting & Scoring',
  'Hockey IQ & Strategy',
  'Goaltending',
  'Defensive Play',
  'Leadership Development',
  'Mental Performance',
  'Nutrition & Fitness',
  'Strength & Conditioning',
  'College Recruiting',
  'Professional Development'
]

const COACHING_LEVELS = [
  'Youth (Ages 5-12)',
  'Junior (Ages 13-17)',
  'High School',
  'College/University',
  'Junior Hockey',
  'Professional',
  'Adult Recreation'
]

const CERTIFICATIONS = [
  'Hockey Canada Coach',
  'USA Hockey Certified',
  'NHLCA Certified',
  'Power Skating Instructor',
  'Goalie Coach Certified',
  'Strength & Conditioning',
  'Sports Psychology',
  'Nutrition Certified',
  'First Aid/CPR',
  'SafeSport Certified'
]

export function ProfileBuilder({ advisorId, initialData, className }: ProfileBuilderProps) {
  const [profileData, setProfileData] = useState<AdvisorProfileData>({
    name: '',
    bio: '',
    city: '',
    province: '',
    country: 'Canada',
    specialties: [],
    certifications: [],
    levels: [],
    portfolio: [],
    socials: {},
    ...initialData
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [completenessScore, setCompletenessScore] = useState(0)

  // Calculate profile completeness
  useEffect(() => {
    const calculateCompleteness = () => {
      let score = 0
      const maxScore = 100

      // Basic info (40 points)
      if (profileData.name.trim()) score += 8
      if (profileData.bio.trim() && profileData.bio.length >= 100) score += 10
      if (profileData.city.trim()) score += 4
      if (profileData.province.trim()) score += 4
      if (profileData.phone) score += 7
      if (profileData.website) score += 7

      // Professional info (30 points)
      if (profileData.yearsExperience && profileData.yearsExperience > 0) score += 8
      if (profileData.specialties.length >= 3) score += 10
      if (profileData.certifications.length >= 2) score += 7
      if (profileData.levels.length >= 1) score += 5

      // Media & Social (30 points)
      if (profileData.headshot) score += 10
      if (profileData.portfolio.length >= 2) score += 10
      const socialCount = Object.values(profileData.socials).filter(Boolean).length
      if (socialCount >= 1) score += 5
      if (socialCount >= 2) score += 5

      setCompletenessScore(Math.min(score, maxScore))
    }

    calculateCompleteness()
  }, [profileData])

  const handleInputChange = (field: keyof AdvisorProfileData, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    setError(null)
    setSuccessMessage(null)
  }

  const handleArrayAdd = (field: 'specialties' | 'certifications' | 'levels', value: string) => {
    if (!profileData[field].includes(value)) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...prev[field], value]
      }))
    }
  }

  const handleArrayRemove = (field: 'specialties' | 'certifications' | 'levels', value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }))
  }

  const handleSocialChange = (platform: keyof typeof profileData.socials, value: string) => {
    setProfileData(prev => ({
      ...prev,
      socials: { ...prev.socials, [platform]: value }
    }))
  }

  const validateProfile = (): string | null => {
    if (!profileData.name.trim()) return 'Name is required'
    if (!profileData.bio.trim()) return 'Bio is required'
    if (profileData.bio.length < 50) return 'Bio should be at least 50 characters'
    if (!profileData.city.trim()) return 'City is required'
    if (!profileData.province.trim()) return 'Province is required'
    if (profileData.specialties.length === 0) return 'At least one specialty is required'
    
    return null
  }

  const handleSave = async () => {
    const validationError = validateProfile()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/advisors/${advisorId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileData)
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      setSuccessMessage('Profile saved successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const getCompletenessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getCompletenessLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 80) return 'Great'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Work'
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Completeness */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Profile Builder</h2>
          <p className="text-gray-600">Create an engaging profile that attracts more leads</p>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Profile Completeness</span>
            <Badge className={cn("text-xs", getCompletenessColor(completenessScore))}>
              {getCompletenessLabel(completenessScore)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={completenessScore} className="w-32 h-2" />
            <span className="text-sm font-bold">{completenessScore}%</span>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Profile Builder Tabs */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="media">Media & Portfolio</TabsTrigger>
          <TabsTrigger value="social">Social & Contact</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Essential details that appear prominently on your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Smith"
                    value={profileData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="yearsExperience">Years of Experience</Label>
                  <Select 
                    value={profileData.yearsExperience?.toString()} 
                    onValueChange={(value) => handleInputChange('yearsExperience', parseInt(value))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select years" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i === 0 ? 'Less than 1 year' : `${i} year${i > 1 ? 's' : ''}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="bio">Bio/About Me *</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell parents about your background, coaching philosophy, and what makes you unique..."
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="mt-1 min-h-32"
                  rows={5}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {profileData.bio.length}/1000 characters • Minimum 50 characters recommended
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Toronto"
                    value={profileData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Input
                    id="province"
                    type="text"
                    placeholder="Ontario"
                    value={profileData.province}
                    onChange={(e) => handleInputChange('province', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={profileData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professional" className="space-y-6">
          {/* Specialties */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Specialties
              </CardTitle>
              <CardDescription>
                Select your areas of expertise (select at least 3)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {HOCKEY_SPECIALTIES.map(specialty => (
                  <label key={specialty} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.specialties.includes(specialty)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayAdd('specialties', specialty)
                        } else {
                          handleArrayRemove('specialties', specialty)
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{specialty}</span>
                  </label>
                ))}
              </div>

              {profileData.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profileData.specialties.map(specialty => (
                    <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleArrayRemove('specialties', specialty)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coaching Levels */}
          <Card>
            <CardHeader>
              <CardTitle>Coaching Levels</CardTitle>
              <CardDescription>
                What age groups and skill levels do you work with?
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {COACHING_LEVELS.map(level => (
                  <label key={level} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.levels.includes(level)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayAdd('levels', level)
                        } else {
                          handleArrayRemove('levels', level)
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Certifications & Credentials</CardTitle>
              <CardDescription>
                Add your professional certifications to build credibility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CERTIFICATIONS.map(cert => (
                  <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profileData.certifications.includes(cert)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleArrayAdd('certifications', cert)
                        } else {
                          handleArrayRemove('certifications', cert)
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{cert}</span>
                  </label>
                ))}
              </div>

              {profileData.certifications.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {profileData.certifications.map(cert => (
                    <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {cert}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                        onClick={() => handleArrayRemove('certifications', cert)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media & Portfolio Tab */}
        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Profile Photo & Media
              </CardTitle>
              <CardDescription>
                Upload photos and videos to showcase your expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Media
                </h3>
                <p className="text-gray-600 mb-4">
                  Add photos, videos, and documents to your profile
                </p>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Supports JPG, PNG, WebP, MP4, PDF • Max 10MB per file
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social & Contact Tab */}
        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Contact & Social Media
              </CardTitle>
              <CardDescription>
                Make it easy for parents to connect with you
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={profileData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourwebsite.com"
                    value={profileData.website || ''}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Social Media Profiles</h4>
                
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={profileData.socials.linkedin || ''}
                    onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input
                    id="twitter"
                    type="url"
                    placeholder="https://twitter.com/yourusername"
                    value={profileData.socials.twitter || ''}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    type="url"
                    placeholder="https://instagram.com/yourusername"
                    value={profileData.socials.instagram || ''}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">Changes are saved automatically</span>
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          size="lg"
        >
          {isSaving ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </div>
  )
}