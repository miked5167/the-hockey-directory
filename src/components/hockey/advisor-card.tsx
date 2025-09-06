import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { VerificationBadge, PremiumBadge, FeaturedBadge } from "@/components/ui/badge"
import { HighlightMatches } from "@/lib/search-highlight"
import { cn } from "@/lib/utils"
import { Heart, GitCompare } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"
import { useAdvisorComparison } from "@/hooks/use-advisor-comparison"
import type { Advisor } from "@prisma/client"

interface AdvisorCardProps {
  advisor: Advisor & {
    reviews?: { rating: number }[]
    _count?: { reviews: number }
  }
  layout: "premium" | "featured" | "basic"
  className?: string
  searchQuery?: string
}

const StarRating = ({ rating, count }: { rating: number; count?: number }) => (
  <div className="flex items-center gap-1">
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            "h-4 w-4",
            star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
          )}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
    {count && (
      <span className="text-sm text-muted-foreground">({count})</span>
    )}
  </div>
)

export function AdvisorCard({ advisor, layout, className, searchQuery = "" }: AdvisorCardProps) {
  const isPremium = layout === "premium"
  const isFeatured = layout === "featured"
  const { isFavorited, toggleFavorite } = useFavorites()
  const { toggleComparison, isInComparison } = useAdvisorComparison()
  
  const averageRating = advisor.reviews?.length 
    ? advisor.reviews.reduce((acc, r) => acc + r.rating, 0) / advisor.reviews.length
    : 0

  const isAdvisorFavorited = isFavorited(advisor.id)
  const isAdvisorInComparison = isInComparison(advisor.id)

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite({
      id: advisor.id,
      name: advisor.fullName,
      location: `${advisor.city}, ${advisor.province}`,
      specialties: advisor.specialties || '',
      rating: averageRating,
      headshotUrl: advisor.headshotUrl
    })
  }

  const handleToggleComparison = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Convert advisor to AdvisorWithSubscriptionPlan format
    toggleComparison({
      ...advisor,
      subscription: null // Will be populated from actual data
    })
  }

  const cardClasses = cn(
    "group relative overflow-hidden transition-all duration-300",
    "hover:shadow-lg hover:-translate-y-1",
    {
      // Premium styling with gradient background
      "bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 shadow-md": isPremium,
      // Featured styling with gold accent
      "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm": isFeatured,
      // Basic clean styling
      "bg-white border-gray-200 hover:shadow-md": !isPremium && !isFeatured,
    },
    className
  )

  const specialties = advisor.specialties ? advisor.specialties.split(',').slice(0, 3) : []

  return (
    <Card className={cardClasses}>
      {/* Premium/Featured indicator ribbon */}
      {isPremium && (
        <div className="absolute top-3 right-20 z-10">
          <PremiumBadge />
        </div>
      )}
      {isFeatured && !isPremium && (
        <div className="absolute top-3 right-20 z-10">
          <FeaturedBadge />
        </div>
      )}

      {/* Action buttons in top-right */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {/* Compare button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleComparison}
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-110",
            isAdvisorInComparison 
              ? "text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200" 
              : "text-gray-400 hover:text-blue-500 bg-white/80 hover:bg-blue-50 border border-gray-200 hover:border-blue-200"
          )}
        >
          <GitCompare className={cn(
            "h-4 w-4 transition-all duration-200",
            isAdvisorInComparison && "fill-current"
          )} />
        </Button>

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggleFavorite}
          className={cn(
            "h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-110",
            isAdvisorFavorited 
              ? "text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200" 
              : "text-gray-400 hover:text-red-500 bg-white/80 hover:bg-red-50 border border-gray-200 hover:border-red-200"
          )}
        >
          <Heart className={cn(
            "h-4 w-4 transition-all duration-200",
            isAdvisorFavorited && "fill-current"
          )} />
        </Button>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Advisor photo */}
          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={advisor.headshotUrl || "/placeholder-avatar.jpg"}
              alt={advisor.fullName}
              fill
              className="rounded-full object-cover"
              sizes="64px"
            />
            {advisor.isVerified && (
              <div className="absolute -bottom-1 -right-1">
                <VerificationBadge />
              </div>
            )}
          </div>

          {/* Name and basic info */}
          <div className="min-w-0 flex-1">
            <h3 className={cn(
              "font-semibold truncate",
              isPremium ? "text-purple-900" : isFeatured ? "text-amber-900" : "text-gray-900",
              "text-lg leading-6"
            )}>
              <HighlightMatches text={advisor.fullName} searchQuery={searchQuery} />
            </h3>
            
            {averageRating > 0 && (
              <StarRating 
                rating={Math.round(averageRating)} 
                count={advisor._count?.reviews} 
              />
            )}

            <p className="text-sm text-muted-foreground mt-1">
              <HighlightMatches text={`${advisor.city}, ${advisor.province}`} searchQuery={searchQuery} />
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <span
                  key={specialty}
                  className={cn(
                    "px-2 py-1 text-xs rounded-full border",
                    isPremium ? "bg-purple-100 text-purple-700 border-purple-200" :
                    isFeatured ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-gray-100 text-gray-700 border-gray-200"
                  )}
                >
                  {specialty.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bio excerpt */}
        {advisor.bio && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {advisor.bio}
          </p>
        )}

        {/* Experience and key stats */}
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          {advisor.yearsOfExperience && (
            <span>{advisor.yearsOfExperience} years experience</span>
          )}
          {advisor.responseTimeMs && (
            <span>
              Responds in {Math.round(advisor.responseTimeMs / (1000 * 60 * 60))}h
            </span>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            View Profile
          </Button>
          <Button 
            size="sm" 
            className={cn(
              "flex-1",
              isPremium ? "bg-purple-600 hover:bg-purple-700" :
              isFeatured ? "bg-amber-600 hover:bg-amber-700" :
              "bg-blue-600 hover:bg-blue-700"
            )}
          >
            Contact
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}