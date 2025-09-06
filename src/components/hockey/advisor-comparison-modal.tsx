'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { VerificationBadge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { X, Star, MapPin, Clock, Award, User, Phone, Mail } from 'lucide-react'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'

interface AdvisorComparisonModalProps {
  advisors: AdvisorWithSubscriptionPlan[]
  isOpen: boolean
  onClose: () => void
  onRemoveAdvisor?: (advisorId: string) => void
}

const StarRating = ({ rating, count }: { rating: number; count?: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          )}
        />
      ))}
    </div>
    {count && (
      <span className="text-sm text-muted-foreground">({count})</span>
    )}
  </div>
)

const ComparisonField = ({ 
  label, 
  icon, 
  children 
}: { 
  label: string
  icon: React.ReactNode
  children: React.ReactNode 
}) => (
  <div className="py-3 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
      {icon}
      {label}
    </div>
    <div className="text-sm text-gray-900">
      {children}
    </div>
  </div>
)

export function AdvisorComparisonModal({ 
  advisors, 
  isOpen, 
  onClose, 
  onRemoveAdvisor 
}: AdvisorComparisonModalProps) {
  if (advisors.length === 0) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Compare Advisors ({advisors.length})
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advisors.map((advisor) => {
            const averageRating = advisor.rating || 0
            const specialties = advisor.specialties ? JSON.parse(advisor.specialties) : []
            
            return (
              <div 
                key={advisor.id}
                className="bg-white border border-gray-200 rounded-lg p-6 relative hover:shadow-md transition-shadow"
              >
                {/* Remove button */}
                {onRemoveAdvisor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveAdvisor(advisor.id)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <Image
                      src={advisor.headshotUrl || "/placeholder-avatar.jpg"}
                      alt={advisor.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="48px"
                    />
                    {advisor.isVerified && (
                      <div className="absolute -bottom-1 -right-1">
                        <VerificationBadge />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {advisor.name}
                    </h3>
                    {averageRating > 0 && (
                      <StarRating rating={Math.round(averageRating)} />
                    )}
                  </div>
                </div>

                {/* Comparison Fields */}
                <div className="space-y-0">
                  <ComparisonField 
                    label="Location" 
                    icon={<MapPin className="h-4 w-4" />}
                  >
                    {advisor.location || 'Not specified'}
                  </ComparisonField>

                  <ComparisonField 
                    label="Experience" 
                    icon={<User className="h-4 w-4" />}
                  >
                    {advisor.yearsExperience ? `${advisor.yearsExperience} years` : 'Not specified'}
                  </ComparisonField>

                  <ComparisonField 
                    label="Specialties" 
                    icon={<Award className="h-4 w-4" />}
                  >
                    {specialties.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {specialties.slice(0, 3).map((specialty: string) => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty.trim()}
                          </Badge>
                        ))}
                        {specialties.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{specialties.length - 3} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      'Not specified'
                    )}
                  </ComparisonField>

                  {advisor.subscription?.plan && (
                    <ComparisonField 
                      label="Plan Type" 
                      icon={<Star className="h-4 w-4" />}
                    >
                      <Badge 
                        className={cn(
                          advisor.subscription.plan.name === 'Premium' 
                            ? 'bg-purple-100 text-purple-700'
                            : advisor.subscription.plan.name === 'Featured'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700'
                        )}
                      >
                        {advisor.subscription.plan.name}
                      </Badge>
                    </ComparisonField>
                  )}

                  {advisor.bio && (
                    <ComparisonField 
                      label="About" 
                      icon={<User className="h-4 w-4" />}
                    >
                      <p className="text-sm line-clamp-3">
                        {advisor.bio}
                      </p>
                    </ComparisonField>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-6 pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Profile
                  </Button>
                  <Button size="sm" className="flex-1">
                    Contact
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Clear all button */}
        {advisors.length > 1 && onRemoveAdvisor && (
          <div className="flex justify-center pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => advisors.forEach(advisor => onRemoveAdvisor(advisor.id))}
            >
              Clear All Comparisons
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}