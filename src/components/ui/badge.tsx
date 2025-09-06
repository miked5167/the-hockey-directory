import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        verified: 
          "border-transparent bg-green-50 text-green-700 hover:bg-green-100",
        premium:
          "border-transparent bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700",
        featured:
          "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600",
        tier:
          "border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode
}

function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon}
      {children}
    </div>
  )
}

// Hockey-specific badge components
const VerificationBadge = ({ className, ...props }: Omit<BadgeProps, 'variant'>) => (
  <Badge 
    variant="verified" 
    icon={<CheckCircleIcon />}
    className={className}
    {...props}
  >
    Verified
  </Badge>
)

const PremiumBadge = ({ className, ...props }: Omit<BadgeProps, 'variant'>) => (
  <Badge 
    variant="premium" 
    icon={<CrownIcon />}
    className={className}
    {...props}
  >
    Premium Partner
  </Badge>
)

const FeaturedBadge = ({ className, ...props }: Omit<BadgeProps, 'variant'>) => (
  <Badge 
    variant="featured" 
    icon={<StarIcon />}
    className={className}
    {...props}
  >
    Featured
  </Badge>
)

// Simple icons as components (placeholder until proper icon library is added)
const CheckCircleIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
)

const CrownIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 2h8v8H6V6z" clipRule="evenodd" />
  </svg>
)

const StarIcon = () => (
  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
)

export { Badge, badgeVariants, VerificationBadge, PremiumBadge, FeaturedBadge }
