import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Play, ChevronDown, ChevronUp, ArrowRight,
  BookOpen, Shield, Zap, Lock, Globe,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import SpineUniverse from '../components/SpineUniverse'
import TrustLogos from '../components/TrustLogos'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import Solutions from '../components/Solutions'
import Testimonials from '../components/Testimonials'
import Pricing from '../components/Pricing'
import Resources from '../components/Resources'
import CTA from '../components/CTA'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { getFaq } from '../services/api'

/* ──────────────── Demo Modal ──────────────── */
function DemoModal({ onClose }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
    >
      <div className="relative w-full max-w-3xl bg-navy-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Video placeholder — replace src with real embed when available */}
        <div className="relative aspect-video bg-navy-950 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-crimson-500/20 border border-crimson-500/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-7 h-7 text-crimson-400 fill-crimson-400 ml-1" />
            </div>
            <p className="text-white font-semibold text-lg mb-1">Product Demo</p>
            <p className="text-gray-400 text-sm">See WebShield find and explain vulnerabilities in under 2 minutes.</p>
          </div>
          {/* Uncomment and replace with real YouTube/Vimeo embed:
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/YOUR_VIDEO_ID?autoplay=1"
            allow="autoplay; fullscreen"
            frameBorder="0"
          /> */}
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">WebShield — Web Vulnerability Scanner</p>
          <button
            onClick={onClose}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ──────────────── Knowledge Hub ──────────────── */
const HUB_ARTICLES = [
  {
    icon: Shield,
    color: 'text-blue-400 bg-blue-500/10',
    title: 'OWASP Top 10 2024 Breakdown',
    excerpt: 'What changed in the latest OWASP rankings and how each risk maps to a WebShield scanner.',
    category: 'Security Research',
    href: '/blog',
  },
  {
    icon: Zap,
    color: 'text-orange-400 bg-orange-500/10',
    title: 'Why Security Headers Still Matter',
    excerpt: 'CSP, HSTS, X-Frame-Options — a quick-reference guide to the headers that block common attacks.',
    category: 'How-To',
    href: '/blog',
  },
  {
    icon: Lock,
    color: 'text-purple-400 bg-purple-500/10',
    title: 'Shift Security Left with CI/CD Scanning',
    excerpt: 'Step-by-step guide to running WebShield on every pull request in GitHub Actions and GitLab CI.',
    category: 'DevSecOps',
    href: '/blog',
  },
  {
    icon: Globe,
    color: 'text-teal-400 bg-teal-500/10',
    title: 'API Security Checklist: 15 Things to Test',
    excerpt: 'Before you ship an API, run through this checklist covering auth, rate-limiting, and data exposure.',
    category: 'How-To',
    href: '/blog',
  },
]

function KnowledgeHub({ navigate }) {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="section-tag">Knowledge Hub</span>
            <h2 className="section-heading">Security Guides & Research</h2>
          </div>
          <button
            onClick={() => navigate('/blog')}
            className="hidden sm:flex items-center gap-1.5 text-navy-900 font-semibold text-sm hover:text-crimson-500 transition-colors"
          >
            View all articles <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HUB_ARTICLES.map((a, i) => {
            const Icon = a.icon
            return (
              <button
                key={i}
                onClick={() => navigate(a.href)}
                className="text-left bg-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className={`w-9 h-9 ${a.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{a.category}</span>
                <h3 className="text-sm font-bold text-navy-900 mt-1 mb-2 leading-snug group-hover:text-crimson-500 transition-colors">
                  {a.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">{a.excerpt}</p>
                <div className="flex items-center gap-1 mt-3 text-xs font-semibold text-crimson-500">
                  Read more <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            )
          })}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <button
            onClick={() => navigate('/blog')}
            className="text-navy-900 font-semibold text-sm hover:text-crimson-500 transition-colors"
          >
            View all articles →
          </button>
        </div>
      </div>
    </section>
  )
}

/* ──────────────── FAQ Section ──────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-semibold text-navy-900">{q}</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <p className="text-sm text-gray-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

function FaqSection() {
  const [faqs, setFaqs] = useState([])

  useEffect(() => {
    getFaq()
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.Faqs ?? data?.faqs ?? []
        setFaqs(arr)
      })
      .catch(() => {})
  }, [])

  if (faqs.length === 0) return null

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <span className="section-tag">FAQ</span>
          <h2 className="section-heading">Common Questions</h2>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 px-6 shadow-sm">
          {faqs.map((f, i) => (
            <FaqItem
              key={i}
              q={f.Question ?? f.question ?? f.Q ?? f.q ?? ''}
              a={f.Answer   ?? f.answer   ?? f.A ?? f.a ?? ''}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ──────────────── CTA Banner ──────────────── */
function CtaBanner({ onStartFreeScan }) {
  return (
    <div className="bg-crimson-500 py-4 px-6 text-center">
      <p className="text-white text-sm font-medium">
        New: OWASP Top 10 2024 coverage is now live.{' '}
        <button
          onClick={onStartFreeScan}
          className="underline font-bold hover:no-underline"
        >
          Run a free scan →
        </button>
      </p>
    </div>
  )
}

/* ──────────────── Landing Page ──────────────── */
export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showDemo, setShowDemo] = useState(false)

  const handleStartFreeScan = () => {
    const dest = '/products/web'
    if (user) {
      navigate(dest)
    } else {
      navigate(`/login?redirect=${encodeURIComponent(dest)}`)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#010812' }}>
      <SpineUniverse />
      {showDemo && <DemoModal onClose={() => setShowDemo(false)} />}

      <Navbar banner={<CtaBanner onStartFreeScan={handleStartFreeScan} />} />

      <main>
        <Hero
          onWatchDemo={() => setShowDemo(true)}
          onStartFreeScan={handleStartFreeScan}
        />
        <TrustLogos />
        <Features />
        <HowItWorks />
        <Solutions />
        <Testimonials />
        <KnowledgeHub navigate={navigate} />
        <Pricing />
        <Resources />
        <FaqSection />
        <CTA />
      </main>

      <Footer />
    </div>
  )
}
