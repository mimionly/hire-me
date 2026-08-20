'use client'

import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  FileText,
  Globe,
  MapPin,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import confetti from 'canvas-confetti'

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  )
}

function LinkedinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  )
}

interface Job {
  id: string
  title: string
  employmentType?: string
  workArrangement?: string
  description?: string
  location?: string
  salaryRange?: string
  recruiter?: {
    companyName?: string
  }
}

interface StudentProfileResponse {
  fullName?: string | null
  headline?: string | null
  bio?: string | null
  school?: string | null
  degree?: string | null
  gradYear?: number | null
  gpa?: string | null
  specialization?: string | null
  skills?: string[] | null
  experienceRole?: string | null
  experienceCompany?: string | null
  experienceSummary?: string | null
  githubUrl?: string | null
  linkedinUrl?: string | null
  portfolioUrl?: string | null
  resumeUrl?: string | null
  phone?: string | null
  openToWork?: boolean
  dk24Status?: string | null
  completionPercentage?: number
}

export default function StudentOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [isCompleted, setIsCompleted] = useState(false)

  // Step 1: Basic Details
  const [fullName, setFullName] = useState('')
  const [headline, setHeadline] = useState('')
  const [bio, setBio] = useState('')
  const [step1Error, setStep1Error] = useState('')

  // Step 2: Education
  const [school, setSchool] = useState('')
  const [degree, setDegree] = useState('')
  const [graduationYear, setGraduationYear] = useState('2026')
  const [gpa, setGpa] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [step2Error, setStep2Error] = useState('')

  // Step 3: Skills & Experience
  const [skills, setSkills] = useState<string[]>(['React', 'TypeScript', 'Next.js', 'Tailwind CSS'])
  const [newSkillInput, setNewSkillInput] = useState('')
  const [experienceRole, setExperienceRole] = useState('')
  const [experienceCompany, setExperienceCompany] = useState('')
  const [experienceSummary, setExperienceSummary] = useState('')

  // Step 4: Links & Finish
  const [githubUrl, setGithubUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')

  // Extended Profile States
  const [isDashboardMode, setIsDashboardMode] = useState(false)
  const [profileCompletion, setProfileCompletion] = useState(15)
  const [phone, setPhone] = useState('')
  const [openToWork, setOpenToWork] = useState(true)
  const [dk24Status, setDk24Status] = useState<string>('none')
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)

  // Interactive Character Eye Tracking & Blinking
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [blink, setBlink] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
    const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
    setMousePos({
      x: Math.max(-1, Math.min(1, x)),
      y: Math.max(-1, Math.min(1, y)),
    })
  }

  useEffect(() => {
    const interval = setInterval(
      () => {
        setBlink(true)
        setTimeout(() => setBlink(false), 140)
      },
      3200 + Math.random() * 2600,
    )
    return () => clearInterval(interval)
  }, [])

  // Skills handlers
  const handleAddSkill = (skillToAdd?: string) => {
    const target = (skillToAdd || newSkillInput).trim()
    if (!target) return
    if (!skills.includes(target)) {
      setSkills([...skills, target])
    }
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove))
  }

  // Load Profile from DB on mount
  useEffect(() => {
    let userId = localStorage.getItem('user_id')
    if (!userId) {
      // Hardcode student user ID for local manual testing so they don't get redirected to /login
      userId = '00000000-0001-0000-0000-000000000001'
      localStorage.setItem('user_id', userId)
      localStorage.setItem('user_email', 'arjun.sharma@college.edu')
      localStorage.setItem('user_role', 'student')
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:8787/api/student/profile', {
          headers: {
            'x-user-id': userId,
          },
        })
        if (response.ok) {
          const data = (await response.json()) as StudentProfileResponse
          if (data.fullName) setFullName(data.fullName)
          if (data.headline) setHeadline(data.headline)
          if (data.bio) setBio(data.bio)
          if (data.school) setSchool(data.school)
          if (data.degree) setDegree(data.degree)
          if (data.gradYear) setGraduationYear(String(data.gradYear))
          if (data.gpa) setGpa(data.gpa)
          if (data.specialization) setSpecialization(data.specialization)
          if (data.skills && data.skills.length > 0) setSkills(data.skills)
          if (data.experienceRole) setExperienceRole(data.experienceRole)
          if (data.experienceCompany) setExperienceCompany(data.experienceCompany)
          if (data.experienceSummary) setExperienceSummary(data.experienceSummary)
          if (data.githubUrl) setGithubUrl(data.githubUrl)
          if (data.linkedinUrl) setLinkedinUrl(data.linkedinUrl)
          if (data.portfolioUrl) setPortfolioUrl(data.portfolioUrl)
          if (data.resumeUrl) setResumeUrl(data.resumeUrl)
          if (data.phone) setPhone(data.phone)
          if (data.openToWork !== undefined) setOpenToWork(data.openToWork)
          if (data.dk24Status) setDk24Status(data.dk24Status)
          if (data.completionPercentage) setProfileCompletion(data.completionPercentage)

          // If profile has significant details (beyond defaults), show dashboard
          if (data.completionPercentage !== undefined && data.completionPercentage > 15) {
            setIsDashboardMode(true)
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile', err)
      }
    }

    fetchProfile()
  }, [router])

  // Load Job Postings for Feed
  useEffect(() => {
    if (!isDashboardMode) return
    const fetchJobs = async () => {
      setIsLoadingJobs(true)
      try {
        const response = await fetch('http://localhost:8787/api/postings')
        if (response.ok) {
          const data = (await response.json()) as { data: Job[] }
          setJobs(data.data || [])
        }
      } catch (err) {
        console.error('Failed to fetch job postings', err)
      } finally {
        setIsLoadingJobs(false)
      }
    }
    fetchJobs()
  }, [isDashboardMode])

  // Stepper navigation
  const handleNext = async () => {
    if (step === 1) {
      if (!fullName.trim() || !headline.trim()) {
        setStep1Error('Please fill in your full name and headline.')
        return
      }
      setStep1Error('')
      setStep(2)
    } else if (step === 2) {
      if (!school.trim() || !degree.trim()) {
        setStep2Error('Please provide your School/University and Degree.')
        return
      }
      setStep2Error('')
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    } else if (step === 4) {
      const userId = localStorage.getItem('user_id')
      if (!userId) {
        router.push('/login')
        return
      }

      setIsCompleted(true)

      const payload = {
        fullName: fullName.trim(),
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        gradYear: graduationYear ? parseInt(graduationYear, 10) : null,
        openToWork: openToWork,
        resumeUrl: resumeUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        linkedinUrl: linkedinUrl.trim() || null,
        phone: phone.trim() || null,
        skills: skills,
        experienceRole: experienceRole.trim() || null,
        experienceCompany: experienceCompany.trim() || null,
        experienceSummary: experienceSummary.trim() || null,
        school: school.trim() || null,
        degree: degree.trim() || null,
        gpa: gpa.trim() || null,
        specialization: specialization.trim() || null,
        portfolioUrl: portfolioUrl.trim() || null,
      }

      try {
        const response = await fetch('http://localhost:8787/api/student/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error('Failed to save profile')
        }

        const data = (await response.json()) as { completionPercentage: number }
        setProfileCompletion(data.completionPercentage)

        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F24E38', '#45C6B6', '#3A82F7', '#FFA2B6', '#FBBF24'],
          })
        } catch {
          // Ignore confetti errors if rendering environment doesn't support it
        }

        setTimeout(() => {
          setIsCompleted(false)
          setIsDashboardMode(true)
        }, 1200)
      } catch (err) {
        console.error(err)
        setIsCompleted(false)
        alert('Failed to save profile to server. Please try again.')
      }
    }
  }

  const handleBack = () => {
    if (step === 1) {
      router.push('/role-select')
    } else {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4)
    }
  }

  const gradYearOptions = ['2024', '2025', '2026', '2027', '2028', '2029', '2030']
  const popularSkills = ['Python', 'JavaScript', 'Node.js', 'SQL', 'Docker', 'Git', 'Java']

  const StepperView = () => {
    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        className="h-screen w-screen bg-bg-page text-text-main flex flex-col justify-between overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] select-none selection:bg-brand/20 selection:text-text-main"
      >
        {/* Top Navbar */}
        <header className="w-full z-20 shrink-0">
          <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 py-3 sm:py-4 flex items-center justify-between">
            {/* Logo */}
            <div
              className="flex items-center gap-1.5 text-2xl tracking-tight cursor-pointer"
              onClick={() => router.push('/')}
            >
              <span className="font-extrabold text-brand">DK24</span>
              <span className="font-bold text-text-main">CareerLink</span>
            </div>
          </div>
        </header>

        {/* Main Container Fixed-Height Card */}
        <main className="flex-1 w-full flex items-center justify-center px-4 sm:px-8 py-2 z-10 overflow-hidden">
          <div className="w-full max-w-[1240px] h-[550px] sm:h-[570px] lg:h-[580px] bg-card rounded-3xl sm:rounded-[32px] border border-border-subtle shadow-[0_12px_44px_-12px_rgba(0,0,0,0.06)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            {/* ========================================================================= */}
            {/* LEFT COLUMN: HERO & 3D STUDENT WITH LAPTOP (Fixed Height) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 bg-gradient-to-b from-surface-hero-start to-surface-hero-end border-b lg:border-b-0 lg:border-r border-border-subtle/50 p-6 sm:p-8 lg:p-9 flex flex-col justify-between h-full relative overflow-hidden">
              {/* Top Content */}
              <div className="space-y-4 z-10">
                {/* Title & Subtitle */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-text-main tracking-tight leading-[1.2]">
                    Let&apos;s build your <br />
                    <span className="text-brand inline-flex items-center gap-1.5">
                      career profile
                    </span>
                  </h1>
                  <p className="text-text-muted text-xs sm:text-sm font-medium leading-relaxed mt-2 max-w-[360px]">
                    A complete profile helps recruiters discover you and gives you better
                    opportunities.
                  </p>
                </div>
              </div>

              {/* Bottom 3D Scene: Student Character with Laptop */}
              <div className="relative w-full flex-1 min-h-[220px] max-h-[340px] flex items-center justify-center select-none py-1">
                <svg
                  viewBox="35 65 310 195"
                  className="w-full h-full max-h-[320px] overflow-visible drop-shadow-sm"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="clayShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="8"
                        stdDeviation="12"
                        floodColor="#0F172A"
                        floodOpacity="0.12"
                      />
                    </filter>
                    <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow
                        dx="0"
                        dy="4"
                        stdDeviation="5"
                        floodColor="#0F172A"
                        floodOpacity="0.1"
                      />
                    </filter>
                    <filter id="laptopShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow
                        dx="0"
                        dy="10"
                        stdDeviation="8"
                        floodColor="#0F172A"
                        floodOpacity="0.13"
                      />
                    </filter>

                    <radialGradient id="greenClaySphere" cx="35%" cy="30%" r="68%">
                      <stop offset="0%" stopColor="var(--clay-sphere-start)" />
                      <stop offset="28%" stopColor="var(--brand-green)" />
                      <stop offset="70%" stopColor="var(--clay-sphere-mid2)" />
                      <stop offset="90%" stopColor="var(--clay-sphere-dark)" />
                      <stop offset="100%" stopColor="var(--clay-sphere-end)" />
                    </radialGradient>

                    <linearGradient id="capTop" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#333A44" />
                      <stop offset="50%" stopColor="#22272E" />
                      <stop offset="100%" stopColor="#14181F" />
                    </linearGradient>
                    <linearGradient id="capBevel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#181D24" />
                      <stop offset="100%" stopColor="#0D1015" />
                    </linearGradient>

                    <linearGradient id="laptopLid" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F1F5F9" />
                      <stop offset="50%" stopColor="#E2E8F0" />
                      <stop offset="100%" stopColor="#CBD5E1" />
                    </linearGradient>
                    <linearGradient id="laptopBase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E2E8F0" />
                      <stop offset="100%" stopColor="#94A3B8" />
                    </linearGradient>
                  </defs>

                  {/* Ground Shadow */}
                  <ellipse cx="200" cy="245" rx="130" ry="10" fill="#0F172A" opacity="0.07" />

                  {/* 3D Student Character */}
                  <g transform="translate(130, 165)">
                    <circle
                      cx="0"
                      cy="0"
                      r="62"
                      fill="url(#greenClaySphere)"
                      filter="url(#clayShadow)"
                    />

                    {/* Graduation Cap */}
                    <g transform="translate(-22, -60) rotate(-16)">
                      <path
                        d="M -24,10 C -24,-2 24,-2 24,10 C 24,18 -24,18 -24,10 Z"
                        fill="#12161D"
                      />
                      <polygon points="-52,0 -52,5 0,22 52,5 52,0 0,17" fill="url(#capBevel)" />
                      <polygon
                        points="-52,0 0,-18 52,0 0,17"
                        fill="url(#capTop)"
                        stroke="#14181F"
                        strokeWidth="1"
                      />
                      <ellipse cx="0" cy="0" rx="3.5" ry="2.5" fill="#10141A" />
                      <path
                        d="M 0,0 C -28,10 -38,22 -40,42"
                        stroke="var(--brand-green)"
                        strokeWidth="2.8"
                        fill="none"
                        strokeLinecap="round"
                      />
                      <ellipse cx="-40" cy="42" rx="3.5" ry="3" fill="var(--clay-sphere-mid2)" />
                      <path d="M -44,43 C -44,56 -36,56 -36,43 Z" fill="var(--brand-green)" />
                    </g>

                    {/* Left Eye */}
                    <g transform="translate(-8, -4) rotate(-3)">
                      <ellipse cx="0" cy="0" rx="13" ry="12" fill="#FFFFFF" />
                      <motion.circle
                        cx={mousePos.x * 3 + 1.5}
                        cy={mousePos.y * 2 + 3.5}
                        r={5}
                        fill="#1A202C"
                        animate={{ scaleY: blink ? 0.1 : 1 }}
                        transition={{ duration: 0.1 }}
                      />
                      {!blink && (
                        <circle
                          cx={mousePos.x * 1.8}
                          cy={mousePos.y * 1.8 + 1.8}
                          r="1.8"
                          fill="#FFFFFF"
                        />
                      )}
                    </g>

                    {/* Right Eye */}
                    <g transform="translate(22, -8) rotate(3)">
                      <ellipse cx="0" cy="0" rx="13" ry="12" fill="#FFFFFF" />
                      <motion.circle
                        cx={mousePos.x * 3 + 1.5}
                        cy={mousePos.y * 2 + 3.5}
                        r={5}
                        fill="#1A202C"
                        animate={{ scaleY: blink ? 0.1 : 1 }}
                        transition={{ duration: 0.1 }}
                      />
                      {!blink && (
                        <circle
                          cx={mousePos.x * 1.8}
                          cy={mousePos.y * 1.8 + 1.8}
                          r="1.8"
                          fill="#FFFFFF"
                        />
                      )}
                    </g>

                    {/* Satisfied Smile */}
                    <path
                      d="M -12,20 Q 0,36 12,20"
                      stroke="#1A202C"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Left Blush */}
                    <ellipse cx="-26" cy="18" rx="7" ry="4" fill="#F87171" opacity="0.35" />

                    {/* Right Blush */}
                    <ellipse cx="28" cy="14" rx="7" ry="4" fill="#F87171" opacity="0.35" />
                  </g>

                  {/* 3D Glassmorphic Student ID Card (Floating on bottom left) */}
                  <g transform="translate(48, 172) rotate(-8)" filter="url(#badgeShadow)">
                    {/* Glass Body */}
                    <rect
                      x="0"
                      y="0"
                      width="92"
                      height="58"
                      rx="12"
                      fill="#FFFFFF"
                      fillOpacity="0.82"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    {/* Chip */}
                    <rect x="10" y="10" width="14" height="11" rx="2.5" fill="#FBBF24" />
                    {/* Photo Placeholder */}
                    <rect x="10" y="27" width="16" height="20" rx="3" fill="var(--brand-green)" />
                    {/* Text lines */}
                    <line
                      x1="33"
                      y1="14"
                      x2="72"
                      y2="14"
                      stroke="#475569"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <line
                      x1="33"
                      y1="21"
                      x2="60"
                      y2="21"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <line
                      x1="33"
                      y1="31"
                      x2="80"
                      y2="31"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="33"
                      y1="37"
                      x2="75"
                      y2="37"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="33"
                      y1="43"
                      x2="68"
                      y2="43"
                      stroke="#94A3B8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </g>

                  {/* 3D Claymorphic Laptop (Floating on bottom right) */}
                  <g transform="translate(196, 175) rotate(6)" filter="url(#laptopShadow)">
                    {/* Screen / Lid */}
                    <polygon
                      points="12,-62 76,-66 84,4 4,8"
                      fill="url(#laptopLid)"
                      stroke="#E2E8F0"
                      strokeWidth="1"
                    />
                    {/* Inner Screen */}
                    <polygon points="17,-56 71,-60 77,0 11,4" fill="#1E293B" />
                    {/* Screen Glow Content */}
                    <circle cx="44" cy="-28" r="8" fill="var(--brand-green)" />
                    <polygon points="35,-16 53,-16 44,-31" fill="#38BDF8" opacity="0.8" />
                    {/* Base */}
                    <polygon
                      points="4,8 84,4 94,22 14,28"
                      fill="url(#laptopBase)"
                      stroke="#CBD5E1"
                      strokeWidth="1"
                    />
                    {/* Trackpad */}
                    <polygon points="44,20 62,19 64,24 46,25" fill="#94A3B8" />
                  </g>
                </svg>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: STEPPER FORM BODY */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 lg:p-9 h-full overflow-hidden bg-card">
              {/* Stepper Progress Bar Header (Fixed Area) */}
              <div className="flex flex-col gap-3 shrink-0">
                {/* Steps indicators */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs font-bold text-brand uppercase tracking-wider">
                    Step {step} of 4
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-text-muted font-mono">
                    {Math.round((step / 4) * 100)}% Complete
                  </span>
                </div>

                {/* Progress bar line */}
                <div className="w-full h-1 bg-border-subtle rounded-full overflow-hidden flex gap-1">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step >= 1 ? 'bg-brand' : 'bg-transparent'
                    }`}
                    style={{ width: '25%' }}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step >= 2 ? 'bg-brand' : 'bg-transparent'
                    }`}
                    style={{ width: '25%' }}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step >= 3 ? 'bg-brand' : 'bg-transparent'
                    }`}
                    style={{ width: '25%' }}
                  />
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      step >= 4 ? 'bg-brand' : 'bg-transparent'
                    }`}
                    style={{ width: '25%' }}
                  />
                </div>

                {/* Step labels */}
                <div className="grid grid-cols-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`text-[11px] whitespace-nowrap transition-colors ${
                        step === 1 ? 'font-bold text-brand' : 'font-medium text-text-muted'
                      }`}
                    >
                      Basics
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`text-[11px] whitespace-nowrap transition-colors ${
                        step === 2 ? 'font-bold text-brand' : 'font-medium text-text-muted'
                      }`}
                    >
                      Education
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`text-[11px] whitespace-nowrap transition-colors ${
                        step === 3 ? 'font-bold text-brand' : 'font-medium text-text-muted'
                      }`}
                    >
                      Skills
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`text-[11px] whitespace-nowrap transition-colors ${
                        step === 4 ? 'font-bold text-brand' : 'font-medium text-text-muted'
                      }`}
                    >
                      Links &amp; Finish
                    </span>
                  </div>
                </div>
              </div>

              {/* Step Form Content Body (Fixed Area, perfectly fitted) */}
              <div className="flex-1 flex flex-col justify-center overflow-hidden py-1">
                <AnimatePresence mode="wait">
                  {/* ------------------------------------------------------------- */}
                  {/* STEP 1: BASIC DETAILS */}
                  {/* ------------------------------------------------------------- */}
                  {step === 1 && (
                    <motion.div
                      key="step-1"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3.5"
                    >
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
                          Basic Details
                        </h2>
                        <p className="text-xs text-text-muted font-medium mt-0.5">
                          Start with the basics. You can update these anytime.
                        </p>
                      </div>

                      {step1Error && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold">
                          {step1Error}
                        </div>
                      )}

                      {/* Full Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Alex Chen"
                          className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                        />
                      </div>

                      {/* Headline */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-800">
                            Headline <span className="text-red-500">*</span>
                          </label>
                          <span className="text-[11px] text-text-muted font-mono">
                            {headline.length}/80
                          </span>
                        </div>
                        <input
                          type="text"
                          maxLength={80}
                          value={headline}
                          onChange={(e) => setHeadline(e.target.value)}
                          placeholder="e.g. CS Student | Full-Stack Developer | Open to Internships"
                          className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                        />
                      </div>

                      {/* Bio / Summary */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-bold text-slate-800">Bio / Summary</label>
                          <span className="text-[11px] text-text-muted font-mono">
                            {bio.length}/300
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={300}
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell recruiters a bit about yourself, your interests, and what you enjoy building..."
                          className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* STEP 2: EDUCATION */}
                  {/* ------------------------------------------------------------- */}
                  {step === 2 && (
                    <motion.div
                      key="step-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3.5"
                    >
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
                          Education
                        </h2>
                        <p className="text-xs text-text-muted font-medium mt-0.5">
                          Where are you studying or what is your academic background?
                        </p>
                      </div>

                      {step2Error && (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-semibold">
                          {step2Error}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            School / University <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            placeholder="e.g. Stanford University or MIT"
                            className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Degree &amp; Major <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={degree}
                              onChange={(e) => setDegree(e.target.value)}
                              placeholder="e.g. B.S. Computer Science"
                              className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Graduation Year <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={graduationYear}
                              onChange={(e) => setGraduationYear(e.target.value)}
                              className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            >
                              {gradYearOptions.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              GPA (Optional)
                            </label>
                            <input
                              type="text"
                              value={gpa}
                              onChange={(e) => setGpa(e.target.value)}
                              placeholder="e.g. 3.8 / 4.0"
                              className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              Specialization (Optional)
                            </label>
                            <input
                              type="text"
                              value={specialization}
                              onChange={(e) => setSpecialization(e.target.value)}
                              placeholder="e.g. AI / Machine Learning"
                              className="w-full px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* STEP 3: SKILLS & EXPERIENCE */}
                  {/* ------------------------------------------------------------- */}
                  {step === 3 && (
                    <motion.div
                      key="step-3"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
                          Skills &amp; Experience
                        </h2>
                        <p className="text-xs text-text-muted font-medium mt-0.5">
                          Showcase your technical superpowers and past work or projects.
                        </p>
                      </div>

                      {/* Skills Input & Badges */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-800">
                          Technical Skills
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSkillInput}
                            onChange={(e) => setNewSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddSkill()
                              }
                            }}
                            placeholder="Type a skill and press Enter..."
                            className="flex-1 px-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSkill()}
                            className="px-3.5 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>

                        {/* Added Skills Badges */}
                        <div className="flex flex-wrap gap-1.5 max-h-[58px] overflow-hidden">
                          {skills.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-skills text-slate-700 text-xs font-semibold border border-border-subtle/40"
                            >
                              {s}
                              <button
                                type="button"
                                onClick={() => handleRemoveSkill(s)}
                                className="hover:text-red-500 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Quick Add Suggestions */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <span className="text-[11px] font-medium text-text-muted mr-1">
                            Popular:
                          </span>
                          {popularSkills
                            .filter((s) => !skills.includes(s))
                            .slice(0, 5)
                            .map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleAddSkill(suggestion)}
                                className="text-[10px] font-medium bg-slate-100 hover:bg-brand/10 hover:text-brand text-slate-600 px-2 py-0.5 rounded-md transition cursor-pointer"
                              >
                                + {suggestion}
                              </button>
                            ))}
                        </div>
                      </div>

                      {/* Past Experience */}
                      <div className="border-t border-border-subtle/50 pt-2.5 space-y-2">
                        <h4 className="text-xs font-bold text-slate-800">
                          Experience / Internships (Optional)
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input
                            type="text"
                            value={experienceRole}
                            onChange={(e) => setExperienceRole(e.target.value)}
                            placeholder="Role (e.g. Frontend Intern)"
                            className="w-full px-3 py-1.5 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs transition bg-card"
                          />
                          <input
                            type="text"
                            value={experienceCompany}
                            onChange={(e) => setExperienceCompany(e.target.value)}
                            placeholder="Company (e.g. DK24 Labs)"
                            className="w-full px-3 py-1.5 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs transition bg-card"
                          />
                        </div>

                        <input
                          type="text"
                          value={experienceSummary}
                          onChange={(e) => setExperienceSummary(e.target.value)}
                          placeholder="Brief summary of achievements or projects..."
                          className="w-full px-3 py-1.5 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs transition bg-card"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* ------------------------------------------------------------- */}
                  {/* STEP 4: LINKS & FINISH */}
                  {/* ------------------------------------------------------------- */}
                  {step === 4 && (
                    <motion.div
                      key="step-4"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3.5"
                    >
                      <div>
                        <h2 className="text-xl sm:text-2xl font-extrabold text-text-main tracking-tight">
                          Links &amp; Finish
                        </h2>
                        <p className="text-xs text-text-muted font-medium mt-0.5">
                          Connect your online profiles so verified recruiters can check your work.
                        </p>
                      </div>

                      <div className="space-y-2.5">
                        {/* GitHub */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            GitHub Profile URL
                          </label>
                          <div className="relative flex items-center">
                            <GithubIcon className="w-4 h-4 text-slate-400 absolute left-3" />
                            <input
                              type="url"
                              value={githubUrl}
                              onChange={(e) => setGithubUrl(e.target.value)}
                              placeholder="https://github.com/yourusername"
                              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            />
                          </div>
                        </div>

                        {/* LinkedIn */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            LinkedIn Profile URL
                          </label>
                          <div className="relative flex items-center">
                            <LinkedinIcon className="w-4 h-4 text-[#0A66C2] absolute left-3" />
                            <input
                              type="url"
                              value={linkedinUrl}
                              onChange={(e) => setLinkedinUrl(e.target.value)}
                              placeholder="https://linkedin.com/in/yourusername"
                              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            />
                          </div>
                        </div>

                        {/* Portfolio */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Portfolio / Website (Optional)
                          </label>
                          <div className="relative flex items-center">
                            <Globe className="w-4 h-4 text-slate-400 absolute left-3" />
                            <input
                              type="url"
                              value={portfolioUrl}
                              onChange={(e) => setPortfolioUrl(e.target.value)}
                              placeholder="https://yourportfolio.dev"
                              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            />
                          </div>
                        </div>

                        {/* Resume */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1">
                            Resume / CV Link (Optional)
                          </label>
                          <div className="relative flex items-center">
                            <FileText className="w-4 h-4 text-slate-400 absolute left-3" />
                            <input
                              type="url"
                              value={resumeUrl}
                              onChange={(e) => setResumeUrl(e.target.value)}
                              placeholder="https://drive.google.com/... or resume URL"
                              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border-subtle focus:border-brand focus:ring-2 focus:ring-brand/15 outline-none text-xs sm:text-sm transition bg-card"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Actions Bar (Fixed at bottom of right column) */}
              <div className="flex items-center justify-between pt-3 border-t border-border-subtle/50 shrink-0">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm transition cursor-pointer active:scale-[0.98]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                {/* Next / Complete Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isCompleted}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2 rounded-xl bg-action-dark hover:bg-black text-white font-semibold text-xs sm:text-sm transition shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98]"
                >
                  {step < 4 ? (
                    <>
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      <span>{isCompleted ? 'Profile Created!' : 'Finish Setup'}</span>
                      <Sparkles className="w-4 h-4 text-brand-emerald" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const DashboardView = () => {
    return (
      <div className="min-h-screen w-full bg-[#F3F4F6] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        {/* Navbar */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-brand tracking-tight font-mono">DK24</span>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                CareerLink
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.clear()
                router.push('/login')
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto">
          {/* Left Column: Student Profile Details */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Profile Info Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 text-brand flex items-center justify-center font-black text-2xl uppercase shrink-0">
                  {fullName ? fullName[0] : 'S'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 leading-tight">
                    {fullName || 'Student'}
                  </h2>
                  <p className="text-xs font-semibold text-brand mt-0.5">
                    {headline || 'Career Seeker'}
                  </p>
                </div>
              </div>

              {bio && <p className="text-sm text-slate-600 leading-relaxed italic">"{bio}"</p>}

              {/* Progress Gauge */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Profile Strength</span>
                  <span>{profileCompletion}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>

              {/* DK24 Application Status */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="font-bold text-slate-500">DK24 Status:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                    dk24Status === 'approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : dk24Status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : dk24Status === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {dk24Status || 'none'}
                </span>
              </div>

              {/* Education details */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Education
                </h3>
                <div className="text-sm space-y-2">
                  {school && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 shrink-0">School:</span>
                      <span className="text-slate-600 font-medium">{school}</span>
                    </div>
                  )}
                  {degree && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 shrink-0">Degree:</span>
                      <span className="text-slate-600 font-medium">{degree}</span>
                    </div>
                  )}
                  {graduationYear && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 shrink-0">Class:</span>
                      <span className="text-slate-600 font-medium">{graduationYear}</span>
                    </div>
                  )}
                  {gpa && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 shrink-0">GPA:</span>
                      <span className="text-slate-600 font-medium">{gpa}</span>
                    </div>
                  )}
                  {specialization && (
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-slate-700 shrink-0">Focus:</span>
                      <span className="text-slate-600 font-medium">{specialization}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {skills.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {experienceRole && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Experience
                  </h3>
                  <div className="text-sm">
                    <p className="font-bold text-slate-700">{experienceRole}</p>
                    <p className="text-xs font-bold text-slate-500">{experienceCompany}</p>
                    {experienceSummary && (
                      <p className="text-xs text-slate-600 mt-1">{experienceSummary}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Links */}
              <div className="pt-3 border-t border-slate-100 flex gap-3 text-slate-400">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand transition"
                  >
                    <GithubIcon className="w-5 h-5" />
                  </a>
                )}
                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand transition"
                  >
                    <LinkedinIcon className="w-5 h-5" />
                  </a>
                )}
                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand transition"
                  >
                    <Globe className="w-5 h-5 animate-pulse" />
                  </a>
                )}
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand transition"
                  >
                    <FileText className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </aside>

          {/* Right Column: Opportunities Feed */}
          <main className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Open Opportunities
              </h2>
              <span className="px-3 py-1 bg-brand/10 text-brand rounded-full text-xs font-bold uppercase">
                {jobs.length} jobs available
              </span>
            </div>

            {isLoadingJobs ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
                <p className="text-sm font-semibold text-slate-500">Loading opportunities...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm space-y-3">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
                <p className="text-slate-500 font-semibold text-sm">
                  No job opportunities listed at this time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between hover:border-slate-300"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {job.employmentType || 'Full-time'}
                        </span>
                        <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-brand/5 px-2 py-0.5 rounded-md">
                          {job.workArrangement || 'Hybrid'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-800 line-clamp-1">
                          {job.title}
                        </h4>
                        <p className="text-xs font-bold text-slate-500">
                          {job.recruiter?.companyName || 'Verified Partner'}
                        </p>
                      </div>
                      {job.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      )}
                    </div>
                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location || 'Remote'}
                      </span>
                      {job.salaryRange && (
                        <span className="font-bold text-slate-700 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">
                          {job.salaryRange}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    )
  }

  return isDashboardMode ? DashboardView() : StepperView()
}
