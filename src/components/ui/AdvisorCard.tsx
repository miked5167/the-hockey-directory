import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, MapPin, Star, Crown, Sparkles, Phone, Mail } from 'lucide-react'
import { parseJsonField } from '@/lib/business'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'
import Link from 'next/link'

interface AdvisorCardProps {
  advisor: AdvisorWithSubscriptionPlan
  showContactButton?: boolean
  onContact?: () => void
}

export function AdvisorCard({ advisor, showContactButton = true, onContact }: AdvisorCardProps) {
  const specialties = parseJsonField<string>(advisor.specialties)
  const certifications = parseJsonField<string>(advisor.certifications)
  const subscriptionPlan = advisor.subscription?.plan
  
  // Determine card styling based on subscription tier
  const getCardClassName = () => {
    if (!subscriptionPlan) return ''
    
    switch (subscriptionPlan.name) {
      case 'premium':
        return 'advisor-premium border-purple-200'
      case 'featured':
        return 'advisor-featured border-amber-200'
      default:
        return ''
    }
  }

  // Get subscription badge
  const getSubscriptionBadge = () => {
    if (!subscriptionPlan) return null
    
    switch (subscriptionPlan.name) {
      case 'premium':
        return (
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )
      case 'featured':
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-800">
            <Sparkles className="w-3 h-3 mr-1" />
            Featured
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${getCardClassName()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-ice-100 rounded-full flex items-center justify-center">
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
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900">{advisor.name}</h3>
                {advisor.verified && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{advisor.location}</span>
              </div>
            </div>
          </div>
          {getSubscriptionBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Rating and Experience */}
          <div className="flex items-center justify-between">
            {advisor.rating && advisor.reviewCount > 0 ? (
              <div className="flex items-center">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-medium">{advisor.rating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm ml-1">({advisor.reviewCount} reviews)</span>
              </div>
            ) : (
              <span className="text-gray-500 text-sm">New advisor</span>
            )}
            
            {advisor.yearsExperience && (
              <span className="text-sm text-gray-600">
                {advisor.yearsExperience} years experience
              </span>
            )}
          </div>

          {/* Bio */}
          {advisor.bio && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {advisor.bio}
            </p>
          )}

          {/* Specialties */}
          {specialties.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Specialties</h4>
              <div className="flex flex-wrap gap-1">
                {specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {specialty}
                  </Badge>
                ))}
                {specialties.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{specialties.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Certifications</h4>
              <div className="flex flex-wrap gap-1">
                {certifications.slice(0, 2).map((cert, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cert}
                  </Badge>
                ))}
                {certifications.length > 2 && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    +{certifications.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4">
              {advisor.phone && (
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="h-4 w-4 mr-1" />
                  <span>Available</span>
                </div>
              )}
              {advisor.email && (
                <div className="flex items-center text-sm text-gray-500">
                  <Mail className="h-4 w-4 mr-1" />
                  <span>Email</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href={`/advisors/${advisor.id}`}>
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
              </Link>
              {showContactButton && (
                <Button size="sm" onClick={onContact}>
                  Contact
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}