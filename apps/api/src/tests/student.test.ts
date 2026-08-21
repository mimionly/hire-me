/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, beforeAll } from 'vitest'
import { app } from '../app.js'
import { getDbClient } from '../db.js'
import { users, studentProfiles, contactDetails } from '@repo/db'
import { eq } from 'drizzle-orm'
import { fileURLToPath } from 'url'
import path from 'path'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables for the test suite
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })
dotenv.config({ path: path.resolve(__dirname, '../../.dev.vars') })

describe('Student Profile API', () => {
  const testStudentId = '00000000-1111-2222-3333-444444444444'
  const testRecruiterId = '00000000-1111-2222-3333-555555555555'

  beforeAll(async () => {
    const db = await getDbClient()

    // Clean up test data if left over
    await db.delete(contactDetails).where(eq(contactDetails.studentId, testStudentId))
    await db.delete(studentProfiles).where(eq(studentProfiles.userId, testStudentId))
    await db.delete(users).where(eq(users.id, testStudentId))
    await db.delete(users).where(eq(users.id, testRecruiterId))
    await db.delete(users).where(eq(users.email, 'newstudent@example.com'))

    // Insert a test student user
    await db.insert(users).values({
      id: testStudentId,
      email: 'teststudent@example.com',
      fullName: 'Test Student',
      roles: ['student'],
    })

    // Insert a test recruiter user
    await db.insert(users).values({
      id: testRecruiterId,
      email: 'testrecruiter@example.com',
      fullName: 'Test Recruiter',
      roles: ['recruiter'],
    })
  }, 60000)

  it('fails with 401 if unauthorized (missing header)', async () => {
    const res = await app.request('/api/student/profile')
    expect(res.status).toBe(401)
    const data = (await res.json()) as any
    expect(data.error).toBe('Unauthorized')
  })

  it('fails with 403 if authenticated user is not a student', async () => {
    const res = await app.request('/api/student/profile', {
      headers: {
        'x-user-id': testRecruiterId,
      },
    })
    expect(res.status).toBe(403)
    const data = (await res.json()) as any
    expect(data.error).toBe('Forbidden')
  })

  it('successfully fetches and auto-initializes student profile', async () => {
    const res = await app.request('/api/student/profile', {
      headers: {
        'x-user-id': testStudentId,
      },
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.id).toBe(testStudentId)
    expect(data.email).toBe('teststudent@example.com')
    expect(data.fullName).toBe('Test Student')
    expect(data.bio).toBeNull()
    expect(data.headline).toBeNull()
    expect(data.dk24Status).toBe('none')
    expect(data.phone).toBeNull()
    expect(data.school).toBeNull()
    expect(data.degree).toBeNull()
    expect(data.gpa).toBeNull()
    expect(data.specialization).toBeNull()
    expect(data.portfolioUrl).toBeNull()
    expect(data.githubUrl).toBeNull()
    expect(data.linkedinUrl).toBeNull()
    expect(data.resumeUrl).toBeNull()

    // Only fullName exists (15%)
    expect(data.completionPercentage).toBe(15)
  })

  it('successfully updates student profile and returns updated values & completion percentage', async () => {
    const res = await app.request('/api/student/profile', {
      method: 'PUT',
      headers: {
        'x-user-id': testStudentId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Test Student Updated',
        bio: 'Avid software developer.',
        headline: 'Software Engineer Intern',
        gradYear: 2026,
        openToWork: true,
        resumeUrl: 'https://example.com/resume.pdf',
        githubUrl: 'https://github.com/teststudent',
        linkedinUrl: 'https://linkedin.com/in/teststudent',
        phone: '+1234567890',
        otherLinks: { portfolio: 'https://teststudent.dev' },
        skills: ['React', 'TypeScript', 'Next.js'],
        experienceRole: 'Frontend Dev Intern',
        experienceCompany: 'Google',
        experienceSummary: 'Built cool things.',
        school: 'Stanford',
        degree: 'BS CS',
        gpa: '3.9',
        specialization: 'AI/ML',
        portfolioUrl: 'https://teststudent.dev',
        dk24Status: 'verified',
      }),
    })

    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.fullName).toBe('Test Student Updated')
    expect(data.bio).toBe('Avid software developer.')
    expect(data.headline).toBe('Software Engineer Intern')
    expect(data.gradYear).toBe(2026)
    expect(data.openToWork).toBe(true)
    expect(data.resumeUrl).toBe('https://example.com/resume.pdf')
    expect(data.githubUrl).toBe('https://github.com/teststudent')
    expect(data.linkedinUrl).toBe('https://linkedin.com/in/teststudent')
    expect(data.phone).toBe('+1234567890')
    expect(data.skills).toEqual(['React', 'TypeScript', 'Next.js'])
    expect(data.experienceRole).toBe('Frontend Dev Intern')
    expect(data.experienceCompany).toBe('Google')
    expect(data.experienceSummary).toBe('Built cool things.')
    expect(data.school).toBe('Stanford')
    expect(data.degree).toBe('BS CS')
    expect(data.gpa).toBe('3.9')
    expect(data.specialization).toBe('AI/ML')
    expect(data.portfolioUrl).toBe('https://teststudent.dev')
    expect(data.dk24Status).toBe('verified')

    // Direct database assertions to ensure values are persisted in student_profiles
    const db = await getDbClient()
    const [dbProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, testStudentId))
      .limit(1)

    expect(dbProfile).toBeDefined()
    expect(dbProfile.githubUrl).toBe('https://github.com/teststudent')
    expect(dbProfile.linkedinUrl).toBe('https://linkedin.com/in/teststudent')
    expect(dbProfile.resumeUrl).toBe('https://example.com/resume.pdf')
    expect(dbProfile.otherLinks).toBeDefined()
    const otherLinks = dbProfile.otherLinks as any
    expect(otherLinks.school).toBe('Stanford')
    expect(otherLinks.degree).toBe('BS CS')
    expect(otherLinks.gpa).toBe('3.9')
    expect(otherLinks.specialization).toBe('AI/ML')
    expect(otherLinks.portfolioUrl).toBe('https://teststudent.dev')

    // All fields populated (fullName: 15, headline: 15, bio: 15, gradYear: 15, phone: 10, resumeUrl: 15, githubUrl: 10, linkedinUrl: 5)
    expect(data.completionPercentage).toBe(100)
  })

  it('successfully fetches the updated student profile with all fields', async () => {
    const res = await app.request('/api/student/profile', {
      headers: {
        'x-user-id': testStudentId,
      },
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.fullName).toBe('Test Student Updated')
    expect(data.school).toBe('Stanford')
    expect(data.degree).toBe('BS CS')
    expect(data.gpa).toBe('3.9')
    expect(data.specialization).toBe('AI/ML')
    expect(data.portfolioUrl).toBe('https://teststudent.dev')
    expect(data.githubUrl).toBe('https://github.com/teststudent')
    expect(data.linkedinUrl).toBe('https://linkedin.com/in/teststudent')
    expect(data.resumeUrl).toBe('https://example.com/resume.pdf')
    expect(data.experienceRole).toBe('Frontend Dev Intern')
    expect(data.experienceCompany).toBe('Google')
    expect(data.experienceSummary).toBe('Built cool things.')

    // Direct database assertions to ensure values are persisted in student_profiles
    const db = await getDbClient()
    const [dbProfile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, testStudentId))
      .limit(1)

    expect(dbProfile).toBeDefined()
    expect(dbProfile.githubUrl).toBe('https://github.com/teststudent')
    expect(dbProfile.linkedinUrl).toBe('https://linkedin.com/in/teststudent')
    expect(dbProfile.resumeUrl).toBe('https://example.com/resume.pdf')
    expect(dbProfile.otherLinks).toBeDefined()
    const otherLinks2 = dbProfile.otherLinks as any
    expect(otherLinks2.school).toBe('Stanford')
    expect(otherLinks2.degree).toBe('BS CS')
    expect(otherLinks2.gpa).toBe('3.9')
    expect(otherLinks2.specialization).toBe('AI/ML')
    expect(otherLinks2.portfolioUrl).toBe('https://teststudent.dev')
  })

  it('fails with 400 for validation errors in PUT /profile', async () => {
    const res = await app.request('/api/student/profile', {
      method: 'PUT',
      headers: {
        'x-user-id': testStudentId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gradYear: 1850,
      }),
    })
    expect(res.status).toBe(400)
    const data = (await res.json()) as any
    expect(data.error).toBe('Validation Error')
  })

  it('computes correct completion percentage when social links are lacking', async () => {
    const res = await app.request('/api/student/profile', {
      method: 'PUT',
      headers: {
        'x-user-id': testStudentId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        githubUrl: null,
        linkedinUrl: null,
      }),
    })

    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.githubUrl).toBeNull()
    expect(data.linkedinUrl).toBeNull()
    // 100% - 10% (github) - 5% (linkedin) = 85%
    expect(data.completionPercentage).toBe(85)
  })

  describe('Authentication API', () => {
    it('successfully logs in an existing user', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'teststudent@example.com' }),
      })
      expect(res.status).toBe(200)
      const data = (await res.json()) as any
      expect(data.user.email).toBe('teststudent@example.com')
      expect(data.user.fullName).toBe('Test Student Updated')
    })

    it('fails to log in if user does not exist', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      })
      expect(res.status).toBe(404)
    })

    it('successfully signs up a new user', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'newstudent@example.com',
          fullName: 'New Student',
          isSignUp: true,
        }),
      })
      expect(res.status).toBe(200)
      const data = (await res.json()) as any
      expect(data.user.email).toBe('newstudent@example.com')
      expect(data.user.fullName).toBe('New Student')
    })

    it('fails to sign up if email already exists', async () => {
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'teststudent@example.com',
          fullName: 'Test Student',
          isSignUp: true,
        }),
      })
      expect(res.status).toBe(409)
    })
  })
})
