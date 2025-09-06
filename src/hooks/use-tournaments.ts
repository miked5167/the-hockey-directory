import { useQuery } from '@tanstack/react-query'
import { prisma } from '@/lib/database'
import { searchTournaments } from '@/lib/search'
import { dateRanges, validators } from '@/lib/date-utils'
import type { Tournament } from '@prisma/client'

// Query keys
export const tournamentKeys = {
  all: ['tournaments'] as const,
  upcoming: () => [...tournamentKeys.all, 'upcoming'] as const,
  search: (query?: string, filters?: any) => [...tournamentKeys.all, 'search', query, filters] as const,
  byId: (id: string) => [...tournamentKeys.all, id] as const,
}

// Fetch upcoming tournaments
export function useUpcomingTournaments(limit?: number) {
  return useQuery({
    queryKey: tournamentKeys.upcoming(),
    queryFn: async (): Promise<Tournament[]> => {
      const range = dateRanges.getUpcomingTournamentsRange()
      
      return prisma.tournament.findMany({
        where: {
          startDate: {
            gte: range.start,
            lte: range.end
          },
          status: 'upcoming'
        },
        orderBy: { startDate: 'asc' },
        ...(limit && { take: limit })
      })
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

// Search tournaments with filters
export function useTournamentSearch(
  query?: string,
  filters?: {
    location?: string
    ageGroups?: string[]
    startDate?: Date
    endDate?: Date
    maxEntryFee?: number
  }
) {
  return useQuery({
    queryKey: tournamentKeys.search(query, filters),
    queryFn: async (): Promise<Tournament[]> => {
      // Build where clause for database query
      const whereClause: any = {
        status: 'upcoming'
      }

      // Date filters
      if (filters?.startDate) {
        whereClause.startDate = { gte: filters.startDate }
      }
      if (filters?.endDate) {
        whereClause.endDate = { lte: filters.endDate }
      }

      // Entry fee filter
      if (filters?.maxEntryFee) {
        whereClause.entryFee = { lte: filters.maxEntryFee }
      }

      // Location filter
      if (filters?.location) {
        whereClause.location = {
          contains: filters.location,
          mode: 'insensitive'
        }
      }

      // Get tournaments from database
      const tournaments = await prisma.tournament.findMany({
        where: whereClause,
        orderBy: { startDate: 'asc' }
      })

      // If there's a search query, use Fuse.js for fuzzy search
      if (query && query.length >= 2) {
        const searchResults = searchTournaments(tournaments, query)
        return searchResults.map(result => result.item)
      }

      // Filter by age groups (stored as JSON)
      if (filters?.ageGroups && filters.ageGroups.length > 0) {
        return tournaments.filter(tournament => {
          if (!tournament.ageGroups) return false
          
          try {
            const tournamentAgeGroups = JSON.parse(tournament.ageGroups) as string[]
            return filters.ageGroups!.some(ageGroup => 
              tournamentAgeGroups.includes(ageGroup)
            )
          } catch {
            return false
          }
        })
      }

      return tournaments
    },
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get tournament by ID
export function useTournament(id: string) {
  return useQuery({
    queryKey: tournamentKeys.byId(id),
    queryFn: async () => {
      return prisma.tournament.findUnique({
        where: { id }
      })
    },
    enabled: !!id,
  })
}

// Get tournaments by status
export function useTournamentsByStatus(status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled') {
  return useQuery({
    queryKey: [...tournamentKeys.all, 'status', status],
    queryFn: async (): Promise<Tournament[]> => {
      return prisma.tournament.findMany({
        where: { status },
        orderBy: { startDate: status === 'completed' ? 'desc' : 'asc' }
      })
    },
    staleTime: 1000 * 60 * 30, // 30 minutes (status changes infrequently)
  })
}

// Get tournaments with open registration
export function useOpenRegistrationTournaments(limit?: number) {
  return useQuery({
    queryKey: [...tournamentKeys.all, 'open-registration'],
    queryFn: async (): Promise<Tournament[]> => {
      const now = new Date()
      
      const tournaments = await prisma.tournament.findMany({
        where: {
          status: 'upcoming',
          registrationDeadline: { gte: now },
          startDate: { gt: now }
        },
        orderBy: { registrationDeadline: 'asc' },
        ...(limit && { take: limit })
      })

      // Additional validation using our date utilities
      return tournaments.filter(tournament => 
        validators.isTournamentOpen(
          tournament.registrationDeadline || tournament.startDate,
          tournament.startDate
        )
      )
    },
    staleTime: 1000 * 60 * 5, // 5 minutes (registration status changes more frequently)
  })
}