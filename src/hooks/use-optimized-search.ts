import { useState, useEffect, useMemo, useCallback } from 'react'
import { useDebounce } from './use-debounced-search'
import { 
  createSearchIndex, 
  searchWithIndex, 
  applyFiltersOptimized, 
  sortItemsOptimized,
  usePerformanceMonitor
} from '@/lib/search-optimization'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'

interface SearchSuggestion {
  type: 'name' | 'location' | 'specialty' | 'recent'
  value: string
  count?: number
}

interface FilterState {
  location: string
  selectedSpecialties: string[]
  selectedCertifications: string[]
  minRating: number
  minExperience: number
  verifiedOnly: boolean
  featuredOnly: boolean
}

export function useOptimizedAdvisorSearch(
  advisors: AdvisorWithSubscriptionPlan[],
  searchQuery: string,
  filters: FilterState,
  sortBy: string = 'priority'
) {
  const [isSearching, setIsSearching] = useState(false)
  const { trackOperation } = usePerformanceMonitor('OptimizedAdvisorSearch')
  
  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300)

  // Create search index - memoized and only recreated when advisors change
  const searchIndex = useMemo(() => {
    if (advisors.length === 0) return null

    return trackOperation('createSearchIndex', () => 
      createSearchIndex(advisors, (advisor) => ({
        id: advisor.id,
        name: advisor.name,
        location: advisor.location || '',
        specialties: advisor.specialties ? JSON.parse(advisor.specialties) : [],
        keywords: [
          advisor.bio || '',
          advisor.name,
          advisor.location || '',
          ...(advisor.specialties ? JSON.parse(advisor.specialties) : [])
        ]
      }))
    )
  }, [advisors, trackOperation])

  // Search results - memoized based on debounced query and index
  const searchResults = useMemo(() => {
    if (!searchIndex || advisors.length === 0) return advisors

    if (!debouncedQuery.trim()) return advisors

    return trackOperation('searchWithIndex', () =>
      searchWithIndex(
        advisors,
        debouncedQuery,
        searchIndex,
        (advisor) => advisor.id
      )
    )
  }, [advisors, debouncedQuery, searchIndex, trackOperation])

  // Apply filters - memoized based on search results and filters
  const filteredResults = useMemo(() => {
    if (searchResults.length === 0) return []

    return trackOperation('applyFilters', () =>
      applyFiltersOptimized(
        searchResults,
        filters,
        (advisor) => ({
          location: advisor.location || '',
          rating: advisor.rating,
          experience: advisor.yearsExperience,
          isVerified: advisor.verified || false,
          isFeatured: advisor.subscription?.plan.name?.includes('Featured') || false,
          specialties: advisor.specialties ? JSON.parse(advisor.specialties) : []
        })
      )
    )
  }, [searchResults, filters, trackOperation])

  // Sort results - memoized based on filtered results and sort criteria
  const sortedResults = useMemo(() => {
    if (filteredResults.length === 0) return []

    return trackOperation('sortResults', () =>
      sortItemsOptimized(
        filteredResults,
        sortBy,
        (advisor) => ({
          priority: advisor.subscription?.plan.priority || 0,
          rating: advisor.rating,
          name: advisor.name,
          experience: advisor.yearsExperience
        })
      )
    )
  }, [filteredResults, sortBy, trackOperation])

  // Generate search suggestions - optimized and memoized
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || !searchIndex) return []

    const query = searchQuery.toLowerCase()
    const suggestionSet = new Set<SearchSuggestion>()
    const maxSuggestions = 5

    // Name suggestions
    for (const [word, ids] of searchIndex.byName.entries()) {
      if (word.startsWith(query) && suggestionSet.size < maxSuggestions) {
        suggestionSet.add({
          type: 'name',
          value: word,
          count: ids.length
        })
      }
    }

    // Location suggestions
    for (const [word, ids] of searchIndex.byLocation.entries()) {
      if (word.startsWith(query) && suggestionSet.size < maxSuggestions) {
        suggestionSet.add({
          type: 'location', 
          value: word,
          count: ids.length
        })
      }
    }

    // Specialty suggestions
    for (const [specialty, ids] of searchIndex.bySpecialty.entries()) {
      if (specialty.includes(query) && suggestionSet.size < maxSuggestions) {
        suggestionSet.add({
          type: 'specialty',
          value: specialty,
          count: ids.length
        })
      }
    }

    return Array.from(suggestionSet).slice(0, maxSuggestions)
  }, [searchQuery, searchIndex])

  // Track searching state
  useEffect(() => {
    if (searchQuery !== debouncedQuery) {
      setIsSearching(true)
    } else {
      setIsSearching(false)
    }
  }, [searchQuery, debouncedQuery])

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    totalAdvisors: advisors.length,
    searchResults: searchResults.length,
    filteredResults: filteredResults.length,
    finalResults: sortedResults.length,
    hasActiveFilters: Object.values(filters).some(value => 
      value !== undefined && 
      value !== '' && 
      value !== 0 && 
      value !== false &&
      (!Array.isArray(value) || value.length > 0)
    ),
    hasActiveSearch: debouncedQuery.trim().length > 0
  }), [advisors.length, searchResults.length, filteredResults.length, sortedResults.length, filters, debouncedQuery])

  return {
    filteredItems: sortedResults,
    suggestions,
    isSearching,
    performanceMetrics
  }
}