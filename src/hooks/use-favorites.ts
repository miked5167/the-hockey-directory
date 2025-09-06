'use client'

import { useState, useEffect, useCallback } from 'react'

const FAVORITES_STORAGE_KEY = 'hockey-directory-favorites'

export interface FavoriteAdvisor {
  id: string
  name: string
  location: string
  specialties: string
  rating?: number
  headshotUrl?: string
  addedAt: string
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteAdvisor[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setFavorites(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Failed to load favorites:', error)
      setFavorites([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save favorites to localStorage whenever favorites change
  const saveFavorites = useCallback((newFavorites: FavoriteAdvisor[]) => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(newFavorites))
      setFavorites(newFavorites)
    } catch (error) {
      console.error('Failed to save favorites:', error)
    }
  }, [])

  // Add advisor to favorites
  const addToFavorites = useCallback((advisor: Omit<FavoriteAdvisor, 'addedAt'>) => {
    const newFavorite: FavoriteAdvisor = {
      ...advisor,
      addedAt: new Date().toISOString()
    }
    
    const newFavorites = [...favorites, newFavorite]
    saveFavorites(newFavorites)
    
    // Show success toast (optional)
    return true
  }, [favorites, saveFavorites])

  // Remove advisor from favorites
  const removeFromFavorites = useCallback((advisorId: string) => {
    const newFavorites = favorites.filter(fav => fav.id !== advisorId)
    saveFavorites(newFavorites)
    return true
  }, [favorites, saveFavorites])

  // Toggle favorite status
  const toggleFavorite = useCallback((advisor: Omit<FavoriteAdvisor, 'addedAt'>) => {
    const isCurrentlyFavorited = favorites.some(fav => fav.id === advisor.id)
    
    if (isCurrentlyFavorited) {
      removeFromFavorites(advisor.id)
      return false // Not favorited anymore
    } else {
      addToFavorites(advisor)
      return true // Now favorited
    }
  }, [favorites, addToFavorites, removeFromFavorites])

  // Check if advisor is favorited
  const isFavorited = useCallback((advisorId: string) => {
    return favorites.some(fav => fav.id === advisorId)
  }, [favorites])

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    saveFavorites([])
  }, [saveFavorites])

  // Get favorites by specialty
  const getFavoritesBySpecialty = useCallback((specialty: string) => {
    return favorites.filter(fav => 
      fav.specialties.toLowerCase().includes(specialty.toLowerCase())
    )
  }, [favorites])

  // Get recently added favorites (last 7 days)
  const getRecentFavorites = useCallback((days: number = 7) => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return favorites.filter(fav => 
      new Date(fav.addedAt) > cutoffDate
    ).sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
  }, [favorites])

  return {
    favorites,
    isLoading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorited,
    clearFavorites,
    getFavoritesBySpecialty,
    getRecentFavorites,
    favoritesCount: favorites.length
  }
}