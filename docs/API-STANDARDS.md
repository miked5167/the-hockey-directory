# Hockey Directory - API Standards

**Version:** 1.0  
**Date:** September 2025

---

## 🚀 API Design Philosophy

The Hockey Directory API follows RESTful principles with a focus on type safety, security, and developer experience. All endpoints are built with Next.js API routes and include comprehensive validation, error handling, and documentation.

### Core Principles

- **Type Safety**: End-to-end TypeScript with Zod validation
- **Security First**: Authentication, authorization, and input sanitization
- **Consistency**: Standardized request/response formats
- **Performance**: Optimized queries and caching strategies
- **Developer Experience**: Clear documentation and predictable behavior

---

## 📊 API Structure

### Base URL Structure
```
Production:  https://hockeydirectory.com/api
Staging:     https://staging-hockeydirectory.com/api
Development: http://localhost:3000/api
```

### Versioning Strategy
```
/api/v1/advisors          # Version 1 (current)
/api/v2/advisors          # Version 2 (future)
/api/advisors             # Unversioned (maps to latest)
```

---

## 🔐 Authentication & Authorization

### Authentication Methods
```typescript
// JWT Bearer Token (Advisors, Admins)
Authorization: Bearer <jwt_token>

// API Key (Future: Partner integrations)
X-API-Key: <api_key>

// Public endpoints (no authentication required)
GET /api/advisors
GET /api/advisors/[id]
```

### Role-Based Access Control
```typescript
enum UserRole {
  ADMIN = 'admin',      // Full system access
  ADVISOR = 'advisor',  // Own profile and leads
  PARENT = 'parent',    // Lead submission only
  PUBLIC = 'public'     // Read-only access
}

// Permission matrix
const PERMISSIONS = {
  'GET /api/advisors': ['public'],
  'POST /api/leads': ['public', 'parent'],
  'GET /api/advisor/dashboard': ['advisor'],
  'PUT /api/advisors/[id]': ['advisor', 'admin'],
  'GET /api/admin/users': ['admin']
}
```

---

## 📝 Request/Response Standards

### Request Format
```typescript
// Standard request headers
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <token>",
  "X-Request-ID": "<uuid>",          // For request tracing
  "User-Agent": "Hockey-Directory/1.0"
}

// Request body validation with Zod
const CreateLeadSchema = z.object({
  advisorId: z.string().cuid(),
  parentName: z.string().min(2).max(100),
  parentEmail: z.string().email(),
  parentPhone: z.string().optional(),
  playerAge: z.number().int().min(10).max(18).optional(),
  message: z.string().min(20).max(1000),
  source: z.string().default('website'),
  turnstileToken: z.string() // CAPTCHA verification
})
```

### Response Format
```typescript
// Success response structure
interface APIResponse<T> {
  success: true
  data: T
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
  requestId: string
  timestamp: string
}

// Error response structure
interface APIError {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
  requestId: string
  timestamp: string
}
```

### Example Responses
```json
// Success response
{
  "success": true,
  "data": {
    "id": "advisor_123",
    "name": "John Smith",
    "verified": true,
    "rating": 4.8
  },
  "requestId": "req_abc123",
  "timestamp": "2025-09-06T10:30:00Z"
}

// Error response
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "parentEmail",
      "received": "invalid-email"
    }
  },
  "requestId": "req_def456",
  "timestamp": "2025-09-06T10:35:00Z"
}
```

---

## 🛠️ Standard API Endpoints

### Advisor Management

#### GET /api/advisors
```typescript
// Query parameters
interface AdvisorSearchParams {
  q?: string              // Search query
  location?: string       // City or region
  specialties?: string[]  // Array of specialties
  verified?: boolean      // Only verified advisors
  featured?: boolean      // Only featured advisors
  limit?: number         // Results per page (max 50)
  offset?: number        // Pagination offset
  sort?: 'rating' | 'name' | 'experience' | 'featured'
}

// Response
interface AdvisorListResponse {
  advisors: AdvisorSummary[]
  total: number
  hasMore: boolean
}
```

#### GET /api/advisors/[id]
```typescript
// Path parameters
interface AdvisorDetailParams {
  id: string  // Advisor ID or slug
}

// Response includes full profile data
interface AdvisorDetailResponse {
  advisor: AdvisorDetail
  reviews: ReviewSummary[]
  relatedAdvisors: AdvisorSummary[]
}
```

### Lead Management

#### POST /api/leads
```typescript
// Request body
interface CreateLeadRequest {
  advisorId: string
  parentName: string
  parentEmail: string
  parentPhone?: string
  playerAge?: number
  message: string
  source?: string
  turnstileToken: string
}

// Response
interface CreateLeadResponse {
  lead: {
    id: string
    status: 'new'
    submittedAt: string
  }
  advisor: {
    name: string
    responseTime: string
  }
}
```

### Review Management

#### POST /api/reviews
```typescript
// Request body
interface CreateReviewRequest {
  advisorId: string
  rating: number      // 1-5
  title: string
  body: string
  authorName: string
  authorEmail: string // Not exposed publicly
  turnstileToken: string
}

// Response
interface CreateReviewResponse {
  review: {
    id: string
    status: 'pending'  // Requires moderation
    submittedAt: string
  }
}
```

---

## 🔒 Security Standards

### Input Validation
```typescript
// Zod schema validation example
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = CreateLeadSchema.parse(body)
    
    // Proceed with validated data
    const lead = await createLead(validatedData)
    return Response.json({ success: true, data: lead })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors
        }
      }, { status: 400 })
    }
    
    throw error
  }
}
```

### Rate Limiting
```typescript
// Rate limiting configuration
const RATE_LIMITS = {
  '/api/leads': {
    windowMs: 60000,      // 1 minute
    maxRequests: 5,       // 5 requests per minute
    skipSuccessfulRequests: false
  },
  '/api/reviews': {
    windowMs: 300000,     // 5 minutes
    maxRequests: 2,       // 2 reviews per 5 minutes
    skipSuccessfulRequests: true
  }
}

// Implementation
async function checkRateLimit(endpoint: string, identifier: string) {
  const key = `rate_limit:${endpoint}:${identifier}`
  const count = await redis.incr(key)
  
  if (count === 1) {
    await redis.expire(key, RATE_LIMITS[endpoint].windowMs / 1000)
  }
  
  if (count > RATE_LIMITS[endpoint].maxRequests) {
    throw new RateLimitError('Too many requests')
  }
}
```

### CAPTCHA Verification
```typescript
// Turnstile verification
async function verifyTurnstile(token: string): Promise<boolean> {
  const response = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token
      })
    }
  )
  
  const result = await response.json()
  return result.success === true
}
```

---

## 📊 Error Handling

### Standard Error Codes
```typescript
enum APIErrorCode {
  // Client errors (4xx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  CAPTCHA_FAILED = 'CAPTCHA_FAILED',
  
  // Server errors (5xx)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}
```

### Error Response Examples
```json
// Validation error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": {
      "field": "parentEmail",
      "expected": "string",
      "received": "undefined"
    }
  }
}

// Rate limit error
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests, please try again later",
    "details": {
      "retryAfter": 60,
      "limit": 5,
      "remaining": 0
    }
  }
}
```

---

## 📈 Performance Standards

### Response Time Targets
```typescript
const PERFORMANCE_TARGETS = {
  'GET /api/advisors': 200,      // ms
  'GET /api/advisors/[id]': 300, // ms
  'POST /api/leads': 500,        // ms
  'POST /api/reviews': 400       // ms
}
```

### Caching Strategy
```typescript
// Cache configuration
const CACHE_CONFIG = {
  'GET /api/advisors': {
    ttl: 300,           // 5 minutes
    vary: ['location', 'specialties']
  },
  'GET /api/advisors/[id]': {
    ttl: 600,           // 10 minutes
    revalidate: true    // Background revalidation
  }
}

// Implementation with Redis
async function getCachedResponse(key: string) {
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }
  return null
}
```

### Database Query Optimization
```typescript
// Optimized advisor query with proper includes
async function getAdvisors(params: AdvisorSearchParams) {
  return prisma.advisor.findMany({
    where: buildWhereClause(params),
    include: {
      subscription: {
        include: { plan: true }
      },
      reviews: {
        where: { status: 'approved' },
        select: { rating: true }
      }
    },
    orderBy: buildOrderByClause(params.sort),
    take: Math.min(params.limit || 20, 50),
    skip: params.offset || 0
  })
}
```

---

## 📋 API Documentation

### OpenAPI Specification
```yaml
# api-docs.yml
openapi: 3.0.0
info:
  title: Hockey Directory API
  version: 1.0.0
  description: RESTful API for Hockey Directory platform

paths:
  /advisors:
    get:
      summary: List advisors
      parameters:
        - name: q
          in: query
          schema:
            type: string
          description: Search query
      responses:
        '200':
          description: List of advisors
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AdvisorList'
```

### Type Definitions Export
```typescript
// types/api.ts - Exported for client consumption
export interface AdvisorSummary {
  id: string
  slug: string
  name: string
  location: string
  specialties: string[]
  verified: boolean
  rating: number
  reviewCount: number
  subscriptionTier: 'basic' | 'featured' | 'premium'
}

export interface CreateLeadRequest {
  advisorId: string
  parentName: string
  parentEmail: string
  message: string
  turnstileToken: string
}
```

---

## 🔍 Monitoring & Logging

### Request Logging
```typescript
// API request logging middleware
export function apiLogger(req: Request) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  
  // Log request
  logger.info('API Request', {
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent'),
    ip: getClientIP(req)
  })
  
  // Return response logger
  return (status: number, responseTime: number) => {
    logger.info('API Response', {
      requestId,
      status,
      responseTime: Date.now() - startTime
    })
  }
}
```

### Error Tracking
```typescript
// Sentry integration for error tracking
export function trackAPIError(error: Error, context: any) {
  Sentry.withScope((scope) => {
    scope.setContext('api', {
      endpoint: context.endpoint,
      method: context.method,
      requestId: context.requestId
    })
    
    scope.setLevel('error')
    Sentry.captureException(error)
  })
}
```

---

## 🚀 Testing API Endpoints

### Integration Test Example
```typescript
// tests/api/advisors.test.ts
describe('GET /api/advisors', () => {
  it('should return paginated advisor list', async () => {
    await seedTestData()
    
    const response = await request(app)
      .get('/api/advisors?limit=10&location=Toronto')
      .expect(200)
    
    expect(response.body).toMatchObject({
      success: true,
      data: {
        advisors: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            location: 'Toronto'
          })
        ]),
        total: expect.any(Number),
        hasMore: expect.any(Boolean)
      }
    })
  })
})
```

---

## 📋 API Development Checklist

### For New Endpoints
```markdown
- [ ] Zod schema validation for request body
- [ ] Proper authentication/authorization checks
- [ ] Rate limiting implemented
- [ ] Error handling with standard error codes
- [ ] Request/response logging
- [ ] Integration tests written
- [ ] Performance benchmarking completed
- [ ] API documentation updated
- [ ] Type definitions exported
```

### Security Checklist
```markdown
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CAPTCHA verification (public endpoints)
- [ ] Rate limiting configured
- [ ] Sensitive data not logged
- [ ] Proper CORS configuration
```

---

*These API standards ensure The Hockey Directory maintains consistent, secure, and performant endpoints that support both current needs and future scaling requirements.*