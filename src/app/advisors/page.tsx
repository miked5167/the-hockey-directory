import { Suspense } from 'react'
import { AdvisorBrowser } from './components/AdvisorBrowser'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Star, Crown, Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Hockey Advisors Directory - Find Verified Hockey Mentors',
  description: 'Connect with verified hockey advisors specializing in youth development, college recruitment, and skill building. Browse 300+ certified professionals.',
  keywords: 'hockey advisors, hockey mentors, youth hockey development, college recruitment, hockey coaches',
}

function DirectoryStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="flex items-center p-6">
          <Users className="h-8 w-8 text-ice-600 mr-3" />
          <div>
            <p className="text-2xl font-bold">300+</p>
            <p className="text-sm text-gray-600">Verified Advisors</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <Star className="h-8 w-8 text-yellow-500 mr-3" />
          <div>
            <p className="text-2xl font-bold">4.8</p>
            <p className="text-sm text-gray-600">Average Rating</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <Sparkles className="h-8 w-8 text-amber-500 mr-3" />
          <div>
            <p className="text-2xl font-bold">150+</p>
            <p className="text-sm text-gray-600">Featured Advisors</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="flex items-center p-6">
          <Crown className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <p className="text-2xl font-bold">50+</p>
            <p className="text-sm text-gray-600">Premium Partners</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DirectoryHeader() {
  return (
    <div className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Find the Perfect Hockey Advisor
      </h1>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Connect with verified hockey professionals who specialize in helping young players (ages 13-15) 
        develop their skills, navigate recruitment, and achieve their hockey dreams.
      </p>
    </div>
  )
}

export default function AdvisorsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <DirectoryHeader />
          <DirectoryStats />
        </div>
      </section>

      {/* Directory Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="lg:col-span-3">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-6 bg-gray-200 rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        }>
          <AdvisorBrowser />
        </Suspense>
      </section>
    </div>
  )
}