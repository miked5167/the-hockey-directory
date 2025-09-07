import { Hero } from "@/components/hockey/hero"
import { AdvisorCard } from "@/components/hockey/advisor-card"
import { Grid } from "@/components/ui/grid"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Find Hockey Advisors & Coaches | The Hockey Directory",
  description: "Connect with 500+ verified hockey advisors, coaches, and development experts. From skill development to college prep, find the perfect guidance for your hockey journey.",
  keywords: "hockey advisors, hockey coaches, youth hockey development, college prep, skill training, hockey mentors, verified advisors, hockey directory",
  openGraph: {
    title: "Find Your Perfect Hockey Advisor | The Hockey Directory",
    description: "Connect with verified hockey advisors and coaches. 98% parent satisfaction, 24hr response time. Browse 500+ qualified professionals.",
    type: "website",
    url: "https://thehockeydirectory.com",
    siteName: "The Hockey Directory",
    images: [
      {
        url: "/og-image-homepage.jpg",
        width: 1200,
        height: 630,
        alt: "The Hockey Directory - Find Hockey Advisors & Coaches"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Your Perfect Hockey Advisor | The Hockey Directory", 
    description: "Connect with verified hockey advisors and coaches. 98% parent satisfaction, 24hr response time.",
    images: ["/og-image-homepage.jpg"]
  },
  alternates: {
    canonical: "https://thehockeydirectory.com"
  }
}

// Icons for How It Works section
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const MessageIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
)

const TrophyIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
)

const StarFilledIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

// Mock data for featured advisors (will be replaced with database query)
const featuredAdvisors = [
  {
    id: "1",
    name: "Sarah Johnson",
    slug: "sarah-johnson",
    bio: "Former NCAA Division I player with 8 years of coaching experience. Specializes in skill development and college recruitment guidance.",
    specialties: "Skill Development, College Prep, Mental Training",
    city: "Toronto",
    province: "ON",
    country: "CA",
    yearsExperience: 8,
    verified: true,
    headshot: "/placeholder-avatar.svg",
    responseTimeMs: 3600000, // 1 hour
    completeness: 95,
    reviews: [
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
    ],
    _count: { reviews: 3 },
    planId: null,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Mike Chen",
    slug: "mike-chen",
    bio: "Professional goalie coach working with junior and college players. Former OHL goaltender with professional experience.",
    specialties: "Goalie Training, Technical Skills, Mental Training",
    city: "Calgary",
    province: "AB",
    country: "CA",
    yearsExperience: 12,
    verified: true,
    headshot: "/placeholder-avatar.svg",
    responseTimeMs: 7200000, // 2 hours
    completeness: 98,
    reviews: [
      { rating: 5 },
      { rating: 5 },
      { rating: 5 },
      { rating: 4 },
    ],
    _count: { reviews: 4 },
    planId: null,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Jennifer Davis",
    slug: "jennifer-davis",
    bio: "Skills and conditioning coach with focus on youth development. Former university player turned development specialist.",
    specialties: "Youth Development, Conditioning, Skating",
    city: "Vancouver",
    province: "BC", 
    country: "CA",
    yearsExperience: 6,
    verified: true,
    headshot: "/placeholder-avatar.svg",
    responseTimeMs: 1800000, // 30 minutes
    completeness: 90,
    reviews: [
      { rating: 5 },
      { rating: 4 },
    ],
    _count: { reviews: 2 },
    planId: null,
    userId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <Hero />

      {/* Featured Advisors Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Hockey Advisors
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with our top-rated, verified advisors who are ready to help 
              take your hockey development to the next level.
            </p>
          </div>

          <Grid 
            cols={{ mobile: 1, tablet: 2, desktop: 3 }}
            gap="lg"
            className="mb-12"
          >
            {featuredAdvisors.map((advisor, index) => (
              <AdvisorCard
                key={advisor.id}
                advisor={advisor}
                layout={index === 0 ? "premium" : index === 1 ? "featured" : "basic"}
              />
            ))}
          </Grid>

          <div className="text-center">
            <Button asChild size="lg">
              <Link href="/advisors">
                View All Advisors
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Getting started with The Hockey Directory is simple. 
              Find, connect, and grow with the right advisor for your goals.
            </p>
          </div>

          <Grid 
            cols={{ mobile: 1, tablet: 3, desktop: 3 }}
            gap="lg"
            className="relative"
          >
            {/* Step 1: Search & Browse */}
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <SearchIcon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Search & Browse</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse our directory of <span className="font-semibold text-blue-600">500+ verified</span> hockey 
                advisors by specialty, location, or experience level.
              </p>
            </div>

            {/* Connection Arrow (hidden on mobile) */}
            <div className="hidden md:block absolute top-10 left-1/3 transform -translate-x-1/2">
              <ArrowRightIcon className="w-8 h-8 text-blue-300" />
            </div>

            {/* Step 2: Connect */}
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MessageIcon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Connect Instantly</h3>
              <p className="text-gray-600 leading-relaxed">
                Reach out directly to advisors that match your needs. 
                <span className="font-semibold text-green-600">98% respond within 24 hours.</span>
              </p>
            </div>

            {/* Connection Arrow (hidden on mobile) */}
            <div className="hidden md:block absolute top-10 left-2/3 transform -translate-x-1/2">
              <ArrowRightIcon className="w-8 h-8 text-green-300" />
            </div>

            {/* Step 3: Grow */}
            <div className="text-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Achieve Your Goals</h3>
              <p className="text-gray-600 leading-relaxed">
                Work with your chosen advisor to develop skills, navigate recruitment, 
                and <span className="font-semibold text-purple-600">achieve your hockey dreams.</span>
              </p>
            </div>
          </Grid>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <p className="text-gray-600 mb-6">Ready to find your perfect hockey advisor?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href="/advisors">
                  Browse All Advisors
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/list-your-services">
                  Join as an Advisor
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Hockey Parents Say
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Real testimonials from families who found success through The Hockey Directory.
            </p>
          </div>

          <Grid cols={{ mobile: 1, tablet: 3, desktop: 3 }} gap="lg">
            {/* Testimonial 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarFilledIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "Sarah helped my son develop his skating technique and confidence. Within 6 months, he made the AAA team. Couldn't be happier with the guidance we received!"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-semibold text-sm">MK</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Michael K.</div>
                  <div className="text-sm text-gray-500">Parent from Toronto</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarFilledIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "The college prep guidance was invaluable. My daughter got recruited to her dream school. The advisor's connections and expertise made all the difference."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-green-600 font-semibold text-sm">JL</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Jennifer L.</div>
                  <div className="text-sm text-gray-500">Parent from Calgary</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarFilledIcon key={i} className="w-5 h-5 text-yellow-400" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "Professional, verified advisors who truly care about player development. The mental training aspect was especially helpful for my son's performance."
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-purple-600 font-semibold text-sm">DR</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">David R.</div>
                  <div className="text-sm text-gray-500">Parent from Vancouver</div>
                </div>
              </div>
            </div>
          </Grid>

          {/* Trust Stats */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Trusted by Hockey Families Nationwide</h3>
              <p className="text-blue-100">Join thousands of families who have found success with our verified advisors</p>
            </div>
            
            <Grid cols={{ mobile: 2, tablet: 4, desktop: 4 }} gap="md">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">98%</div>
                <div className="text-blue-100 text-sm">Parent Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">24hr</div>
                <div className="text-blue-100 text-sm">Avg Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">500+</div>
                <div className="text-blue-100 text-sm">Success Stories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">75%</div>
                <div className="text-blue-100 text-sm">Make Team Goals</div>
              </div>
            </Grid>
          </div>
        </div>
      </section>

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "The Hockey Directory",
            "description": "Connect with verified hockey advisors, coaches, and development experts for skill training and college prep guidance.",
            "url": "https://thehockeydirectory.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://thehockeydirectory.com/advisors?search={search_term_string}",
              "query-input": "required name=search_term_string"
            },
            "provider": {
              "@type": "Organization",
              "name": "The Hockey Directory",
              "description": "The premier directory for connecting hockey families with verified advisors and coaches",
              "url": "https://thehockeydirectory.com",
              "sameAs": [
                "https://twitter.com/hockeydirectory",
                "https://facebook.com/thehockeydirectory",
                "https://linkedin.com/company/the-hockey-directory"
              ]
            },
            "mainEntity": {
              "@type": "Service",
              "name": "Hockey Advisory Services",
              "description": "Professional hockey coaching and development advisory services",
              "provider": {
                "@type": "Organization",
                "name": "The Hockey Directory"
              },
              "areaServed": ["Canada", "United States"],
              "serviceType": "Sports Coaching and Advisory",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1200",
                "bestRating": "5",
                "worstRating": "1"
              }
            }
          })
        }}
      />
    </div>
  )
}