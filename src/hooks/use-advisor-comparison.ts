'use client'

import { useState, useEffect, useCallback } from 'react'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'

const COMPARISON_STORAGE_KEY = 'hockey-directory-comparison'
const MAX_COMPARISON_ITEMS = 3

export function useAdvisorComparison() {
  const [comparisonList, setComparisonList] = useState<AdvisorWithSubscriptionPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isComparisonOpen, setIsComparisonOpen] = useState(false)

  // Load comparison list from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMPARISON_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setComparisonList(Array.isArray(parsed) ? parsed : [])
      }
    } catch (error) {
      console.error('Failed to load comparison list:', error)
      setComparisonList([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save comparison list to localStorage whenever it changes
  const saveComparisonList = useCallback((newList: AdvisorWithSubscriptionPlan[]) => {
    try {
      localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(newList))
      setComparisonList(newList)
    } catch (error) {
      console.error('Failed to save comparison list:', error)
    }
  }, [])

  // Add advisor to comparison
  const addToComparison = useCallback((advisor: AdvisorWithSubscriptionPlan) => {
    // Check if advisor is already in comparison
    const isAlreadyAdded = comparisonList.some(item => item.id === advisor.id)
    if (isAlreadyAdded) {
      return { success: false, message: 'Advisor already in comparison' }
    }

    // Check if we've reached the maximum
    if (comparisonList.length >= MAX_COMPARISON_ITEMS) {
      return { 
        success: false, 
        message: `Maximum ${MAX_COMPARISON_ITEMS} advisors can be compared at once` 
      }
    }

    const newList = [...comparisonList, advisor]
    saveComparisonList(newList)
    
    return { 
      success: true, 
      message: `Added ${advisor.name} to comparison (${newList.length}/${MAX_COMPARISON_ITEMS})` 
    }
  }, [comparisonList, saveComparisonList])

  // Remove advisor from comparison
  const removeFromComparison = useCallback((advisorId: string) => {
    const newList = comparisonList.filter(advisor => advisor.id !== advisorId)
    saveComparisonList(newList)
    
    return { 
      success: true, 
      message: 'Removed from comparison' 
    }
  }, [comparisonList, saveComparisonList])

  // Check if advisor is in comparison
  const isInComparison = useCallback((advisorId: string) => {
    return comparisonList.some(advisor => advisor.id === advisorId)
  }, [comparisonList])

  // Toggle advisor in comparison
  const toggleComparison = useCallback((advisor: AdvisorWithSubscriptionPlan) => {
    const isCurrentlyInComparison = isInComparison(advisor.id)
    
    if (isCurrentlyInComparison) {
      return removeFromComparison(advisor.id)
    } else {
      return addToComparison(advisor)
    }
  }, [isInComparison, addToComparison, removeFromComparison])

  // Clear all comparisons
  const clearComparisons = useCallback(() => {
    saveComparisonList([])
    setIsComparisonOpen(false)
    
    return { success: true, message: 'Cleared all comparisons' }
  }, [saveComparisonList])

  // Open comparison modal
  const openComparison = useCallback(() => {
    if (comparisonList.length === 0) {
      return { success: false, message: 'No advisors to compare' }
    }
    
    setIsComparisonOpen(true)
    return { success: true, message: '' }
  }, [comparisonList.length])

  // Close comparison modal
  const closeComparison = useCallback(() => {
    setIsComparisonOpen(false)
  }, [])

  return {
    comparisonList,
    comparisonCount: comparisonList.length,
    maxComparisons: MAX_COMPARISON_ITEMS,
    isLoading,
    isComparisonOpen,
    addToComparison,
    removeFromComparison,
    toggleComparison,
    isInComparison,
    clearComparisons,
    openComparison,
    closeComparison
  }
}