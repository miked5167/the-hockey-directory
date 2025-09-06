'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SavedSearchesModal } from '@/components/hockey/saved-searches-modal'
import { FavoritesModal } from '@/components/hockey/favorites-modal'
import { useFavorites } from '@/hooks/use-favorites'
import { Bookmark, Heart } from 'lucide-react'
import { AdvisorFilters, type FilterState } from './AdvisorFilters'
import { AdvisorDirectory } from './AdvisorDirectory'

export function AdvisorBrowser() {
  const [filters, setFilters] = useState<FilterState>({
    location: '',
    selectedSpecialties: [],
    selectedCertifications: [],
    minRating: 0,
    minExperience: 0,
    verifiedOnly: true,
    featuredOnly: false
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [isSavedSearchesOpen, setIsSavedSearchesOpen] = useState(false)
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false)

  const { favoritesCount } = useFavorites()

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters)
  }

  const handleApplySearch = (query: string, newFilters: FilterState) => {
    setSearchQuery(query)
    setFilters(newFilters)
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => setIsFavoritesOpen(true)}
          className="flex items-center gap-2"
        >
          <Heart className="h-4 w-4" />
          Favorites {favoritesCount > 0 && `(${favoritesCount})`}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setIsSavedSearchesOpen(true)}
          className="flex items-center gap-2"
        >
          <Bookmark className="h-4 w-4" />
          Saved Searches
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <AdvisorFilters 
              onFiltersChange={handleFiltersChange}
              initialFilters={filters}
            />
          </div>
        </div>

        {/* Main Directory */}
        <div className="mt-8 lg:mt-0 lg:col-span-3">
          <AdvisorDirectory 
            filters={filters} 
            initialSearchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
          />
        </div>
      </div>

      {/* Modals */}
      <SavedSearchesModal
        isOpen={isSavedSearchesOpen}
        onClose={() => setIsSavedSearchesOpen(false)}
        onApplySearch={handleApplySearch}
        currentQuery={searchQuery}
        currentFilters={filters}
      />
      
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />
    </div>
  )
}