import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/database'
import { AdvisorProfile } from './components/AdvisorProfile'
import { parseJsonField } from '@/lib/business'

interface PageProps {
  params: { id: string }
}

async function getAdvisor(id: string) {
  try {
    const advisor = await prisma.advisor.findUnique({
      where: { id },
      include: {
        subscription: {
          include: { plan: true }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        leads: {
          where: { status: 'converted' },
          select: { id: true }
        }
      }
    })

    return advisor
  } catch (error) {
    console.error('Error fetching advisor:', error)
    return null
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const advisor = await getAdvisor(params.id)
  
  if (!advisor) {
    return {
      title: 'Advisor Not Found - Hockey Directory'
    }
  }

  const specialties = parseJsonField<string>(advisor.specialties)
  const location = advisor.location

  return {
    title: `${advisor.name} - Hockey Advisor in ${location} | Hockey Directory`,
    description: `Connect with ${advisor.name}, a verified hockey advisor in ${location} specializing in ${specialties.slice(0, 3).join(', ')}. ${advisor.yearsExperience || 0} years of experience helping young hockey players.`,
    keywords: `${advisor.name}, hockey advisor, ${location}, ${specialties.join(', ')}, youth hockey development`,
    openGraph: {
      title: `${advisor.name} - Hockey Advisor`,
      description: advisor.bio || `Hockey advisor specializing in ${specialties.slice(0, 2).join(' and ')}`,
      type: 'profile',
      images: advisor.imageUrl ? [advisor.imageUrl] : [],
    },
    alternates: {
      canonical: `/advisors/${advisor.id}`
    }
  }
}

export default async function AdvisorPage({ params }: PageProps) {
  const advisor = await getAdvisor(params.id)

  if (!advisor) {
    notFound()
  }

  // Add structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": advisor.name,
    "description": advisor.bio,
    "jobTitle": "Hockey Advisor",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": advisor.location
    },
    ...(advisor.rating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": advisor.rating,
        "reviewCount": advisor.reviewCount,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    ...(advisor.website && { "url": advisor.website }),
    ...(advisor.imageUrl && { "image": advisor.imageUrl }),
    "offers": {
      "@type": "Offer",
      "category": "Hockey Coaching & Advisory Services"
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <AdvisorProfile advisor={advisor} />
    </>
  )
}