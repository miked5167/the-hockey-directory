import { useCallback, useEffect } from 'react'

// Analytics events interface
export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

// User session management
class SessionManager {
  private sessionId: string
  private startTime: number

  constructor() {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getSessionId(): string {
    return this.sessionId
  }

  getSessionDuration(): number {
    return Date.now() - this.startTime
  }

  renewSession(): void {
    this.sessionId = this.generateSessionId()
    this.startTime = Date.now()
  }
}

// Analytics tracker class
class AnalyticsTracker {
  private events: AnalyticsEvent[] = []
  private sessionManager: SessionManager
  private isEnabled: boolean = true
  private userId?: string

  constructor() {
    this.sessionManager = new SessionManager()
    this.loadUserPreferences()
  }

  private loadUserPreferences() {
    try {
      const preferences = localStorage.getItem('hockey-directory-analytics-preferences')
      if (preferences) {
        const parsed = JSON.parse(preferences)
        this.isEnabled = parsed.enabled !== false // Default to enabled
        this.userId = parsed.userId
      }
    } catch (error) {
      console.warn('Failed to load analytics preferences:', error)
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
    try {
      const preferences = {
        enabled,
        userId: this.userId
      }
      localStorage.setItem('hockey-directory-analytics-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save analytics preferences:', error)
    }
  }

  setUserId(userId: string) {
    this.userId = userId
    this.saveUserPreferences()
  }

  private saveUserPreferences() {
    try {
      const preferences = {
        enabled: this.isEnabled,
        userId: this.userId
      }
      localStorage.setItem('hockey-directory-analytics-preferences', JSON.stringify(preferences))
    } catch (error) {
      console.warn('Failed to save user preferences:', error)
    }
  }

  track(eventName: string, properties: Record<string, any> = {}) {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        timestamp: Date.now(),
        sessionDuration: this.sessionManager.getSessionDuration()
      },
      timestamp: Date.now(),
      userId: this.userId,
      sessionId: this.sessionManager.getSessionId()
    }

    this.events.push(event)
    this.processEvent(event)

    // Keep only last 100 events in memory
    if (this.events.length > 100) {
      this.events = this.events.slice(-100)
    }
  }

  private async processEvent(event: AnalyticsEvent) {
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event)
    }

    // Send to analytics service in production
    // Example implementations:

    // Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.name, event.properties)
    }

    // Custom analytics endpoint
    try {
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.warn('Failed to send analytics event:', error)
    }
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const now = Date.now()
    const last24Hours = now - (24 * 60 * 60 * 1000)
    
    const recentEvents = this.events.filter(event => 
      event.timestamp && event.timestamp > last24Hours
    )

    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalEvents: this.events.length,
      recentEvents: recentEvents.length,
      eventCounts,
      sessionId: this.sessionManager.getSessionId(),
      sessionDuration: this.sessionManager.getSessionDuration()
    }
  }
}

// Global analytics instance
let analytics: AnalyticsTracker

function getAnalytics(): AnalyticsTracker {
  if (typeof window !== 'undefined' && !analytics) {
    analytics = new AnalyticsTracker()
  }
  return analytics
}

// Hockey Directory specific events
export const HockeyDirectoryEvents = {
  // Directory interactions
  DIRECTORY_LOADED: 'directory_loaded',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  ADVISOR_VIEWED: 'advisor_viewed',
  ADVISOR_CONTACTED: 'advisor_contacted',
  
  // User interactions
  FAVORITE_ADDED: 'favorite_added',
  FAVORITE_REMOVED: 'favorite_removed',
  COMPARISON_STARTED: 'comparison_started',
  COMPARISON_COMPLETED: 'comparison_completed',
  
  // Search and discovery
  SEARCH_SUGGESTION_CLICKED: 'search_suggestion_clicked',
  SAVED_SEARCH_CREATED: 'saved_search_created',
  SAVED_SEARCH_USED: 'saved_search_used',
  
  // Performance
  SLOW_SEARCH: 'slow_search',
  ERROR_OCCURRED: 'error_occurred',
  
  // Business metrics
  PREMIUM_ADVISOR_VIEWED: 'premium_advisor_viewed',
  FEATURED_ADVISOR_VIEWED: 'featured_advisor_viewed'
} as const

// React hooks for analytics
export function useAnalytics() {
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      getAnalytics().track(eventName, properties)
    }
  }, [])

  const setUserId = useCallback((userId: string) => {
    if (typeof window !== 'undefined') {
      getAnalytics().setUserId(userId)
    }
  }, [])

  const setEnabled = useCallback((enabled: boolean) => {
    if (typeof window !== 'undefined') {
      getAnalytics().setEnabled(enabled)
    }
  }, [])

  return { track, setUserId, setEnabled }
}

// Hook for tracking page views
export function usePageTracking() {
  const { track } = useAnalytics()

  useEffect(() => {
    track(HockeyDirectoryEvents.DIRECTORY_LOADED, {
      page: typeof window !== 'undefined' ? window.location.pathname : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined
    })
  }, [track])
}

// Hook for tracking search performance
export function useSearchTracking() {
  const { track } = useAnalytics()

  const trackSearch = useCallback((query: string, resultCount: number, duration: number) => {
    track(HockeyDirectoryEvents.SEARCH_PERFORMED, {
      query: query.substring(0, 100), // Limit PII exposure
      query_length: query.length,
      result_count: resultCount,
      duration_ms: duration
    })

    // Track slow searches
    if (duration > 2000) {
      track(HockeyDirectoryEvents.SLOW_SEARCH, {
        query_length: query.length,
        result_count: resultCount,
        duration_ms: duration
      })
    }
  }, [track])

  const trackFilter = useCallback((filterType: string, filterValue: any, resultCount: number) => {
    track(HockeyDirectoryEvents.FILTER_APPLIED, {
      filter_type: filterType,
      filter_value: typeof filterValue === 'string' ? filterValue.substring(0, 50) : filterValue,
      result_count: resultCount
    })
  }, [track])

  return { trackSearch, trackFilter }
}

// Hook for tracking user interactions
export function useInteractionTracking() {
  const { track } = useAnalytics()

  const trackAdvisorView = useCallback((advisorId: string, advisorData: any) => {
    track(HockeyDirectoryEvents.ADVISOR_VIEWED, {
      advisor_id: advisorId,
      advisor_type: advisorData.subscription?.plan?.name || 'basic',
      location: advisorData.location,
      specialties_count: advisorData.specialties ? JSON.parse(advisorData.specialties).length : 0
    })

    // Track premium/featured views
    if (advisorData.subscription?.plan?.name === 'Premium') {
      track(HockeyDirectoryEvents.PREMIUM_ADVISOR_VIEWED, { advisor_id: advisorId })
    } else if (advisorData.subscription?.plan?.name === 'Featured') {
      track(HockeyDirectoryEvents.FEATURED_ADVISOR_VIEWED, { advisor_id: advisorId })
    }
  }, [track])

  const trackFavoriteAction = useCallback((action: 'add' | 'remove', advisorId: string) => {
    const eventName = action === 'add' 
      ? HockeyDirectoryEvents.FAVORITE_ADDED 
      : HockeyDirectoryEvents.FAVORITE_REMOVED
      
    track(eventName, { advisor_id: advisorId })
  }, [track])

  const trackComparison = useCallback((advisorIds: string[]) => {
    track(HockeyDirectoryEvents.COMPARISON_STARTED, {
      advisor_count: advisorIds.length,
      advisor_ids: advisorIds
    })
  }, [track])

  return { trackAdvisorView, trackFavoriteAction, trackComparison }
}

// Error tracking
export function trackError(error: Error, context?: Record<string, any>) {
  if (typeof window !== 'undefined') {
    getAnalytics().track(HockeyDirectoryEvents.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500),
      error_name: error.name,
      ...context
    })
  }
}