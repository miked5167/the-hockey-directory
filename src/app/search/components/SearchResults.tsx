'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAdvisorSearch } from '@/hooks/use-advisors'
import { AdvisorCard } from '@/components/ui/AdvisorCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ContactAdvisorModal } from '@/app/advisors/components/ContactAdvisorModal'
import { 
  Search, Filter, SortAsc, Crown, Sparkles, Star, 
  MapPin, Award, Users, AlertCircle
} from 'lucide-react'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'

type EntityType = 'all' | 'advisors' | 'coaches' | 'tournaments' | 'prep-schools' | 'arenas'
type SortOption = 'relevance' | 'rating' | 'experience' | 'name'

export function SearchResults() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams?.get('q') || ''
  const initialType = (searchParams?.get('type') as EntityType) || 'advisors'

  const [query, setQuery] = useState(initialQuery)
  const [entityType, setEntityType] = useState<EntityType>(initialType)
  const [sortBy, setSortBy] = useState<SortOption>('relevance')
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorWithSubscriptionPlan | null>(null)

  // For now, focusing on advisors as requested
  const { 
    data: advisors = [], 
    isLoading, 
    error 
  } = useAdvisorSearch(query, {
    location: searchParams?.get('location') || undefined,
    minRating: searchParams?.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined
  })

  // Sort advisors based on business logic and user preference
  const sortedAdvisors = [...advisors].sort((a, b) => {
    switch (sortBy) {
      case 'relevance':
        // Business logic: Priority by subscription tier, then rating
        const aPriority = a.subscription?.plan.priority || 0
        const bPriority = b.subscription?.plan.priority || 0
        if (aPriority !== bPriority) return bPriority - aPriority
        return (b.rating || 0) - (a.rating || 0)
        
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
        
      case 'experience':
        return (b.yearsExperience || 0) - (a.yearsExperience || 0)
        
      case 'name':
        return a.name.localeCompare(b.name)
        
      default:
        return 0
    }
  })

  // Get featured advisors count for display
  const featuredCount = advisors.filter(a => a.subscription?.plan.featured).length
  const premiumCount = advisors.filter(a => a.subscription?.plan.name === 'premium').length

  const handleContactAdvisor = (advisor: AdvisorWithSubscriptionPlan) => {
    setSelectedAdvisor(advisor)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would update the URL and trigger a new search
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(query)}&type=${entityType}`)
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
        <p className="text-gray-500 mb-4">Failed to load search results. Please try again.</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for advisors, coaches, locations, specialties..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 text-lg h-12"
            />
          </div>

          {/* Entity Type Tabs - For now just showing advisors */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                entityType === 'advisors'
                  ? 'bg-white text-ice-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setEntityType('advisors')}
            >
              <Users className="h-4 w-4 inline mr-2" />
              Advisors ({advisors.length})
            </button>
            {/* Other entity types would go here */}
          </div>
        </form>

        {/* Results Summary */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>
              {isLoading ? 'Loading...' : `${sortedAdvisors.length} advisor${sortedAdvisors.length !== 1 ? 's' : ''} found`}
              {query && ` for "${query}"`}
            </span>
            
            {/* Business Logic Indicators */}
            {premiumCount > 0 && (
              <div className="flex items-center gap-1">
                <Crown className="h-4 w-4 text-purple-600" />
                <span>{premiumCount} Premium</span>
              </div>
            )}
            
            {featuredCount > 0 && (
              <div className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>{featuredCount} Featured</span>
              </div>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <SortAsc className="h-4 w-4 text-gray-400" />
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              <option value="relevance">Best Match</option>
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experience</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Logic Notice */}
      {featuredCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start">
            <Sparkles className="h-5 w-5 text-amber-600 mr-3 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-800 font-medium mb-1">Featured Advisors</p>
              <p className="text-amber-700">
                Featured and Premium advisors appear first in search results and offer enhanced services 
                with faster response times and priority support.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 rounded w-20"></div>
                <div className="h-6 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : sortedAdvisors.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-500 mb-6">
            {query 
              ? `No advisors found matching "${query}". Try adjusting your search terms or filters.`
              : 'Try entering a search term to find advisors.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => setQuery('')}>
              Clear Search
            </Button>
            <Button onClick={() => setQuery('hockey advisor')}>
              Browse All Advisors
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {sortedAdvisors.map((advisor) => (
            <AdvisorCard
              key={advisor.id}
              advisor={advisor}
              onContact={() => handleContactAdvisor(advisor)}
            />
          ))}
        </div>
      )}

      {/* Load More Button - For pagination in future */}
      {sortedAdvisors.length >= 20 && (
        <div className="text-center">
          <Button variant="outline" size="lg">
            Load More Results
          </Button>
        </div>
      )}

      {/* Contact Modal */}
      <ContactAdvisorModal
        advisor={selectedAdvisor}
        isOpen={!!selectedAdvisor}
        onClose={() => setSelectedAdvisor(null)}
      />
    </div>
  )
}