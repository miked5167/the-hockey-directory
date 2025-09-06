/**
 * Hockey Directory - Security Configuration
 * 
 * This file contains all security-related constants, rate limits,
 * and configuration used throughout the application.
 */

/**
 * Rate limiting configuration by endpoint
 */
export const RATE_LIMITS = {
  // Lead submission - critical business function, strict limits
  '/api/leads': {
    windowMs: 60 * 1000,          // 1 minute window
    max: 3,                       // 3 requests per minute per IP
    maxPerUser: 5,                // 5 requests per minute per user
    message: 'Too many lead submissions. Please wait before submitting another.',
    skipSuccessfulRequests: false,
    standardHeaders: true
  },

  // Review submission - prevent spam reviews
  '/api/reviews': {
    windowMs: 5 * 60 * 1000,      // 5 minute window
    max: 2,                       // 2 reviews per 5 minutes per IP
    maxPerUser: 3,                // 3 reviews per 5 minutes per user
    message: 'Too many reviews submitted. Please wait before submitting another.',
    skipSuccessfulRequests: true,
    standardHeaders: true
  },

  // Authentication endpoints - prevent brute force
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000,     // 15 minute window
    max: 5,                       // 5 login attempts per 15 minutes per IP
    maxPerUser: 10,               // 10 attempts per user (account lockout)
    message: 'Too many login attempts. Please try again later.',
    skipSuccessfulRequests: true,
    standardHeaders: true,
    onLimitReached: 'LOCK_ACCOUNT' // Special handling for auth
  },

  '/api/auth/register': {
    windowMs: 60 * 60 * 1000,     // 1 hour window
    max: 3,                       // 3 registrations per hour per IP
    message: 'Too many registration attempts. Please try again later.',
    skipSuccessfulRequests: true,
    standardHeaders: true
  },

  '/api/auth/reset-password': {
    windowMs: 60 * 60 * 1000,     // 1 hour window
    max: 3,                       // 3 reset attempts per hour per IP
    maxPerUser: 5,                // 5 reset attempts per user per hour
    message: 'Too many password reset requests. Please try again later.',
    skipSuccessfulRequests: true,
    standardHeaders: true
  },

  // Search endpoints - prevent excessive usage
  '/api/advisors': {
    windowMs: 60 * 1000,          // 1 minute window
    max: 30,                      // 30 searches per minute per IP
    message: 'Too many search requests. Please slow down.',
    skipSuccessfulRequests: false,
    standardHeaders: true
  },

  // Profile updates - prevent spam updates
  '/api/advisors/[id]': {
    windowMs: 5 * 60 * 1000,      // 5 minute window
    max: 10,                      // 10 updates per 5 minutes
    message: 'Too many profile updates. Please wait before updating again.',
    skipSuccessfulRequests: true,
    standardHeaders: true
  },

  // File uploads - prevent abuse
  '/api/upload': {
    windowMs: 60 * 60 * 1000,     // 1 hour window
    max: 20,                      // 20 uploads per hour per IP
    maxPerUser: 50,               // 50 uploads per hour per user
    message: 'Too many file uploads. Please try again later.',
    skipSuccessfulRequests: true,
    standardHeaders: true
  },

  // Contact forms - prevent spam
  '/api/contact': {
    windowMs: 10 * 60 * 1000,     // 10 minute window
    max: 2,                       // 2 contact form submissions per 10 minutes
    message: 'Too many contact form submissions. Please wait before sending another message.',
    skipSuccessfulRequests: false,
    standardHeaders: true
  },

  // Default rate limit for unlisted endpoints
  'default': {
    windowMs: 60 * 1000,          // 1 minute window
    max: 100,                     // 100 requests per minute per IP
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true
  }
} as const

/**
 * Content Security Policy configuration
 */
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",                    // Required for Next.js
    "'unsafe-eval'",                      // Required for development
    'https://challenges.cloudflare.com',  // Turnstile CAPTCHA
    'https://js.stripe.com',              // Stripe payments
    'https://app.posthog.com',            // Analytics
    'https://www.googletagmanager.com'    // Google Analytics
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",                    // Required for Tailwind CSS
    'https://fonts.googleapis.com',       // Google Fonts
    'https://cdn.jsdelivr.net'            // Font libraries
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',          // Google Fonts
    'https://cdn.jsdelivr.net'            // Font CDNs
  ],
  'img-src': [
    "'self'",
    'data:',                              // Base64 images
    'blob:',                              // Blob URLs for uploads
    'https://*.stripe.com',               // Stripe assets
    'https://*.hockeydirectory.com',      // Our CDN
    'https://images.unsplash.com',        // Stock photos
    'https://via.placeholder.com'         // Placeholder images
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',             // Stripe API
    'https://app.posthog.com',            // Analytics
    'https://challenges.cloudflare.com',  // Turnstile
    'wss://app.posthog.com'               // WebSocket analytics
  ],
  'frame-src': [
    'https://js.stripe.com',              // Stripe Elements
    'https://hooks.stripe.com',           // Stripe webhooks
    'https://challenges.cloudflare.com'   // Turnstile widget
  ],
  'object-src': ["'none'"],              // No plugins
  'base-uri': ["'self'"],                // Prevent base tag injection
  'form-action': ["'self'"],             // Restrict form targets
  'frame-ancestors': ["'none'"],         // Prevent framing
  'upgrade-insecure-requests': []        // Force HTTPS
} as const

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Prevent XSS attacks
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Prevent framing (clickjacking protection)
  'X-Frame-Options': 'DENY',
  
  // Force HTTPS (HSTS)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (Feature Policy)
  'Permissions-Policy': [
    'camera=()',           // No camera access
    'microphone=()',       // No microphone access
    'geolocation=()',      // No geolocation access
    'payment=(self)',      // Payment API only on our domain
    'usb=()',             // No USB access
    'magnetometer=()',     // No magnetometer access
    'accelerometer=()',    // No accelerometer access
    'gyroscope=()'         // No gyroscope access
  ].join(', ')
} as const

/**
 * JWT configuration
 */
export const JWT_CONFIG = {
  // Access token settings
  accessToken: {
    expiresIn: '15m',                     // Short-lived access tokens
    algorithm: 'HS256' as const,
    issuer: 'hockey-directory',
    audience: 'hockey-directory-api'
  },
  
  // Refresh token settings
  refreshToken: {
    expiresIn: '7d',                      // Longer-lived refresh tokens
    algorithm: 'HS256' as const,
    issuer: 'hockey-directory',
    audience: 'hockey-directory-refresh'
  },
  
  // Session settings
  session: {
    maxConcurrent: 5,                     // Max concurrent sessions per user
    inactivityTimeout: 24 * 60 * 60,      // 24 hours of inactivity
    absoluteTimeout: 30 * 24 * 60 * 60    // 30 days absolute maximum
  }
} as const

/**
 * Password policy configuration
 */
export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxRepeatingChars: 3,
  preventCommonPatterns: true,
  
  // Password history
  preventReuse: 5,                        // Can't reuse last 5 passwords
  
  // Account lockout
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 15,
  
  // Password reset
  resetTokenExpiry: 60 * 60,              // 1 hour
  maxResetAttempts: 3
} as const

/**
 * File upload security configuration
 */
export const UPLOAD_CONFIG = {
  // Allowed file types
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'application/pdf'
  ],
  
  // File size limits (in bytes)
  maxFileSize: {
    image: 5 * 1024 * 1024,              // 5MB for images
    document: 10 * 1024 * 1024,          // 10MB for documents
    video: 100 * 1024 * 1024             // 100MB for videos (future)
  },
  
  // Security scanning
  scanForMalware: true,
  stripMetadata: true,
  
  // Storage configuration
  uploadDirectory: '/uploads',
  tempDirectory: '/tmp/uploads',
  maxFilesPerRequest: 5
} as const

/**
 * Input validation patterns
 */
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[\d\s\-\(\)]{10,}$/,
  url: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
  
  // Social media patterns
  linkedin: /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-]+\/?$/,
  twitter: /^https:\/\/(www\.)?(twitter|x)\.com\/[a-zA-Z0-9_]+\/?$/,
  instagram: /^https:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.]+\/?$/,
  
  // Security patterns
  noScriptTags: /^(?!.*<script).*$/i,
  noSqlInjection: /^(?!.*(union|select|insert|update|delete|drop|create|alter|exec)).*$/i,
  safeChars: /^[a-zA-Z0-9\s\-_.,!?'"()@#$%&*+=[\]{}|\\:;<>\/~`]+$/
} as const

/**
 * Profanity filter configuration
 */
export const PROFANITY_CONFIG = {
  enableFilter: true,
  strictMode: false,                      // Less strict for hockey terminology
  customWords: [
    // Add hockey-specific terms that might be flagged
    'puck', 'stick', 'hit', 'check', 'fight'
  ],
  blockedWords: [
    // Add inappropriate words specific to our domain
  ],
  replacementChar: '*'
} as const

/**
 * IP-based security configuration
 */
export const IP_SECURITY = {
  // Trusted proxy IPs (Cloudflare, Vercel, etc.)
  trustedProxies: [
    '127.0.0.1',
    '::1',
    // Cloudflare IP ranges (simplified - use full list in production)
    '103.21.244.0/22',
    '103.22.200.0/22',
    '103.31.4.0/22'
  ],
  
  // Blocked IP ranges
  blockedIPs: new Set<string>(),
  
  // Geoblocking configuration
  allowedCountries: ['US', 'CA', 'GB', 'AU'],  // Hockey-focused countries
  blockedCountries: [],                         // Countries to block
  
  // VPN/Proxy detection
  blockVPNs: false,                            // Don't block VPNs by default
  blockProxies: false,                         // Don't block proxies by default
  blockTor: true                               // Block Tor exit nodes
} as const

/**
 * Database security configuration
 */
export const DATABASE_SECURITY = {
  // Connection security
  requireSSL: process.env.NODE_ENV === 'production',
  connectionTimeout: 30000,                    // 30 seconds
  queryTimeout: 10000,                         // 10 seconds
  
  // Query logging
  logQueries: process.env.NODE_ENV === 'development',
  logSlowQueries: true,
  slowQueryThreshold: 1000,                    // 1 second
  
  // Connection pooling
  maxConnections: 20,
  minConnections: 2,
  acquireTimeout: 30000,
  
  // Data encryption
  encryptPII: true,                           // Encrypt email, phone
  encryptionAlgorithm: 'aes-256-gcm',
  keyRotationDays: 90
} as const

/**
 * API security configuration
 */
export const API_SECURITY = {
  // Request validation
  maxRequestSize: '1mb',
  maxParameterLength: 1000,
  maxHeaderSize: 8192,
  
  // CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://hockeydirectory.com', 'https://www.hockeydirectory.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200
  },
  
  // API versioning
  currentVersion: 'v1',
  supportedVersions: ['v1'],
  deprecationWarnings: true
} as const

/**
 * Audit logging configuration
 */
export const AUDIT_CONFIG = {
  // Events to log
  loggedEvents: [
    'user_login',
    'user_logout',
    'profile_update',
    'lead_submission',
    'payment_processed',
    'admin_action',
    'security_violation'
  ],
  
  // Retention policy
  retentionDays: {
    security: 365,                            // 1 year for security events
    audit: 90,                                // 3 months for audit logs
    access: 30                                // 1 month for access logs
  },
  
  // PII handling in logs
  stripPII: true,
  hashUserIds: true,
  logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
} as const

/**
 * Monitoring and alerting configuration
 */
export const MONITORING_CONFIG = {
  // Alert thresholds
  alerts: {
    highRateLimit: 0.8,                      // Alert at 80% of rate limit
    failedLogins: 10,                        // Alert after 10 failed logins
    errorRate: 0.05,                         // Alert at 5% error rate
    responseTime: 2000,                      // Alert if response time > 2s
    memoryUsage: 0.9                         // Alert at 90% memory usage
  },
  
  // Health checks
  healthCheck: {
    interval: 60000,                         // Check every minute
    timeout: 5000,                           // 5 second timeout
    endpoints: [
      '/api/health',
      '/api/advisors'
    ]
  }
} as const

/**
 * Environment-specific overrides
 */
export const ENVIRONMENT_OVERRIDES = {
  development: {
    CSP_POLICY: {
      ...CSP_POLICY,
      'script-src': [...CSP_POLICY['script-src'], "'unsafe-eval'"]
    },
    RATE_LIMITS: {
      ...RATE_LIMITS,
      // More relaxed rate limits in development
      '/api/leads': { ...RATE_LIMITS['/api/leads'], max: 10 },
      '/api/advisors': { ...RATE_LIMITS['/api/advisors'], max: 100 }
    }
  },
  
  staging: {
    // Staging mirrors production but with some relaxed limits
    RATE_LIMITS: {
      ...RATE_LIMITS,
      '/api/leads': { ...RATE_LIMITS['/api/leads'], max: 5 }
    }
  },
  
  production: {
    // Production uses all default strict settings
    SECURITY_HEADERS: {
      ...SECURITY_HEADERS,
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload'
    }
  }
} as const

/**
 * Get security configuration for current environment
 */
export function getSecurityConfig() {
  const env = (process.env.NODE_ENV as keyof typeof ENVIRONMENT_OVERRIDES) || 'development'
  const overrides = ENVIRONMENT_OVERRIDES[env] || {}
  
  return {
    RATE_LIMITS: overrides.RATE_LIMITS || RATE_LIMITS,
    CSP_POLICY: overrides.CSP_POLICY || CSP_POLICY,
    SECURITY_HEADERS: overrides.SECURITY_HEADERS || SECURITY_HEADERS,
    // ... other configurations
  }
}