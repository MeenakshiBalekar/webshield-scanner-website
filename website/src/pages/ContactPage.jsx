import React, { useState } from 'react'
import { Shield, Send, Loader2, CheckCircle, AlertCircle, Mail, Phone, MessageSquare, Building2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { submitContact } from '../services/api'

const SUBJECTS = [
  'General Inquiry',
  'Sales & Pricing',
  'Technical Support',
  'Security Research',
  'Partnership',
  'Report a Vulnerability',
  'Other',
]

const CONTACT_OPTIONS = [
  {
    icon: Mail,
    label: 'Email Us',
    value: 'hello@webshield.io',
    href: 'mailto:hello@webshield.io',
    desc: 'For general questions and sales',
  },
  {
    icon: Phone,
    label: 'Sales',
    value: 'sales@webshield.io',
    href: 'mailto:sales@webshield.io',
    desc: 'Talk to our sales team',
  },
  {
    icon: MessageSquare,
    label: 'Support',
    value: 'support@webshield.io',
    href: 'mailto:support@webshield.io',
    desc: 'Technical help and bug reports',
  },
  {
    icon: Building2,
    label: 'Press',
    value: 'press@webshield.io',
    href: 'mailto:press@webshield.io',
    desc: 'Media inquiries and partnerships',
  },
]

export default function ContactPage() {
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
      setError(err.message || 'Failed to send message. Please try again.')
    }
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero */}
        <div className="border-b border-white/10 py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-crimson-400 mb-3 block">Contact</span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Get in Touch</h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Have a question about our plans, a security concern, or want to explore a partnership? We typically reply within one business day.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-4 py-12">
          <div className="grid lg:grid-cols-5 gap-12">

            {/* Left — contact options */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-white mb-6">Contact Options</h2>
              {CONTACT_OPTIONS.map((opt) => {
                const Icon = opt.icon
                return (
                  <a
                    key={opt.label}
                    href={opt.href}
                    className="flex items-start gap-4 bg-white/3 border border-white/10 rounded-2xl p-4 hover:border-crimson-500/40 transition-colors group block"
                  >
                    <div className="w-9 h-9 bg-crimson-500/10 border border-crimson-500/20 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-crimson-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm group-hover:text-crimson-300 transition-colors">{opt.label}</p>
                      <p className="text-xs text-gray-500 mb-0.5">{opt.desc}</p>
                      <p className="text-xs text-crimson-400">{opt.value}</p>
                    </div>
                  </a>
                )
              })}

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Looking for our full company profile, team, and press resources?{' '}
                  <Link to="/company" className="text-crimson-400 hover:text-crimson-300">Visit the Company page →</Link>
                </p>
              </div>
            </div>

            {/* Right — form */}
            <div className="lg:col-span-3 bg-white/3 border border-white/10 rounded-2xl p-6">
              {success ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <CheckCircle className="w-14 h-14 text-green-400" />
                  <p className="text-white font-bold text-xl">Message sent!</p>
                  <p className="text-gray-400 text-sm">We'll get back to you within 1 business day.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-3 text-sm text-crimson-400 hover:text-crimson-300 transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-lg font-bold text-white mb-5">Send a Message</h2>

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
                      <select required value={form.subject} onChange={set('subject')}
                        className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white px-4 py-2.5 rounded-xl text-sm outline-none transition-colors appearance-none"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="" disabled className="bg-navy-900">Select a subject…</option>
                        {SUBJECTS.map((s) => (
                          <option key={s} value={s} className="bg-navy-900">{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Message *</label>
                    <textarea required rows={6} value={form.message} onChange={set('message')}
                      placeholder="Tell us how we can help…"
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
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
