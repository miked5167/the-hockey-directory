import { Suspense } from 'react'
import { SearchResults } from './components/SearchResults'
import { SearchFilters } from './components/SearchFilters'
import { Card, CardContent } from '@/components/ui/card'

export const metadata = {
  title: 'Search Hockey Directory - Find Advisors, Coaches & Resources',
  description: 'Search our comprehensive hockey directory to find verified advisors, experienced coaches, tournaments, and prep schools for youth hockey development.',
  keywords: 'search hockey directory, find hockey advisors, hockey coaches, tournaments, prep schools',
}

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Search Hockey Directory
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find the perfect hockey advisor, coach, tournament, or prep school 
              for your player's development journey.
            </p>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Suspense fallback={
                <Card>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              }>
                <SearchFilters />
              </Suspense>
            </div>
          </div>

          {/* Main Search Results */}
          <div className="mt-8 lg:mt-0 lg:col-span-3">
            <Suspense fallback={
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-16 bg-gray-200 rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                        <div className="h-6 bg-gray-200 rounded w-24"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            }>
              <SearchResults />
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  )
}