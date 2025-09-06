'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Heart, 
  Star, 
  Clock, 
  Trash2, 
  X,
  MapPin,
  Search,
  SortAsc,
  Filter,
  Mail,
  Phone
} from 'lucide-react'
import { useFavorites, FavoriteAdvisor } from '@/hooks/use-favorites'

interface FavoritesModalProps {
  isOpen: boolean
  onClose: () => void
  onContactAdvisor?: (advisor: FavoriteAdvisor) => void
}

const StarRating = ({ rating }: { rating?: number }) => {
  if (!rating) return null
  
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          )}
        />
      ))}
      <span className="text-sm text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </div>
  )
}

const FavoriteCard = ({ 
  favorite, 
  onRemove, 
  onContact 
}: { 
  favorite: FavoriteAdvisor
  onRemove: (id: string) => void
  onContact?: (advisor: FavoriteAdvisor) => void
}) => {
  const specialties = favorite.specialties ? favorite.specialties.split(',').slice(0, 3) : []
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="relative h-16 w-16 flex-shrink-0">
          <Image
            src={favorite.headshotUrl || "/placeholder-avatar.jpg"}
            alt={favorite.name}
            fill
            className="rounded-full object-cover"
            sizes="64px"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {favorite.name}
              </h3>
              {favorite.rating && <StarRating rating={favorite.rating} />}
              <p className="text-sm text-gray-500 truncate mt-1">
                <MapPin className="h-3 w-3 inline mr-1" />
                {favorite.location}
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(favorite.id)}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
            >
              <Heart className="h-4 w-4 fill-current" />
            </Button>
          </div>
        </div>
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {specialties.map((specialty) => (
              <Badge key={specialty} variant="secondary" className="text-xs">
                {specialty.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Added date */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Added {new Date(favorite.addedAt).toLocaleDateString()}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          View Profile
        </Button>
        <Button 
          size="sm" 
          className="flex-1"
          onClick={() => onContact?.(favorite)}
        >
          <Mail className="h-3 w-3 mr-1" />
          Contact
        </Button>
      </div>
    </div>
  )
}

export function FavoritesModal({ 
  isOpen, 
  onClose, 
  onContactAdvisor 
}: FavoritesModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'rating'>('recent')
  const [filterSpecialty, setFilterSpecialty] = useState('')

  const { 
    favorites, 
    removeFromFavorites, 
    clearFavorites,
    getFavoritesBySpecialty,
    getRecentFavorites
  } = useFavorites()

  // Filter and sort favorites
  let displayFavorites = [...favorites]

  // Apply search filter
  if (searchQuery) {
    displayFavorites = displayFavorites.filter(fav => 
      fav.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fav.specialties.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Apply specialty filter
  if (filterSpecialty) {
    displayFavorites = getFavoritesBySpecialty(filterSpecialty)
  }

  // Apply sorting
  displayFavorites.sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0
    }
  })

  // Get unique specialties for filter dropdown
  const allSpecialties = Array.from(new Set(
    favorites.flatMap(fav => 
      fav.specialties ? fav.specialties.split(',').map(s => s.trim()) : []
    )
  )).sort()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900">
              My Favorites ({favorites.length})
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Controls */}
        <div className="border-b border-gray-200 pb-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">All Specialties</option>
                {allSpecialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="recent">Recently Added</option>
                <option value="name">Name A-Z</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {favorites.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Are you sure you want to clear all favorites?')) {
                    clearFavorites()
                  }
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Favorites Grid */}
        <div className="flex-1 overflow-y-auto">
          {displayFavorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Heart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium mb-2">
                {favorites.length === 0 
                  ? "No favorites yet" 
                  : searchQuery || filterSpecialty 
                    ? "No favorites match your search"
                    : "No favorites to display"
                }
              </p>
              <p className="text-gray-400 text-sm">
                {favorites.length === 0 
                  ? "Click the heart icon on advisor cards to save them here"
                  : "Try adjusting your search or filters"
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 py-4">
              {displayFavorites.map((favorite) => (
                <FavoriteCard
                  key={favorite.id}
                  favorite={favorite}
                  onRemove={removeFromFavorites}
                  onContact={onContactAdvisor}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}