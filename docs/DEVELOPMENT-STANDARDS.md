# Hockey Directory - Development Standards

**Version:** 1.0  
**Last Updated:** September 2025  
**Status:** Active

---

## 📋 Overview

This document establishes comprehensive development standards for The Hockey Directory project. These rules ensure code quality, security, performance, and maintainability while supporting our business objectives of creating a trusted platform for hockey families and service providers.

**Reference Documents:**
- [PRD.md](PRD.md) - Business requirements and success metrics
- [BUSINESS-LOGIC.md](BUSINESS-LOGIC.md) - Subscription and monetization logic
- [PROJECT-PLAN.md](PROJECT-PLAN.md) - Development roadmap and workflow
- [SETUP.md](SETUP.md) - Technical setup and environment configuration

---

## 🗄️ Data Model Standards

### Core Tables Structure

#### **Advisors Table**
```sql
advisors (
  id: string (cuid),
  slug: string (unique, SEO-friendly),
  name: string,
  headshot: string?, 
  city: string,
  province: string,
  country: string,
  bio: text,
  website: string?,
  socials: json, -- {linkedin, twitter, instagram}
  specialties: string[], -- JSON array
  levels: string[], -- JSON array (youth, junior, college, pro)
  verified: boolean (default: false),
  featured_until: timestamp?,
  completeness: integer (0-100),
  response_time_ms: integer?,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### **Reviews Table**
```sql
reviews (
  id: string (cuid),
  advisor_id: string (foreign key),
  rating: integer (1-5),
  title: string,
  body: text,
  author_name: string,
  status: enum('pending', 'approved', 'rejected'),
  admin_notes: text?,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### **Leads Table**
```sql
leads (
  id: string (cuid),
  advisor_id: string (foreign key),
  parent_email: string,
  parent_phone: string?,
  parent_name: string,
  player_age: integer?,
  message: text,
  status: enum('new', 'contacted', 'qualified', 'won', 'lost'),
  source: string (default: 'website'),
  value: decimal?, -- for conversion tracking
  created_at: timestamp,
  updated_at: timestamp
)
```

#### **Users Table**
```sql
users (
  id: string (cuid),
  email: string (unique),
  role: enum('admin', 'advisor', 'parent'),
  advisor_id: string? (foreign key),
  last_login: timestamp?,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### **Subscription Plans Table**
```sql
plans (
  id: string (cuid),
  name: enum('basic', 'featured', 'premium'),
  price_month: integer (cents),
  price_year: integer (cents),
  features_json: json,
  max_leads: integer?,
  priority_score: integer,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### **Entitlements Table**
```sql
entitlements (
  id: string (cuid),
  advisor_id: string (foreign key),
  plan_id: string (foreign key),
  active: boolean (default: true),
  renews_at: timestamp,
  cancel_at_period_end: boolean (default: false),
  stripe_subscription_id: string?,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### **Events Table**
```sql
events (
  id: string (cuid),
  name: string, -- 'profile_viewed', 'lead_submitted', etc.
  payload_json: json,
  user_id: string? (foreign key),
  advisor_id: string? (foreign key),
  ip_address: string?,
  user_agent: string?,
  created_at: timestamp
)
```

#### **Moderation Queue Table**
```sql
moderation_queue (
  id: string (cuid),
  type: enum('review', 'profile', 'lead'),
  ref_id: string, -- ID of the item being moderated
  status: enum('pending', 'approved', 'rejected'),
  notes: text?,
  moderator_id: string? (foreign key to users),
  created_at: timestamp,
  updated_at: timestamp
)
```

### Prisma Migration Standards
- **Clear Messages**: All migrations must have descriptive names (e.g., `add_advisor_completeness_scoring`)
- **Backward Compatible**: Never break existing data without migration scripts
- **Seed Data**: Maintain `scripts/seed.ts` with **golden dataset** (10+ advisors, reviews, etc.)
- **Testing**: Test migrations on copy of production data before deployment

---

## 🔐 Security & Privacy Standards

### Input Validation & Sanitization
```typescript
// All public forms MUST include:
- Turnstile CAPTCHA verification
- IP-based rate limiting (5 requests/minute per IP)
- User-based rate limiting (3 requests/minute per email)
- HTML sanitization using DOMPurify
- XSS prevention (no dangerouslySetInnerHTML without sanitizer)
```

### PII Protection
```typescript
// Data handling requirements:
- Email/phone: encrypted at rest where feasible
- Never log PII in application logs
- Lead delivery: email notification + secure dashboard access
- Free/basic listings: no direct contact exposure (route through forms)
```

### Authentication & Authorization
```typescript
// Security layers:
- JWT tokens with short expiry (15 minutes)
- Refresh token rotation
- Role-based access control (admin, advisor, parent)
- Session invalidation on suspicious activity
```

---

## 💳 Payments & Entitlements Standards

### Stripe Integration
```typescript
// Product configuration:
- Products: 'basic', 'featured', 'premium' (monthly & annual)
- Webhooks: entitlement updates NEVER trust client-side plan status
- Featured carousel: limited slots (configurable, e.g., 12 max)
- Entitlement checks: server-side validation for all features
```

### Business Logic Integration
```typescript
// Revenue tracking:
- Subscription revenue: automatic via Stripe webhooks
- Commission tracking: manual input with approval workflow  
- Lead limits: enforced at API level, not UI level
- Feature access: determined by active entitlements only
```

---

## 🔍 SEO & Accessibility Standards

### Structured Data Requirements
```typescript
// JSON-LD schemas required:
- List pages: ItemList, BreadcrumbList
- Profile pages: Person, Review, AggregateRating  
- FAQ pages: FAQPage schema
- Search pages: SearchResultsPage
```

### SEO Technical Requirements
```typescript
// Page optimization:
- Sitemaps: root + chunked advisor sitemaps (max 1000 URLs each)
- Canonicals: proper canonical URLs on filtered pages
- Meta tags: unique titles/descriptions per page
- Open Graph: profile-specific OG/Twitter cards
```

### Accessibility Requirements
```typescript
// A11y standards:
- Color contrast: minimum 4.5:1 ratio
- Form labels: all inputs properly labeled  
- Focus states: visible keyboard navigation
- Screen readers: proper ARIA labels and roles
- Alt text: descriptive alt text for all images
```

---

## 📊 Logging, Telemetry & Metrics Standards

### Event Tracking (PostHog)
```typescript
// Required events (helper in packages/types/events.ts):
const TRACKING_EVENTS = {
  // Discovery
  'profile_viewed': { advisor_id, source, user_type },
  'search_performed': { query, filters, result_count },
  'carousel_impression': { advisor_id, position, campaign },
  
  // Engagement  
  'cta_clicked': { advisor_id, cta_type, source },
  'lead_submitted': { advisor_id, lead_id, source },
  'review_submitted': { advisor_id, rating, source },
  
  // Business
  'purchase_started': { plan_name, advisor_id },
  'purchase_succeeded': { plan_name, advisor_id, amount },
  'lead_opened': { advisor_id, lead_id }
}
```

### Error Logging
```typescript
// API routes error handling:
- Sentry integration with request correlation IDs
- PII scrubbing in error payloads
- Performance monitoring for database queries
- Rate limit violation tracking
```

### Performance Metrics
```typescript
// Required tracking:
- Core Web Vitals: LCP, FID, CLS
- Custom metrics: lead conversion rate, search success rate
- Database performance: query execution time, connection pool usage
```

---

## 🧪 Testing Standards

### Testing Strategy
```typescript
// Testing pyramid:
Unit Tests (vitest):
  - Utils, zod schemas, ranking algorithms
  - Business logic functions
  - Component logic (not UI rendering)

Integration Tests (supertest):
  - API route functionality
  - Database operations
  - External service integrations

E2E Tests (Cypress - light coverage):
  - Lead submission happy path
  - Advisor signup/upgrade flow
  - Critical user journeys only
```

### Test Requirements
```typescript
// Minimum coverage:
- All new API routes must have integration tests
- Critical utilities must have unit tests
- Coverage should not decrease with new features
- Tests must pass before merge to main branch
```

---

## ⚡ Performance Standards

### Performance Budgets
```typescript
// Hard limits:
- LCP < 2.5s (desktop & mobile)
- JavaScript bundle < 200kb gzipped per page
- API response time < 500ms (p95)
- Database query time < 100ms (p95)
```

### Optimization Strategies
```typescript
// Implementation requirements:
- React Server Components where possible
- Streaming responses for data-heavy pages
- Server-side caching for read operations
- Image optimization with Next.js Image
- Database query optimization with proper indexing
```

---

## 🔧 Git & CI Standards

### Commit Standards
```bash
# Conventional commits format:
feat: add advisor completeness scoring algorithm
fix: resolve lead routing bug for premium advisors  
chore: update dependencies and security patches
refactor: extract lead notification service
test: add integration tests for subscription webhooks
docs: update API documentation for v2 endpoints
```

### Pull Request Standards
```markdown
# PR Template Requirements:
## Scope
- [ ] Feature description and business impact
- [ ] Files changed and reasoning

## Screenshots  
- [ ] Before/after for UI changes
- [ ] Mobile and desktop views

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests passing
- [ ] Manual testing completed

## Risks & Rollout
- [ ] Potential breaking changes identified
- [ ] Feature flags used for risky changes
- [ ] Rollback plan documented
```

### CI/CD Pipeline
```yaml
# GitHub Actions requirements:
- pnpm install --frozen-lockfile
- TypeScript typecheck (strict mode)
- ESLint + Prettier validation
- Unit and integration test execution
- Build verification
- Security scanning
```

---

## 🚩 Feature Flags Standards

### Flag Configuration
```typescript
// Feature flags system (packages/config/flags.ts):
interface FeatureFlags {
  advisorVideoProfiles: boolean
  enhancedSearchFilters: boolean
  automatedLeadRouting: boolean
  premiumAnalyticsDashboard: boolean
}

// Implementation:
- Environment-based flags for staging/production
- Database-backed flags for runtime toggling
- Gradual rollout capability (percentage-based)
- Default to disabled for new features
```

---

## 🎯 Ranking Formula Standards

### Advisor Ranking Algorithm
```typescript
// Formula: packages/config/ranking.ts
const calculateAdvisorScore = (advisor: Advisor): number => {
  const weights = {
    verified: 3.0,        // Verification badge
    completeness: 0.02,   // Profile completeness (0-100)
    recentActivity: 1.0,  // Last login/update activity
    responseRate: 2.0,    // Lead response rate
    reviewAverage: 2.0,   // Average review rating
    reviewCount: 0.2,     // Number of reviews
    featuredBoost: 10.0   // Featured/premium boost
  }
  
  return (
    (advisor.verified ? weights.verified : 0) +
    (advisor.completeness * weights.completeness) +
    (advisor.recentActivityScore * weights.recentActivity) +
    (advisor.responseRate * weights.responseRate) +
    (advisor.reviewAverage * weights.reviewAverage) +
    (advisor.reviewCount * weights.reviewCount) +
    (advisor.hasFeaturedBoost ? weights.featuredBoost : 0)
  )
}
```

---

## 🛡️ Moderation Standards

### Review Moderation
```typescript
// Review workflow:
- Default status: 'pending'
- Admin approval required before public display
- Profanity filtering with configurable word list
- PII detection and automatic redaction
- Advisor reply capability post-approval
- Moderation audit trail in moderation_queue
```

### Content Guidelines
```typescript
// Automated checks:
- Profanity detection and filtering
- Personal information (email, phone) detection
- Spam pattern recognition
- Inappropriate content flagging
- Manual review queue for edge cases
```

---

## 🎠 Featured Carousel Standards

### Carousel Configuration
```typescript
// Carousel rules:
interface CarouselConfig {
  maxSlots: number        // e.g., 12 total slots
  rotationStrategy: 'weighted_random' | 'round_robin'
  allowPinned: boolean    // Admin can pin specific advisors
  trackingRequired: boolean // Must emit carousel_impression events
}

// Eligibility:
- Active 'featured_carousel' entitlement required
- Verified advisor status required
- Profile completeness > 80%
- No recent moderation issues
```

---

## 🚀 Release & Rollback Standards

### Deployment Process
```yaml
# Release pipeline:
1. Staging deployment with seed data
2. Automated testing suite execution
3. Manual UAT on staging environment
4. Tagged release (semantic versioning)
5. Production deployment with database migration
6. Post-deployment verification
```

### Rollback Procedures
```bash
# Emergency rollback:
1. Revert to previous git tag
2. Restore database from latest backup
3. Verify system functionality
4. Communicate incident status
5. Post-mortem analysis required
```

---

## 📚 Documentation Standards

### Required Documentation
```markdown
# Documentation structure:
/docs/
├── architecture.md     # System diagrams + data flow
├── events.md          # Telemetry event specifications  
├── ranking.md         # Ranking algorithm rationale
├── onboarding-advisors.md # Advisor upgrade process
├── api/              # API endpoint documentation
└── deployment/       # Release and rollback procedures
```

---

## ✅ Definition of Done

### Task Completion Checklist
```markdown
Every development task must include:

- [ ] **Type Safety**: End-to-end type safety (DB → API → UI)
- [ ] **Testing**: Tests added/updated, coverage maintained
- [ ] **Telemetry**: Required events implemented and tested
- [ ] **SEO/A11y**: Meta tags, structured data, accessibility
- [ ] **Dependencies**: No unvetted dependencies added
- [ ] **Documentation**: Feature documentation updated
- [ ] **Schema**: Database migrations and seed data updated
- [ ] **Security**: Security review completed for sensitive features
- [ ] **Performance**: Performance impact assessed and optimized
```

---

## 🔄 Claude Code Generation Standards

### Code Generation Rules
```typescript
// When generating code:
1. Prefer small, focused diffs
2. Ask specific questions if context is missing
3. Import from env.ts (never hardcode secrets/URLs)
4. Include Zod validation for API endpoints
5. Return typed responses from API routes

// Response format:
- Default: unified diffs with repo root paths
- New files: include full file content
- Single file requests: return only that file

// Development approach:
- Test-first when feasible: tests → implement → refactor
- At minimum: integration tests for API endpoints
```

### Code Style Standards
```typescript
// TypeScript configuration:
- Strict mode enabled (noImplicitAny)
- Exhaustive switch statements
- Use 'never' type for unreachable code
- Pure functions where possible
- Side effects isolated in service layers
```

---

*This document serves as the authoritative guide for all development decisions in The Hockey Directory project. Updates require team review and approval.*