'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'

interface VirtualGridProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  itemsPerRow: number
  gap?: number
  className?: string
  renderItem: (item: T, index: number) => React.ReactNode
  getItemKey: (item: T, index: number) => string | number
  overscan?: number
  onScroll?: (scrollTop: number, scrollLeft: number) => void
  loadMoreThreshold?: number
  onLoadMore?: () => void
  isLoading?: boolean
}

export function VirtualGrid<T>({
  items,
  itemHeight,
  containerHeight,
  itemsPerRow,
  gap = 16,
  className,
  renderItem,
  getItemKey,
  overscan = 5,
  onScroll,
  loadMoreThreshold = 5,
  onLoadMore,
  isLoading = false
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calculate virtual scrolling parameters
  const rowHeight = itemHeight + gap
  const totalRows = Math.ceil(items.length / itemsPerRow)
  const totalHeight = totalRows * rowHeight - gap

  const visibleRowCount = Math.ceil(containerHeight / rowHeight)
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const endRow = Math.min(totalRows - 1, startRow + visibleRowCount + 2 * overscan)

  // Generate visible items
  const visibleItems = useMemo(() => {
    const items_to_render: Array<{
      item: T
      index: number
      row: number
      col: number
      top: number
      left: number
      key: string | number
    }> = []

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col
        if (index >= items.length) break

        const item = items[index]
        items_to_render.push({
          item,
          index,
          row,
          col,
          top: row * rowHeight,
          left: col * (100 / itemsPerRow), // Percentage for responsive
          key: getItemKey(item, index)
        })
      }
    }

    return items_to_render
  }, [items, startRow, endRow, itemsPerRow, rowHeight, getItemKey])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget
    const newScrollTop = element.scrollTop
    const scrollLeft = element.scrollLeft

    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop, scrollLeft)

    // Load more logic
    if (onLoadMore && !isLoading) {
      const scrolledToBottom = 
        element.scrollHeight - element.scrollTop <= element.clientHeight + rowHeight * loadMoreThreshold
      
      if (scrolledToBottom) {
        onLoadMore()
      }
    }
  }, [onScroll, onLoadMore, isLoading, rowHeight, loadMoreThreshold])

  // Scroll to item
  const scrollToItem = useCallback((index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollElementRef.current) return

    const row = Math.floor(index / itemsPerRow)
    const scrollTo = row * rowHeight

    scrollElementRef.current.scrollTo({
      top: scrollTo,
      behavior
    })
  }, [itemsPerRow, rowHeight])

  // Scroll to top
  const scrollToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (!scrollElementRef.current) return

    scrollElementRef.current.scrollTo({
      top: 0,
      behavior
    })
  }, [])

  return (
    <div className={cn("relative", className)}>
      {/* Virtual scroll container */}
      <div
        ref={scrollElementRef}
        className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        {/* Total height spacer */}
        <div style={{ height: totalHeight, position: 'relative' }}>
          {/* Visible items */}
          {visibleItems.map(({ item, index, top, left, key }) => (
            <div
              key={key}
              className="absolute transition-opacity duration-200"
              style={{
                top: `${top}px`,
                left: `${left}%`,
                width: `calc(${100 / itemsPerRow}% - ${gap * (itemsPerRow - 1) / itemsPerRow}px)`,
                height: `${itemHeight}px`
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator at bottom */}
      {isLoading && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
          <span className="text-sm text-gray-600">Loading more...</span>
        </div>
      )}
    </div>
  )
}

// Hook for managing virtual grid state
export function useVirtualGrid<T>(
  items: T[],
  options: {
    itemHeight: number
    itemsPerRow: number
    containerHeight?: number
    loadMoreThreshold?: number
  }
) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Auto-detect container height
  const [containerHeight, setContainerHeight] = useState(
    options.containerHeight || 600
  )

  useEffect(() => {
    if (!options.containerHeight && scrollElementRef.current) {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry) {
          setContainerHeight(entry.contentRect.height)
        }
      })

      observer.observe(scrollElementRef.current)
      return () => observer.disconnect()
    }
  }, [options.containerHeight])

  // Scroll utilities
  const scrollToTop = useCallback(() => {
    scrollElementRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollToItem = useCallback((index: number) => {
    if (!scrollElementRef.current) return

    const row = Math.floor(index / options.itemsPerRow)
    const scrollTop = row * (options.itemHeight + 16) // 16px gap

    scrollElementRef.current.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
  }, [options.itemHeight, options.itemsPerRow])

  return {
    containerHeight,
    isLoading,
    setIsLoading,
    hasMore,
    setHasMore,
    scrollToTop,
    scrollToItem,
    scrollElementRef
  }
}

// Responsive virtual grid that adjusts items per row
interface ResponsiveVirtualGridProps<T> extends Omit<VirtualGridProps<T>, 'itemsPerRow'> {
  breakpoints?: {
    sm?: number // items per row on small screens
    md?: number // items per row on medium screens  
    lg?: number // items per row on large screens
    xl?: number // items per row on extra large screens
  }
}

export function ResponsiveVirtualGrid<T>({
  breakpoints = { sm: 1, md: 2, lg: 3, xl: 4 },
  ...props
}: ResponsiveVirtualGridProps<T>) {
  const [itemsPerRow, setItemsPerRow] = useState(breakpoints.lg || 3)

  useEffect(() => {
    const updateItemsPerRow = () => {
      const width = window.innerWidth
      
      if (width >= 1280) {
        setItemsPerRow(breakpoints.xl || 4)
      } else if (width >= 1024) {
        setItemsPerRow(breakpoints.lg || 3)
      } else if (width >= 768) {
        setItemsPerRow(breakpoints.md || 2)
      } else {
        setItemsPerRow(breakpoints.sm || 1)
      }
    }

    updateItemsPerRow()
    window.addEventListener('resize', updateItemsPerRow)
    return () => window.removeEventListener('resize', updateItemsPerRow)
  }, [breakpoints])

  return <VirtualGrid {...props} itemsPerRow={itemsPerRow} />
}