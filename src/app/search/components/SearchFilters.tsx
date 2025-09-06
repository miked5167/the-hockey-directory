'use client'

import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { MapPin, Star, Award, Filter, Crown, Sparkles } from 'lucide-react'

const POPULAR_LOCATIONS = [
  'Boston, MA',
  'Toronto, ON', 
  'Minneapolis, MN',
  'Detroit, MI',
  'Chicago, IL',
  'New York, NY',
  'Montreal, QC',
  'Vancouver, BC'
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
  'Youth Development',
  'Elite Training',
  'Scholarship Guidance'
]

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize state from URL parameters
  const [location, setLocation] = useState(searchParams?.get('location') || '')
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(
    searchParams?.get('specialties')?.split(',').filter(Boolean) || []
  )
  const [minRating, setMinRating] = useState(
    searchParams?.get('minRating') ? parseFloat(searchParams.get('minRating')!) : 0
  )
  const [minExperience, setMinExperience] = useState(
    searchParams?.get('minExperience') ? parseInt(searchParams.get('minExperience')!) : 0
  )
  const [verifiedOnly, setVerifiedOnly] = useState(
    searchParams?.get('verified') === 'true'
  )
  const [featuredOnly, setFeaturedOnly] = useState(
    searchParams?.get('featured') === 'true'
  )
  const [premiumOnly, setPremiumOnly] = useState(
    searchParams?.get('premium') === 'true'
  )

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty) 
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams?.toString())
    
    // Update URL parameters
    if (location) params.set('location', location)
    else params.delete('location')
    
    if (selectedSpecialties.length > 0) params.set('specialties', selectedSpecialties.join(','))
    else params.delete('specialties')
    
    if (minRating > 0) params.set('minRating', minRating.toString())
    else params.delete('minRating')
    
    if (minExperience > 0) params.set('minExperience', minExperience.toString())
    else params.delete('minExperience')
    
    if (verifiedOnly) params.set('verified', 'true')
    else params.delete('verified')
    
    if (featuredOnly) params.set('featured', 'true')
    else params.delete('featured')
    
    if (premiumOnly) params.set('premium', 'true')
    else params.delete('premium')

    router.push(`/search?${params.toString()}`)
  }

  const clearAllFilters = () => {
    setLocation('')
    setSelectedSpecialties([])
    setMinRating(0)
    setMinExperience(0)
    setVerifiedOnly(false)
    setFeaturedOnly(false)
    setPremiumOnly(false)
    router.push('/search')
  }

  const activeFilterCount = 
    (location ? 1 : 0) +
    selectedSpecialties.length +
    (minRating > 0 ? 1 : 0) +
    (minExperience > 0 ? 1 : 0) +
    (verifiedOnly ? 1 : 0) +
    (featuredOnly ? 1 : 0) +
    (premiumOnly ? 1 : 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Search Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Business Tier Filters */}
        <div>
          <label className="text-sm font-medium mb-3 block">Subscription Tier</label>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="premium"
                checked={premiumOnly}
                onCheckedChange={setPremiumOnly}
              />
              <label htmlFor="premium" className="text-sm flex items-center cursor-pointer">
                <Crown className="h-4 w-4 text-purple-600 mr-1" />
                Premium Partners Only
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={featuredOnly}
                onCheckedChange={setFeaturedOnly}
              />
              <label htmlFor="featured" className="text-sm flex items-center cursor-pointer">
                <Sparkles className="h-4 w-4 text-amber-600 mr-1" />
                Featured Advisors Only
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={verifiedOnly}
                onCheckedChange={setVerifiedOnly}
              />
              <label htmlFor="verified" className="text-sm cursor-pointer">
                Verified advisors only
              </label>
            </div>
          </div>
          
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Tip:</strong> Premium and Featured advisors offer faster response times 
              and enhanced services.
            </p>
          </div>
        </div>

        <Separator />

        {/* Location */}
        <div>
          <label className="flex items-center text-sm font-medium mb-3">
            <MapPin className="h-4 w-4 mr-2" />
            Location
          </label>
          <Input
            placeholder="Enter city or state..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mb-3"
          />
          <div className="grid grid-cols-1 gap-2">
            {POPULAR_LOCATIONS.map(loc => (
              <Button
                key={loc}
                variant={location === loc ? "default" : "outline"}
                size="sm"
                onClick={() => setLocation(location === loc ? '' : loc)}
                className="text-xs justify-start"
              >
                {loc}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <label className="flex items-center text-sm font-medium mb-3">
            <Star className="h-4 w-4 mr-2" />
            Minimum Rating
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[4.0, 4.5, 4.8, 5.0].map(rating => (
              <Button
                key={rating}
                variant={minRating === rating ? "default" : "outline"}
                size="sm"
                onClick={() => setMinRating(minRating === rating ? 0 : rating)}
                className="text-xs"
              >
                {rating}+ ⭐
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Experience */}
        <div>
          <label className="text-sm font-medium mb-3 block">
            Minimum Experience
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[5, 10, 15, 20].map(years => (
              <Button
                key={years}
                variant={minExperience === years ? "default" : "outline"}
                size="sm"
                onClick={() => setMinExperience(minExperience === years ? 0 : years)}
                className="text-xs"
              >
                {years}+ years
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Specialties */}
        <div>
          <label className="flex items-center text-sm font-medium mb-3">
            <Award className="h-4 w-4 mr-2" />
            Specialties ({selectedSpecialties.length} selected)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
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

        {/* Apply Filters Button */}
        <Button onClick={applyFilters} className="w-full">
          Apply Filters
          {activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
      </CardContent>
    </Card>
  )
}