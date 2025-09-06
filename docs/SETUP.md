# Hockey Directory - Development Setup

**Version:** 1.0  
**Last Updated:** September 2025

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ installed
- Git for version control
- VS Code (recommended) or preferred editor

### **Installation Steps**
```bash
# Clone the repository (if working from git)
git clone <repository-url>
cd "The Hockey Directory"

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client and run migrations
npx prisma generate
npx prisma db push

# Seed the database with sample data
npm run db:seed

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🗄️ Database Setup

### **Current Configuration**
- **Development:** SQLite (local file: `prisma/dev.db`)
- **ORM:** Prisma with TypeScript integration
- **Production Ready:** Structured for easy PostgreSQL migration

### **Database Commands**
```bash
# View database in browser
npx prisma studio

# Reset database (careful - deletes all data!)
npm run db:reset

# Re-seed with sample data
npm run db:seed

# Generate new migration after schema changes
npx prisma migrate dev --name description_of_change
```

### **Sample Data Included**
- 3 subscription plans (Basic, Featured, Premium)
- 2 sample advisors with active subscriptions
- 1 each: coach, tournament, prep school, arena
- Reviews and ratings examples

---

## 🏗️ Project Structure

```
The Hockey Directory/
├── docs/                          # Documentation and design assets
│   ├── PRD.md                    # Product Requirements Document
│   ├── FEATURES.md               # Feature specifications  
│   ├── BUSINESS-LOGIC.md         # Business rules and logic
│   └── design/                   # UI inspiration and assets
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── advisors/            # Advisor directory and profiles
│   │   ├── search/              # Search functionality
│   │   └── api/                 # Backend API routes
│   ├── components/               # Reusable UI components
│   │   ├── ui/                  # shadcn/ui components
│   │   └── layout/              # Header, Footer, etc.
│   ├── hooks/                    # React Query hooks
│   ├── lib/                      # Utility libraries
│   │   ├── business/            # Business logic functions
│   │   ├── search/              # Fuse.js search configuration
│   │   └── database.ts          # Prisma client setup
│   └── styles/                   # CSS and styling
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── seed.ts                  # Sample data seeding
│   └── migrations/              # Database migration files
└── public/                       # Static assets
```

---

## 🔧 Development Tools

### **Code Quality**
- **ESLint:** Code linting with Next.js rules
- **Prettier:** Code formatting with Tailwind CSS plugin
- **Husky:** Git hooks for pre-commit quality checks
- **TypeScript:** Full type safety throughout

### **UI Development**
- **shadcn/ui:** Component library with Radix UI
- **Tailwind CSS:** Utility-first styling
- **Lucide React:** Icon library
- **Next.js:** React framework with App Router

### **Data Management**
- **Prisma:** Database ORM and migrations
- **TanStack Query:** Data fetching and caching
- **Fuse.js:** Fuzzy search functionality
- **date-fns:** Date manipulation utilities

---

## 🧪 Testing & Quality Assurance

### **Running Quality Checks**
```bash
# Run linting
npm run lint

# Fix linting issues automatically  
npm run lint:fix

# Format code with Prettier
npm run format

# Type check with TypeScript
npx tsc --noEmit
```

### **Database Testing**
```bash
# Test database connection
npx prisma db pull

# Validate schema
npx prisma validate

# Check for pending migrations
npx prisma migrate status
```

---

## 🌐 Environment Configuration

### **Environment Variables**
```bash
# .env file (create from .env.example)
DATABASE_URL="file:./dev.db"                    # SQLite for development
NEXT_PUBLIC_APP_URL="http://localhost:3000"     # App base URL
NEXT_PUBLIC_GA_ID=""                             # Google Analytics (optional)
```

### **Environment-Specific Settings**
- **Development:** SQLite database, dev tools enabled
- **Production:** PostgreSQL, optimized builds, monitoring enabled

---

## 📊 Business Logic Overview

### **Key Business Components**
- **Subscription Management:** 3-tier system with feature differentiation
- **Lead Routing:** Priority-based lead distribution with monthly limits
- **Commission Tracking:** Automatic calculation based on subscription tier
- **Search Prioritization:** Featured/Premium listings appear first

### **Revenue Model**
- **Subscription Revenue:** $49-199/month per advisor
- **Commission Revenue:** 10-20% of successful placements
- **Target:** $150k ARR by end of Year 1

---

## 🔄 Development Workflow

### **Feature Development**
1. **Reference Documentation:** Check PRD and FEATURES.md for requirements
2. **Design Inspiration:** Look at `/docs/design/inspiration/` folder
3. **Business Logic:** Implement using functions in `/src/lib/business/`
4. **UI Components:** Build with shadcn/ui and Tailwind CSS
5. **API Integration:** Use TanStack Query hooks for data management
6. **Testing:** Verify functionality across subscription tiers

### **Database Changes**
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name change_description`
3. Update seed data if needed: `prisma/seed.ts`
4. Update business logic functions as needed

---

## 🚦 Common Development Tasks

### **Adding New Advisor**
```bash
# Use Prisma Studio for easy data entry
npx prisma studio

# Or add via seed script
# Edit prisma/seed.ts and run:
npm run db:seed
```

### **Testing Lead Flow**
1. Go to advisor profile page
2. Fill out contact form
3. Check leads in database: `npx prisma studio`
4. Verify business logic (subscription limits, routing)

### **Testing Subscription Tiers**
1. Create advisors with different subscription plans
2. Verify search result ordering (Premium > Featured > Basic)
3. Test lead limits and visual differentiation

---

## 🐛 Troubleshooting

### **Common Issues**

#### **Database Connection Errors**
```bash
# Reset database and regenerate
npx prisma migrate reset
npx prisma generate
npm run db:seed
```

#### **TypeScript Errors**
```bash
# Regenerate Prisma client types
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run dev
```

#### **Dependency Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### **Performance Issues**
- Check database queries in Prisma Studio
- Verify TanStack Query caching is working
- Use React DevTools to identify render issues

---

## 📝 Additional Resources

- **PRD:** `/docs/PRD.md` - Business objectives and success metrics
- **Features:** `/docs/FEATURES.md` - Detailed feature specifications
- **Business Logic:** `/docs/BUSINESS-LOGIC.md` - Subscription and monetization rules
- **Design Assets:** `/docs/design/` - UI inspiration and brand guidelines

---

*This setup guide will be updated as the project evolves. For questions or issues, refer to the documentation or create detailed issue reports.*