'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

// Fade in animation
interface FadeInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 300,
  className,
  direction = 'up' 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const directionClasses = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: 'translate-x-4',
    right: '-translate-x-4',
    none: ''
  }

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible 
          ? 'opacity-100 translate-y-0 translate-x-0' 
          : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Scale animation
interface ScaleInProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  scale?: number
}

export function ScaleIn({ 
  children, 
  delay = 0, 
  duration = 200,
  className,
  scale = 0.95 
}: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible 
          ? 'opacity-100 scale-100' 
          : `opacity-0 scale-${Math.round(scale * 100)}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Staggered children animation
interface StaggeredChildrenProps {
  children: React.ReactNode[]
  delay?: number
  staggerDelay?: number
  className?: string
}

export function StaggeredChildren({ 
  children, 
  delay = 0,
  staggerDelay = 100,
  className 
}: StaggeredChildrenProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn key={index} delay={delay + index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  )
}

// Hover lift effect
interface HoverLiftProps {
  children: React.ReactNode
  className?: string
  liftHeight?: number
  duration?: number
}

export function HoverLift({ 
  children, 
  className, 
  liftHeight = 4,
  duration = 200 
}: HoverLiftProps) {
  return (
    <div
      className={cn(
        'transition-all ease-out hover:shadow-lg cursor-pointer',
        `hover:-translate-y-${liftHeight}`,
        className
      )}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {children}
    </div>
  )
}

// Pulse animation
interface PulseProps {
  children: React.ReactNode
  className?: string
  intensity?: 'subtle' | 'medium' | 'strong'
}

export function Pulse({ children, className, intensity = 'medium' }: PulseProps) {
  const intensityClasses = {
    subtle: 'animate-pulse opacity-70',
    medium: 'animate-pulse',
    strong: 'animate-ping'
  }

  return (
    <div className={cn(intensityClasses[intensity], className)}>
      {children}
    </div>
  )
}

// Slide in from direction
interface SlideInProps {
  children: React.ReactNode
  direction: 'left' | 'right' | 'top' | 'bottom'
  delay?: number
  duration?: number
  distance?: number
  className?: string
}

export function SlideIn({ 
  children, 
  direction, 
  delay = 0,
  duration = 300,
  distance = 50,
  className 
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const getInitialTransform = () => {
    switch (direction) {
      case 'left': return `translateX(-${distance}px)`
      case 'right': return `translateX(${distance}px)`
      case 'top': return `translateY(-${distance}px)`
      case 'bottom': return `translateY(${distance}px)`
    }
  }

  return (
    <div
      className={cn(
        'transition-all ease-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        transform: isVisible ? 'translate(0, 0)' : getInitialTransform(),
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

// Count up animation
interface CountUpProps {
  to: number
  from?: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

export function CountUp({ 
  to, 
  from = 0, 
  duration = 1000,
  className,
  suffix = '',
  prefix = ''
}: CountUpProps) {
  const [count, setCount] = useState(from)

  useEffect(() => {
    const increment = (to - from) / (duration / 16) // 60fps
    let current = from
    
    const timer = setInterval(() => {
      current += increment
      if (current >= to) {
        setCount(to)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [to, from, duration])

  return (
    <span className={className}>
      {prefix}{count}{suffix}
    </span>
  )
}

// Typewriter effect
interface TypewriterProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  cursor?: boolean
}

export function Typewriter({ 
  text, 
  speed = 50,
  delay = 0,
  className,
  cursor = true 
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    const startTimer = setTimeout(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(text.slice(0, currentIndex + 1))
          setCurrentIndex(currentIndex + 1)
        }, speed)

        return () => clearTimeout(timer)
      } else if (cursor) {
        // Blinking cursor after text is complete
        const cursorTimer = setInterval(() => {
          setShowCursor(prev => !prev)
        }, 500)

        return () => clearInterval(cursorTimer)
      }
    }, delay)

    return () => clearTimeout(startTimer)
  }, [currentIndex, text, speed, delay, cursor])

  return (
    <span className={className}>
      {displayText}
      {cursor && (currentIndex < text.length || showCursor) && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  )
}

// Attention grabber (wiggle, shake, etc.)
interface AttentionGrabberProps {
  children: React.ReactNode
  type?: 'wiggle' | 'shake' | 'bounce' | 'flash'
  trigger?: boolean
  className?: string
}

export function AttentionGrabber({ 
  children, 
  type = 'wiggle',
  trigger = false,
  className 
}: AttentionGrabberProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 1000)
      return () => clearTimeout(timer)
    }
  }, [trigger])

  const animationClasses = {
    wiggle: 'animate-wiggle',
    shake: 'animate-shake', 
    bounce: 'animate-bounce',
    flash: 'animate-pulse'
  }

  return (
    <div className={cn(
      isAnimating && animationClasses[type],
      className
    )}>
      {children}
    </div>
  )
}

// Loading dots
interface LoadingDotsProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export function LoadingDots({ 
  className, 
  size = 'md',
  color = 'bg-blue-600' 
}: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'h-1 w-1',
    md: 'h-2 w-2',
    lg: 'h-3 w-3'
  }

  return (
    <div className={cn("flex space-x-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-pulse',
            sizeClasses[size],
            color
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  )
}

// Floating action button with expand animation
interface FloatingActionButtonProps {
  children: React.ReactNode
  isExpanded?: boolean
  onClick?: () => void
  className?: string
  expandedContent?: React.ReactNode
}

export function FloatingActionButton({
  children,
  isExpanded = false,
  onClick,
  className,
  expandedContent
}: FloatingActionButtonProps) {
  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      <div className="relative">
        {/* Main FAB */}
        <button
          onClick={onClick}
          className={cn(
            "bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg",
            "transition-all duration-300 ease-out hover:scale-110",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            isExpanded && "rotate-45"
          )}
        >
          {children}
        </button>

        {/* Expanded content */}
        {expandedContent && (
          <div
            className={cn(
              "absolute bottom-16 right-0 transition-all duration-300 ease-out",
              isExpanded 
                ? "opacity-100 translate-y-0 scale-100" 
                : "opacity-0 translate-y-4 scale-95 pointer-events-none"
            )}
          >
            {expandedContent}
          </div>
        )}
      </div>
    </div>
  )
}