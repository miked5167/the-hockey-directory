import { useState, useEffect, useMemo } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface SearchSuggestion {
  type: 'name' | 'location' | 'specialty'
  value: string
  count?: number
}

export function useAdvisorSearch<T>(
  items: T[],
  searchQuery: string,
  searchFields: {
    getName: (item: T) => string
    getLocation: (item: T) => string
    getSpecialties: (item: T) => string[]
    getBio?: (item: T) => string
  }
) {
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Generate search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []

    const suggestions: SearchSuggestion[] = []
    const searchLower = searchQuery.toLowerCase()
    const seen = new Set<string>()

    items.forEach(item => {
      // Name suggestions
      const name = searchFields.getName(item)
      if (name.toLowerCase().includes(searchLower) && !seen.has(name)) {
        suggestions.push({ type: 'name', value: name })
        seen.add(name)
      }

      // Location suggestions
      const location = searchFields.getLocation(item)
      if (location.toLowerCase().includes(searchLower) && !seen.has(location)) {
        suggestions.push({ type: 'location', value: location })
        seen.add(location)
      }

      // Specialty suggestions
      const specialties = searchFields.getSpecialties(item)
      specialties.forEach(specialty => {
        if (specialty.toLowerCase().includes(searchLower) && !seen.has(specialty)) {
          suggestions.push({ type: 'specialty', value: specialty })
          seen.add(specialty)
        }
      })
    })

    return suggestions.slice(0, 8) // Limit to 8 suggestions
  }, [items, searchQuery, searchFields])

  // Filter items based on debounced search
  const filteredItems = useMemo(() => {
    if (!debouncedSearchQuery) return items

    const searchLower = debouncedSearchQuery.toLowerCase()

    return items.filter(item => {
      const name = searchFields.getName(item).toLowerCase()
      const location = searchFields.getLocation(item).toLowerCase()
      const specialties = searchFields.getSpecialties(item)
      const bio = searchFields.getBio?.(item)?.toLowerCase() || ''

      return (
        name.includes(searchLower) ||
        location.includes(searchLower) ||
        bio.includes(searchLower) ||
        specialties.some(specialty => 
          specialty.toLowerCase().includes(searchLower)
        )
      )
    })
  }, [items, debouncedSearchQuery, searchFields])

  return {
    filteredItems,
    suggestions,
    debouncedSearchQuery,
    isSearching: searchQuery !== debouncedSearchQuery
  }
}