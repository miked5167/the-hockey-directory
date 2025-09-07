'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAdvisors } from '@/hooks/use-advisors'
import { useOptimizedAdvisorSearch } from '@/hooks/use-optimized-search'
import { AdvisorCard } from '@/components/hockey/advisor-card'
import { SearchInput } from '@/components/hockey/search-input'
import { Grid } from '@/components/ui/grid'
import { Button } from '@/components/ui/button'
import { ContactAdvisorModal } from './ContactAdvisorModal'
import { Filter, SortAsc, GitCompare, TrendingUp } from 'lucide-react'
import { AdvisorComparisonModal } from '@/components/hockey/advisor-comparison-modal'
import { useAdvisorComparison } from '@/hooks/use-advisor-comparison'
import { ErrorBoundary } from '@/components/error-boundary'
import { DirectoryGridSkeleton, SearchSkeleton, ProgressiveLoading } from '@/components/ui/loading-states'
import { FadeIn, StaggeredChildren, HoverLift, CountUp } from '@/components/ui/animations'
import { useAnalytics, usePageTracking, useSearchTracking, useInteractionTracking, HockeyDirectoryEvents } from '@/lib/analytics'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'
import type { FilterState } from './AdvisorFilters'

interface AdvisorDirectoryProps {
  filters?: FilterState
  initialSearchQuery?: string
  onSearchQueryChange?: (query: string) => void
}

export function AdvisorDirectory({ 
  filters: externalFilters,
  initialSearchQuery = '',
  onSearchQueryChange
}: AdvisorDirectoryProps) {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [selectedAdvisor, setSelectedAdvisor] = useState<AdvisorWithSubscriptionPlan | null>(null)
  const [sortBy, setSortBy] = useState<'priority' | 'rating' | 'name' | 'experience'>('priority')
  const [showFilters, setShowFilters] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  // Analytics hooks
  usePageTracking()
  const { track } = useAnalytics()
  const { trackSearch, trackFilter } = useSearchTracking()
  const { trackAdvisorView } = useInteractionTracking()
  
  // Comparison functionality
  const {
    comparisonList,
    comparisonCount,
    isComparisonOpen,
    openComparison,
    closeComparison,
    removeFromComparison
  } = useAdvisorComparison()
  
  // Use external filters or default internal filters
  const filters = externalFilters || {
    location: '',
    selectedSpecialties: [],
    selectedCertifications: [],
    minRating: 0,
    minExperience: 0,
    verifiedOnly: true,
    featuredOnly: false
  }

  // Set search query from URL parameters on component mount
  useEffect(() => {
    const searchParam = searchParams.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
      onSearchQueryChange?.(searchParam)
    }
    
    // Load recent searches from localStorage
    const saved = localStorage.getItem('hockey-directory-recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [searchParams, onSearchQueryChange])

  // Update local search query when initialSearchQuery changes
  useEffect(() => {
    setSearchQuery(initialSearchQuery)
  }, [initialSearchQuery])

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query)
    onSearchQueryChange?.(query)
  }

  const { data: advisors = [], isLoading, error } = useAdvisors({
    verified: externalFilters?.verifiedOnly,
    location: externalFilters?.location,
    specialties: externalFilters?.selectedSpecialties
  })

  // Use optimized search with performance tracking
  const { 
    filteredItems: sortedAdvisors, 
    suggestions, 
    isSearching,
    performanceMetrics
  } = useOptimizedAdvisorSearch(advisors, searchQuery, filters, sortBy)

  // Track search performance
  useEffect(() => {
    if (searchQuery && performanceMetrics.finalResults !== undefined) {
      const searchTime = performance.now() // This would need to be properly measured
      trackSearch(searchQuery, performanceMetrics.finalResults, searchTime)
    }
  }, [searchQuery, performanceMetrics.finalResults, trackSearch])

  // Enhanced contact handler with analytics
  const handleContactAdvisor = useCallback((advisor: AdvisorWithSubscriptionPlan) => {
    setSelectedAdvisor(advisor)
    trackAdvisorView(advisor.id, advisor)
    track(HockeyDirectoryEvents.ADVISOR_CONTACTED, { advisor_id: advisor.id })
  }, [trackAdvisorView, track])


  const handleSuggestionSelect = (suggestion: string) => {
    // Save to recent searches
    const newRecent = [suggestion, ...recentSearches.filter(s => s !== suggestion)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem('hockey-directory-recent-searches', JSON.stringify(newRecent))
  }

  // Enhanced loading and error handling
  if (isLoading) {
    return (
      <div className="space-y-6">
        <SearchSkeleton />
        <DirectoryGridSkeleton count={6} />
      </div>
    )
  }

  if (error) {
    return (
      <ErrorBoundary>
        <div className="text-center py-12">
          <p className="text-gray-500">Failed to load advisors. Please try again.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </ErrorBoundary>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Sort Controls */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={handleSearchQueryChange}
              onSuggestionSelect={handleSuggestionSelect}
              suggestions={suggestions}
              isSearching={isSearching}
              recentSearches={recentSearches}
              placeholder="Search advisors by name, location, or specialty..."
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

            {/* Comparison button */}
            {comparisonCount > 0 && (
              <Button
                variant="outline"
                onClick={() => openComparison()}
                className="relative"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare ({comparisonCount})
              </Button>
            )}
          </div>
        </div>
        
        {/* Enhanced Results Count with Performance Metrics */}
        <FadeIn delay={200}>
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                Showing <CountUp to={sortedAdvisors.length} className="font-medium text-blue-600" /> of <CountUp to={advisors.length} className="font-medium" /> advisors
                {searchQuery && (
                  <span>
                    {" "}for <span className="font-medium text-blue-600">"{searchQuery}"</span>
                  </span>
                )}
              </span>
              
              {isSearching && (
                <span className="inline-flex items-center gap-1 text-blue-500">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  Searching...
                </span>
              )}

              {/* Performance indicator */}
              {performanceMetrics.hasActiveSearch || performanceMetrics.hasActiveFilters ? (
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">Optimized</span>
                </div>
              ) : null}
            </div>
            
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
        </FadeIn>
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
              onClick={() => handleSearchQueryChange('')}
              className="mt-4"
            >
              Clear Search
            </Button>
          )}
        </div>
      ) : (
        <ProgressiveLoading
          isLoading={isSearching}
          isEmpty={sortedAdvisors.length === 0}
          emptyMessage={searchQuery 
            ? `No advisors found matching "${searchQuery}"` 
            : 'No advisors available'
          }
          skeleton={<DirectoryGridSkeleton count={3} />}
        >
          <ErrorBoundary>
            <StaggeredChildren 
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
              delay={300}
              staggerDelay={100}
            >
              {sortedAdvisors.map((advisor, index) => {
                // Determine card layout based on subscription and position
                let layout: "premium" | "featured" | "basic" = "basic"
                
                if (advisor.subscription?.plan.name === "Premium") {
                  layout = "premium"
                } else if (advisor.subscription?.plan.name === "Featured" || index < 3) {
                  layout = "featured"
                }

                return (
                  <HoverLift key={advisor.id} liftHeight={2}>
                    <AdvisorCard
                      advisor={{
                        ...advisor,
                        fullName: advisor.name,
                        headshotUrl: advisor.headshotUrl || "/placeholder-avatar.jpg",
                        completeness: 90, // Mock completeness
                        responseTimeMs: 3600000, // 1 hour mock
                      }}
                      layout={layout}
                      searchQuery={searchQuery}
                    />
                  </HoverLift>
                )
              })}
            </StaggeredChildren>
          </ErrorBoundary>
        </ProgressiveLoading>
      )}

      {/* Contact Modal */}
      <ContactAdvisorModal
        advisor={selectedAdvisor}
        isOpen={!!selectedAdvisor}
        onClose={() => setSelectedAdvisor(null)}
      />

      {/* Comparison Modal */}
      <AdvisorComparisonModal
        advisors={comparisonList}
        isOpen={isComparisonOpen}
        onClose={closeComparison}
        onRemoveAdvisor={removeFromComparison}
      />
    </div>
  )
}