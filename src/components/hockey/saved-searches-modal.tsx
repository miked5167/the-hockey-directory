'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Search, 
  Star, 
  Clock, 
  Trash2, 
  Edit3, 
  Play, 
  X,
  MapPin,
  Award,
  Shield,
  Plus
} from 'lucide-react'
import { useSavedSearches, SavedSearch } from '@/hooks/use-saved-searches'
import type { FilterState } from '@/app/advisors/components/AdvisorFilters'

interface SavedSearchesModalProps {
  isOpen: boolean
  onClose: () => void
  onApplySearch?: (query: string, filters: FilterState) => void
  currentQuery?: string
  currentFilters?: FilterState
}

interface SaveSearchFormProps {
  onSave: (name: string) => void
  onCancel: () => void
  currentQuery: string
  currentFilters: FilterState
  isVisible: boolean
}

const SaveSearchForm = ({ onSave, onCancel, isVisible }: SaveSearchFormProps) => {
  const [searchName, setSearchName] = useState('')

  const handleSave = () => {
    if (searchName.trim()) {
      onSave(searchName.trim())
      setSearchName('')
    }
  }

  if (!isVisible) return null

  return (
    <div className="border-t border-gray-200 p-4 bg-gray-50">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Enter search name..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onCancel()
            }}
            className="text-sm"
            autoFocus
          />
        </div>
        <Button size="sm" onClick={handleSave} disabled={!searchName.trim()}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

const SearchCard = ({ 
  search, 
  onUse, 
  onDelete 
}: { 
  search: SavedSearch
  onUse: (search: SavedSearch) => void
  onDelete: (id: string) => void
}) => {
  const hasActiveFilters = 
    search.filters.location ||
    search.filters.selectedSpecialties.length > 0 ||
    search.filters.minRating > 0 ||
    search.filters.minExperience > 0 ||
    search.filters.verifiedOnly ||
    search.filters.featuredOnly

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{search.name}</h3>
          {search.query && (
            <p className="text-sm text-gray-600 truncate mt-1">
              "{search.query}"
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUse(search)}
            className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <Play className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(search.id)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-3">
          {search.filters.location && (
            <Badge variant="secondary" className="text-xs">
              <MapPin className="h-3 w-3 mr-1" />
              {search.filters.location}
            </Badge>
          )}
          {search.filters.selectedSpecialties.map(specialty => (
            <Badge key={specialty} variant="secondary" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              {specialty}
            </Badge>
          ))}
          {search.filters.minRating > 0 && (
            <Badge variant="secondary" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              {search.filters.minRating}+ stars
            </Badge>
          )}
          {search.filters.minExperience > 0 && (
            <Badge variant="secondary" className="text-xs">
              {search.filters.minExperience}+ years
            </Badge>
          )}
          {search.filters.verifiedOnly && (
            <Badge variant="secondary" className="text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Verified only
            </Badge>
          )}
          {search.filters.featuredOnly && (
            <Badge variant="secondary" className="text-xs">
              Featured only
            </Badge>
          )}
        </div>
      )}

      {/* Usage Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Used {search.useCount} times
          </span>
          <span>
            Last used {new Date(search.lastUsed).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SavedSearchesModal({ 
  isOpen, 
  onClose, 
  onApplySearch,
  currentQuery = '',
  currentFilters = {
    location: '',
    selectedSpecialties: [],
    selectedCertifications: [],
    minRating: 0,
    minExperience: 0,
    verifiedOnly: false,
    featuredOnly: false
  }
}: SavedSearchesModalProps) {
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'popular'>('recent')

  const {
    savedSearches,
    saveSearch,
    useSearch,
    deleteSearch,
    getRecentSearches,
    getPopularSearches,
    savedSearchCount,
    maxSavedSearches
  } = useSavedSearches()

  const displaySearches = sortBy === 'recent' ? getRecentSearches() : getPopularSearches()

  const handleSaveCurrentSearch = (name: string) => {
    const result = saveSearch(name, currentQuery, currentFilters)
    setShowSaveForm(false)
    // Could show toast notification here based on result
  }

  const handleUseSearch = (search: SavedSearch) => {
    const result = useSearch(search.id)
    if (result.success && onApplySearch) {
      onApplySearch(search.query, search.filters)
      onClose()
    }
  }

  const handleDeleteSearch = (searchId: string) => {
    deleteSearch(searchId)
  }

  const hasActiveSearch = currentQuery || Object.values(currentFilters).some(value => 
    Array.isArray(value) ? value.length > 0 : value
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Saved Searches ({savedSearchCount}/{maxSavedSearches})
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Save current search */}
        {hasActiveSearch && savedSearchCount < maxSavedSearches && (
          <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  Save your current search
                </p>
                <p className="text-xs text-blue-700">
                  Query: "{currentQuery}" with {Object.values(currentFilters).filter(v => 
                    Array.isArray(v) ? v.length > 0 : v
                  ).length} active filters
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowSaveForm(!showSaveForm)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        )}

        {/* Save form */}
        <SaveSearchForm
          onSave={handleSaveCurrentSearch}
          onCancel={() => setShowSaveForm(false)}
          currentQuery={currentQuery}
          currentFilters={currentFilters}
          isVisible={showSaveForm}
        />

        {/* Sort controls */}
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex gap-1">
            <Button
              variant={sortBy === 'recent' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('recent')}
              className="h-8"
            >
              <Clock className="h-3 w-3 mr-1" />
              Recent
            </Button>
            <Button
              variant={sortBy === 'popular' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSortBy('popular')}
              className="h-8"
            >
              <Star className="h-3 w-3 mr-1" />
              Popular
            </Button>
          </div>
        </div>

        {/* Searches list */}
        <div className="flex-1 overflow-y-auto">
          {displaySearches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-2">No saved searches yet</p>
              <p className="text-gray-400 text-sm">
                {hasActiveSearch 
                  ? "Save your current search to quickly access it later"
                  : "Perform a search and save it for quick access later"
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {displaySearches.map((search) => (
                <SearchCard
                  key={search.id}
                  search={search}
                  onUse={handleUseSearch}
                  onDelete={handleDeleteSearch}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}