import { useMemo, useCallback } from 'react'

// Search index for faster lookups
interface SearchIndex {
  byName: Map<string, string[]>
  byLocation: Map<string, string[]>
  bySpecialty: Map<string, string[]>
  byKeywords: Map<string, Set<string>>
}

// Create search index from advisors
export function createSearchIndex<T>(
  items: T[],
  getSearchableFields: (item: T) => {
    id: string
    name: string
    location: string
    specialties: string[]
    keywords: string[]
  }
): SearchIndex {
  const index: SearchIndex = {
    byName: new Map(),
    byLocation: new Map(), 
    bySpecialty: new Map(),
    byKeywords: new Map()
  }

  items.forEach(item => {
    const fields = getSearchableFields(item)
    const { id, name, location, specialties, keywords } = fields

    // Index by name fragments
    const nameWords = name.toLowerCase().split(/\s+/)
    nameWords.forEach(word => {
      if (!index.byName.has(word)) index.byName.set(word, [])
      index.byName.get(word)!.push(id)
    })

    // Index by location fragments
    const locationWords = location.toLowerCase().split(/\s+|,/)
    locationWords.forEach(word => {
      const cleanWord = word.trim()
      if (cleanWord) {
        if (!index.byLocation.has(cleanWord)) index.byLocation.set(cleanWord, [])
        index.byLocation.get(cleanWord)!.push(id)
      }
    })

    // Index by specialties
    specialties.forEach(specialty => {
      const specialtyKey = specialty.toLowerCase()
      if (!index.bySpecialty.has(specialtyKey)) index.bySpecialty.set(specialtyKey, [])
      index.bySpecialty.get(specialtyKey)!.push(id)
    })

    // Index by keywords
    keywords.forEach(keyword => {
      const keywordKey = keyword.toLowerCase()
      if (!index.byKeywords.has(keywordKey)) index.byKeywords.set(keywordKey, new Set())
      index.byKeywords.get(keywordKey)!.add(id)
    })
  })

  return index
}

// Fast search using pre-built index
export function searchWithIndex<T>(
  items: T[],
  query: string,
  index: SearchIndex,
  getId: (item: T) => string
): T[] {
  if (!query.trim()) return items

  const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
  const matchingIds = new Set<string>()

  searchTerms.forEach(term => {
    const termMatches = new Set<string>()

    // Search in names
    for (const [word, ids] of index.byName.entries()) {
      if (word.includes(term)) {
        ids.forEach(id => termMatches.add(id))
      }
    }

    // Search in locations
    for (const [word, ids] of index.byLocation.entries()) {
      if (word.includes(term)) {
        ids.forEach(id => termMatches.add(id))
      }
    }

    // Search in specialties
    for (const [specialty, ids] of index.bySpecialty.entries()) {
      if (specialty.includes(term)) {
        ids.forEach(id => termMatches.add(id))
      }
    }

    // Search in keywords
    for (const [keyword, ids] of index.byKeywords.entries()) {
      if (keyword.includes(term)) {
        ids.forEach(id => termMatches.add(id))
      }
    }

    // For first term, add all matches
    if (matchingIds.size === 0) {
      termMatches.forEach(id => matchingIds.add(id))
    } else {
      // For subsequent terms, keep only items that match all previous terms (AND logic)
      const intersection = new Set<string>()
      matchingIds.forEach(id => {
        if (termMatches.has(id)) {
          intersection.add(id)
        }
      })
      matchingIds.clear()
      intersection.forEach(id => matchingIds.add(id))
    }
  })

  // Return items that match the search
  return items.filter(item => matchingIds.has(getId(item)))
}

// Optimized filter function with early exits
export function applyFiltersOptimized<T>(
  items: T[],
  filters: {
    location?: string
    minRating?: number
    minExperience?: number
    verifiedOnly?: boolean
    featuredOnly?: boolean
    selectedSpecialties?: string[]
  },
  getFilterFields: (item: T) => {
    location: string
    rating: number | null
    experience: number | null
    isVerified: boolean
    isFeatured: boolean
    specialties: string[]
  }
): T[] {
  // Early return if no filters
  const hasFilters = Object.values(filters).some(value => 
    value !== undefined && 
    value !== '' && 
    value !== 0 && 
    value !== false &&
    (!Array.isArray(value) || value.length > 0)
  )
  
  if (!hasFilters) return items

  return items.filter(item => {
    const fields = getFilterFields(item)

    // Location filter - early exit
    if (filters.location && !fields.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false
    }

    // Rating filter - early exit
    if (filters.minRating && filters.minRating > 0 && (fields.rating || 0) < filters.minRating) {
      return false
    }

    // Experience filter - early exit  
    if (filters.minExperience && filters.minExperience > 0 && (fields.experience || 0) < filters.minExperience) {
      return false
    }

    // Verified filter - early exit
    if (filters.verifiedOnly && !fields.isVerified) {
      return false
    }

    // Featured filter - early exit
    if (filters.featuredOnly && !fields.isFeatured) {
      return false
    }

    // Specialties filter - most expensive, do last
    if (filters.selectedSpecialties && filters.selectedSpecialties.length > 0) {
      const hasMatchingSpecialty = filters.selectedSpecialties.some(filterSpecialty => 
        fields.specialties.some(itemSpecialty => 
          itemSpecialty.toLowerCase().includes(filterSpecialty.toLowerCase())
        )
      )
      if (!hasMatchingSpecialty) return false
    }

    return true
  })
}

// Memoized sort function
export function sortItemsOptimized<T>(
  items: T[],
  sortBy: string,
  getSortFields: (item: T) => {
    priority: number
    rating: number | null
    name: string
    experience: number | null
  }
): T[] {
  // Don't sort if array is small
  if (items.length <= 1) return items

  return [...items].sort((a, b) => {
    const aFields = getSortFields(a)
    const bFields = getSortFields(b)

    switch (sortBy) {
      case 'priority':
        // Business logic: subscription priority first, then rating
        if (aFields.priority !== bFields.priority) {
          return bFields.priority - aFields.priority
        }
        return (bFields.rating || 0) - (aFields.rating || 0)
        
      case 'rating':
        return (bFields.rating || 0) - (aFields.rating || 0)
        
      case 'name':
        return aFields.name.localeCompare(bFields.name)
        
      case 'experience':
        return (bFields.experience || 0) - (aFields.experience || 0)
        
      default:
        return 0
    }
  })
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const trackRender = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const renderTime = performance.now()
      console.debug(`${componentName} render at:`, renderTime)
    }
  }, [componentName])

  const trackOperation = useCallback((operationName: string, operation: () => any) => {
    if (typeof window !== 'undefined' && window.performance) {
      const start = performance.now()
      const result = operation()
      const end = performance.now()
      console.debug(`${componentName} ${operationName} took:`, end - start, 'ms')
      return result
    }
    return operation()
  }, [componentName])

  return { trackRender, trackOperation }
}