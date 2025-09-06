# Hockey Directory - Design System Specifications

**Version:** 1.0  
**Based on:** UI Inspiration Analysis  
**Last Updated:** September 2025

---

## 🎨 Design Philosophy

The Hockey Directory design system combines **professional trust-building** with **hockey-specific energy**, creating a platform that feels both authoritative and approachable for hockey families.

### **Core Principles**
- **Trust First**: Clean, professional layouts that build confidence
- **Hockey Energy**: Athletic colors and dynamic imagery
- **Mobile Excellence**: 60%+ traffic requires mobile-first approach
- **Conversion Focus**: Clear CTAs and minimal friction
- **Accessibility**: WCAG 2.1 AA compliance throughout

---

## 🎯 Component Specifications from Inspiration Analysis

### **1. Featured Provider Cards (from 3PL Directory)**
```typescript
// Inspired by the "Featured 3PLs" section
interface FeaturedAdvisorCard {
  // Visual Hierarchy
  layout: 'premium' | 'featured' | 'basic'
  backgroundGradient: boolean // Premium gets gradient
  borderStyle: 'premium' | 'featured' | 'standard'
  
  // Content Structure
  header: {
    badge: VerificationBadge
    tier: SubscriptionTier
    name: string
    rating: StarRating
  }
  
  body: {
    specialties: string[]
    experience: string
    location: string
    shortBio: string
  }
  
  footer: {
    cta: PrimaryButton
    stats: { reviews: number, successRate?: number }
  }
}
```

### **2. Provider Grid Layout (from Category Page)**
```typescript
// Inspired by the structured grid in first image
interface AdvisorGrid {
  // Responsive Grid
  columns: {
    mobile: 1,
    tablet: 2, 
    desktop: 3,
    large: 4
  }
  
  // Card Variations
  cardTypes: [
    'premium-featured',  // Top placement, gradient
    'featured-standard', // Featured placement
    'basic-standard'     // Standard placement
  ]
  
  // Interactive States
  hover: 'lift-shadow'   // Subtle elevation on hover
  loading: 'skeleton'    // Smooth loading states
}
```

### **3. Trust Indicators (from all images)**
```typescript
// Verification badges seen throughout
interface TrustIndicators {
  verificationBadge: {
    icon: 'checkmark-shield'
    text: 'Verified Advisor'
    color: 'success-green'
  }
  
  subscriptionTiers: {
    premium: {
      icon: 'crown'
      text: 'Premium Partner'
      gradient: 'purple-to-blue'
    }
    featured: {
      icon: 'star'
      text: 'Featured Advisor'
      gradient: 'gold-to-orange'
    }
  }
  
  statsDisplay: {
    rating: StarRating
    reviewCount: number
    responseTime: string
    successRate?: number
  }
}
```

### **4. Navigation & Header (from all pages)**
```typescript
// Professional navigation seen in inspiration
interface Navigation {
  // Header Layout
  logo: 'left-aligned'
  navigation: 'center-aligned'
  cta: 'right-aligned-primary-button'
  
  // Mobile Behavior
  mobile: {
    logo: 'left'
    hamburger: 'right'
    overlay: 'full-screen-menu'
  }
  
  // Menu Items
  primaryNav: [
    'Find Advisors',
    'Coaches', 
    'Prep Schools',
    'Tournaments',
    'Resources'
  ]
  
  ctaButton: {
    text: 'List Your Services'
    style: 'primary-blue'
    size: 'medium'
  }
}
```

### **5. Call-to-Action Patterns (from blue theme)**
```typescript
// Strong blue CTAs seen throughout
interface CTAPatterns {
  primary: {
    background: 'hockey-blue-600'
    text: 'white'
    hover: 'hockey-blue-700'
    shadow: 'medium'
  }
  
  secondary: {
    border: 'hockey-blue-600'
    text: 'hockey-blue-600'
    background: 'transparent'
    hover: 'hockey-blue-50'
  }
  
  // Sizes from inspiration
  sizes: {
    small: '32px height',
    medium: '40px height', 
    large: '48px height',
    xl: '56px height'
  }
}
```

### **6. Content Sections (from layout patterns)**
```typescript
// Clean sectioning seen in examples
interface ContentSections {
  hero: {
    layout: 'centered'
    background: 'gradient' | 'image-overlay'
    content: 'value-prop + search-bar + trust-stats'
  }
  
  featuredProviders: {
    layout: 'grid-with-sidebar'
    sidebar: 'filters + sponsored-content'
    grid: 'responsive-card-grid'
  }
  
  testimonials: {
    layout: 'carousel' | 'grid'
    style: 'photo + quote + name + title'
  }
  
  faq: {
    layout: 'accordion'
    style: 'expandable-sections'
  }
}
```

---

## 🏒 Hockey-Specific Adaptations

### **Visual Elements**
- **Ice Blue Primary**: Professional hockey rink aesthetic
- **Hockey Red Accents**: Energy and urgency for CTAs
- **Athletic Typography**: Strong, confident font choices
- **Action Photography**: Players, coaching, training moments
- **Success Imagery**: College commitments, achievements

### **Hockey Terminology Integration**
- Specialties: "Skill Development", "College Prep", "Mental Training"
- Levels: "Youth", "Junior", "College", "Professional"
- Trust Signals: "Former NHL Player", "NCAA Certified", "X Years Experience"

### **Parent-Focused Messaging**
- Emphasis on results and outcomes
- Clear pricing and value propositions
- Success stories and testimonials
- Safety and verification priorities

---

## 📱 Mobile-First Specifications

### **Responsive Breakpoints** (from mobile-first analysis)
```css
/* Mobile First Approach */
mobile: 320px - 767px    /* Primary target */
tablet: 768px - 1023px   /* Secondary */
desktop: 1024px - 1439px /* Tertiary */
large: 1440px+           /* Enhancement */
```

### **Touch-Friendly Interactions**
- Minimum 44px touch targets
- Swipe gestures for carousels
- Pull-to-refresh functionality
- Thumb-reach navigation
- Fast tap responses

### **Mobile Performance**
- Skeleton screens for loading
- Progressive image loading
- Optimized asset delivery
- Minimal JavaScript bundles
- Offline-capable core features

---

## 🎨 Component Priority Order

### **Phase 1: Core Components**
1. **AdvisorCard** - The heart of the directory
2. **Navigation** - Site-wide navigation and mobile menu
3. **Hero** - Homepage value proposition
4. **Button** - All CTA variations
5. **Badge** - Trust indicators and subscription tiers

### **Phase 2: Layout Components**
1. **Grid** - Responsive advisor grid
2. **Filters** - Search and filter sidebar
3. **Modal** - Contact forms and dialogs
4. **Carousel** - Featured advisors and testimonials
5. **Footer** - Site-wide footer with links

### **Phase 3: Content Components**
1. **ReviewCard** - Parent testimonials
2. **StatsDisplay** - Trust metrics and numbers
3. **FAQ** - Expandable question sections
4. **ContactForm** - Lead capture forms
5. **SearchBar** - Global search functionality

---

*This design system specification will guide the implementation of all UI components, ensuring consistency with the professional, trustworthy aesthetic identified in the inspiration images while optimizing for hockey industry needs.*