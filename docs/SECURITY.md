# Hockey Directory - Security Standards

**Version:** 1.0  
**Date:** September 2025

---

## 🔐 Security Philosophy

The Hockey Directory prioritizes the security and privacy of hockey families and service providers. Our security approach follows industry best practices for web application security, with special attention to protecting personally identifiable information (PII) and maintaining user trust.

### Security Principles

- **Defense in Depth**: Multiple layers of security controls
- **Privacy by Design**: Minimal data collection and strong protection
- **Zero Trust**: Verify every request and user interaction
- **Fail Secure**: Default to denying access when in doubt
- **Continuous Monitoring**: Real-time threat detection and response

---

## 🛡️ Authentication & Authorization

### Authentication Strategy

#### JWT Token Implementation
```typescript
// Token structure
interface JWTPayload {
  userId: string
  role: 'admin' | 'advisor' | 'parent'
  advisorId?: string
  iat: number
  exp: number
  jti: string  // JWT ID for revocation
}

// Token generation
export function generateAccessToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      advisorId: user.advisorId,
      jti: crypto.randomUUID()
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '15m',  // Short-lived access tokens
      issuer: 'hockey-directory',
      audience: 'hockey-directory-api'
    }
  )
}

// Refresh token strategy
export function generateRefreshToken(user: User): string {
  return jwt.sign(
    { userId: user.id, jti: crypto.randomUUID() },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  )
}
```

#### Session Management
```typescript
// Session configuration
const SESSION_CONFIG = {
  accessTokenExpiry: 15 * 60,      // 15 minutes
  refreshTokenExpiry: 7 * 24 * 60 * 60,  // 7 days
  maxSessions: 5,                  // Maximum concurrent sessions
  sessionTimeout: 24 * 60 * 60     // 24 hours of inactivity
}

// Session validation middleware
export async function validateSession(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload
    
    // Check if token is revoked
    const isRevoked = await isTokenRevoked(payload.jti)
    if (isRevoked) {
      throw new Error('Token revoked')
    }
    
    // Update last activity
    await updateLastActivity(payload.userId)
    
    return payload
  } catch (error) {
    throw new AuthenticationError('Invalid token')
  }
}
```

### Authorization Controls

#### Role-Based Access Control (RBAC)
```typescript
// Permission definitions
const PERMISSIONS = {
  // Public permissions
  'advisors:read': ['public'],
  'reviews:read': ['public'],
  
  // Parent permissions
  'leads:create': ['parent', 'admin'],
  'reviews:create': ['parent', 'admin'],
  
  // Advisor permissions
  'advisor:profile:update': ['advisor', 'admin'],
  'advisor:leads:read': ['advisor', 'admin'],
  'advisor:analytics:read': ['advisor', 'admin'],
  
  // Admin permissions
  'users:manage': ['admin'],
  'moderation:manage': ['admin'],
  'system:analytics': ['admin']
} as const

// Permission checking
export function hasPermission(
  userRole: string,
  permission: keyof typeof PERMISSIONS
): boolean {
  return PERMISSIONS[permission].includes(userRole as any)
}
```

#### Resource-Level Authorization
```typescript
// Advisor resource access control
export async function canAccessAdvisorResource(
  userId: string,
  advisorId: string,
  action: string
): Promise<boolean> {
  const user = await getUser(userId)
  
  // Admins can access all resources
  if (user.role === 'admin') return true
  
  // Advisors can only access their own resources
  if (user.role === 'advisor' && user.advisorId === advisorId) {
    return true
  }
  
  // Parents can only read public advisor data
  if (user.role === 'parent' && action === 'read') {
    const advisor = await getAdvisor(advisorId)
    return advisor.verified === true
  }
  
  return false
}
```

---

## 🔒 Input Validation & Sanitization

### Validation Strategy

#### Zod Schema Validation
```typescript
// Lead submission validation
export const CreateLeadSchema = z.object({
  advisorId: z.string().cuid('Invalid advisor ID'),
  parentName: z.string()
    .min(2, 'Name too short')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Invalid characters in name'),
  parentEmail: z.string()
    .email('Invalid email format')
    .max(254, 'Email too long'),
  parentPhone: z.string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone format')
    .optional(),
  message: z.string()
    .min(20, 'Message too short')
    .max(1000, 'Message too long')
    .refine(val => !containsProfanity(val), 'Inappropriate content'),
  playerAge: z.number()
    .int('Age must be whole number')
    .min(10, 'Player too young')
    .max(18, 'Player too old')
    .optional(),
  turnstileToken: z.string().min(1, 'CAPTCHA verification required')
})

// HTML sanitization
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true
  })
}
```

### SQL Injection Prevention
```typescript
// Safe database queries using Prisma
export async function searchAdvisors(params: {
  query?: string
  location?: string
  specialties?: string[]
}) {
  // Prisma automatically prevents SQL injection
  return prisma.advisor.findMany({
    where: {
      AND: [
        params.query ? {
          OR: [
            { name: { contains: params.query, mode: 'insensitive' } },
            { bio: { contains: params.query, mode: 'insensitive' } }
          ]
        } : {},
        params.location ? {
          location: { contains: params.location, mode: 'insensitive' }
        } : {},
        params.specialties?.length ? {
          specialties: {
            array_contains: params.specialties
          }
        } : {}
      ]
    }
  })
}
```

---

## 🚫 Rate Limiting & DDoS Protection

### Rate Limiting Implementation
```typescript
// Rate limiting configuration by endpoint
const RATE_LIMITS = {
  '/api/leads': {
    windowMs: 60 * 1000,        // 1 minute window
    max: 3,                     // 3 requests per minute
    message: 'Too many lead submissions'
  },
  '/api/reviews': {
    windowMs: 5 * 60 * 1000,    // 5 minute window
    max: 2,                     // 2 reviews per 5 minutes
    message: 'Too many reviews submitted'
  },
  '/api/auth/login': {
    windowMs: 15 * 60 * 1000,   // 15 minute window
    max: 5,                     // 5 login attempts
    message: 'Too many login attempts'
  }
} as const

// Rate limiting middleware
export class RateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>()
  
  async checkLimit(
    identifier: string,
    endpoint: string
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = RATE_LIMITS[endpoint as keyof typeof RATE_LIMITS]
    if (!config) return { allowed: true, remaining: Infinity, resetTime: 0 }
    
    const key = `${endpoint}:${identifier}`
    const now = Date.now()
    const windowStart = now - config.windowMs
    
    // Clean old entries
    const entry = this.store.get(key)
    if (!entry || entry.resetTime < windowStart) {
      this.store.set(key, { count: 1, resetTime: now + config.windowMs })
      return { allowed: true, remaining: config.max - 1, resetTime: now + config.windowMs }
    }
    
    // Check limit
    if (entry.count >= config.max) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime }
    }
    
    // Increment count
    entry.count++
    return {
      allowed: true,
      remaining: config.max - entry.count,
      resetTime: entry.resetTime
    }
  }
}
```

### IP-Based Protection
```typescript
// IP reputation checking
export class IPProtection {
  private blockedIPs = new Set<string>()
  private suspiciousIPs = new Map<string, { count: number; firstSeen: number }>()
  
  async checkIPReputation(ip: string): Promise<boolean> {
    // Check if IP is permanently blocked
    if (this.blockedIPs.has(ip)) {
      return false
    }
    
    // Check for suspicious activity patterns
    const suspicious = this.suspiciousIPs.get(ip)
    if (suspicious && suspicious.count > 10) {
      this.blockedIPs.add(ip)
      return false
    }
    
    return true
  }
  
  recordSuspiciousActivity(ip: string) {
    const existing = this.suspiciousIPs.get(ip) || { count: 0, firstSeen: Date.now() }
    existing.count++
    this.suspiciousIPs.set(ip, existing)
  }
}
```

---

## 🔐 CAPTCHA & Bot Protection

### Turnstile Integration
```typescript
// Cloudflare Turnstile verification
export async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY!,
          response: token,
          remoteip: ip
        })
      }
    )
    
    const result = await response.json()
    
    if (!result.success) {
      logger.warn('Turnstile verification failed', {
        errorCodes: result['error-codes'],
        ip
      })
      return false
    }
    
    return true
  } catch (error) {
    logger.error('Turnstile verification error', error)
    return false
  }
}

// Bot detection patterns
export function detectBotBehavior(request: Request): boolean {
  const userAgent = request.headers.get('user-agent') || ''
  const suspiciousPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /python/i, /curl/i, /wget/i
  ]
  
  return suspiciousPatterns.some(pattern => pattern.test(userAgent))
}
```

---

## 🛡️ Data Protection & Privacy

### PII Handling
```typescript
// PII classification
enum PIIClass {
  PUBLIC = 'public',           // Name, city, bio
  INTERNAL = 'internal',       // Email, phone
  SENSITIVE = 'sensitive',     // Payment info
  RESTRICTED = 'restricted'    // Admin notes, logs
}

// PII encryption for sensitive fields
export class PIIProtection {
  private readonly key = process.env.ENCRYPTION_KEY!
  
  encrypt(data: string): string {
    const cipher = crypto.createCipher('aes-256-gcm', this.key)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()
    return encrypted + ':' + authTag.toString('hex')
  }
  
  decrypt(encryptedData: string): string {
    const [encrypted, authTagHex] = encryptedData.split(':')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = crypto.createDecipher('aes-256-gcm', this.key)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  }
}

// Data retention policies
const DATA_RETENTION = {
  leads: 365 * 24 * 60 * 60 * 1000,          // 1 year
  reviews: -1,                                 // Permanent
  sessions: 30 * 24 * 60 * 60 * 1000,        // 30 days
  logs: 90 * 24 * 60 * 60 * 1000             // 90 days
}
```

### Data Minimization
```typescript
// Limited data exposure based on user context
export function sanitizeAdvisorData(
  advisor: Advisor,
  context: { userRole: string; isOwner: boolean }
) {
  const publicData = {
    id: advisor.id,
    slug: advisor.slug,
    name: advisor.name,
    location: advisor.location,
    bio: advisor.bio,
    specialties: advisor.specialties,
    verified: advisor.verified,
    rating: advisor.rating,
    reviewCount: advisor.reviewCount
  }
  
  // Add internal data for advisor owners and admins
  if (context.isOwner || context.userRole === 'admin') {
    return {
      ...publicData,
      email: advisor.email,
      phone: advisor.phone,
      createdAt: advisor.createdAt
    }
  }
  
  return publicData
}
```

---

## 🚨 Incident Response & Monitoring

### Security Event Logging
```typescript
// Security event types
enum SecurityEvent {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  CAPTCHA_FAILURE = 'captcha_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access'
}

// Security logger
export class SecurityLogger {
  static log(event: SecurityEvent, context: {
    userId?: string
    ip: string
    userAgent: string
    endpoint: string
    details?: any
  }) {
    const logEntry = {
      event,
      timestamp: new Date().toISOString(),
      severity: this.getSeverity(event),
      ...context
    }
    
    // Log to security monitoring system
    logger.security(logEntry)
    
    // Alert on high-severity events
    if (logEntry.severity === 'high') {
      this.sendSecurityAlert(logEntry)
    }
  }
  
  private static getSeverity(event: SecurityEvent): 'low' | 'medium' | 'high' {
    const severityMap = {
      [SecurityEvent.LOGIN_SUCCESS]: 'low',
      [SecurityEvent.LOGIN_FAILURE]: 'medium',
      [SecurityEvent.RATE_LIMIT_EXCEEDED]: 'medium',
      [SecurityEvent.SUSPICIOUS_ACTIVITY]: 'high',
      [SecurityEvent.UNAUTHORIZED_ACCESS]: 'high'
    }
    return severityMap[event] || 'medium'
  }
}
```

### Real-time Threat Detection
```typescript
// Anomaly detection
export class ThreatDetector {
  private readonly thresholds = {
    failedLogins: 10,        // per hour
    rateLimit: 5,            // violations per hour
    suspiciousPatterns: 3    // per hour
  }
  
  async checkThreatLevel(userId: string, ip: string): Promise<'low' | 'medium' | 'high'> {
    const hour = 60 * 60 * 1000
    const since = Date.now() - hour
    
    const events = await this.getSecurityEvents(userId, ip, since)
    
    const failedLogins = events.filter(e => e.event === SecurityEvent.LOGIN_FAILURE).length
    const rateLimitViolations = events.filter(e => e.event === SecurityEvent.RATE_LIMIT_EXCEEDED).length
    const suspiciousActivity = events.filter(e => e.event === SecurityEvent.SUSPICIOUS_ACTIVITY).length
    
    if (failedLogins >= this.thresholds.failedLogins ||
        suspiciousActivity >= this.thresholds.suspiciousPatterns) {
      return 'high'
    }
    
    if (rateLimitViolations >= this.thresholds.rateLimit) {
      return 'medium'
    }
    
    return 'low'
  }
}
```

---

## 🔐 Content Security Policy

### CSP Configuration
```typescript
// Content Security Policy headers
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // For Next.js inline scripts
    'https://challenges.cloudflare.com', // Turnstile
    'https://js.stripe.com', // Stripe
    'https://app.posthog.com' // Analytics
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // For Tailwind CSS
    'https://fonts.googleapis.com'
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com'
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'https://*.stripe.com', // Stripe images
    'https://cdn.hockeydirectory.com' // Our CDN
  ],
  'connect-src': [
    "'self'",
    'https://api.stripe.com',
    'https://app.posthog.com',
    'https://challenges.cloudflare.com'
  ],
  'frame-src': [
    'https://js.stripe.com',
    'https://hooks.stripe.com'
  ]
}
```

---

## 🔒 Secure Development Practices

### Code Security Standards
```typescript
// Security code review checklist
const SECURITY_CHECKLIST = {
  authentication: [
    'JWT tokens properly validated',
    'Session management secure',
    'Password policies enforced'
  ],
  authorization: [
    'Role-based access controls implemented',
    'Resource-level permissions checked',
    'Default deny policy enforced'
  ],
  input_validation: [
    'All inputs validated with Zod',
    'SQL injection prevention verified',
    'XSS protection implemented'
  ],
  data_protection: [
    'PII properly classified and protected',
    'Encryption used for sensitive data',
    'Data retention policies followed'
  ]
}

// Static security analysis
export function analyzeCodeSecurity(code: string): SecurityIssue[] {
  const issues: SecurityIssue[] = []
  
  // Check for hardcoded secrets
  if (/api_key|secret|password\s*=\s*['"][^'"]+['"]/i.test(code)) {
    issues.push({
      type: 'HARDCODED_SECRET',
      severity: 'high',
      message: 'Potential hardcoded secret found'
    })
  }
  
  // Check for SQL injection risks
  if (/\$\{[^}]*\}.*sql|sql.*\$\{[^}]*\}/i.test(code)) {
    issues.push({
      type: 'SQL_INJECTION_RISK',
      severity: 'high',
      message: 'Potential SQL injection vulnerability'
    })
  }
  
  return issues
}
```

---

## 📋 Security Compliance Checklist

### Pre-deployment Security Review
```markdown
## Authentication & Authorization
- [ ] JWT tokens properly implemented with short expiry
- [ ] Role-based access control enforced
- [ ] Session management secure
- [ ] Password policies meet requirements

## Input Validation & Sanitization
- [ ] All inputs validated with Zod schemas
- [ ] HTML sanitization implemented
- [ ] SQL injection prevention verified
- [ ] File upload security (if applicable)

## Rate Limiting & Protection
- [ ] Rate limiting configured for all public endpoints
- [ ] CAPTCHA protection on forms
- [ ] IP-based protection implemented
- [ ] Bot detection mechanisms active

## Data Protection
- [ ] PII properly classified and protected
- [ ] Encryption implemented for sensitive data
- [ ] Data retention policies configured
- [ ] Backup security verified

## Infrastructure Security
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Environment variables secured
- [ ] Database access properly restricted

## Monitoring & Incident Response
- [ ] Security event logging implemented
- [ ] Real-time threat detection active
- [ ] Incident response plan documented
- [ ] Security alerts configured
```

### Regular Security Audits
```typescript
// Automated security audit tasks
const SECURITY_AUDIT_TASKS = [
  'dependency_vulnerability_scan',
  'code_security_analysis',
  'penetration_testing',
  'configuration_review',
  'access_control_audit',
  'data_protection_review'
]

// Security metrics tracking
export interface SecurityMetrics {
  failedLoginAttempts: number
  rateLimitViolations: number
  captchaFailures: number
  suspiciousActivities: number
  blockedIPs: number
  vulnerabilitiesFound: number
}
```

---

*These security standards ensure The Hockey Directory maintains the highest levels of protection for user data and system integrity while providing a seamless user experience.*