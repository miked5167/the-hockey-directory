'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Send, CheckCircle, AlertTriangle, User, MapPin, Calendar, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactAdvisorFormProps {
  advisorId: string
  advisorName: string
  className?: string
  onSuccess?: () => void
  onClose?: () => void
}

interface FormData {
  parentName: string
  parentEmail: string
  parentPhone: string
  playerName: string
  playerAge: string
  location: string
  specialties: string[]
  message: string
}

const HOCKEY_SPECIALTIES = [
  'Skill Development',
  'Power Skating', 
  'Shooting & Scoring',
  'Hockey IQ',
  'Goaltending',
  'Defensive Play',
  'Leadership',
  'Mental Game',
  'Nutrition',
  'Strength & Conditioning'
]

export function ContactAdvisorForm({ 
  advisorId, 
  advisorName, 
  className,
  onSuccess,
  onClose 
}: ContactAdvisorFormProps) {
  const [formData, setFormData] = useState<FormData>({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    playerName: '',
    playerAge: '',
    location: '',
    specialties: [],
    message: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }))
  }

  const validateForm = (): string | null => {
    if (!formData.parentName.trim()) return 'Parent/Guardian name is required'
    if (!formData.parentEmail.trim()) return 'Email address is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.parentEmail)) return 'Please enter a valid email address'
    if (!formData.message.trim()) return 'Please include a message describing what you\'re looking for'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          advisorId,
          parentName: formData.parentName,
          parentEmail: formData.parentEmail,
          parentPhone: formData.parentPhone || undefined,
          playerName: formData.playerName || undefined,
          playerAge: formData.playerAge ? parseInt(formData.playerAge) : undefined,
          location: formData.location || undefined,
          specialties: formData.specialties,
          message: formData.message,
          source: 'website'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message')
      }

      setIsSuccess(true)
      onSuccess?.()
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <Card className={cn("w-full max-w-lg", className)}>
        <CardContent className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Message Sent Successfully!
          </h3>
          
          <p className="text-gray-600 mb-6">
            Your message has been sent to {advisorName}. They typically respond within 24 hours.
          </p>

          <div className="space-y-2 text-sm text-gray-600 mb-6">
            <p>✓ Check your email for a confirmation</p>
            <p>✓ {advisorName} will contact you directly</p>
            <p>✓ Response time: Usually within 24 hours</p>
          </div>

          {onClose && (
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Contact {advisorName}
        </CardTitle>
        <CardDescription>
          Fill out this form to get connected with {advisorName}. All fields marked with * are required.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Parent Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              Parent/Guardian Information
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="parentName">Your Name *</Label>
                <Input
                  id="parentName"
                  type="text"
                  placeholder="John Smith"
                  value={formData.parentName}
                  onChange={(e) => handleInputChange('parentName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="parentEmail">Email Address *</Label>
                <Input
                  id="parentEmail"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.parentEmail}
                  onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="parentPhone">Phone Number (Optional)</Label>
                <Input
                  id="parentPhone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.parentPhone}
                  onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Player Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="h-4 w-4" />
              Player Information
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="playerName">Player Name (Optional)</Label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Alex Smith"
                  value={formData.playerName}
                  onChange={(e) => handleInputChange('playerName', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="playerAge">Age (Optional)</Label>
                <Select value={formData.playerAge} onValueChange={(value) => handleInputChange('playerAge', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select age" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 18 }, (_, i) => i + 5).map(age => (
                      <SelectItem key={age} value={age.toString()}>
                        {age} years old
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  type="text"
                  placeholder="Toronto, ON"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Areas of Interest */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Areas of Interest (Optional)</Label>
            <div className="grid grid-cols-2 gap-2">
              {HOCKEY_SPECIALTIES.map(specialty => (
                <label
                  key={specialty}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={() => handleSpecialtyToggle(specialty)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">{specialty}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Tell us about your goals and what you're looking for in a hockey advisor..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              className="mt-1 min-h-24"
              rows={4}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.message.length}/500 characters
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            {onClose && (
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            )}
            
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className={cn("flex-1", !onClose && "w-full")}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Message
                </div>
              )}
            </Button>
          </div>

          {/* Privacy Note */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Your information will only be shared with {advisorName} and will not be used for marketing purposes.
          </div>
        </form>
      </CardContent>
    </Card>
  )
}