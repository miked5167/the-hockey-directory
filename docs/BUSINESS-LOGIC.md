# Hockey Directory - Business Logic Documentation

**Version:** 1.0  
**Last Updated:** September 2025

---

## 💰 Subscription & Monetization Logic

### **Subscription Tiers & Pricing**

#### **Tier Structure**
```typescript
interface SubscriptionTier {
  name: 'basic' | 'featured' | 'premium'
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  maxLeads: number | null  // null = unlimited
  priority: number         // Higher = better search placement
  featured: boolean        // Shows in featured sections
}
```

#### **Pricing Matrix**
| Tier | Monthly | Yearly | Savings | Lead Limit | Priority Score |
|------|---------|--------|---------|------------|----------------|
| **Basic** | $49.99 | $499.99 | 17% | 5/month | 1 |
| **Featured** | $99.99 | $999.99 | 17% | 20/month | 5 |
| **Premium** | $199.99 | $1999.99 | 17% | Unlimited | 10 |

---

## 🎯 Lead Management Logic

### **Lead Routing Algorithm**

#### **Step 1: Advisor Eligibility Check**
```typescript
async function isAdvisorEligible(advisorId: string): Promise<boolean> {
  const advisor = await getAdvisor(advisorId)
  
  // Must be verified
  if (!advisor.verified) return false
  
  // Must have active subscription
  const hasActiveSubscription = await isSubscriptionActive(advisorId)
  if (!hasActiveSubscription) return false
  
  // Must be within lead limits
  const canReceiveMoreLeads = await canReceiveMoreLeads(advisorId)
  if (!canReceiveMoreLeads) return false
  
  return true
}
```

#### **Step 2: Lead Routing Priority**
```typescript
// Priority order for lead routing
1. Premium advisors (priority: 10) - unlimited leads
2. Featured advisors (priority: 5) - up to 20 leads/month
3. Basic advisors (priority: 1) - up to 5 leads/month
4. Within same tier: sort by rating (highest first)
5. If tied rating: sort by response time (fastest first)
6. If still tied: round-robin distribution
```

#### **Step 3: Monthly Lead Limits**
```typescript
async function canReceiveMoreLeads(advisorId: string): Promise<boolean> {
  const subscription = await getActiveSubscription(advisorId)
  
  // Premium tier has unlimited leads
  if (!subscription.plan.maxLeads) return true
  
  // Count leads this calendar month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  
  const leadsThisMonth = await countLeadsForAdvisor(advisorId, startOfMonth)
  
  return leadsThisMonth < subscription.plan.maxLeads
}
```

---

### **Lead Status Workflow**

#### **Lead Lifecycle States**
```typescript
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'

interface LeadStatusFlow {
  new: {
    description: "Just submitted by parent"
    autoTransitions: "None - requires advisor action"
    timeLimit: "Advisor should respond within 24-48 hours"
  }
  
  contacted: {
    description: "Advisor has reached out to parent"
    autoTransitions: "Auto-move to 'qualified' after parent responds positively"
    timeLimit: "Should qualify within 7 days or mark closed"
  }
  
  qualified: {
    description: "Parent is interested and fit is confirmed"
    autoTransitions: "None - requires manual conversion tracking"
    timeLimit: "Should convert or close within 30 days"
  }
  
  converted: {
    description: "Parent has hired advisor - commission eligible"
    autoTransitions: "Can be updated with deal value and commission"
    timeLimit: "No time limit - success state"
  }
  
  closed: {
    description: "Lead didn't convert - not a fit or declined"
    autoTransitions: "Final state - no further changes"
    timeLimit: "Final state"
  }
}
```

#### **Commission Trigger Logic**
```typescript
async function processLeadConversion(leadId: string, dealValue: number) {
  const lead = await getLead(leadId)
  const advisor = await getAdvisor(lead.advisorId)
  
  // Update lead status
  await updateLead(leadId, {
    status: 'converted',
    leadValue: dealValue,
    conversionDate: new Date()
  })
  
  // Calculate commission based on advisor tier
  const commissionRate = getCommissionRate(advisor.subscription.plan.name)
  const commissionAmount = dealValue * commissionRate
  
  // Record commission payment
  await createCommissionPayment({
    advisorId: lead.advisorId,
    leadId: leadId,
    amount: commissionAmount,
    rate: commissionRate,
    dealValue: dealValue
  })
}
```

---

## 💵 Commission Structure

### **Commission Rates by Tier**
```typescript
const COMMISSION_RATES = {
  basic: 0.10,      // 10% commission
  featured: 0.15,   // 15% commission  
  premium: 0.20     // 20% commission
} as const
```

### **Commission Calculation Logic**
```typescript
function calculateCommission(dealValue: number, tierName: string): number {
  const rate = COMMISSION_RATES[tierName] || COMMISSION_RATES.basic
  return dealValue * rate
}

// Example calculations:
// Basic advisor, $3000 deal = $300 commission (10%)
// Featured advisor, $3000 deal = $450 commission (15%)
// Premium advisor, $3000 deal = $600 commission (20%)
```

### **Payment Processing**
```typescript
interface CommissionPayment {
  advisorId: string
  leadId: string
  type: 'commission'
  amount: number
  dealValue: number
  commissionRate: number
  status: 'pending' | 'processing' | 'paid' | 'failed'
  stripePaymentId?: string
  scheduledPayDate: Date  // Net 30 payment terms
  createdAt: Date
}
```

---

## 🔍 Search & Display Logic

### **Search Result Prioritization**

#### **Primary Sort: Subscription Priority**
```typescript
function sortAdvisorsByBusinessLogic(advisors: Advisor[]): Advisor[] {
  return advisors.sort((a, b) => {
    // 1. Subscription priority (Premium > Featured > Basic > Free)
    const aPriority = a.subscription?.plan?.priority || 0
    const bPriority = b.subscription?.plan?.priority || 0
    if (aPriority !== bPriority) {
      return bPriority - aPriority  // Higher priority first
    }
    
    // 2. If same tier, sort by rating
    const aRating = a.rating || 0
    const bRating = b.rating || 0
    if (aRating !== bRating) {
      return bRating - aRating  // Higher rating first
    }
    
    // 3. If tied rating, sort by review count
    const aReviews = a.reviewCount || 0
    const bReviews = b.reviewCount || 0
    if (aReviews !== bReviews) {
      return bReviews - aReviews  // More reviews first
    }
    
    // 4. Finally, sort by years of experience
    const aExp = a.yearsExperience || 0
    const bExp = b.yearsExperience || 0
    return bExp - aExp  // More experience first
  })
}
```

#### **Featured Placement Logic**
```typescript
// Featured advisors appear in special sections
async function getFeaturedAdvisors(limit?: number): Advisor[] {
  const advisors = await prisma.advisor.findMany({
    where: {
      verified: true,
      subscription: {
        status: 'active',
        plan: {
          featured: true  // Featured or Premium tiers
        }
      }
    },
    orderBy: [
      { subscription: { plan: { priority: 'desc' } } },  // Premium first
      { rating: 'desc' },                                // Then by rating
      { reviewCount: 'desc' }                           // Then by review count
    ],
    take: limit
  })
  
  return advisors
}
```

---

## 👤 Profile Display Logic

### **Subscription Tier Visual Indicators**

#### **Profile Styling by Tier**
```typescript
function getProfileStyling(advisorTier: string) {
  switch (advisorTier) {
    case 'premium':
      return {
        cardClass: 'advisor-premium border-purple-200',
        backgroundGradient: 'from-purple-50 via-indigo-50 to-blue-50',
        badge: {
          icon: 'Crown',
          text: 'Premium Partner',
          class: 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white'
        }
      }
      
    case 'featured':
      return {
        cardClass: 'advisor-featured border-amber-200',
        backgroundGradient: 'from-amber-50 via-yellow-50 to-orange-50',
        badge: {
          icon: 'Sparkles', 
          text: 'Featured Advisor',
          class: 'bg-gradient-to-r from-amber-500 to-yellow-600 text-white'
        }
      }
      
    case 'basic':
      return {
        cardClass: '',
        backgroundGradient: '',
        badge: {
          icon: 'CheckCircle',
          text: 'Verified Advisor', 
          class: 'bg-green-50 text-green-700 border-green-200'
        }
      }
      
    default:
      return {
        cardClass: '',
        backgroundGradient: '',
        badge: null
      }
  }
}
```

#### **Feature Access Control**
```typescript
function getFeatureAccess(advisorTier: string) {
  const baseFeatures = {
    basicListing: true,
    contactForm: true,
    basicProfile: true
  }
  
  const featuredFeatures = {
    ...baseFeatures,
    enhancedProfile: true,
    priorityPlacement: true,
    profilePhotos: true,
    reviewHighlights: true
  }
  
  const premiumFeatures = {
    ...featuredFeatures,
    unlimitedLeads: true,
    analyticsAccess: true,
    prioritySupport: true,
    customBranding: true,
    videoIntroductions: true
  }
  
  switch (advisorTier) {
    case 'premium': return premiumFeatures
    case 'featured': return featuredFeatures
    case 'basic': return baseFeatures
    default: return { basicListing: false }
  }
}
```

---

## 📊 Analytics & Reporting Logic

### **Lead Analytics**

#### **Conversion Rate Calculation**
```typescript
async function calculateConversionRate(advisorId: string, timeframe: 'month' | 'quarter' | 'year') {
  const dateRange = getDateRange(timeframe)
  
  const totalLeads = await prisma.lead.count({
    where: {
      advisorId,
      createdAt: { gte: dateRange.start, lte: dateRange.end }
    }
  })
  
  const convertedLeads = await prisma.lead.count({
    where: {
      advisorId,
      status: 'converted',
      createdAt: { gte: dateRange.start, lte: dateRange.end }
    }
  })
  
  return totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0
}
```

#### **Revenue Attribution**
```typescript
async function getRevenueAttribution(advisorId: string) {
  const payments = await prisma.payment.findMany({
    where: { 
      advisorId,
      type: { in: ['subscription', 'commission'] }
    }
  })
  
  const subscriptionRevenue = payments
    .filter(p => p.type === 'subscription')
    .reduce((sum, p) => sum + p.amount, 0)
    
  const commissionRevenue = payments
    .filter(p => p.type === 'commission')  
    .reduce((sum, p) => sum + p.amount, 0)
  
  return {
    subscriptionRevenue,
    commissionRevenue,
    totalRevenue: subscriptionRevenue + commissionRevenue
  }
}
```

---

## 🔐 Subscription Status Logic

### **Subscription State Management**

#### **Active Subscription Check**
```typescript
async function isSubscriptionActive(advisorId: string): Promise<boolean> {
  const subscription = await prisma.advisorSubscription.findUnique({
    where: { advisorId },
    include: { plan: true }
  })
  
  if (!subscription) return false
  if (subscription.status !== 'active') return false
  if (subscription.endDate && subscription.endDate < new Date()) return false
  
  return true
}
```

#### **Grace Period Handling**
```typescript
async function checkGracePeriod(subscription: AdvisorSubscription): Promise<SubscriptionStatus> {
  const now = new Date()
  const endDate = subscription.endDate
  
  if (!endDate) return 'active'  // No end date = unlimited
  
  const daysPastDue = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysPastDue <= 0) return 'active'
  if (daysPastDue <= 3) return 'grace_period'  // 3-day grace period
  if (daysPastDue <= 30) return 'suspended'    // 30-day suspended period
  return 'expired'  // Beyond 30 days = expired
}
```

#### **Feature Degradation Logic**
```typescript
function getFeaturesBySubscriptionStatus(status: SubscriptionStatus) {
  switch (status) {
    case 'active':
      return 'all_features'  // Full access
      
    case 'grace_period':  
      return 'limited_features'  // Profile visible, no new leads
      
    case 'suspended':
      return 'profile_only'  // Profile visible, marked as unavailable
      
    case 'expired':
      return 'no_features'  // Profile hidden from search
  }
}
```

---

## 📈 Business Intelligence Logic

### **Marketplace Health Metrics**

#### **Supply/Demand Balance**
```typescript
async function getMarketplaceHealth() {
  const advisorCount = await prisma.advisor.count({ where: { verified: true } })
  const activeParents = await getActiveParentCount() // Based on lead submissions
  const optimalRatio = 10 // 10 parents per advisor
  
  const currentRatio = activeParents / advisorCount
  const healthScore = Math.min(100, (currentRatio / optimalRatio) * 100)
  
  return {
    advisorCount,
    activeParents, 
    ratio: currentRatio,
    healthScore,
    recommendation: getHealthRecommendation(healthScore)
  }
}
```

#### **Revenue Forecasting**
```typescript
async function forecastMonthlyRevenue() {
  const subscriptions = await prisma.advisorSubscription.findMany({
    where: { status: 'active' },
    include: { plan: true }
  })
  
  const monthlySubscriptionRevenue = subscriptions.reduce(
    (sum, sub) => sum + sub.plan.monthlyPrice, 0
  )
  
  const avgCommissionPerMonth = await getAverageCommissionRevenue()
  const projectedGrowthRate = 0.15 // 15% monthly growth assumption
  
  return {
    currentMRR: monthlySubscriptionRevenue,
    projectedCommissions: avgCommissionPerMonth,
    totalProjected: monthlySubscriptionRevenue + avgCommissionPerMonth,
    nextMonthProjected: (monthlySubscriptionRevenue + avgCommissionPerMonth) * (1 + projectedGrowthRate)
  }
}
```

---

## 🚨 Business Rule Validations

### **Lead Submission Rules**
```typescript
const BUSINESS_RULES = {
  // Prevent spam submissions
  MAX_LEADS_PER_PARENT_PER_DAY: 3,
  
  // Ensure fair distribution
  MAX_LEADS_PER_ADVISOR_PER_DAY: 10,  // Even for Premium
  
  // Quality controls
  MIN_MESSAGE_LENGTH: 20,  // Characters in inquiry message
  REQUIRED_PLAYER_AGE: { min: 10, max: 18 },  // Target age range
  
  // Business protections
  MIN_DEAL_VALUE_FOR_COMMISSION: 500,  // Minimum $500 to trigger commission
  MAX_COMMISSION_AMOUNT: 2000,  // Cap commissions at $2000 per deal
}
```

### **Data Quality Rules**
```typescript
async function validateAdvisorProfile(advisor: Partial<Advisor>): Promise<ValidationResult> {
  const errors: string[] = []
  
  // Required fields
  if (!advisor.name || advisor.name.length < 2) {
    errors.push('Name must be at least 2 characters')
  }
  
  if (!advisor.email || !isValidEmail(advisor.email)) {
    errors.push('Valid email address required')
  }
  
  if (!advisor.location || advisor.location.length < 3) {
    errors.push('Location must be specified')
  }
  
  // Business quality rules
  if (advisor.bio && advisor.bio.length < 100) {
    errors.push('Bio should be at least 100 characters for better conversion')
  }
  
  if (!advisor.specialties || JSON.parse(advisor.specialties).length === 0) {
    errors.push('At least one specialty must be specified')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    completionScore: calculateProfileCompletionScore(advisor)
  }
}
```

---

*This business logic documentation should be referenced for all development decisions involving subscriptions, leads, commissions, and marketplace operations. Updates to business rules should be reflected here and in the corresponding code.*