'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ContactAdvisorModal } from '../../components/ContactAdvisorModal'
import { AdvisorReviews } from './AdvisorReviews'
import { 
  User, MapPin, Star, Crown, Sparkles, Phone, Mail, Globe, 
  Calendar, Award, TrendingUp, Users, CheckCircle 
} from 'lucide-react'
import { parseJsonField } from '@/lib/business'
import type { Advisor, AdvisorSubscription, SubscriptionPlan, Review } from '@prisma/client'

type AdvisorWithDetails = Advisor & {
  subscription?: (AdvisorSubscription & { plan: SubscriptionPlan }) | null
  reviews: Review[]
  leads: { id: string }[]
}

interface AdvisorProfileProps {
  advisor: AdvisorWithDetails
}

export function AdvisorProfile({ advisor }: AdvisorProfileProps) {
  const [showContactModal, setShowContactModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview')

  const specialties = parseJsonField<string>(advisor.specialties)
  const certifications = parseJsonField<string>(advisor.certifications)
  const subscriptionPlan = advisor.subscription?.plan
  const convertedLeads = advisor.leads?.length || 0

  // Get subscription styling
  const getProfileBadge = () => {
    if (!subscriptionPlan) return null
    
    switch (subscriptionPlan.name) {
      case 'premium':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <Crown className="w-4 h-4 mr-1" />
            Premium Partner
          </Badge>
        )
      case 'featured':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white">
            <Sparkles className="w-4 h-4 mr-1" />
            Featured Advisor
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            Verified Advisor
          </Badge>
        )
    }
  }

  const getHeaderClass = () => {
    if (!subscriptionPlan) return 'bg-white'
    
    switch (subscriptionPlan.name) {
      case 'premium':
        return 'bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 border-purple-200'
      case 'featured':
        return 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-amber-200'
      default:
        return 'bg-white'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <section className={`${getHeaderClass()} border-b`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="flex items-start gap-6">
              {/* Profile Image */}
              <div className="w-24 h-24 bg-ice-100 rounded-full flex items-center justify-center flex-shrink-0 ring-4 ring-white shadow-lg">
                {advisor.imageUrl ? (
                  <img 
                    src={advisor.imageUrl} 
                    alt={advisor.name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-ice-600" />
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{advisor.name}</h1>
                  {advisor.verified && (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                </div>
                
                {getProfileBadge()}

                <div className="flex items-center text-gray-600 mt-3 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{advisor.location}</span>
                </div>

                {/* Rating and Experience */}
                <div className="flex items-center gap-6">
                  {advisor.rating && advisor.reviewCount > 0 ? (
                    <div className="flex items-center">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                      <span className="font-semibold text-lg">{advisor.rating.toFixed(1)}</span>
                      <span className="text-gray-600 ml-1">({advisor.reviewCount} reviews)</span>
                    </div>
                  ) : (
                    <span className="text-gray-600">New advisor</span>
                  )}

                  {advisor.yearsExperience && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{advisor.yearsExperience} years experience</span>
                    </div>
                  )}

                  {convertedLeads > 0 && (
                    <div className="flex items-center text-gray-600">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{convertedLeads} successful placements</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <div className="lg:flex-shrink-0">
              <Button 
                size="lg" 
                onClick={() => setShowContactModal(true)}
                className="w-full lg:w-auto"
              >
                Contact {advisor.name}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-ice-500 text-ice-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reviews'
                      ? 'border-ice-500 text-ice-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reviews ({advisor.reviewCount})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* About */}
                {advisor.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle>About {advisor.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {advisor.bio}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Specialties */}
                {specialties.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Award className="h-5 w-5 mr-2" />
                        Specialties
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {specialties.map((specialty, index) => (
                          <div key={index} className="flex items-center p-3 bg-ice-50 rounded-lg">
                            <TrendingUp className="h-4 w-4 text-ice-600 mr-2" />
                            <span className="font-medium">{specialty}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Certifications & Credentials</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {certifications.map((cert, index) => (
                          <div key={index} className="flex items-center p-2">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-3" />
                            <span>{cert}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <AdvisorReviews advisorId={advisor.id} reviews={advisor.reviews} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {advisor.phone && (
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Phone available</span>
                  </div>
                )}
                
                {advisor.email && (
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-sm text-gray-600">Email available</span>
                  </div>
                )}

                {advisor.website && (
                  <div className="flex items-center">
                    <Globe className="h-4 w-4 text-gray-400 mr-3" />
                    <a 
                      href={advisor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-ice-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}

                <Separator />

                <Button 
                  className="w-full" 
                  onClick={() => setShowContactModal(true)}
                >
                  Get In Touch
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Experience</span>
                  <span className="font-medium">
                    {advisor.yearsExperience || 'Not specified'} 
                    {advisor.yearsExperience ? ' years' : ''}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Reviews</span>
                  <span className="font-medium">{advisor.reviewCount}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rating</span>
                  <span className="font-medium">
                    {advisor.rating ? `${advisor.rating.toFixed(1)} / 5.0` : 'No ratings yet'}
                  </span>
                </div>

                {convertedLeads > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-medium text-green-600">High</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Modal */}
      <ContactAdvisorModal
        advisor={advisor}
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  )
}