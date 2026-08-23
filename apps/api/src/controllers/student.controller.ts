import { eq } from 'drizzle-orm'
import type { Database } from '@repo/db'
import {
  users,
  studentProfiles,
  contactDetails,
  skills as skillsTable,
  experience as experienceTable,
} from '@repo/db'

// ==========================================
// TYPES
// ==========================================

export interface UpdateProfilePayload {
  fullName?: string
  bio?: string | null
  headline?: string | null
  gradYear?: number | null
  openToWork?: boolean
  resumeUrl?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  otherLinks?: Record<string, unknown> | null
  phone?: string | null
  skills?: string[]
  experienceRole?: string | null
  experienceCompany?: string | null
  experienceSummary?: string | null
  school?: string | null
  degree?: string | null
  gpa?: string | null
  specialization?: string | null
  portfolioUrl?: string | null
}

export function calculateCompletionPercentage(profile: {
  fullName?: string | null
  headline?: string | null
  bio?: string | null
  gradYear?: number | null
  phone?: string | null
  resumeUrl?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
}): number {
  let percentage = 0
  if (profile.fullName && profile.fullName.trim() !== '') percentage += 15
  if (profile.headline && profile.headline.trim() !== '') percentage += 15
  if (profile.bio && profile.bio.trim() !== '') percentage += 15
  if (profile.gradYear !== null && profile.gradYear !== undefined) percentage += 15
  if (profile.phone && profile.phone.trim() !== '') percentage += 10
  if (profile.resumeUrl && profile.resumeUrl.trim() !== '') percentage += 15
  if (profile.githubUrl && profile.githubUrl.trim() !== '') percentage += 10
  if (profile.linkedinUrl && profile.linkedinUrl.trim() !== '') percentage += 5
  return percentage
}

// ==========================================
// CONTROLLERS
// ==========================================

/**
 * Fetches and formats the student profile.
 * Auto-initializes student profile and contact details if they do not exist.
 */
export async function getStudentProfile(db: Database, userId: string) {
  // 1. Fetch user record
  const [dbUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (!dbUser) {
    return null
  }

  // 2. Fetch or initialize student profile record
  let [dbProfile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1)

  if (!dbProfile) {
    const [newProfile] = await db
      .insert(studentProfiles)
      .values({
        userId,
        headline: null,
        bio: null,
        gradYear: null,
        openToWork: false,
        resumeUrl: null,
        githubUrl: null,
        linkedinUrl: null,
        otherLinks: null,
        dk24Status: 'none',
      })
      .returning()
    dbProfile = newProfile
  }

  if (!dbProfile) {
    throw new Error('Failed to initialize student profile')
  }

  // 3. Fetch or initialize contact details record
  let [dbContact] = await db
    .select()
    .from(contactDetails)
    .where(eq(contactDetails.studentId, userId))
    .limit(1)

  if (!dbContact) {
    const [newContact] = await db
      .insert(contactDetails)
      .values({
        studentId: userId,
        phone: null,
      })
      .returning()
    dbContact = newContact
  }

  if (!dbContact) {
    throw new Error('Failed to initialize contact details')
  }

  // 4. Fetch skills and experience records
  const dbSkills = await db.select().from(skillsTable).where(eq(skillsTable.studentId, userId))
  const studentSkills = dbSkills.map((s) => s.skill)

  const dbExperiences = await db
    .select()
    .from(experienceTable)
    .where(eq(experienceTable.studentId, userId))
  let experienceRole: string | null = null
  let experienceCompany: string | null = null
  let experienceSummary: string | null = null

  const dbExperience = dbExperiences[0]
  if (dbExperience) {
    experienceRole = dbExperience.role || null
    experienceCompany = dbExperience.companyName || null
    experienceSummary = dbExperience.contributions || null
  }

  // 5. Extract education details from otherLinks
  let school: string | null = null
  let degree: string | null = null
  let gpa: string | null = null
  let specialization: string | null = null
  let portfolioUrl: string | null = null

  if (
    dbProfile.otherLinks &&
    typeof dbProfile.otherLinks === 'object' &&
    !Array.isArray(dbProfile.otherLinks)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links = dbProfile.otherLinks as Record<string, any>
    school = links.school || null
    degree = links.degree || null
    gpa = links.gpa || null
    specialization = links.specialization || null
    portfolioUrl = links.portfolioUrl || null
  }

  const completionPercentage = calculateCompletionPercentage({
    fullName: dbUser.fullName,
    headline: dbProfile.headline,
    bio: dbProfile.bio,
    gradYear: dbProfile.gradYear,
    phone: dbContact.phone,
    resumeUrl: dbProfile.resumeUrl,
    githubUrl: dbProfile.githubUrl,
    linkedinUrl: dbProfile.linkedinUrl,
  })

  return {
    id: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    headline: dbProfile.headline || null,
    bio: dbProfile.bio || null,
    gradYear: dbProfile.gradYear || null,
    openToWork: dbProfile.openToWork ?? false,
    resumeUrl: dbProfile.resumeUrl || null,
    githubUrl: dbProfile.githubUrl || null,
    linkedinUrl: dbProfile.linkedinUrl || null,
    otherLinks: dbProfile.otherLinks,
    dk24Status: dbProfile.dk24Status || 'none',
    phone: dbContact.phone || null,
    completionPercentage,
    skills: studentSkills,
    experienceRole,
    experienceCompany,
    experienceSummary,
    school,
    degree,
    gpa,
    specialization,
    portfolioUrl,
  }
}

/**
 * Updates a student profile inside a database transaction.
 */
export async function updateStudentProfile(
  db: Database,
  userId: string,
  body: UpdateProfilePayload,
) {
  // Update using db client directly (neon-http driver does not support transactions)
  const tx = db
  // 1. Update user fullName
  if (body.fullName !== undefined) {
    await tx
      .update(users)
      .set({ fullName: body.fullName, updatedAt: new Date() })
      .where(eq(users.id, userId))
  }

  // Fetch existing otherLinks to merge
  const [existingProfileRecord] = await tx
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mergedOtherLinks: any = existingProfileRecord?.otherLinks
  if (
    !mergedOtherLinks ||
    typeof mergedOtherLinks !== 'object' ||
    Array.isArray(mergedOtherLinks)
  ) {
    mergedOtherLinks = {}
  }

  if (body.school !== undefined) mergedOtherLinks.school = body.school
  if (body.degree !== undefined) mergedOtherLinks.degree = body.degree
  if (body.gpa !== undefined) mergedOtherLinks.gpa = body.gpa
  if (body.specialization !== undefined) mergedOtherLinks.specialization = body.specialization
  if (body.portfolioUrl !== undefined) mergedOtherLinks.portfolioUrl = body.portfolioUrl
  if (body.otherLinks !== undefined) {
    mergedOtherLinks =
      body.otherLinks === null ? mergedOtherLinks : { ...mergedOtherLinks, ...body.otherLinks }
  }

  // 2. Update studentProfiles
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileUpdates: Record<string, any> = {}
  if (body.bio !== undefined) profileUpdates.bio = body.bio
  if (body.headline !== undefined) profileUpdates.headline = body.headline
  if (body.gradYear !== undefined) profileUpdates.gradYear = body.gradYear
  if (body.openToWork !== undefined) profileUpdates.openToWork = body.openToWork
  if (body.resumeUrl !== undefined) profileUpdates.resumeUrl = body.resumeUrl
  if (body.githubUrl !== undefined) profileUpdates.githubUrl = body.githubUrl
  if (body.linkedinUrl !== undefined) profileUpdates.linkedinUrl = body.linkedinUrl
  profileUpdates.otherLinks = mergedOtherLinks

  profileUpdates.updatedAt = new Date()

  if (!existingProfileRecord) {
    await tx.insert(studentProfiles).values({
      userId,
      bio: null,
      headline: null,
      gradYear: null,
      openToWork: false,
      resumeUrl: null,
      githubUrl: null,
      linkedinUrl: null,
      dk24Status: 'none',
      ...profileUpdates,
    })
  } else {
    await tx.update(studentProfiles).set(profileUpdates).where(eq(studentProfiles.userId, userId))
  }

  // 3. Update contactDetails
  if (body.phone !== undefined) {
    const [existingContact] = await tx
      .select()
      .from(contactDetails)
      .where(eq(contactDetails.studentId, userId))
      .limit(1)

    if (!existingContact) {
      await tx.insert(contactDetails).values({
        studentId: userId,
        phone: body.phone || null,
      })
    } else {
      await tx
        .update(contactDetails)
        .set({ phone: body.phone })
        .where(eq(contactDetails.studentId, userId))
    }
  }

  // 4. Update skills table
  if (body.skills !== undefined) {
    await tx.delete(skillsTable).where(eq(skillsTable.studentId, userId))
    if (body.skills.length > 0) {
      const uniqueSkills = Array.from(
        new Set(body.skills.map((s) => s.trim()).filter((s) => s !== '')),
      )
      if (uniqueSkills.length > 0) {
        await tx.insert(skillsTable).values(
          uniqueSkills.map((s) => ({
            studentId: userId,
            skill: s,
          })),
        )
      }
    }
  }

  // 5. Update experience table
  if (
    body.experienceRole !== undefined ||
    body.experienceCompany !== undefined ||
    body.experienceSummary !== undefined
  ) {
    const [existingExp] = await tx
      .select()
      .from(experienceTable)
      .where(eq(experienceTable.studentId, userId))
      .limit(1)

    if (existingExp) {
      const finalCompany =
        body.experienceCompany !== undefined ? body.experienceCompany : existingExp.companyName
      const finalRole = body.experienceRole !== undefined ? body.experienceRole : existingExp.role

      if (!finalCompany || !finalRole) {
        await tx.delete(experienceTable).where(eq(experienceTable.studentId, userId))
      } else {
        await tx
          .update(experienceTable)
          .set({
            role: finalRole,
            companyName: finalCompany,
            contributions:
              body.experienceSummary !== undefined
                ? body.experienceSummary
                : existingExp.contributions,
          })
          .where(eq(experienceTable.studentId, userId))
      }
    } else {
      const finalCompany = body.experienceCompany || null
      const finalRole = body.experienceRole || null

      if (finalCompany && finalRole) {
        await tx.insert(experienceTable).values({
          studentId: userId,
          companyName: finalCompany,
          role: finalRole,
          contributions: body.experienceSummary || null,
        })
      }
    }
  }

  // Return the fully fetched updated profile
  return getStudentProfile(db, userId)
}
