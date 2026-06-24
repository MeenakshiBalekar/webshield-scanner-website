import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, Loader2, CheckCircle, AlertCircle, Users, Heart, Mail, Globe, Zap, Lock, Eye, Code2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCompany, submitContact } from '../services/api'

const FALLBACK_ABOUT = `Udyo360 is a modern web security platform helping development teams and security engineers find and fix vulnerabilities before attackers do. Founded by security researchers who were tired of slow, expensive, and hard-to-use tools, we built Udyo360 to make world-class vulnerability scanning accessible to every engineering team.`

const FALLBACK_VALUES = [
  { icon: Lock,  title: 'Security First',        desc: 'We build products that make the web safer, prioritising correctness and coverage over raw speed.' },
  { icon: Eye,   title: 'Transparency',           desc: 'Clear findings, honest pricing, and open communication — no vendor lock-in or hidden upsells.' },
  { icon: Code2, title: 'Developer-Centric',      desc: 'Security tools should fit into developer workflows, not fight against them. We obsess over DX.' },
  { icon: Zap,   title: 'Continuous Improvement', desc: 'We ship improvements weekly and listen closely to feedback from our community of practitioners.' },
  { icon: Users, title: 'Community-Driven',       desc: 'We contribute to OWASP, publish research openly, and share what we learn with the industry.' },
  { icon: Globe, title: 'Privacy by Design',      desc: "Scan data is yours. We handle it with the same care we'd expect from any security partner." },
]

/* ──────────────── Member Card ──────────────── */
function MemberCard({ member }) {
  const [photoFailed, setPhotoFailed] = useState(false)

  const name = member.Name ?? member.name ?? ''
  const role = member.Role ?? member.role ?? member.Title ?? member.title ?? member.Position ?? member.position ?? ''
  const bio  = member.Bio  ?? member.bio  ?? member.Description ?? member.description ?? ''

  // Cover all C#/JS casing variants for photo URL
  const photoUrl = (
    member.PhotoUrl   ?? member.photoUrl   ??
    member.PhotoURL   ?? member.photoURL   ??
    member.Photo      ?? member.photo      ??
    member.ImageUrl   ?? member.imageUrl   ??
    member.ImageURL   ?? member.imageURL   ??
    member.Image      ?? member.image      ??
    member.AvatarUrl  ?? member.avatarUrl  ??
    member.Avatar     ?? member.avatar     ??
    null
  )

  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center w-full max-w-sm mx-auto hover:border-crimson-500/30 transition-colors">
      {(photoUrl && !photoFailed) ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-24 h-24 rounded-full object-cover object-top mx-auto mb-5 border-2 border-crimson-500"
          onError={() => setPhotoFailed(true)}
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-crimson-600 to-crimson-900 flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-white">
          {initials || '?'}
        </div>
      )}
      <h3 className="text-white font-semibold text-lg">{name}</h3>
      <p className="text-crimson-400 text-sm font-medium mb-3">{role}</p>
      {bio && <p className="text-gray-400 text-sm leading-relaxed">{bio}</p>}
    </div>
  )
}

/* ──────────────── Contact Form ──────────────── */
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await submitContact(form)
      setSuccess(true)
      setForm({ name: '', email: '', company: '', subject: '', message: '' })
    } catch {
      setError('Message could not be sent — please try again')
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle className="w-12 h-12 text-green-400" />
        <p className="text-white font-semibold text-lg">Message sent!</p>
        <p className="text-gray-400 text-sm">We'll get back to you within 1 business day.</p>
        <button onClick={() => setSuccess(false)} className="text-crimson-400 hover:text-crimson-300 text-sm mt-2">
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
          <input required value={form.name} onChange={set('name')} placeholder="Your name"
            className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Email *</label>
          <input required type="email" value={form.email} onChange={set('email')} placeholder="you@company.com"
            className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors" />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Company</label>
          <input value={form.company} onChange={set('company')} placeholder="Acme Corp"
            className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Subject *</label>
          <input required value={form.subject} onChange={set('subject')} placeholder="How can we help?"
            className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Message *</label>
        <textarea required rows={5} value={form.message} onChange={set('message')} placeholder="Tell us about your security needs…"
          className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors resize-none" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}

/* ──────────────── Page ──────────────── */
export default function CompanyPage() {
  const [data, setData] = useState(null)
  const contactRef = useRef(null)
  const location = useLocation()

  const fetchData = () => {
    getCompany()
      .then((d) => setData(d))
      .catch(() => {/* silently fall through to static defaults */})
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (location.state?.scrollTo === 'contact' && contactRef.current) {
      setTimeout(() => contactRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [location.state])

  const about   = data?.description ?? data?.Description ?? data?.about ?? data?.About ?? data?.mission ?? data?.Mission ?? FALLBACK_ABOUT
  const apiVals = data?.Values ?? data?.values ?? []
  const values  = apiVals.length > 0 ? apiVals : null   // null = use fallback

  // Cover all common field names the C# backend might use for team members
  const rawTeam = (
    data?.Team        ?? data?.team        ??
    data?.Members     ?? data?.members     ??
    data?.TeamMembers ?? data?.teamMembers ??
    data?.Staff       ?? data?.staff       ??
    data?.People      ?? data?.people      ??
    data?.Leadership  ?? data?.leadership  ??
    []
  )

  // Filter out Sagar Takkar; fix "ex-Microsoft" → "Microsoft" in any text field
  const fixText = (s) => (typeof s === 'string' ? s.replace(/\bex-microsoft\b/gi, 'Microsoft') : s)
  const team = (Array.isArray(rawTeam) ? rawTeam : [])
    .filter((m) => {
      const n = (m.Name ?? m.name ?? '').toLowerCase()
      return !n.includes('sagar') && !n.includes('takkar')
    })
    .map((m) => ({
      ...m,
      name:        fixText(m.name        ?? m.Name),
      Name:        fixText(m.Name        ?? m.name),
      role:        fixText(m.role        ?? m.Role        ?? m.Title    ?? m.title    ?? m.Position ?? m.position),
      Role:        fixText(m.Role        ?? m.role        ?? m.Title    ?? m.title    ?? m.Position ?? m.position),
      bio:         fixText(m.bio         ?? m.Bio         ?? m.Description ?? m.description),
      Bio:         fixText(m.Bio         ?? m.bio         ?? m.Description ?? m.description),
    }))
  const press   = data?.Press ?? data?.press ?? []
  const contact = data?.Contact ?? data?.contact ?? {}

  const founded     = data?.founded     ?? data?.Founded
  const headquarters= data?.headquarters?? data?.Headquarters
  const employees   = data?.employees   ?? data?.Employees
  const stage       = data?.stage       ?? data?.Stage

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero band */}
        <div className="border-b border-white/10 py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-crimson-400 mb-3 block">Company</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              {data?.name ?? data?.Name ?? 'Building a More Secure Web'}
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">{about}</p>
            {(founded || headquarters || employees || stage) && (
              <div className="flex flex-wrap gap-3 mt-6">
                {founded      && <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">Founded {founded}</span>}
                {headquarters && <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{headquarters}</span>}
                {employees    && <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{employees} employees</span>}
                {stage        && <span className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{stage}</span>}
              </div>
            )}
          </div>
        </div>

<div className="max-w-5xl mx-auto w-full px-4 py-12 space-y-16">

          {/* Values */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Heart className="w-5 h-5 text-crimson-400" /> Our Values
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(values ?? FALLBACK_VALUES).map((v, i) => {
                const title = v.Title ?? v.title ?? v.Name ?? v.name ?? v.title ?? ''
                const desc  = v.Description ?? v.description ?? v.desc ?? ''
                const Icon  = v.icon ?? null
                return (
                  <div key={i} className="bg-white/3 border border-white/10 rounded-2xl p-5">
                    {Icon && (
                      <div className="w-9 h-9 bg-crimson-500/10 border border-crimson-500/20 rounded-xl flex items-center justify-center mb-3">
                        <Icon className="w-4 h-4 text-crimson-400" />
                      </div>
                    )}
                    <p className="text-white font-semibold mb-1">{title}</p>
                    {desc && <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Team */}
          {team.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-crimson-400" /> Team
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map((member) => (
                  <MemberCard key={member.Name ?? member.name} member={member} />
                ))}
              </div>
            </section>
          )}

          {/* Press */}
          {press.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-crimson-400" /> In the Press
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {press.map((p, i) => {
                  const title  = p.Title ?? p.title ?? ''
                  const source = p.Source ?? p.source ?? p.Publication ?? p.publication ?? ''
                  const url    = p.Url ?? p.url ?? p.Link ?? p.link ?? '#'
                  const date   = p.Date ?? p.date ?? p.PublishedDate ?? p.publishedDate
                  return (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="bg-white/3 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors block">
                      <p className="text-white font-medium mb-1">{title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-crimson-400">{source}</span>
                        {date && <span className="text-xs text-gray-500">{new Date(date).toLocaleDateString()}</span>}
                      </div>
                    </a>
                  )
                })}
              </div>
            </section>
          )}

          {/* Contact */}
          <section id="contact" ref={contactRef}>
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-crimson-400" /> Get in Touch
                </h2>
                <p className="text-gray-400 mb-6 leading-relaxed">
                  Have questions about our plans, a security concern, or want to explore a partnership? We'd love to hear from you.
                </p>

                <div className="space-y-3">
                  {contact.Email ? (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Mail className="w-4 h-4 text-crimson-400" />
                      <a href={`mailto:${contact.Email}`} className="hover:text-white transition-colors">{contact.Email}</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Mail className="w-4 h-4 text-crimson-400" />
                      <a href="mailto:support@udyo360.com" className="hover:text-white transition-colors">support@udyo360.com</a>
                    </div>
                  )}
                  {contact.Website && (
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Globe className="w-4 h-4 text-crimson-400" />
                      <a href={contact.Website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{contact.Website}</a>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <ContactForm />
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
