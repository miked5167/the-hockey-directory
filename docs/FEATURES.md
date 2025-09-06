# Hockey Directory - Feature Specifications

**Version:** 1.0  
**Last Updated:** September 2025

---

## 🎯 Feature Overview

This document details the specific functionality and requirements for each feature in the Hockey Directory platform. Features are organized by development priority and user impact.

---

## ✅ MVP Features (Already Implemented)

### 1. Advisor Directory & Profiles

#### **Advisor Directory Page (`/advisors`)**
- **Purpose:** Showcase all verified advisors with business logic prioritization
- **Key Features:**
  - Grid layout showing advisor cards (3-column on desktop, 1-column mobile)
  - Subscription tier indicators (Premium = Crown icon, Featured = Star icon)
  - Real-time stats display (300+ Advisors, 4.8 Average Rating, etc.)
  - Advanced filtering sidebar
  - Search functionality with autocomplete
  - Sort options: Featured First, Highest Rated, Most Experience, Name A-Z

#### **Advisor Profile Pages (`/advisors/[id]`)**
- **Purpose:** Detailed advisor information optimized for lead conversion
- **Key Features:**
  - Professional layout with subscription tier styling
  - Contact form integration (lead capture)
  - Reviews and ratings display
  - Specialties and certifications showcase
  - Success metrics (years experience, successful placements)
  - SEO optimization with structured data
  - Social proof elements (verification badges, testimonials)

#### **Business Logic Integration:**
- **Search Priority:** Premium → Featured → Basic → Free listings
- **Visual Hierarchy:** Gradient backgrounds and badges for paid tiers
- **Lead Routing:** Form submissions route based on subscription status
- **Monthly Limits:** Enforced at API level (Basic: 5, Featured: 20, Premium: unlimited)

---

### 2. Lead Management System

#### **Contact Forms**
- **Purpose:** Capture high-quality parent inquiries for advisors
- **Form Fields:**
  - **Parent Info:** Name*, Email*, Phone, Location
  - **Player Info:** Name, Age, Current Level, Goals
  - **Message:** Open text for specific needs/questions
- **Validation:**
  - Required field checking
  - Email format validation
  - Age range validation (4-25 for hockey context)
  - Spam prevention measures

#### **Lead Routing Logic**
```typescript
// Lead routing priority
1. Check advisor subscription status (active required)
2. Check monthly lead limits (Basic: 5, Featured: 20, Premium: unlimited)
3. Route to highest-tier advisor first if multiple match criteria
4. Send immediate confirmation to parent
5. Notify advisor via email within 5 minutes
6. Track lead status: new → contacted → qualified → converted → closed
```

#### **Lead Analytics**
- Track conversion rates by advisor
- Monitor lead quality scores
- Calculate average response times
- Generate monthly reports for advisors

---

### 3. Subscription Management

#### **Subscription Tiers**
| Feature | Basic ($49/mo) | Featured ($99/mo) | Premium ($199/mo) |
|---------|---------------|------------------|-------------------|
| Directory Listing | ✅ | ✅ | ✅ |
| Contact Information | ✅ | ✅ | ✅ |
| Monthly Leads | 5 | 20 | Unlimited |
| Search Priority | Standard | High | Highest |
| Profile Badge | Verified | Featured ⭐ | Premium 👑 |
| Enhanced Profile | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |
| Analytics Dashboard | Basic | Advanced | Full |

#### **Subscription Status Tracking**
- Real-time subscription validation
- Automatic feature access control
- Grace period handling (3 days past due)
- Downgrade/upgrade flows
- Cancellation retention workflows

---

### 4. Review & Rating System

#### **Review Collection**
- 5-star rating system
- Optional written reviews
- Parent name (first name + last initial for privacy)
- Review verification system
- Helpful/unhelpful voting
- Moderation queue for inappropriate content

#### **Rating Calculation**
```typescript
// Weighted rating system
- Total reviews influence overall rating visibility
- Recent reviews weighted more heavily (last 6 months = 1.2x weight)
- Verified reviews weighted higher than unverified
- Minimum 3 reviews required for public rating display
- Ratings update in real-time after new review submission
```

---

### 5. Advanced Search & Filtering

#### **Search Functionality**
- **Fuzzy Search:** Using Fuse.js for intelligent matching
- **Weighted Fields:** Name (30%), Bio (20%), Location (20%), Specialties (15%)
- **Auto-suggestions:** Real-time search suggestions as user types
- **Search Analytics:** Track popular search terms for SEO optimization

#### **Filter Options**
- **Subscription Tier:** Premium Only, Featured Only, All Verified
- **Location:** City/State search + popular location quick-select
- **Specialties:** Multi-select checkboxes (12 specialty categories)
- **Experience Level:** 5+, 10+, 15+, 20+ years
- **Ratings:** 4.0+, 4.5+, 4.8+ stars
- **Certifications:** USA Hockey, Hockey Canada, NCAA experience

---

## 📋 V1 Features (Next 3 Months)

### 1. Homepage & Marketing

#### **Homepage Design (`/`)**
- **Hero Section:** 
  - Value proposition headline
  - Primary search bar
  - Trust indicators (advisor count, parent testimonials)
- **Featured Advisors Carousel:**
  - Top 6-8 Premium/Featured advisors
  - Auto-rotating every 5 seconds
  - Click to view profile
- **How It Works:**
  - 3-step process illustration
  - Parent testimonials
  - Success stories
- **Trust & Safety:**
  - Verification process explanation
  - Security badges
  - Money-back guarantee

#### **SEO Landing Pages**
- Location-specific pages: `/advisors/boston-ma`, `/advisors/toronto-on`
- Specialty pages: `/hockey-advisors/college-recruitment`, `/coaches/goaltending`
- Blog/content section for hockey development guides

---

### 2. Payment Integration

#### **Stripe Integration**
- **Subscription Billing:**
  - Monthly/yearly subscription options
  - Automatic renewal handling
  - Failed payment retry logic
  - Dunning management (payment recovery)
- **One-time Payments:**
  - Featured listing boosts
  - Profile enhancement fees
  - Premium photo uploads

#### **Billing Dashboard**
- Payment history
- Invoice downloads
- Subscription management (upgrade/downgrade)
- Payment method updates
- Billing address management

---

### 3. Email Notification System

#### **Automated Email Flows**
- **For Parents:**
  - Lead submission confirmation
  - Advisor response notifications
  - Weekly advisor recommendations
  - Follow-up surveys after 30 days
- **For Advisors:**
  - New lead notifications (real-time)
  - Monthly lead summary reports
  - Subscription renewal reminders
  - Profile optimization tips

#### **Email Templates**
- Professional hockey-themed design
- Mobile-responsive layouts
- Personalization variables
- Unsubscribe management
- A/B testing capability

---

### 4. Enhanced Profile Features

#### **Multimedia Content**
- **Photo Galleries:** Up to 10 professional photos
- **Video Introductions:** 60-90 second advisor introductions
- **Document Uploads:** Certifications, testimonials, training plans
- **Portfolio Items:** Success stories, before/after player development

#### **Profile Optimization Tools**
- **Completion Score:** Percentage-based profile completeness
- **SEO Recommendations:** Keywords and content suggestions
- **Performance Analytics:** Profile views, contact form submissions
- **A/B Testing:** Test different bio versions, photo selections

---

## 🔮 V2 Features (6-12 Months)

### 1. Advisor Dashboard

#### **Lead Management**
- Lead pipeline view (Kanban-style)
- Contact history tracking
- Conversion rate analytics
- Response time monitoring
- Lead scoring and qualification tools

#### **Business Analytics**
- Revenue tracking and forecasting
- Lead source attribution
- Seasonal demand patterns
- Competitive analysis
- ROI calculations for subscription tiers

---

### 2. Parent Dashboard

#### **Saved Advisors**
- Favorite advisor lists
- Comparison tools
- Notes and ratings
- Contact history

#### **Recommendations Engine**
- AI-powered advisor matching
- Based on location, player age, goals
- Learning from successful connections
- Seasonal sport recommendations

---

### 3. In-Platform Messaging

#### **Communication System**
- Real-time messaging between parents and advisors
- File sharing (videos, documents)
- Appointment scheduling integration
- Message history and search
- Read receipts and typing indicators

#### **Safety Features**
- Message moderation
- Report inappropriate behavior
- Block/unblock functionality
- Privacy controls

---

### 4. Directory Expansion

#### **Tournament Directory**
- Searchable tournament database
- Age group and skill level filtering
- Registration deadline tracking
- Team formation tools
- Travel tournament recommendations

#### **Facility Directory**
- Ice rink and training facility listings
- Availability calendar integration
- Equipment rental information
- Coaching staff directories
- Parent reviews and ratings

---

## 🎨 Design Specifications

### **Visual Design System**

#### **Colors**
- **Primary Blue:** #0ea5e9 (ice blue)
- **Secondary Blue:** #0284c7 (darker blue)
- **Accent Red:** #dc2626 (hockey red)
- **Success Green:** #16a34a
- **Warning Amber:** #d97706
- **Neutral Grays:** #f8fafc, #e2e8f0, #64748b, #334155

#### **Typography**
- **Primary Font:** Inter (clean, modern, web-optimized)
- **Headers:** Bold weights (600-800)
- **Body Text:** Regular weight (400)
- **Captions:** Light weight (300)

#### **Component Library**
- Button styles with hover states
- Card layouts with elevation
- Form input styling
- Navigation components
- Modal and dialog patterns
- Loading states and skeletons

---

### **Responsive Design**

#### **Breakpoints**
- **Mobile:** 320px - 768px (single column, touch-optimized)
- **Tablet:** 768px - 1024px (2-column layouts)
- **Desktop:** 1024px+ (3-column grids, sidebar layouts)

#### **Mobile-First Considerations**
- Touch targets minimum 44px
- Simplified navigation (hamburger menu)
- Optimized image loading
- Offline functionality consideration
- Swipe gestures for carousels

---

## 🔧 Technical Specifications

### **Performance Requirements**
- **Page Load Speed:** <2 seconds on 3G
- **Time to Interactive:** <3 seconds
- **Core Web Vitals:** All green scores
- **Search Response:** <500ms
- **Image Optimization:** WebP format, lazy loading

### **SEO Requirements**
- **Meta Tags:** Dynamic based on page content
- **Structured Data:** Schema.org markup for advisors
- **Sitemap:** Auto-generated, updated daily
- **Robots.txt:** Properly configured
- **Canonical URLs:** Prevent duplicate content

### **Security & Privacy**
- **Data Encryption:** All sensitive data encrypted at rest
- **HTTPS:** SSL certificates on all pages
- **GDPR Compliance:** Cookie consent, data deletion
- **Input Validation:** XSS and SQL injection prevention
- **Rate Limiting:** API abuse prevention

---

## 📊 Success Metrics

### **Feature-Specific KPIs**

#### **Advisor Directory**
- **Profile Views:** Average 50+ views per advisor per month
- **Contact Rate:** >15% of profile views result in contact forms
- **Search Usage:** >70% of visitors use search functionality
- **Filter Usage:** >40% of visitors apply filters

#### **Lead Management**
- **Lead Quality Score:** >8/10 based on advisor feedback
- **Response Time:** <24 hours average advisor response
- **Conversion Rate:** >20% leads become paying clients
- **Lead Volume:** 500+ leads per month at scale

#### **Subscription System**
- **Upgrade Rate:** >30% of Basic users upgrade within 6 months
- **Churn Rate:** <5% monthly across all tiers
- **Payment Success:** >95% successful payment processing
- **Feature Utilization:** >80% of paid features actively used

---

## 🚀 Implementation Priority

### **High Priority (Immediate)**
1. Homepage design and content
2. Payment integration (Stripe)
3. Email notification system
4. Basic advisor dashboard

### **Medium Priority (Next Quarter)**
1. Enhanced profile features
2. Advanced search improvements
3. Mobile app consideration
4. Content management system

### **Low Priority (Future Releases)**
1. In-platform messaging
2. Tournament directory expansion
3. API for third-party integrations
4. White-label solutions

---

*This feature specification will be updated as development progresses and user feedback is incorporated. All features should align with the business objectives outlined in the PRD.*