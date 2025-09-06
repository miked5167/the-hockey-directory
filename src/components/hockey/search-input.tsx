"use client"

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Search, Clock, MapPin, User, Award, X, Loader2 } from 'lucide-react'

interface SearchSuggestion {
  type: 'name' | 'location' | 'specialty' | 'recent'
  value: string
  count?: number
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onSuggestionSelect?: (suggestion: string) => void
  suggestions?: SearchSuggestion[]
  placeholder?: string
  isSearching?: boolean
  className?: string
  recentSearches?: string[]
}

export function SearchInput({
  value,
  onChange,
  onSuggestionSelect,
  suggestions = [],
  placeholder = "Search advisors by name, location, or specialty...",
  isSearching = false,
  className,
  recentSearches = []
}: SearchInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const showDropdown = isFocused && (value.length > 0 || recentSearches.length > 0)
  const displaySuggestions = value.length > 0 ? suggestions : 
    recentSearches.map(search => ({ type: 'recent' as const, value: search }))

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || displaySuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < displaySuggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          const suggestion = displaySuggestions[selectedIndex]
          handleSuggestionClick(suggestion.value)
        }
        break
      case 'Escape':
        setIsFocused(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleSuggestionClick = (suggestionValue: string) => {
    onChange(suggestionValue)
    onSuggestionSelect?.(suggestionValue)
    setIsFocused(false)
    setSelectedIndex(-1)
    
    // Save to recent searches (would typically be handled by parent)
    const recent = [suggestionValue, ...recentSearches.filter(s => s !== suggestionValue)].slice(0, 5)
    // Update recent searches in localStorage or state management
  }

  const clearSearch = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'name': return <User className="h-4 w-4 text-blue-500" />
      case 'location': return <MapPin className="h-4 w-4 text-green-500" />
      case 'specialty': return <Award className="h-4 w-4 text-purple-500" />
      case 'recent': return <Clock className="h-4 w-4 text-gray-400" />
      default: return <Search className="h-4 w-4 text-gray-400" />
    }
  }

  const getSuggestionLabel = (type: string) => {
    switch (type) {
      case 'name': return 'Advisor'
      case 'location': return 'Location'
      case 'specialty': return 'Specialty'
      case 'recent': return 'Recent'
      default: return ''
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "pl-10 pr-12 h-12 text-base transition-all duration-200",
            isFocused && "ring-2 ring-blue-500 border-blue-500"
          )}
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isSearching && (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
        >
          {displaySuggestions.length > 0 ? (
            <>
              {value.length === 0 && recentSearches.length > 0 && (
                <div className="px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                  Recent Searches
                </div>
              )}
              {displaySuggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.value}`}
                  className={cn(
                    "w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors border-b border-gray-100 last:border-b-0",
                    selectedIndex === index && "bg-blue-50 border-blue-100"
                  )}
                  onClick={() => handleSuggestionClick(suggestion.value)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {getSuggestionIcon(suggestion.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.value}
                      </span>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {getSuggestionLabel(suggestion.type)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for advisor names, locations, or specialties</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}