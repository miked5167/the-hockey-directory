'use client'

import { useState } from 'react'
import { useAdvisors } from '@/hooks/use-advisors'
import { AdvisorCard } from '@/components/ui/AdvisorCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ContactAdvisorModal } from './ContactAdvisorModal'
import { Search, Filter, SortAsc } from 'lucide-react'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'

export function AdvisorDirectory() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorWithSubscriptionPlan | null>(null)
  const [sortBy, setSortBy] = useState<'priority' | 'rating' | 'name' | 'experience'>('priority')
  const [showFilters, setShowFilters] = useState(false)

  const { data: advisors = [], isLoading, error } = useAdvisors({
    verified: true
  })

  // Filter advisors based on search query
  const filteredAdvisors = advisors.filter(advisor => {
    if (!searchQuery) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      advisor.name.toLowerCase().includes(searchLower) ||
      advisor.location.toLowerCase().includes(searchLower) ||
      advisor.bio?.toLowerCase().includes(searchLower) ||
      (advisor.specialties && JSON.parse(advisor.specialties).some((s: string) => 
        s.toLowerCase().includes(searchLower)
      ))
    )
  })

  // Sort advisors
  const sortedAdvisors = [...filteredAdvisors].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        // Business logic: subscription priority first, then rating
        const aPriority = a.subscription?.plan.priority || 0
        const bPriority = b.subscription?.plan.priority || 0
        if (aPriority !== bPriority) return bPriority - aPriority
        return (b.rating || 0) - (a.rating || 0)
        
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
        
      case 'name':
        return a.name.localeCompare(b.name)
        
      case 'experience':
        return (b.yearsExperience || 0) - (a.yearsExperience || 0)
        
      default:
        return 0
    }
  })

  const handleContactAdvisor = (advisor: AdvisorWithSubscriptionPlan) => {
    setSelectedAdvisor(advisor)
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-gray-200 rounded mb-4"></div>
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load advisors. Please try again.</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search advisors by name, location, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="priority">Featured First</option>
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experience</option>
              <option value="name">Name A-Z</option>
            </select>
            
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>
        
        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {sortedAdvisors.length} of {advisors.length} advisors
            {searchQuery && ` for "${searchQuery}"`}
          </span>
          
          {/* Featured Badge Legend */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div>
              <span>Premium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div>
              <span>Featured</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advisors Grid */}
      {sortedAdvisors.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery 
              ? `No advisors found matching "${searchQuery}"`
              : 'No advisors available'
            }
          </p>
          {searchQuery && (
            <Button 
              variant="outline" 
              onClick={() => setSearchQuery('')}
              className="mt-4"
            >
              Clear Search
            </Button>
          )}
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

      {/* Contact Modal */}
      <ContactAdvisorModal
        advisor={selectedAdvisor}
        isOpen={!!selectedAdvisor}
        onClose={() => setSelectedAdvisor(null)}
      />
    </div>
  )
}