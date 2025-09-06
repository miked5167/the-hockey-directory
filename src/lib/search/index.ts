import Fuse from 'fuse.js'
import type { Advisor, Coach, Tournament, PrepSchool, Arena } from '@prisma/client'
import { parseJsonField } from '../business'

// Search configuration for different entity types
export const SEARCH_OPTIONS = {
  advisor: {
    keys: [
      { name: 'name', weight: 0.3 },
      { name: 'bio', weight: 0.2 },
      { name: 'location', weight: 0.2 },
      { name: 'specialties', weight: 0.15 },
      { name: 'certifications', weight: 0.1 },
      { name: 'website', weight: 0.05 }
    ],
    threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  },
  coach: {
    keys: [
      { name: 'name', weight: 0.3 },
      { name: 'bio', weight: 0.2 },
      { name: 'location', weight: 0.2 },
      { name: 'coachingLevel', weight: 0.15 },
      { name: 'teamAffiliation', weight: 0.1 },
      { name: 'certifications', weight: 0.05 }
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  },
  tournament: {
    keys: [
      { name: 'name', weight: 0.3 },
      { name: 'description', weight: 0.2 },
      { name: 'location', weight: 0.2 },
      { name: 'ageGroups', weight: 0.15 },
      { name: 'divisions', weight: 0.15 }
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  },
  prepSchool: {
    keys: [
      { name: 'name', weight: 0.3 },
      { name: 'description', weight: 0.2 },
      { name: 'location', weight: 0.2 },
      { name: 'hockeyProgram', weight: 0.15 },
      { name: 'grades', weight: 0.1 },
      { name: 'facilities', weight: 0.05 }
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  },
  arena: {
    keys: [
      { name: 'name', weight: 0.3 },
      { name: 'description', weight: 0.2 },
      { name: 'location', weight: 0.2 },
      { name: 'address', weight: 0.15 },
      { name: 'facilities', weight: 0.15 }
    ],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2
  }
} as const

export type SearchEntityType = keyof typeof SEARCH_OPTIONS
export type SearchResult<T> = Fuse.FuseResult<T>

// Transform data for better searching (parse JSON fields)
function transformAdvisorForSearch(advisor: Advisor) {
  return {
    ...advisor,
    specialties: parseJsonField<string>(advisor.specialties).join(' '),
    certifications: parseJsonField<string>(advisor.certifications).join(' ')
  }
}

function transformCoachForSearch(coach: Coach) {
  return {
    ...coach,
    certifications: parseJsonField<string>(coach.certifications).join(' ')
  }
}

function transformTournamentForSearch(tournament: Tournament) {
  return {
    ...tournament,
    ageGroups: parseJsonField<string>(tournament.ageGroups).join(' '),
    divisions: parseJsonField<string>(tournament.divisions).join(' ')
  }
}

function transformPrepSchoolForSearch(prepSchool: PrepSchool) {
  return {
    ...prepSchool,
    grades: parseJsonField<string>(prepSchool.grades).join(' '),
    facilities: parseJsonField<string>(prepSchool.facilities).join(' ')
  }
}

function transformArenaForSearch(arena: Arena) {
  return {
    ...arena,
    facilities: parseJsonField<string>(arena.facilities).join(' ')
  }
}

// Search functions for each entity type
export function searchAdvisors(
  advisors: Advisor[],
  query: string,
  options?: Partial<typeof SEARCH_OPTIONS.advisor>
): SearchResult<Advisor>[] {
  const transformedData = advisors.map(transformAdvisorForSearch)
  const fuse = new Fuse(transformedData, { ...SEARCH_OPTIONS.advisor, ...options })
  return fuse.search(query)
}

export function searchCoaches(
  coaches: Coach[],
  query: string,
  options?: Partial<typeof SEARCH_OPTIONS.coach>
): SearchResult<Coach>[] {
  const transformedData = coaches.map(transformCoachForSearch)
  const fuse = new Fuse(transformedData, { ...SEARCH_OPTIONS.coach, ...options })
  return fuse.search(query)
}

export function searchTournaments(
  tournaments: Tournament[],
  query: string,
  options?: Partial<typeof SEARCH_OPTIONS.tournament>
): SearchResult<Tournament>[] {
  const transformedData = tournaments.map(transformTournamentForSearch)
  const fuse = new Fuse(transformedData, { ...SEARCH_OPTIONS.tournament, ...options })
  return fuse.search(query)
}

export function searchPrepSchools(
  prepSchools: PrepSchool[],
  query: string,
  options?: Partial<typeof SEARCH_OPTIONS.prepSchool>
): SearchResult<PrepSchool>[] {
  const transformedData = prepSchools.map(transformPrepSchoolForSearch)
  const fuse = new Fuse(transformedData, { ...SEARCH_OPTIONS.prepSchool, ...options })
  return fuse.search(query)
}

export function searchArenas(
  arenas: Arena[],
  query: string,
  options?: Partial<typeof SEARCH_OPTIONS.arena>
): SearchResult<Arena>[] {
  const transformedData = arenas.map(transformArenaForSearch)
  const fuse = new Fuse(transformedData, { ...SEARCH_OPTIONS.arena, ...options })
  return fuse.search(query)
}

// Universal search function
export function universalSearch<T>(
  data: T[],
  query: string,
  entityType: SearchEntityType,
  options?: Partial<Fuse.IFuseOptions<T>>
): SearchResult<T>[] {
  const searchOptions = SEARCH_OPTIONS[entityType]
  const fuse = new Fuse(data, { ...searchOptions, ...options })
  return fuse.search(query)
}

// Advanced search with filters
export interface SearchFilters {
  location?: string
  minRating?: number
  maxDistance?: number // Future feature
  verified?: boolean
  priceRange?: [number, number] // For prep schools, tournaments
  ageGroups?: string[] // For tournaments
  facilities?: string[] // For arenas, prep schools
}

export function searchWithFilters<T extends Record<string, any>>(
  data: T[],
  query: string,
  entityType: SearchEntityType,
  filters: SearchFilters = {}
): SearchResult<T>[] {
  // First apply filters
  let filteredData = data

  if (filters.location) {
    filteredData = filteredData.filter(item => 
      item.location?.toLowerCase().includes(filters.location!.toLowerCase())
    )
  }

  if (filters.minRating && 'rating' in data[0]) {
    filteredData = filteredData.filter(item => 
      (item.rating || 0) >= filters.minRating!
    )
  }

  if (filters.verified !== undefined && 'verified' in data[0]) {
    filteredData = filteredData.filter(item => 
      item.verified === filters.verified
    )
  }

  // Then perform fuzzy search on filtered data
  return universalSearch(filteredData, query, entityType)
}

// Search suggestions based on partial input
export function getSearchSuggestions(
  data: any[],
  query: string,
  entityType: SearchEntityType,
  limit = 5
): string[] {
  if (!query || query.length < 2) return []

  const results = universalSearch(data, query, entityType, { 
    threshold: 0.6,
    limit 
  })

  return results.map(result => result.item.name).slice(0, limit)
}