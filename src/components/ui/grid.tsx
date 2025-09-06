import { cn } from "@/lib/utils"
import { HTMLAttributes } from "react"

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: {
    mobile?: 1 | 2
    tablet?: 2 | 3 | 4
    desktop?: 3 | 4 | 5 | 6
    large?: 4 | 5 | 6 | 8
  }
  gap?: "sm" | "md" | "lg" | "xl"
}

const Grid = ({ 
  className, 
  cols = { mobile: 1, tablet: 2, desktop: 3, large: 4 },
  gap = "md",
  ...props 
}: GridProps) => {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4", 
    lg: "gap-6",
    xl: "gap-8"
  }

  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-2", 
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
    8: "grid-cols-8"
  }

  return (
    <div
      className={cn(
        "grid",
        gapClasses[gap],
        cols.mobile && colClasses[cols.mobile],
        cols.tablet && `sm:${colClasses[cols.tablet]}`,
        cols.desktop && `md:${colClasses[cols.desktop]}`, 
        cols.large && `lg:${colClasses[cols.large]}`,
        className
      )}
      {...props}
    />
  )
}

export { Grid }