import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  )
}

// Advisor card skeleton
export function AdvisorCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>

      {/* Specialties */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>

      {/* Stats */}
      <div className="flex justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  )
}

// Search skeleton
export function SearchSkeleton() {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-12 w-32" />
          <Skeleton className="h-12 w-20" />
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
}

// Directory grid skeleton
export function DirectoryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <AdvisorCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  }

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-gray-300 border-t-blue-600",
        sizeClasses[size],
        className
      )}
    />
  )
}

// Full page loading
export function FullPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading The Hockey Directory
        </h2>
        <p className="text-gray-600">
          Finding the best hockey advisors for you...
        </p>
      </div>
    </div>
  )
}

// Inline loading with message
interface InlineLoadingProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InlineLoading({ 
  message = "Loading...", 
  size = 'sm',
  className 
}: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  )
}

// Progressive loading container
interface ProgressiveLoadingProps {
  isLoading: boolean
  error?: Error | null
  isEmpty?: boolean
  emptyMessage?: string
  children: React.ReactNode
  skeleton?: React.ReactNode
}

export function ProgressiveLoading({
  isLoading,
  error,
  isEmpty,
  emptyMessage = "No items found",
  children,
  skeleton = <DirectoryGridSkeleton />
}: ProgressiveLoadingProps) {
  if (isLoading) {
    return <>{skeleton}</>
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-2">⚠️ Error loading content</div>
        <p className="text-gray-600">{error.message}</p>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}

// Lazy loading container with intersection observer
interface LazyLoadProps {
  children: React.ReactNode
  placeholder?: React.ReactNode
  rootMargin?: string
  threshold?: number
  onInView?: () => void
}

export function LazyLoad({
  children,
  placeholder = <Skeleton className="h-32 w-full" />,
  rootMargin = "50px",
  threshold = 0.1,
  onInView
}: LazyLoadProps) {
  const [isInView, setIsInView] = React.useState(false)
  const [hasBeenInView, setHasBeenInView] = React.useState(false)
  const elementRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          setHasBeenInView(true)
          onInView?.()
        } else {
          setIsInView(false)
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [rootMargin, threshold, onInView])

  return (
    <div ref={elementRef}>
      {hasBeenInView ? children : placeholder}
    </div>
  )
}

// Staggered animation container
interface StaggeredAnimationProps {
  children: React.ReactNode[]
  delay?: number
  className?: string
}

export function StaggeredAnimation({ 
  children, 
  delay = 100,
  className 
}: StaggeredAnimationProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-in fade-in-0 slide-in-from-bottom-4"
          style={{
            animationDelay: `${index * delay}ms`,
            animationFillMode: 'both'
          }}
        >
          {child}
        </div>
      ))}
    </div>
  )
}