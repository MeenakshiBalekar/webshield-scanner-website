import React, { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Send, Loader2, CheckCircle, AlertCircle, Users, Heart, Mail, Globe, Zap, Lock, Eye, Code2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCompany, submitContact } from '../services/api'

const FALLBACK_ABOUT = `WebShield is a modern web security platform helping development teams and security engineers find and fix vulnerabilities before attackers do. Founded by security researchers who were tired of slow, expensive, and hard-to-use tools, we built WebShield to make world-class vulnerability scanning accessible to every engineering team.`

const FALLBACK_VALUES = [
  { icon: Lock,  title: 'Security First',        desc: 'We build products that make the web safer, prioritising correctness and coverage over raw speed.' },
  { icon: Eye,   title: 'Transparency',           desc: 'Clear findings, honest pricing, and open communication — no vendor lock-in or hidden upsells.' },
  { icon: Code2, title: 'Developer-Centric',      desc: 'Security tools should fit into developer workflows, not fight against them. We obsess over DX.' },
  { icon: Zap,   title: 'Continuous Improvement', desc: 'We ship improvements weekly and listen closely to feedback from our community of practitioners.' },
  { icon: Users, title: 'Community-Driven',       desc: 'We contribute to OWASP, publish research openly, and share what we learn with the industry.' },
  { icon: Globe, title: 'Privacy by Design',      desc: "Scan data is yours. We handle it with the same care we'd expect from any security partner." },
]

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
    } catch (err) {
      setError(err.message)
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

  useEffect(() => {
    getCompany().then(setData).catch(() => {})
  }, [])

  useEffect(() => {
    if (location.state?.scrollTo === 'contact' && contactRef.current) {
      setTimeout(() => contactRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [location.state])

  const about   = data?.About ?? data?.about ?? FALLBACK_ABOUT
  const apiVals = data?.Values ?? data?.values ?? []
  const values  = apiVals.length > 0 ? apiVals : null   // null = use fallback
  const team    = data?.Team ?? data?.team ?? []
  const press   = data?.Press ?? data?.press ?? []
  const contact = data?.Contact ?? data?.contact ?? {}

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero band */}
        <div className="border-b border-white/10 py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-crimson-400 mb-3 block">Company</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
              Building a More Secure Web
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed max-w-2xl">{about}</p>
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
                {team.map((m, i) => {
                  const name     = m.Name ?? m.name ?? ''
                  const role     = m.Role ?? m.role ?? m.Title ?? m.title ?? ''
                  const bio      = m.Bio ?? m.bio ?? ''
                  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                  return (
                    <div key={i} className="bg-white/3 border border-white/10 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-10 h-10 bg-crimson-500/20 border border-crimson-500/30 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-crimson-400">{initials}</span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{name}</p>
                        <p className="text-xs text-gray-400 mb-1">{role}</p>
                        {bio && <p className="text-xs text-gray-500">{bio}</p>}
                      </div>
                    </div>
                  )
                })}
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
                      <a href="mailto:hello@webshield.io" className="hover:text-white transition-colors">hello@webshield.io</a>
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
