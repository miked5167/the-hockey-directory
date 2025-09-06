'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Star, Award, Filter, X } from 'lucide-react'

export interface FilterState {
  location: string
  selectedSpecialties: string[]
  selectedCertifications: string[]
  minRating: number
  minExperience: number
  verifiedOnly: boolean
  featuredOnly: boolean
}

interface AdvisorFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
  initialFilters?: FilterState
  className?: string
}

const POPULAR_LOCATIONS = [
  'Boston, MA',
  'Toronto, ON', 
  'Minneapolis, MN',
  'Detroit, MI',
  'Chicago, IL',
  'New York, NY'
]

const SPECIALTIES = [
  'Skill Development',
  'College Recruitment', 
  'Mental Training',
  'Goaltending',
  'Power Skating',
  'Hockey IQ',
  'Leadership',
  'Nutrition',
  'Strength Training',
  'Youth Development'
]

const CERTIFICATIONS = [
  'USA Hockey Certified',
  'Hockey Canada Certified',
  'NCHC Specialist',
  'Former Professional',
  'NCAA Experience',
  'Junior Hockey',
  'Mental Performance',
  'Strength & Conditioning'
]

export function AdvisorFilters({ onFiltersChange, className }: AdvisorFiltersProps) {
  const [location, setLocation] = useState('')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [minExperience, setMinExperience] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(true)
  const [featuredOnly, setFeaturedOnly] = useState(false)

  // Create filter state object
  const filterState: FilterState = {
    location,
    selectedSpecialties,
    selectedCertifications,
    minRating,
    minExperience,
    verifiedOnly,
    featuredOnly
  }

  // Notify parent component of filter changes
  useEffect(() => {
    onFiltersChange?.(filterState)
  }, [location, selectedSpecialties, selectedCertifications, minRating, minExperience, verifiedOnly, featuredOnly])

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  const handleCertificationToggle = (cert: string) => {
    setSelectedCertifications(prev => 
      prev.includes(cert) 
        ? prev.filter(c => c !== cert)
        : [...prev, cert]
    )
  }

  const clearAllFilters = () => {
    setLocation('')
    setSelectedSpecialties([])
    setSelectedCertifications([])
    setMinRating(0)
    setMinExperience(0)
    setVerifiedOnly(true)
    setFeaturedOnly(false)
  }

  const activeFilterCount = 
    (location ? 1 : 0) +
    selectedSpecialties.length +
    selectedCertifications.length +
    (minRating > 0 ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    (featuredOnly ? 1 : 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Location */}
        <div>
          <label className="flex items-center text-sm font-medium mb-3 text-gray-700">
            <MapPin className="h-4 w-4 mr-2 text-blue-600" />
            Location
          </label>
          <Input
            placeholder="Enter city, province, or state..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mb-3"
          />
          <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-2">Popular locations:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_LOCATIONS.map(loc => (
                <Button
                  key={loc}
                  variant={location === loc ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocation(location === loc ? '' : loc)}
                  className={`text-xs transition-all ${
                    location === loc 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {loc}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <label className="flex items-center text-sm font-medium mb-3 text-gray-700">
            <Star className="h-4 w-4 mr-2 text-blue-600" />
            Minimum Rating
          </label>
          <div className="flex flex-wrap gap-2">
            {[4.0, 4.5, 4.8].map(rating => (
              <Button
                key={rating}
                variant={minRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                className={`transition-all ${
                  minRating === rating 
                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                    : 'hover:bg-amber-50 hover:border-amber-300'
                }`}
              >
                {rating}+ ⭐
              </Button>
            ))}
            {minRating > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMinRating(0)}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Experience */}
        <div>
          <label className="flex items-center text-sm font-medium mb-3 text-gray-700">
            <Award className="h-4 w-4 mr-2 text-blue-600" />
            Minimum Experience
          </label>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20].map(years => (
              <Button
                key={years}
                variant={minExperience === years ? "default" : "outline"}
                size="sm"
                onClick={() => setMinExperience(minExperience === years ? 0 : years)}
                className={`transition-all ${
                  minExperience === years 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'hover:bg-green-50 hover:border-green-300'
                }`}
              >
                {years}+ years
              </Button>
            ))}
            {minExperience > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMinExperience(0)}
                className="text-gray-400 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Advisor Type */}
        <div>
          <label className="text-sm font-medium mb-3 block">Advisor Type</label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={verifiedOnly}
                onCheckedChange={setVerifiedOnly}
              />
              <label htmlFor="verified" className="text-sm">Verified advisors only</label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={featuredOnly}
                onCheckedChange={setFeaturedOnly}
              />
              <label htmlFor="featured" className="text-sm">Featured advisors only</label>
            </div>
          </div>
        </div>

        {/* Specialties */}
        <div>
          <label className="flex items-center text-sm font-medium mb-3">
            <Award className="h-4 w-4 mr-2" />
            Specialties
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {SPECIALTIES.map(specialty => (
              <div key={specialty} className="flex items-center space-x-2">
                <Checkbox
                  id={`specialty-${specialty}`}
                  checked={selectedSpecialties.includes(specialty)}
                  onCheckedChange={() => handleSpecialtyToggle(specialty)}
                />
                <label 
                  htmlFor={`specialty-${specialty}`} 
                  className="text-sm cursor-pointer"
                >
                  {specialty}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div>
          <label className="text-sm font-medium mb-3 block">Certifications</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {CERTIFICATIONS.map(cert => (
              <div key={cert} className="flex items-center space-x-2">
                <Checkbox
                  id={`cert-${cert}`}
                  checked={selectedCertifications.includes(cert)}
                  onCheckedChange={() => handleCertificationToggle(cert)}
                />
                <label 
                  htmlFor={`cert-${cert}`} 
                  className="text-sm cursor-pointer"
                >
                  {cert}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Filters Button */}
        <Button className="w-full">
          Apply Filters
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
      </CardContent>
    </Card>
  )
}