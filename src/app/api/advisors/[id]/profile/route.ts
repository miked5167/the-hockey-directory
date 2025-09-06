import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const advisorId = params.id

    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 400 }
      )
    }

    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
      select: {
        id: true,
        name: true,
        bio: true,
        city: true,
        province: true,
        country: true,
        phone: true,
        website: true,
        yearsExperience: true,
        specialties: true,
        certifications: true,
        levels: true,
        headshot: true,
        socials: true,
        completeness: true
      }
    })

    if (!advisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields
    const profileData = {
      ...advisor,
      specialties: advisor.specialties ? JSON.parse(advisor.specialties) : [],
      certifications: advisor.certifications ? JSON.parse(advisor.certifications) : [],
      levels: advisor.levels ? JSON.parse(advisor.levels) : [],
      socials: advisor.socials ? JSON.parse(advisor.socials) : {},
      portfolio: [] // Will be populated when media system is implemented
    }

    return NextResponse.json({ profile: profileData })

  } catch (error) {
    console.error('Error fetching advisor profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const advisorId = params.id
    const body = await request.json()

    if (!advisorId) {
      return NextResponse.json(
        { error: 'Advisor ID is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    const { name, bio, city, province, specialties } = body

    if (!name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!bio?.trim()) {
      return NextResponse.json(
        { error: 'Bio is required' },
        { status: 400 }
      )
    }

    if (bio.length < 50) {
      return NextResponse.json(
        { error: 'Bio must be at least 50 characters' },
        { status: 400 }
      )
    }

    if (!city?.trim()) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      )
    }

    if (!province?.trim()) {
      return NextResponse.json(
        { error: 'Province is required' },
        { status: 400 }
      )
    }

    if (!Array.isArray(specialties) || specialties.length === 0) {
      return NextResponse.json(
        { error: 'At least one specialty is required' },
        { status: 400 }
      )
    }

    // Check if advisor exists
    const existingAdvisor = await prisma.advisor.findUnique({
      where: { id: advisorId }
    })

    if (!existingAdvisor) {
      return NextResponse.json(
        { error: 'Advisor not found' },
        { status: 404 }
      )
    }

    // Calculate profile completeness
    const calculateCompleteness = (data: any) => {
      let score = 0
      const maxScore = 100

      // Basic info (40 points)
      if (data.name?.trim()) score += 8
      if (data.bio?.trim() && data.bio.length >= 100) score += 10
      if (data.city?.trim()) score += 4
      if (data.province?.trim()) score += 4
      if (data.phone?.trim()) score += 7
      if (data.website?.trim()) score += 7

      // Professional info (30 points)
      if (data.yearsExperience && data.yearsExperience > 0) score += 8
      if (data.specialties?.length >= 3) score += 10
      if (data.certifications?.length >= 2) score += 7
      if (data.levels?.length >= 1) score += 5

      // Media & Social (30 points)
      if (data.headshot) score += 10
      if (data.portfolio?.length >= 2) score += 10
      const socialCount = Object.values(data.socials || {}).filter(Boolean).length
      if (socialCount >= 1) score += 5
      if (socialCount >= 2) score += 5

      return Math.min(score, maxScore)
    }

    const completenessScore = calculateCompleteness(body)

    // Update the advisor profile
    const updatedAdvisor = await prisma.advisor.update({
      where: { id: advisorId },
      data: {
        name: name.trim(),
        bio: bio.trim(),
        city: city.trim(),
        province: province.trim(),
        country: body.country || 'Canada',
        phone: body.phone?.trim() || null,
        website: body.website?.trim() || null,
        yearsExperience: body.yearsExperience || null,
        specialties: JSON.stringify(body.specialties || []),
        certifications: JSON.stringify(body.certifications || []),
        levels: JSON.stringify(body.levels || []),
        socials: JSON.stringify(body.socials || {}),
        completeness: completenessScore,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      advisor: updatedAdvisor,
      completeness: completenessScore,
      message: 'Profile updated successfully'
    })

  } catch (error) {
    console.error('Error updating advisor profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}