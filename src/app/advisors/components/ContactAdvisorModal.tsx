'use client'

import { useState } from 'react'
import { useContactAdvisor } from '@/hooks/use-advisors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Mail, Phone, MapPin, Crown, Sparkles, AlertCircle, CheckCircle } from 'lucide-react'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'

interface ContactAdvisorModalProps {
  advisor: AdvisorWithSubscriptionPlan | null
  isOpen: boolean
  onClose: () => void
}

export function ContactAdvisorModal({ advisor, isOpen, onClose }: ContactAdvisorModalProps) {
  const [formData, setFormData] = useState({
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    playerName: '',
    playerAge: '',
    location: '',
    message: ''
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const contactMutation = useContactAdvisor()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!advisor) return

    try {
      await contactMutation.mutateAsync({
        advisorId: advisor.id,
        parentName: formData.parentName,
        parentEmail: formData.parentEmail,
        parentPhone: formData.parentPhone || undefined,
        playerName: formData.playerName || undefined,
        playerAge: formData.playerAge ? parseInt(formData.playerAge) : undefined,
        location: formData.location || undefined,
        message: formData.message || undefined
      })

      setIsSubmitted(true)
    } catch (error) {
      console.error('Failed to contact advisor:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      parentName: '',
      parentEmail: '',
      parentPhone: '',
      playerName: '',
      playerAge: '',
      location: '',
      message: ''
    })
    setIsSubmitted(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!advisor) return null

  const getSubscriptionBadge = () => {
    const plan = advisor.subscription?.plan
    if (!plan) return null
    
    switch (plan.name) {
      case 'premium':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Premium Partner
          </Badge>
        )
      case 'featured':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            Featured Advisor
          </Badge>
        )
      default:
        return <Badge variant="secondary">Verified Advisor</Badge>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {!isSubmitted ? (
          <>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl">Contact {advisor.name}</DialogTitle>
                  <DialogDescription className="mt-1">
                    Fill out this form to connect with {advisor.name}. They'll receive your information 
                    and contact you directly to discuss how they can help your player's development.
                  </DialogDescription>
                </div>
                {getSubscriptionBadge()}
              </div>
            </DialogHeader>

            {/* Advisor Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-ice-100 rounded-full flex items-center justify-center flex-shrink-0">
                  {advisor.imageUrl ? (
                    <img 
                      src={advisor.imageUrl} 
                      alt={advisor.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-ice-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{advisor.name}</h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{advisor.location}</span>
                    {advisor.yearsExperience && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{advisor.yearsExperience} years experience</span>
                      </>
                    )}
                  </div>
                  {advisor.rating && advisor.reviewCount > 0 && (
                    <div className="flex items-center mt-1 text-sm">
                      <span className="text-yellow-600">★ {advisor.rating.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({advisor.reviewCount} reviews)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Parent Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Parent/Guardian Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentName">Full Name *</Label>
                    <Input
                      id="parentName"
                      type="text"
                      required
                      value={formData.parentName}
                      onChange={(e) => handleInputChange('parentName', e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="parentEmail">Email Address *</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      required
                      value={formData.parentEmail}
                      onChange={(e) => handleInputChange('parentEmail', e.target.value)}
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="parentPhone">Phone Number</Label>
                    <Input
                      id="parentPhone"
                      type="tel"
                      value={formData.parentPhone}
                      onChange={(e) => handleInputChange('parentPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Your Location</Label>
                    <Input
                      id="location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, State"
                    />
                  </div>
                </div>
              </div>

              {/* Player Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Player Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="playerName">Player's Name</Label>
                    <Input
                      id="playerName"
                      type="text"
                      value={formData.playerName}
                      onChange={(e) => handleInputChange('playerName', e.target.value)}
                      placeholder="Player's full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="playerAge">Player's Age</Label>
                    <Input
                      id="playerAge"
                      type="number"
                      min="4"
                      max="25"
                      value={formData.playerAge}
                      onChange={(e) => handleInputChange('playerAge', e.target.value)}
                      placeholder="Age"
                    />
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Tell the advisor about your player's goals, current level, and what kind of help you're looking for..."
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  The more details you provide, the better the advisor can help you.
                </p>
              </div>

              {/* Error Display */}
              {contactMutation.error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {contactMutation.error instanceof Error 
                      ? contactMutation.error.message 
                      : 'Failed to send your message. Please try again.'
                    }
                  </AlertDescription>
                </Alert>
              )}

              {/* Privacy Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                      <Mail className="w-3 h-3 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-3 text-sm">
                    <p className="text-blue-800">
                      <strong>Privacy Protected:</strong> Your information will only be shared with {advisor.name}. 
                      They will contact you directly to discuss next steps. We never share your data with third parties.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={contactMutation.isPending}
                  className="flex-1"
                >
                  {contactMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    `Contact ${advisor.name}`
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Message Sent Successfully!
            </h3>
            
            <p className="text-gray-600 mb-6">
              Your message has been sent to {advisor.name}. They will review your information 
              and contact you directly within 24-48 hours to discuss how they can help.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li>• {advisor.name} will review your message and player information</li>
                <li>• They'll contact you via email or phone to schedule a consultation</li>
                <li>• You'll discuss your player's goals and how they can help</li>
                <li>• If it's a good fit, you can arrange ongoing advisory services</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Close
              </Button>
              <Button 
                onClick={() => window.open(`/advisors`, '_blank')} 
                className="flex-1"
              >
                Browse More Advisors
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}