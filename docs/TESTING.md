# Hockey Directory - Testing Standards

**Version:** 1.0  
**Date:** September 2025

---

## 🧪 Testing Philosophy

The Hockey Directory follows a comprehensive testing strategy to ensure reliability, security, and performance at scale. Our testing approach balances thorough coverage with development velocity, focusing on critical user paths and business logic.

### Testing Pyramid

```
       ┌─────────────────┐
       │   E2E Tests     │ ← Few, critical paths only
       │   (Cypress)     │
       └─────────────────┘
      ┌─────────────────────┐
      │ Integration Tests   │ ← API routes, services
      │   (Supertest)       │
      └─────────────────────┘
    ┌───────────────────────────┐
    │     Unit Tests            │ ← Business logic, utilities
    │     (Vitest)              │
    └───────────────────────────┘
```

---

## 📋 Testing Standards

### Coverage Requirements

```typescript
// Minimum coverage thresholds:
const COVERAGE_THRESHOLDS = {
  statements: 80,
  branches: 75,
  functions: 80,
  lines: 80
}

// Critical path coverage: 100%
- Lead submission flow
- Payment processing
- Subscription management
- User authentication
```

### Test Categories

#### 🔬 Unit Tests (Vitest)
**Purpose**: Test individual functions and components in isolation

**Scope**:
- Business logic functions (`/src/lib/business/`)
- Utility functions (`/src/lib/utils/`)
- Zod schema validation
- Ranking algorithms
- Data transformations

**Example Structure**:
```typescript
// src/lib/business/__tests__/rankings.test.ts
import { describe, it, expect } from 'vitest'
import { calculateAdvisorScore } from '../rankings'

describe('Advisor Ranking Algorithm', () => {
  it('should prioritize verified advisors', () => {
    const verifiedAdvisor = { verified: true, completeness: 100 }
    const unverifiedAdvisor = { verified: false, completeness: 100 }
    
    expect(calculateAdvisorScore(verifiedAdvisor))
      .toBeGreaterThan(calculateAdvisorScore(unverifiedAdvisor))
  })
  
  it('should handle edge cases gracefully', () => {
    expect(() => calculateAdvisorScore(null)).not.toThrow()
  })
})
```

#### 🔗 Integration Tests (Supertest)
**Purpose**: Test API endpoints and database interactions

**Scope**:
- All API routes (`/src/app/api/`)
- Database operations
- External service integrations
- Authentication flows

**Example Structure**:
```typescript
// src/app/api/__tests__/leads.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { createTestApp } from '@/test-utils/app'

describe('POST /api/leads', () => {
  beforeEach(async () => {
    await resetDatabase()
    await seedTestData()
  })

  it('should create lead with valid data', async () => {
    const leadData = {
      advisorId: 'test-advisor-1',
      parentEmail: 'parent@test.com',
      message: 'Interested in hockey advice for my 14yo'
    }

    const response = await request(app)
      .post('/api/leads')
      .send(leadData)
      .expect(201)

    expect(response.body.lead).toMatchObject({
      status: 'new',
      advisorId: leadData.advisorId
    })
  })

  it('should reject lead without CAPTCHA verification', async () => {
    const leadData = { /* missing turnstile token */ }
    
    await request(app)
      .post('/api/leads')
      .send(leadData)
      .expect(400)
  })

  it('should enforce rate limiting', async () => {
    const leadData = { /* valid data */ }
    
    // Submit multiple leads rapidly
    for (let i = 0; i < 6; i++) {
      await request(app).post('/api/leads').send(leadData)
    }
    
    // Should be rate limited
    await request(app)
      .post('/api/leads')
      .send(leadData)
      .expect(429)
  })
})
```

#### 🎭 End-to-End Tests (Cypress)
**Purpose**: Test critical user journeys in browser environment

**Scope**:
- Lead submission happy path
- Advisor registration and upgrade
- Search and discovery flow
- Payment processing

**Example Structure**:
```typescript
// cypress/e2e/lead-submission.cy.ts
describe('Lead Submission Flow', () => {
  beforeEach(() => {
    cy.visit('/advisors/john-smith')
    cy.seedDatabase('advisors')
  })

  it('should complete lead submission successfully', () => {
    // Fill contact form
    cy.get('[data-testid=contact-form]').within(() => {
      cy.get('input[name=parentName]').type('Jane Parent')
      cy.get('input[name=parentEmail]').type('jane@example.com')
      cy.get('textarea[name=message]').type('Looking for prep school guidance')
      cy.get('button[type=submit]').click()
    })

    // Verify success state
    cy.get('[data-testid=success-message]')
      .should('contain', 'Message sent successfully')
    
    // Verify lead created in database
    cy.task('verifyLeadCreated', {
      parentEmail: 'jane@example.com'
    }).should('eq', true)
  })
})
```

---

## 🛡️ Security Testing

### Authentication Tests
```typescript
describe('Authentication Security', () => {
  it('should reject expired tokens', async () => {
    const expiredToken = jwt.sign({}, secret, { expiresIn: '-1h' })
    
    await request(app)
      .get('/api/advisor/dashboard')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401)
  })
  
  it('should prevent role escalation', async () => {
    const advisorToken = generateAdvisorToken()
    
    await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${advisorToken}`)
      .expect(403)
  })
})
```

### Input Validation Tests
```typescript
describe('Input Validation', () => {
  it('should sanitize HTML in lead messages', async () => {
    const maliciousInput = '<script>alert("xss")</script>Safe message'
    
    const response = await request(app)
      .post('/api/leads')
      .send({ message: maliciousInput })
      .expect(201)
    
    expect(response.body.lead.message).not.toContain('<script>')
    expect(response.body.lead.message).toContain('Safe message')
  })
  
  it('should reject SQL injection attempts', async () => {
    const maliciousEmail = "'; DROP TABLE users; --"
    
    await request(app)
      .post('/api/leads')
      .send({ parentEmail: maliciousEmail })
      .expect(400)
  })
})
```

### Rate Limiting Tests
```typescript
describe('Rate Limiting', () => {
  it('should limit lead submissions per IP', async () => {
    const ip = '192.168.1.100'
    
    // Submit maximum allowed requests
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/leads')
        .set('X-Forwarded-For', ip)
        .send(validLeadData)
        .expect(201)
    }
    
    // Next request should be rate limited
    await request(app)
      .post('/api/leads')
      .set('X-Forwarded-For', ip)
      .send(validLeadData)
      .expect(429)
  })
})
```

---

## 💳 Payment Testing

### Stripe Integration Tests
```typescript
describe('Stripe Webhook Processing', () => {
  it('should activate subscription on successful payment', async () => {
    const webhookEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { advisorId: 'test-advisor-1' },
          subscription: 'sub_test123'
        }
      }
    }
    
    await request(app)
      .post('/api/webhooks/stripe')
      .send(webhookEvent)
      .expect(200)
    
    // Verify entitlement created
    const entitlement = await getAdvisorEntitlement('test-advisor-1')
    expect(entitlement.active).toBe(true)
  })
  
  it('should handle failed payment webhooks', async () => {
    const failedPayment = {
      type: 'invoice.payment_failed',
      data: { /* payment failure data */ }
    }
    
    await request(app)
      .post('/api/webhooks/stripe')
      .send(failedPayment)
      .expect(200)
    
    // Verify grace period initiated
    const advisor = await getAdvisor('test-advisor-1')
    expect(advisor.subscriptionStatus).toBe('grace_period')
  })
})
```

---

## 📊 Performance Testing

### Load Testing
```typescript
// Performance test configuration
const LOAD_TEST_CONFIG = {
  concurrent_users: 100,
  test_duration: '5m',
  scenarios: [
    {
      name: 'advisor_search',
      weight: 60,
      requests: ['GET /advisors', 'GET /advisors/[id]']
    },
    {
      name: 'lead_submission',
      weight: 30,
      requests: ['POST /api/leads']
    },
    {
      name: 'advisor_dashboard',
      weight: 10,
      requests: ['GET /api/advisor/dashboard']
    }
  ]
}
```

### Database Performance Tests
```typescript
describe('Database Performance', () => {
  it('should execute advisor search under 100ms', async () => {
    const startTime = Date.now()
    
    await searchAdvisors({
      location: 'Toronto',
      specialties: ['College Prep']
    })
    
    const executionTime = Date.now() - startTime
    expect(executionTime).toBeLessThan(100)
  })
  
  it('should handle concurrent lead submissions', async () => {
    const promises = Array(50).fill(null).map(() =>
      createLead(generateValidLeadData())
    )
    
    const results = await Promise.all(promises)
    expect(results.every(r => r.success)).toBe(true)
  })
})
```

---

## 🔍 Test Data Management

### Seed Data Strategy
```typescript
// test-utils/seed.ts
export const TEST_DATA = {
  advisors: [
    {
      id: 'advisor-1',
      name: 'John Smith',
      verified: true,
      completeness: 95,
      subscription: { plan: 'premium', active: true }
    },
    // ... more test advisors
  ],
  
  plans: [
    { name: 'basic', price: 4999, features: ['basic_listing'] },
    { name: 'featured', price: 9999, features: ['featured_placement'] },
    { name: 'premium', price: 19999, features: ['unlimited_leads'] }
  ]
}

export async function seedTestDatabase() {
  await prisma.advisor.createMany({ data: TEST_DATA.advisors })
  await prisma.plan.createMany({ data: TEST_DATA.plans })
}
```

### Database Isolation
```typescript
// test-utils/database.ts
export async function resetTestDatabase() {
  // Clear all tables in dependency order
  await prisma.lead.deleteMany()
  await prisma.review.deleteMany()
  await prisma.entitlement.deleteMany()
  await prisma.advisor.deleteMany()
  await prisma.plan.deleteMany()
}

beforeEach(async () => {
  await resetTestDatabase()
  await seedTestDatabase()
})
```

---

## 🎯 Testing Utilities

### Mock Services
```typescript
// test-utils/mocks.ts
export const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test'
      })
    }
  }
}

export const mockPostHog = {
  capture: vi.fn(),
  identify: vi.fn()
}

export const mockTurnstile = {
  verify: vi.fn().mockResolvedValue({ success: true })
}
```

### Test Factories
```typescript
// test-utils/factories.ts
export function createTestAdvisor(overrides = {}) {
  return {
    id: `advisor-${Date.now()}`,
    name: 'Test Advisor',
    email: `advisor${Date.now()}@test.com`,
    verified: true,
    completeness: 85,
    ...overrides
  }
}

export function createTestLead(overrides = {}) {
  return {
    advisorId: 'test-advisor-1',
    parentEmail: `parent${Date.now()}@test.com`,
    message: 'Test inquiry about hockey advice',
    status: 'new',
    ...overrides
  }
}
```

---

## 📈 Test Reporting

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
npm run test:coverage:open

# Coverage thresholds enforced in CI
```

### Test Metrics Tracking
```typescript
// Track test metrics in CI
const TEST_METRICS = {
  total_tests: process.env.TOTAL_TESTS,
  passing_tests: process.env.PASSING_TESTS,
  test_duration: process.env.TEST_DURATION,
  coverage_percentage: process.env.COVERAGE_PERCENT
}

// Send to analytics for tracking over time
await trackTestMetrics(TEST_METRICS)
```

---

## 🚨 Testing in CI/CD

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci --frozen-lockfile
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        
      - name: Run E2E tests
        run: npm run test:e2e:headless
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run test:changed
npm run lint
npm run typecheck
```

---

## 📋 Testing Checklist

### For New Features
```markdown
- [ ] Unit tests for business logic functions
- [ ] Integration tests for API endpoints
- [ ] Security tests for input validation
- [ ] Performance tests for database queries
- [ ] E2E test for critical user path (if applicable)
- [ ] Mock external service dependencies
- [ ] Test error handling and edge cases
- [ ] Verify test coverage meets thresholds
```

### For Bug Fixes
```markdown
- [ ] Reproduction test that fails before fix
- [ ] Test passes after fix implementation
- [ ] Regression tests to prevent similar bugs
- [ ] Edge case coverage expanded
```

---

*This testing strategy ensures The Hockey Directory maintains high quality, security, and performance standards while supporting rapid development and deployment cycles.*