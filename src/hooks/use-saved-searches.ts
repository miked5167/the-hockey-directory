'use client'

import { useState, useEffect, useCallback } from 'react'

const SAVED_SEARCHES_STORAGE_KEY = 'hockey-directory-saved-searches'
const MAX_SAVED_SEARCHES = 10

export interface SavedSearch {
  id: string
  name: string
  query: string
  filters: {
    location: string
    selectedSpecialties: string[]
    selectedCertifications: string[]
    minRating: number
    minExperience: number
    verifiedOnly: boolean
    featuredOnly: boolean
  }
  createdAt: string
  lastUsed: string
  useCount: number
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load saved searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SAVED_SEARCHES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setSavedSearches(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error)
      setSavedSearches([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save searches to localStorage whenever they change
  const saveSavedSearches = useCallback((newSearches: SavedSearch[]) => {
    try {
      localStorage.setItem(SAVED_SEARCHES_STORAGE_KEY, JSON.stringify(newSearches))
      setSavedSearches(newSearches)
    } catch (error) {
      console.error('Failed to save searches:', error)
    }
  }, [])

  // Save a new search
  const saveSearch = useCallback((
    name: string,
    query: string,
    filters: SavedSearch['filters']
  ) => {
    // Check if search with same name already exists
    const existingIndex = savedSearches.findIndex(search => search.name === name)
    
    if (existingIndex >= 0) {
      return { success: false, message: 'Search name already exists' }
    }

    // Check if we've reached the maximum
    if (savedSearches.length >= MAX_SAVED_SEARCHES) {
      return { 
        success: false, 
        message: `Maximum ${MAX_SAVED_SEARCHES} saved searches allowed` 
      }
    }

    const newSearch: SavedSearch = {
      id: crypto.randomUUID(),
      name,
      query,
      filters,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      useCount: 1
    }

    const newSearches = [newSearch, ...savedSearches]
    saveSavedSearches(newSearches)
    
    return { success: true, message: `Search "${name}" saved successfully` }
  }, [savedSearches, saveSavedSearches])

  // Use/apply a saved search
  const useSearch = useCallback((searchId: string) => {
    const search = savedSearches.find(s => s.id === searchId)
    if (!search) {
      return { success: false, message: 'Search not found', search: null }
    }

    // Update usage statistics
    const updatedSearch = {
      ...search,
      lastUsed: new Date().toISOString(),
      useCount: search.useCount + 1
    }

    const newSearches = savedSearches.map(s => 
      s.id === searchId ? updatedSearch : s
    ).sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())

    saveSavedSearches(newSearches)
    
    return { success: true, message: '', search: updatedSearch }
  }, [savedSearches, saveSavedSearches])

  // Delete a saved search
  const deleteSearch = useCallback((searchId: string) => {
    const newSearches = savedSearches.filter(search => search.id !== searchId)
    saveSavedSearches(newSearches)
    
    return { success: true, message: 'Search deleted successfully' }
  }, [savedSearches, saveSavedSearches])

  // Update a saved search
  const updateSearch = useCallback((
    searchId: string,
    updates: Partial<Pick<SavedSearch, 'name' | 'query' | 'filters'>>
  ) => {
    const searchIndex = savedSearches.findIndex(s => s.id === searchId)
    if (searchIndex === -1) {
      return { success: false, message: 'Search not found' }
    }

    // Check if new name conflicts with existing search
    if (updates.name && updates.name !== savedSearches[searchIndex].name) {
      const nameExists = savedSearches.some(s => s.name === updates.name && s.id !== searchId)
      if (nameExists) {
        return { success: false, message: 'Search name already exists' }
      }
    }

    const updatedSearch = {
      ...savedSearches[searchIndex],
      ...updates,
      lastUsed: new Date().toISOString()
    }

    const newSearches = [...savedSearches]
    newSearches[searchIndex] = updatedSearch
    saveSavedSearches(newSearches)
    
    return { success: true, message: 'Search updated successfully' }
  }, [savedSearches, saveSavedSearches])

  // Get searches sorted by most recently used
  const getRecentSearches = useCallback(() => {
    return [...savedSearches].sort((a, b) => 
      new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
    )
  }, [savedSearches])

  // Get searches sorted by most frequently used
  const getPopularSearches = useCallback(() => {
    return [...savedSearches].sort((a, b) => b.useCount - a.useCount)
  }, [savedSearches])

  // Clear all saved searches
  const clearAllSearches = useCallback(() => {
    saveSavedSearches([])
    return { success: true, message: 'All saved searches cleared' }
  }, [saveSavedSearches])

  return {
    savedSearches,
    isLoading,
    saveSearch,
    useSearch,
    deleteSearch,
    updateSearch,
    getRecentSearches,
    getPopularSearches,
    clearAllSearches,
    maxSavedSearches: MAX_SAVED_SEARCHES,
    savedSearchCount: savedSearches.length
  }
}