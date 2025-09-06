/**
 * Hockey Directory - Feature Flags Configuration
 * 
 * This file manages feature flags for gradual rollout, A/B testing,
 * and risk mitigation of new features in production.
 */

/**
 * Feature flag interface
 */
export interface FeatureFlag {
  /** Unique flag identifier */
  key: string
  
  /** Human-readable name */
  name: string
  
  /** Feature description */
  description: string
  
  /** Default enabled state */
  defaultValue: boolean
  
  /** Flag category for organization */
  category: 'core' | 'experimental' | 'monetization' | 'ui' | 'analytics'
  
  /** Environment restrictions */
  environments?: ('development' | 'staging' | 'production')[]
  
  /** Rollout percentage (0-100) */
  rolloutPercentage?: number
  
  /** User role restrictions */
  allowedRoles?: ('admin' | 'advisor' | 'parent' | 'public')[]
  
  /** Kill switch - immediately disable if issues found */
  killSwitch?: boolean
  
  /** Expiration date - automatically disable after this date */
  expiresAt?: Date
  
  /** Associated A/B test identifier */
  abTestId?: string
}

/**
 * All feature flags for Hockey Directory
 * New features should default to disabled (false) and be enabled gradually
 */
export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Core platform features
  advisorVideoProfiles: {
    key: 'advisorVideoProfiles',
    name: 'Advisor Video Profiles',
    description: 'Allow advisors to upload video introductions to their profiles',
    defaultValue: false,
    category: 'core',
    environments: ['staging', 'production'],
    rolloutPercentage: 0,
    allowedRoles: ['advisor', 'admin']
  },

  enhancedSearchFilters: {
    key: 'enhancedSearchFilters',
    name: 'Enhanced Search Filters',
    description: 'Advanced filtering options including price range, response time, etc.',
    defaultValue: true,
    category: 'core',
    rolloutPercentage: 100
  },

  automatedLeadRouting: {
    key: 'automatedLeadRouting',
    name: 'Automated Lead Routing',
    description: 'Intelligent lead distribution based on advisor availability and specialties',
    defaultValue: false,
    category: 'core',
    environments: ['staging'],
    rolloutPercentage: 25,
    allowedRoles: ['admin']
  },

  // Analytics and monitoring
  premiumAnalyticsDashboard: {
    key: 'premiumAnalyticsDashboard',
    name: 'Premium Analytics Dashboard',
    description: 'Advanced analytics for premium tier advisors',
    defaultValue: false,
    category: 'monetization',
    rolloutPercentage: 50,
    allowedRoles: ['advisor']
  },

  realTimeNotifications: {
    key: 'realTimeNotifications',
    name: 'Real-time Notifications',
    description: 'WebSocket-based real-time notifications for leads and messages',
    defaultValue: false,
    category: 'core',
    environments: ['development', 'staging'],
    rolloutPercentage: 0
  },

  // Experimental features
  aiPoweredMatching: {
    key: 'aiPoweredMatching',
    name: 'AI-Powered Advisor Matching',
    description: 'Machine learning recommendations for advisor-parent matching',
    defaultValue: false,
    category: 'experimental',
    environments: ['development', 'staging'],
    rolloutPercentage: 10,
    abTestId: 'ai_matching_v1'
  },

  socialProofBadges: {
    key: 'socialProofBadges',
    name: 'Social Proof Badges',
    description: 'Display achievement badges on advisor profiles',
    defaultValue: false,
    category: 'ui',
    rolloutPercentage: 75
  },

  // Monetization features
  tieredCommissionRates: {
    key: 'tieredCommissionRates',
    name: 'Tiered Commission Rates',
    description: 'Different commission rates based on advisor performance',
    defaultValue: false,
    category: 'monetization',
    environments: ['staging'],
    allowedRoles: ['admin']
  },

  dynamicPricing: {
    key: 'dynamicPricing',
    name: 'Dynamic Subscription Pricing',
    description: 'Adjust subscription prices based on demand and geography',
    defaultValue: false,
    category: 'monetization',
    environments: ['staging'],
    rolloutPercentage: 0,
    allowedRoles: ['admin']
  },

  // UI/UX improvements
  modernProfileLayout: {
    key: 'modernProfileLayout',
    name: 'Modern Profile Layout',
    description: 'Updated advisor profile design with better mobile experience',
    defaultValue: true,
    category: 'ui',
    rolloutPercentage: 90
  },

  advancedSearchAutocomplete: {
    key: 'advancedSearchAutocomplete',
    name: 'Advanced Search Autocomplete',
    description: 'Smart search suggestions with location and specialty completion',
    defaultValue: true,
    category: 'ui',
    rolloutPercentage: 100
  },

  // Security and moderation
  enhancedModerationQueue: {
    key: 'enhancedModerationQueue',
    name: 'Enhanced Moderation Queue',
    description: 'Advanced moderation tools with AI-assisted content review',
    defaultValue: false,
    category: 'core',
    allowedRoles: ['admin'],
    rolloutPercentage: 100
  },

  stricterRateLimiting: {
    key: 'stricterRateLimiting',
    name: 'Stricter Rate Limiting',
    description: 'Reduced rate limits to prevent abuse (emergency toggle)',
    defaultValue: false,
    category: 'core',
    killSwitch: true
  }
}

/**
 * Environment-based configuration
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    // All flags available in development
    enableAllFlags: true,
    overrideRollout: true,
    debugMode: true
  },
  
  staging: {
    // Staging mirrors production but allows experimental features
    enableExperimental: true,
    rolloutMultiplier: 2.0, // Double rollout percentages
    debugMode: true
  },
  
  production: {
    // Production requires careful rollout
    enableExperimental: false,
    respectRollout: true,
    debugMode: false
  }
} as const

/**
 * User-based feature flag override (for testing)
 */
export interface UserOverrides {
  userId: string
  role: string
  overrides: Record<string, boolean>
  expiresAt?: Date
}

/**
 * Feature flag evaluation context
 */
export interface FlagContext {
  userId?: string
  userRole?: string
  environment: 'development' | 'staging' | 'production'
  userAgent?: string
  ipAddress?: string
  advisorId?: string
}

/**
 * Feature flag service class
 */
export class FeatureFlags {
  private static userOverrides = new Map<string, UserOverrides>()
  private static environmentValues = new Map<string, boolean>()
  
  /**
   * Check if a feature flag is enabled for the given context
   */
  static isEnabled(flagKey: string, context: FlagContext): boolean {
    const flag = FEATURE_FLAGS[flagKey]
    if (!flag) {
      console.warn(`Unknown feature flag: ${flagKey}`)
      return false
    }

    // Check kill switch
    if (flag.killSwitch === true) {
      return false
    }

    // Check expiration
    if (flag.expiresAt && new Date() > flag.expiresAt) {
      return false
    }

    // Check environment restrictions
    if (flag.environments && !flag.environments.includes(context.environment)) {
      return false
    }

    // Check role restrictions
    if (flag.allowedRoles && context.userRole && 
        !flag.allowedRoles.includes(context.userRole as any)) {
      return false
    }

    // Check user overrides
    if (context.userId) {
      const override = this.userOverrides.get(context.userId)
      if (override && override.overrides[flagKey] !== undefined) {
        // Check if override has expired
        if (!override.expiresAt || new Date() < override.expiresAt) {
          return override.overrides[flagKey]
        }
      }
    }

    // Check environment overrides
    const envOverride = this.environmentValues.get(flagKey)
    if (envOverride !== undefined) {
      return envOverride
    }

    // Development environment special handling
    if (context.environment === 'development') {
      const config = ENVIRONMENT_CONFIG.development
      if (config.enableAllFlags) {
        return true
      }
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      let rolloutThreshold = flag.rolloutPercentage
      
      // Apply environment multiplier
      const envConfig = ENVIRONMENT_CONFIG[context.environment]
      if ('rolloutMultiplier' in envConfig) {
        rolloutThreshold = Math.min(100, rolloutThreshold * envConfig.rolloutMultiplier)
      }

      // Use consistent hash for user-based rollout
      const hashValue = this.hashUserId(context.userId || context.ipAddress || 'anonymous')
      const userPercentile = hashValue % 100
      
      if (userPercentile >= rolloutThreshold) {
        return false
      }
    }

    return flag.defaultValue
  }

  /**
   * Get all enabled flags for a context
   */
  static getEnabledFlags(context: FlagContext): Record<string, boolean> {
    const result: Record<string, boolean> = {}
    
    for (const flagKey in FEATURE_FLAGS) {
      result[flagKey] = this.isEnabled(flagKey, context)
    }
    
    return result
  }

  /**
   * Set user-specific override for testing
   */
  static setUserOverride(
    userId: string,
    role: string,
    overrides: Record<string, boolean>,
    expiresAt?: Date
  ): void {
    this.userOverrides.set(userId, {
      userId,
      role,
      overrides,
      expiresAt
    })
  }

  /**
   * Remove user override
   */
  static removeUserOverride(userId: string): void {
    this.userOverrides.delete(userId)
  }

  /**
   * Set environment-level override (for emergency toggles)
   */
  static setEnvironmentOverride(flagKey: string, value: boolean): void {
    this.environmentValues.set(flagKey, value)
  }

  /**
   * Emergency kill switch - disable all experimental features
   */
  static activateKillSwitch(): void {
    for (const [key, flag] of Object.entries(FEATURE_FLAGS)) {
      if (flag.category === 'experimental' || flag.category === 'monetization') {
        this.setEnvironmentOverride(key, false)
      }
    }
  }

  /**
   * Get flag metadata for admin dashboard
   */
  static getFlagMetadata(): Record<string, FeatureFlag> {
    return { ...FEATURE_FLAGS }
  }

  /**
   * Simple hash function for consistent user assignment
   */
  private static hashUserId(input: string): number {
    let hash = 0
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}

/**
 * React hook for feature flags (to be used in components)
 */
export interface UseFeatureFlagOptions {
  defaultValue?: boolean
  debugLog?: boolean
}

/**
 * Utility function to check flag in server contexts
 */
export function checkFeatureFlag(
  flagKey: string,
  context: Partial<FlagContext> = {}
): boolean {
  const defaultContext: FlagContext = {
    environment: (process.env.NODE_ENV as any) || 'development',
    ...context
  }
  
  return FeatureFlags.isEnabled(flagKey, defaultContext)
}

/**
 * Middleware helper for checking flags in API routes
 */
export function withFeatureFlag(
  flagKey: string,
  handler: Function,
  fallback?: Function
) {
  return async (req: any, res: any) => {
    const context: FlagContext = {
      environment: (process.env.NODE_ENV as any) || 'development',
      userAgent: req.headers['user-agent'],
      ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      // Extract user context from request if available
      userId: req.user?.id,
      userRole: req.user?.role,
      advisorId: req.user?.advisorId
    }

    if (FeatureFlags.isEnabled(flagKey, context)) {
      return handler(req, res)
    } else if (fallback) {
      return fallback(req, res)
    } else {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'FEATURE_NOT_AVAILABLE', message: 'Feature not available' }
      })
    }
  }
}