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

  // Create sample advisors
  const advisor1 = await prisma.advisor.create({
    data: {
      name: 'Mike Johnson',
      email: 'mike.johnson@hockeyadvice.com',
      phone: '(555) 123-4567',
      bio: 'Former NHL player with 15 years of experience helping young athletes reach their potential. Specialized in skill development and college recruitment.',
      specialties: JSON.stringify(['Skill Development', 'College Recruitment', 'Mental Training']),
      yearsExperience: 15,
      certifications: JSON.stringify(['USA Hockey Certified', 'Hockey Canada Certified', 'NCHC Recruiting Specialist']),
      location: 'Boston, MA',
      website: 'https://mikejohnsonhockey.com',
      verified: true,
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
      name: 'Sarah Mitchell',
      email: 'sarah@hockeymentoring.com',
      phone: '(555) 234-5678',
      bio: 'Youth hockey development specialist with focus on building confidence and fundamental skills in teenage players.',
      specialties: JSON.stringify(['Youth Development', 'Confidence Building', 'Fundamental Skills']),
      yearsExperience: 8,
      certifications: JSON.stringify(['USA Hockey Level 4', 'Mental Performance Coaching']),
      location: 'Minneapolis, MN',
      verified: true,
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

  console.log('Database seeded successfully!')
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