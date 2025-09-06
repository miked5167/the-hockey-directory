'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Star, ThumbsUp, CheckCircle, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Review } from '@prisma/client'

interface AdvisorReviewsProps {
  advisorId: string
  reviews: Review[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ice-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-ice-700">
                {review.parentName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.parentName}</span>
                {review.verified && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <StarRating rating={review.rating} />
                <span>•</span>
                <span>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          {review.verified && (
            <Badge variant="secondary" className="bg-green-50 text-green-700">
              Verified
            </Badge>
          )}
        </div>

        {review.title && (
          <h4 className="font-medium mb-2">{review.title}</h4>
        )}

        {review.comment && (
          <p className="text-gray-700 leading-relaxed mb-3">
            {review.comment}
          </p>
        )}

        {review.helpful > 0 && (
          <div className="flex items-center text-sm text-gray-500">
            <ThumbsUp className="h-4 w-4 mr-1" />
            <span>{review.helpful} people found this helpful</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ReviewStats({ reviews }: { reviews: Review[] }) {
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : 0

  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  }

  const verifiedCount = reviews.filter(r => r.verified).length

  if (totalReviews === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6 text-center">
          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500">
            Be the first to leave a review for this advisor.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Review Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {averageRating.toFixed(1)}
            </div>
            <StarRating rating={Math.round(averageRating)} />
            <div className="text-sm text-gray-500 mt-1">
              {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="flex-1 ml-8">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating as keyof typeof ratingDistribution]
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

              return (
                <div key={rating} className="flex items-center mb-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 ml-1 mr-2" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 ml-2 w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {verifiedCount > 0 && (
          <>
            <Separator />
            <div className="pt-4 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-sm text-gray-600">
                {verifiedCount} of {totalReviews} reviews are verified
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function AdvisorReviews({ advisorId, reviews }: AdvisorReviewsProps) {
  const [filter, setFilter] = useState<'all' | 'verified'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'rating'>('newest')

  // Filter reviews
  const filteredReviews = reviews.filter(review => 
    filter === 'all' || review.verified
  )

  // Sort reviews
  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'rating':
        return b.rating - a.rating
      default:
        return 0
    }
  })

  const verifiedCount = reviews.filter(r => r.verified).length

  return (
    <div className="space-y-6">
      {/* Review Statistics */}
      <ReviewStats reviews={reviews} />

      {reviews.length > 0 && (
        <>
          {/* Filters and Sorting */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All Reviews ({reviews.length})
              </Button>
              {verifiedCount > 0 && (
                <Button
                  variant={filter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('verified')}
                >
                  Verified Only ({verifiedCount})
                </Button>
              )}
            </div>

            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 border rounded-md text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="rating">Highest Rating</option>
            </select>
          </div>

          {/* Reviews List */}
          <div>
            {sortedReviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No reviews match the selected filter.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setFilter('all')}
                  className="mt-4"
                >
                  Show All Reviews
                </Button>
              </div>
            ) : (
              sortedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}