import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create subscription plans
  const basicPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'basic' },
    update: {},
    create: {
      name: 'basic',
      displayName: 'Basic Listing',
      description: 'Standard directory listing with basic contact information',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      features: JSON.stringify([
        'Basic directory listing',
        'Contact information display',
        'Up to 5 leads per month',
        'Email notifications'
      ]),
      maxLeads: 5,
      featured: false,
      priority: 1
    },
  })

  const featuredPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'featured' },
    update: {},
    create: {
      name: 'featured',
      displayName: 'Featured Listing',
      description: 'Enhanced listing with featured placement in search results',
      monthlyPrice: 99.99,
      yearlyPrice: 999.99,
      features: JSON.stringify([
        'Featured directory listing',
        'Priority placement in search',
        'Enhanced profile with photos',
        'Up to 20 leads per month',
        'SMS and email notifications',
        'Review management tools'
      ]),
      maxLeads: 20,
      featured: true,
      priority: 5
    },
  })

  const premiumPlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'premium' },
    update: {},
    create: {
      name: 'premium',
      displayName: 'Premium Listing',
      description: 'Top-tier listing with maximum visibility and unlimited leads',
      monthlyPrice: 199.99,
      yearlyPrice: 1999.99,
      features: JSON.stringify([
        'Premium directory listing',
        'Top placement in all searches',
        'Full multimedia profile',
        'Unlimited leads',
        'Priority customer support',
        'Advanced analytics dashboard',
        'Custom landing page',
        'Social media integration'
      ]),
      maxLeads: null, // Unlimited
      featured: true,
      priority: 10
    },
  })

  // Create sample advisors with new required fields
  const advisor1 = await prisma.advisor.create({
    data: {
      slug: 'mike-johnson-hockey-advisor',
      name: 'Mike Johnson',
      headshot: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
      city: 'Boston',
      province: 'Massachusetts',
      country: 'United States',
      email: 'mike.johnson@hockeyadvice.com',
      phone: '(555) 123-4567',
      bio: 'Former NHL player with 15 years of experience helping young athletes reach their potential. Specialized in skill development and college recruitment. Played 8 seasons in the NHL before transitioning to player development.',
      website: 'https://mikejohnsonhockey.com',
      socials: JSON.stringify({
        linkedin: 'https://linkedin.com/in/mikejohnsonhockey',
        twitter: 'https://twitter.com/mikejhockey',
        instagram: 'https://instagram.com/mikejohnsonhockey'
      }),
      specialties: JSON.stringify(['Skill Development', 'College Recruitment', 'Mental Training']),
      levels: JSON.stringify(['youth', 'junior', 'college']),
      verified: true,
      featuredUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Featured for 90 days
      completeness: 95,
      responseTimeMs: 7200000, // 2 hours response time
      yearsExperience: 15,
      certifications: JSON.stringify(['USA Hockey Certified', 'Hockey Canada Certified', 'NCHC Recruiting Specialist']),
      location: 'Boston, MA', // Keep for backward compatibility
      rating: 4.8,
      reviewCount: 23,
      subscription: {
        create: {
          planId: featuredPlan.id,
          status: 'active',
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        }
      }
    }
  })

  const advisor2 = await prisma.advisor.create({
    data: {
      slug: 'sarah-mitchell-hockey-mentor',
      name: 'Sarah Mitchell',
      headshot: 'https://images.unsplash.com/photo-1494790108755-2616c9eab6ae?w=400&h=400&fit=crop&crop=face',
      city: 'Minneapolis',
      province: 'Minnesota',
      country: 'United States',
      email: 'sarah@hockeymentoring.com',
      phone: '(555) 234-5678',
      bio: 'Youth hockey development specialist with focus on building confidence and fundamental skills in teenage players. Former Division I player who understands the mental game.',
      website: 'https://sarahmitchellhockey.com',
      socials: JSON.stringify({
        linkedin: 'https://linkedin.com/in/sarahmitchellhockey',
        instagram: 'https://instagram.com/sarahmentorshockey'
      }),
      specialties: JSON.stringify(['Youth Development', 'Confidence Building', 'Fundamental Skills']),
      levels: JSON.stringify(['youth', 'junior']),
      verified: true,
      completeness: 85,
      responseTimeMs: 10800000, // 3 hours response time
      yearsExperience: 8,
      certifications: JSON.stringify(['USA Hockey Level 4', 'Mental Performance Coaching']),
      location: 'Minneapolis, MN', // Keep for backward compatibility
      rating: 4.9,
      reviewCount: 18,
      subscription: {
        create: {
          planId: basicPlan.id,
          status: 'active',
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      }
    }
  })

  // Create sample coaches
  await prisma.coach.create({
    data: {
      name: 'Tom Rodriguez',
      email: 'tom@elitehockeycoaching.com',
      phone: '(555) 345-6789',
      bio: 'Head coach with 20 years experience at youth and junior levels. Focus on team development and individual skill enhancement.',
      coachingLevel: 'Junior A',
      yearsExperience: 20,
      certifications: JSON.stringify(['Hockey Canada Level 5', 'USA Hockey Master Level']),
      location: 'Toronto, ON',
      teamAffiliation: 'Toronto Jr. Marlboros',
      verified: true,
    }
  })

  // Create sample tournament
  await prisma.tournament.create({
    data: {
      name: 'New England Spring Classic',
      description: 'Annual spring tournament featuring top teams from across New England',
      location: 'Burlington, VT',
      startDate: new Date('2025-04-15'),
      endDate: new Date('2025-04-17'),
      ageGroups: JSON.stringify(['13U', '14U', '15U']),
      divisions: JSON.stringify(['AA', 'AAA']),
      entryFee: 850.00,
      maxTeams: 32,
      contactEmail: 'info@nespringclassic.com',
      contactPhone: '(802) 555-0123',
      website: 'https://nespringclassic.com',
      registrationDeadline: new Date('2025-03-15'),
      status: 'upcoming'
    }
  })

  // Create sample prep school
  await prisma.prepSchool.create({
    data: {
      name: 'New England Hockey Academy',
      location: 'Marlborough, MA',
      address: '123 Hockey Drive, Marlborough, MA 01752',
      website: 'https://nehockeyacademy.com',
      phone: '(508) 555-0199',
      email: 'admissions@nehockeyacademy.com',
      description: 'Premier hockey prep school combining elite athletic training with college-preparatory academics.',
      tuitionRange: '45000-55000',
      grades: JSON.stringify(['9', '10', '11', '12', 'PG']),
      hockeyProgram: 'Elite hockey development program with NCAA Division 1 placement track record',
      facilities: JSON.stringify(['2 NHL-size rinks', 'Fitness center', 'Video analysis room', 'Dormitories']),
      accreditation: 'NEASC Accredited'
    }
  })

  // Create sample arena
  await prisma.arena.create({
    data: {
      name: 'Boston Sports Complex',
      location: 'Boston, MA',
      address: '456 Arena Boulevard, Boston, MA 02101',
      phone: '(617) 555-0188',
      website: 'https://bostonsportscomplex.com',
      email: 'info@bostonsportscomplex.com',
      description: 'State-of-the-art multi-purpose sports facility with focus on hockey development',
      facilities: JSON.stringify(['3 ice rinks', 'Pro shop', 'Locker rooms', 'Concessions', 'Parking']),
      iceSheets: 3,
      publicSkate: true,
      hockeyPrograms: true,
      rentalAvailable: true
    }
  })

  // Create new Plan models (aligned with development standards)
  const newBasicPlan = await prisma.plan.create({
    data: {
      name: 'basic',
      priceMonth: 4999, // $49.99 in cents
      priceYear: 49999,  // $499.99 in cents
      featuresJson: JSON.stringify([
        'Basic directory listing',
        'Contact information display',
        'Up to 5 leads per month',
        'Email notifications'
      ]),
      maxLeads: 5,
      priority: 1
    }
  })

  const newFeaturedPlan = await prisma.plan.create({
    data: {
      name: 'featured',
      priceMonth: 9999, // $99.99 in cents
      priceYear: 99999,  // $999.99 in cents
      featuresJson: JSON.stringify([
        'Featured directory listing',
        'Priority placement in search',
        'Enhanced profile with photos',
        'Up to 20 leads per month',
        'SMS and email notifications'
      ]),
      maxLeads: 20,
      priority: 5
    }
  })

  const newPremiumPlan = await prisma.plan.create({
    data: {
      name: 'premium',
      priceMonth: 19999, // $199.99 in cents
      priceYear: 199999,  // $1999.99 in cents
      featuresJson: JSON.stringify([
        'Premium directory listing',
        'Top placement in all searches',
        'Full multimedia profile',
        'Unlimited leads',
        'Priority customer support',
        'Advanced analytics dashboard'
      ]),
      maxLeads: null, // Unlimited
      priority: 10
    }
  })

  // Create sample users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hockeydirectory.com',
      role: 'admin'
    }
  })

  const advisorUser1 = await prisma.user.create({
    data: {
      email: 'mike.johnson@hockeyadvice.com',
      role: 'advisor',
      advisorId: advisor1.id,
      lastLogin: new Date()
    }
  })

  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@example.com',
      role: 'parent'
    }
  })

  // Create sample entitlements for the new advisors
  await prisma.entitlement.create({
    data: {
      advisorId: advisor1.id,
      planId: newFeaturedPlan.id,
      active: true,
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Renews in 30 days
      stripeSubscriptionId: 'sub_featured_example_123'
    }
  })

  await prisma.entitlement.create({
    data: {
      advisorId: advisor2.id,
      planId: newBasicPlan.id,
      active: true,
      renewsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeSubscriptionId: 'sub_basic_example_456'
    }
  })

  // Create sample leads
  const lead1 = await prisma.lead.create({
    data: {
      advisorId: advisor1.id,
      parentEmail: 'parent1@example.com',
      parentPhone: '(555) 987-6543',
      parentName: 'Jennifer Smith',
      playerAge: 14,
      message: 'Hi Mike, my son is looking to improve his skating and puck handling skills. He plays AA hockey and is interested in potentially playing at the prep school level. Would love to discuss your training programs.',
      status: 'new',
      source: 'website'
    }
  })

  const lead2 = await prisma.lead.create({
    data: {
      advisorId: advisor2.id,
      parentEmail: 'parent2@example.com',
      parentName: 'David Wilson',
      playerAge: 13,
      message: 'Hello Sarah, we heard great things about your confidence-building approach. Our daughter is struggling with game-time nerves and could use some mental coaching. Are you taking new clients?',
      status: 'contacted',
      source: 'referral'
    }
  })

  // Create sample reviews
  await prisma.review.create({
    data: {
      advisorId: advisor1.id,
      rating: 5,
      title: 'Excellent guidance for college prep',
      body: 'Mike provided outstanding guidance throughout my son\'s college recruitment process. His connections and expertise were invaluable. Highly recommend!',
      authorName: 'Tom Henderson',
      status: 'approved'
    }
  })

  await prisma.review.create({
    data: {
      advisorId: advisor1.id,
      rating: 4,
      title: 'Great skill development program',
      body: 'The training program really helped improve my daughter\'s skating speed and stick handling. Saw noticeable improvement within 6 weeks.',
      authorName: 'Lisa Chen',
      status: 'approved'
    }
  })

  await prisma.review.create({
    data: {
      advisorId: advisor2.id,
      rating: 5,
      title: 'Amazing confidence coach',
      body: 'Sarah helped my son overcome his fear of contact and become a more confident player. Her approach is patient and effective.',
      authorName: 'Mike Rodriguez',
      status: 'approved'
    }
  })

  // Create sample events (analytics tracking)
  await prisma.event.create({
    data: {
      name: 'profile_viewed',
      payloadJson: JSON.stringify({
        advisorId: advisor1.id,
        source: 'search_results',
        userType: 'parent'
      }),
      userId: parentUser.id,
      advisorId: advisor1.id,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  })

  await prisma.event.create({
    data: {
      name: 'lead_submitted',
      payloadJson: JSON.stringify({
        leadId: lead1.id,
        advisorId: advisor1.id,
        parentEmail: 'parent1@example.com',
        source: 'website'
      }),
      userId: parentUser.id,
      advisorId: advisor1.id,
      ipAddress: '192.168.1.100'
    }
  })

  // Create sample moderation queue entries
  await prisma.moderationQueue.create({
    data: {
      type: 'review',
      refId: 'pending-review-123',
      status: 'pending',
      notes: 'Review contains potential spam content - needs manual verification'
    }
  })

  await prisma.moderationQueue.create({
    data: {
      type: 'profile',
      refId: advisor2.id,
      status: 'approved',
      notes: 'Profile verified - advisor credentials confirmed',
      moderatorId: adminUser.id
    }
  })

  console.log('Database seeded successfully with enhanced development data!')
  console.log('Created:')
  console.log('- 3 Subscription Plans (old model)')
  console.log('- 3 Plans (new model)')
  console.log('- 2 Advisors with full profile data')
  console.log('- 1 Coach')
  console.log('- 1 Tournament')
  console.log('- 1 Prep School')
  console.log('- 1 Arena')
  console.log('- 3 Users (admin, advisor, parent)')
  console.log('- 2 Entitlements')
  console.log('- 2 Leads')
  console.log('- 3 Reviews')
  console.log('- 2 Events')
  console.log('- 2 Moderation Queue entries')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })