"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface HeroProps {
  className?: string
}

const trustStats = [
  { number: "500+", label: "Verified Advisors" },
  { number: "10K+", label: "Successful Connections" },
  { number: "98%", label: "Parent Satisfaction" },
  { number: "24hr", label: "Average Response" },
]

export function Hero({ className }: HeroProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to advisors page with search query
      const searchParams = new URLSearchParams()
      searchParams.set('search', searchQuery.trim())
      router.push(`/advisors?${searchParams.toString()}`)
    } else {
      // Navigate to advisors page without search
      router.push('/advisors')
    }
  }

  return (
    <section className={cn(
      "relative bg-gradient-to-br from-blue-50 via-white to-blue-50 py-20 lg:py-32",
      className
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-blue-600 block">Hockey Advisor</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Connect with verified hockey advisors, coaches, and experts who understand your goals. 
            From skill development to college prep, find the right guidance for your hockey journey.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-12">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Search by specialty, location, or advisor name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500"
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Search Advisors
              </Button>
            </div>
          </form>

          {/* Trust indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto mb-12">
            {trustStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Popular searches */}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "Skill Development",
                "College Prep",
                "Goalie Training", 
                "Mental Training",
                "Skating Coach",
                "Youth Hockey"
              ].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term)
                    const searchParams = new URLSearchParams()
                    searchParams.set('search', term)
                    router.push(`/advisors?${searchParams.toString()}`)
                  }}
                  className="px-3 py-1 text-xs bg-white border border-gray-200 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Call to action for advisors */}
          <div className="mt-16 p-6 bg-blue-600 rounded-2xl text-white max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold mb-2">
              Are you a hockey professional?
            </h3>
            <p className="text-blue-100 mb-4">
              Join our network of verified advisors and connect with families seeking your expertise.
            </p>
            <Button variant="secondary" size="lg">
              List Your Services
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}