import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { getDbClient, type AppEnv } from '../db'
import {
  users,
  studentProfiles,
  contactDetails,
  skills as skillsTable,
  experience as experienceTable,
} from '@repo/db'
import { requireStudentAuth } from '../middleware/auth'

export const studentRouter = new Hono<{ Bindings: AppEnv }>()

studentRouter.use('*', requireStudentAuth())

interface UpdateProfilePayload {
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

// GET /api/student/profile
studentRouter.get('/profile', async (c) => {
  const authedUser = c.get('user')

  let db
  try {
    db = await getDbClient(c.env)
  } catch (err) {
    console.error('[STUDENT_PROFILE] GET /profile failed to acquire DB client:', err)
    return c.json(
      { error: 'Internal Server Error', message: 'Unable to load profile right now.' },
      500,
    )
  }

  let user: typeof users.$inferSelect
  let profile: typeof studentProfiles.$inferSelect
  let contact: typeof contactDetails.$inferSelect | { phone: string | null }
  let studentSkills: string[]
  let experienceRole: string | null = null
  let experienceCompany: string | null = null
  let experienceSummary: string | null = null

  try {
    // 1. Fetch user record
    const [dbUser] = await db.select().from(users).where(eq(users.id, authedUser.id)).limit(1)

    if (!dbUser) {
      return c.json({ error: 'Not Found', message: 'Student account not found.' }, 404)
    }
    user = dbUser

    // 2. Fetch or initialize student profile record
    let [dbProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, authedUser.id))
      .limit(1)

    if (!dbProfile) {
      const [newProfile] = await db
        .insert(studentProfiles)
        .values({
          userId: authedUser.id,
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
    profile = dbProfile

    // 3. Fetch or initialize contact details record
    let [dbContact] = await db
      .select()
      .from(contactDetails)
      .where(eq(contactDetails.studentId, authedUser.id))
      .limit(1)

    if (!dbContact) {
      const [newContact] = await db
        .insert(contactDetails)
        .values({
          studentId: authedUser.id,
          phone: null,
        })
        .returning()
      dbContact = newContact
    }
    contact = dbContact

    // 4. Fetch skills and experience records
    const dbSkills = await db
      .select()
      .from(skillsTable)
      .where(eq(skillsTable.studentId, authedUser.id))
    studentSkills = dbSkills.map((s: { skill: string }) => s.skill)

    const dbExperiences = await db
      .select()
      .from(experienceTable)
      .where(eq(experienceTable.studentId, authedUser.id))
    if (dbExperiences.length > 0) {
      experienceRole = dbExperiences[0].role || null
      experienceCompany = dbExperiences[0].companyName || null
      experienceSummary = dbExperiences[0].contributions || null
    }
  } catch (err) {
    console.error('[STUDENT_PROFILE] GET /profile DB fetch failed:', err)
    return c.json(
      { error: 'Internal Server Error', message: 'Unable to load profile right now.' },
      500,
    )
  }

  // 5. Extract education details from otherLinks
  let school: string | null = null
  let degree: string | null = null
  let gpa: string | null = null
  let specialization: string | null = null
  let portfolioUrl: string | null = null

  if (
    profile.otherLinks &&
    typeof profile.otherLinks === 'object' &&
    !Array.isArray(profile.otherLinks)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const links = profile.otherLinks as Record<string, any>
    school = links.school || null
    degree = links.degree || null
    gpa = links.gpa || null
    specialization = links.specialization || null
    portfolioUrl = links.portfolioUrl || null
  }

  const completionPercentage = calculateCompletionPercentage({
    fullName: user.fullName,
    headline: profile.headline,
    bio: profile.bio,
    gradYear: profile.gradYear,
    phone: contact.phone,
    resumeUrl: profile.resumeUrl,
    githubUrl: profile.githubUrl,
    linkedinUrl: profile.linkedinUrl,
  })

  return c.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    headline: profile.headline || null,
    bio: profile.bio || null,
    gradYear: profile.gradYear || null,
    openToWork: profile.openToWork ?? false,
    resumeUrl: profile.resumeUrl || null,
    githubUrl: profile.githubUrl || null,
    linkedinUrl: profile.linkedinUrl || null,
    otherLinks: profile.otherLinks,
    dk24Status: profile.dk24Status || 'none',
    phone: contact.phone || null,
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
  })
})

// PUT /api/student/profile
studentRouter.put('/profile', async (c) => {
  const authedUser = c.get('user')

  let body: UpdateProfilePayload
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Bad Request', message: 'Invalid JSON payload.' }, 400)
  }

  // Validation
  if (
    body.fullName !== undefined &&
    (typeof body.fullName !== 'string' || body.fullName.trim() === '')
  ) {
    return c.json(
      { error: 'Validation Error', message: 'fullName must be a non-empty string.' },
      400,
    )
  }
  if (body.bio !== undefined && body.bio !== null && typeof body.bio !== 'string') {
    return c.json({ error: 'Validation Error', message: 'bio must be a string or null.' }, 400)
  }
  if (body.headline !== undefined && body.headline !== null && typeof body.headline !== 'string') {
    return c.json({ error: 'Validation Error', message: 'headline must be a string or null.' }, 400)
  }
  if (
    body.gradYear !== undefined &&
    body.gradYear !== null &&
    (typeof body.gradYear !== 'number' || body.gradYear < 1900 || body.gradYear > 2100)
  ) {
    return c.json(
      { error: 'Validation Error', message: 'gradYear must be a valid year number.' },
      400,
    )
  }
  if (body.openToWork !== undefined && typeof body.openToWork !== 'boolean') {
    return c.json({ error: 'Validation Error', message: 'openToWork must be a boolean.' }, 400)
  }
  if (
    body.resumeUrl !== undefined &&
    body.resumeUrl !== null &&
    typeof body.resumeUrl !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'resumeUrl must be a string or null.' },
      400,
    )
  }
  if (
    body.githubUrl !== undefined &&
    body.githubUrl !== null &&
    typeof body.githubUrl !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'githubUrl must be a string or null.' },
      400,
    )
  }
  if (
    body.linkedinUrl !== undefined &&
    body.linkedinUrl !== null &&
    typeof body.linkedinUrl !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'linkedinUrl must be a string or null.' },
      400,
    )
  }
  if (
    body.otherLinks !== undefined &&
    body.otherLinks !== null &&
    (typeof body.otherLinks !== 'object' || Array.isArray(body.otherLinks))
  ) {
    return c.json(
      { error: 'Validation Error', message: 'otherLinks must be an object or null.' },
      400,
    )
  }
  if (body.phone !== undefined && body.phone !== null && typeof body.phone !== 'string') {
    return c.json({ error: 'Validation Error', message: 'phone must be a string or null.' }, 400)
  }
  if (
    body.skills !== undefined &&
    (!Array.isArray(body.skills) ||
      body.skills.some((s) => typeof s !== 'string' || s.trim() === ''))
  ) {
    return c.json(
      { error: 'Validation Error', message: 'skills must be an array of non-empty strings.' },
      400,
    )
  }
  if (
    body.experienceRole !== undefined &&
    body.experienceRole !== null &&
    typeof body.experienceRole !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'experienceRole must be a string or null.' },
      400,
    )
  }
  if (
    body.experienceCompany !== undefined &&
    body.experienceCompany !== null &&
    typeof body.experienceCompany !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'experienceCompany must be a string or null.' },
      400,
    )
  }
  if (
    body.experienceSummary !== undefined &&
    body.experienceSummary !== null &&
    typeof body.experienceSummary !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'experienceSummary must be a string or null.' },
      400,
    )
  }
  if (body.school !== undefined && body.school !== null && typeof body.school !== 'string') {
    return c.json({ error: 'Validation Error', message: 'school must be a string or null.' }, 400)
  }
  if (body.degree !== undefined && body.degree !== null && typeof body.degree !== 'string') {
    return c.json({ error: 'Validation Error', message: 'degree must be a string or null.' }, 400)
  }
  if (body.gpa !== undefined && body.gpa !== null && typeof body.gpa !== 'string') {
    return c.json({ error: 'Validation Error', message: 'gpa must be a string or null.' }, 400)
  }
  if (
    body.specialization !== undefined &&
    body.specialization !== null &&
    typeof body.specialization !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'specialization must be a string or null.' },
      400,
    )
  }
  if (
    body.portfolioUrl !== undefined &&
    body.portfolioUrl !== null &&
    typeof body.portfolioUrl !== 'string'
  ) {
    return c.json(
      { error: 'Validation Error', message: 'portfolioUrl must be a string or null.' },
      400,
    )
  }

  let db
  try {
    db = await getDbClient(c.env)
  } catch (err) {
    console.error('[STUDENT_PROFILE] PUT /profile failed to acquire DB client:', err)
    return c.json(
      { error: 'Internal Server Error', message: 'Unable to update profile right now.' },
      500,
    )
  }

  try {
    // Update inside a transaction to ensure atomic profile updates
    {
      const tx = db
      // 1. Update user fullName
      if (body.fullName !== undefined) {
        await tx
          .update(users)
          .set({ fullName: body.fullName, updatedAt: new Date() })
          .where(eq(users.id, authedUser.id))
      }

      // Fetch existing otherLinks to merge
      const [existingProfileRecord] = await tx
        .select()
        .from(studentProfiles)
        .where(eq(studentProfiles.userId, authedUser.id))
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
          userId: authedUser.id,
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
        await tx
          .update(studentProfiles)
          .set(profileUpdates)
          .where(eq(studentProfiles.userId, authedUser.id))
      }

      // 3. Update contactDetails
      if (body.phone !== undefined) {
        const [existingContact] = await tx
          .select()
          .from(contactDetails)
          .where(eq(contactDetails.studentId, authedUser.id))
          .limit(1)

        if (!existingContact) {
          await tx.insert(contactDetails).values({
            studentId: authedUser.id,
            phone: body.phone || null,
          })
        } else {
          await tx
            .update(contactDetails)
            .set({ phone: body.phone })
            .where(eq(contactDetails.studentId, authedUser.id))
        }
      }

      // 4. Update skills table
      if (body.skills !== undefined) {
        await tx.delete(skillsTable).where(eq(skillsTable.studentId, authedUser.id))
        if (body.skills.length > 0) {
          const uniqueSkills = Array.from(
            new Set(body.skills.map((s) => s.trim()).filter((s) => s !== '')),
          )
          if (uniqueSkills.length > 0) {
            await tx.insert(skillsTable).values(
              uniqueSkills.map((s) => ({
                studentId: authedUser.id,
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
          .where(eq(experienceTable.studentId, authedUser.id))
          .limit(1)

        if (existingExp) {
          const finalCompany =
            body.experienceCompany !== undefined ? body.experienceCompany : existingExp.companyName
          const finalRole =
            body.experienceRole !== undefined ? body.experienceRole : existingExp.role

          if (!finalCompany || !finalRole) {
            await tx.delete(experienceTable).where(eq(experienceTable.studentId, authedUser.id))
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
              .where(eq(experienceTable.studentId, authedUser.id))
          }
        } else {
          const finalCompany = body.experienceCompany || null
          const finalRole = body.experienceRole || null

          if (finalCompany && finalRole) {
            await tx.insert(experienceTable).values({
              studentId: authedUser.id,
              companyName: finalCompany,
              role: finalRole,
              contributions: body.experienceSummary || null,
            })
          }
        }
      }
    }
  } catch (dbErr) {
    console.error('[STUDENT_PROFILE] Database update transaction failed:', dbErr)
    return c.json(
      { error: 'Internal Server Error', message: 'Failed to update profile. Please try again.' },
      500,
    )
  }

  // Fetch fully updated profile records — if this fails after a successful
  // write, the update itself still succeeded, so we surface a 500 rather
  // than silently returning stale/fabricated data.
  let updatedUser: typeof users.$inferSelect
  let updatedProfile: typeof studentProfiles.$inferSelect
  let updatedContact: typeof contactDetails.$inferSelect
  const updatedSkills: string[] = []
  let experienceRole: string | null = null
  let experienceCompany: string | null = null
  let experienceSummary: string | null = null
  let school: string | null = null
  let degree: string | null = null
  let gpa: string | null = null
  let specialization: string | null = null
  let portfolioUrl: string | null = null

  try {
    const [u] = await db.select().from(users).where(eq(users.id, authedUser.id)).limit(1)
    if (!u) {
      return c.json({ error: 'Not Found', message: 'Student account not found after update.' }, 404)
    }
    updatedUser = u

    const [p] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, authedUser.id))
      .limit(1)
    if (!p) {
      return c.json(
        { error: 'Internal Server Error', message: 'Profile record missing after update.' },
        500,
      )
    }
    updatedProfile = p

    const [cDetails] = await db
      .select()
      .from(contactDetails)
      .where(eq(contactDetails.studentId, authedUser.id))
      .limit(1)
    updatedContact = cDetails || { studentId: authedUser.id, phone: null }

    const s = await db.select().from(skillsTable).where(eq(skillsTable.studentId, authedUser.id))
    updatedSkills.push(...s.map((item: { skill: string }) => item.skill))

    const exp = await db
      .select()
      .from(experienceTable)
      .where(eq(experienceTable.studentId, authedUser.id))
    if (exp.length > 0) {
      experienceRole = exp[0].role || null
      experienceCompany = exp[0].companyName || null
      experienceSummary = exp[0].contributions || null
    }

    if (
      updatedProfile.otherLinks &&
      typeof updatedProfile.otherLinks === 'object' &&
      !Array.isArray(updatedProfile.otherLinks)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const links = updatedProfile.otherLinks as Record<string, any>
      school = links.school || null
      degree = links.degree || null
      gpa = links.gpa || null
      specialization = links.specialization || null
      portfolioUrl = links.portfolioUrl || null
    }
  } catch (fetchErr) {
    console.error(
      '[STUDENT_PROFILE] Database select failed in PUT route after successful update:',
      fetchErr,
    )
    return c.json(
      { error: 'Internal Server Error', message: 'Profile was updated but could not be reloaded.' },
      500,
    )
  }

  const completionPercentage = calculateCompletionPercentage({
    fullName: updatedUser.fullName,
    headline: updatedProfile.headline,
    bio: updatedProfile.bio,
    gradYear: updatedProfile.gradYear,
    phone: updatedContact.phone,
    resumeUrl: updatedProfile.resumeUrl,
    githubUrl: updatedProfile.githubUrl,
    linkedinUrl: updatedProfile.linkedinUrl,
  })

  return c.json({
    id: updatedUser.id,
    email: updatedUser.email,
    fullName: updatedUser.fullName,
    headline: updatedProfile.headline || null,
    bio: updatedProfile.bio || null,
    gradYear: updatedProfile.gradYear || null,
    openToWork: updatedProfile.openToWork ?? false,
    resumeUrl: updatedProfile.resumeUrl || null,
    githubUrl: updatedProfile.githubUrl || null,
    linkedinUrl: updatedProfile.linkedinUrl || null,
    otherLinks: updatedProfile.otherLinks,
    dk24Status: updatedProfile.dk24Status || 'none',
    phone: updatedContact.phone || null,
    completionPercentage,
    skills: updatedSkills,
    experienceRole,
    experienceCompany,
    experienceSummary,
    school,
    degree,
    gpa,
    specialization,
    portfolioUrl,
  })
})
