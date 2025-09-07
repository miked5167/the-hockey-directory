import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdvisorWithSubscriptionPlan } from '@/lib/business/featured-listings'

// Query keys for React Query
export const advisorKeys = {
  all: ['advisors'] as const,
  featured: () => [...advisorKeys.all, 'featured'] as const,
  search: (query?: string, filters?: any) => [...advisorKeys.all, 'search', query, filters] as const,
  byId: (id: string) => [...advisorKeys.all, id] as const,
}

// Fetch all advisors with priority sorting
export function useAdvisors(filters?: {
  location?: string
  specialties?: string[]
  verified?: boolean
}) {
  return useQuery({
    queryKey: advisorKeys.search('', filters),
    queryFn: async (): Promise<AdvisorWithSubscriptionPlan[]> => {
      const params = new URLSearchParams()
      if (filters?.location) params.set('location', filters.location)
      if (filters?.specialties) params.set('specialties', filters.specialties.join(','))
      if (filters?.verified) params.set('verified', 'true')
      
      const response = await fetch(`/api/advisors?${params}`)
      if (!response.ok) throw new Error('Failed to fetch advisors')
      const data = await response.json()
      return data.advisors
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Fetch featured advisors only
export function useFeaturedAdvisors(limit?: number) {
  return useQuery({
    queryKey: advisorKeys.featured(),
    queryFn: async (): Promise<AdvisorWithSubscriptionPlan[]> => {
      const params = new URLSearchParams()
      params.set('featured', 'true')
      if (limit) params.set('limit', limit.toString())
      
      const response = await fetch(`/api/advisors?${params}`)
      if (!response.ok) throw new Error('Failed to fetch featured advisors')
      const data = await response.json()
      return data.advisors
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (featured listings change less frequently)
  })
}

// Search advisors with business logic
export function useAdvisorSearch(
  query?: string,
  filters?: {
    location?: string
    specialties?: string[]
    minRating?: number
  },
  limit?: number
) {
  return useQuery({
    queryKey: advisorKeys.search(query, filters),
    queryFn: async (): Promise<AdvisorWithSubscriptionPlan[]> => {
      if (!query || query.length < 2) {
        return getAdvisorsByPriority({ 
          location: filters?.location,
          specialties: filters?.specialties,
          verified: true 
        })
      }
      return searchAdvisorsWithPriority(query, filters, limit)
    },
    enabled: true, // Always enabled to show default results
    staleTime: 1000 * 60 * 2, // 2 minutes (search results are more dynamic)
  })
}

// Get single advisor by ID
export function useAdvisor(id: string) {
  return useQuery({
    queryKey: advisorKeys.byId(id),
    queryFn: async () => {
      return prisma.advisor.findUnique({
        where: { id },
        include: {
          subscription: {
            include: { plan: true }
          },
          reviews: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })
    },
    enabled: !!id,
  })
}

// Contact advisor mutation (creates a lead)
export function useContactAdvisor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      advisorId: string
      parentName: string
      parentEmail: string
      parentPhone?: string
      playerName?: string
      playerAge?: number
      location?: string
      message?: string
    }) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to contact advisor')
      }

      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch advisor data to update lead counts
      queryClient.invalidateQueries({ queryKey: advisorKeys.all })
    },
    onError: (error) => {
      console.error('Failed to contact advisor:', error)
    },
  })
}

// Add review mutation
export function useAddReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      advisorId: string
      parentName: string
      rating: number
      title?: string
      comment?: string
    }) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add review')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate advisor data to update ratings
      queryClient.invalidateQueries({ queryKey: advisorKeys.byId(variables.advisorId) })
      queryClient.invalidateQueries({ queryKey: advisorKeys.all })
    },
  })
}