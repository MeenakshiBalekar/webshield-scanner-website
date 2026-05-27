import React, { useState } from 'react'
import { Shield, ArrowRight, CheckCircle, Mail } from 'lucide-react'

export default function CTA() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section id="contact" className="py-20 md:py-28 bg-navy-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-crimson-500/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-crimson-500 rounded-2xl mb-6 shadow-lg shadow-crimson-500/30">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
          Scan Your Web App for Free.<br />
          <span className="text-crimson-400">No Credit Card Required.</span>
        </h2>

        <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
          Join 12,000+ security professionals who trust WebShield to protect their applications.
          Start your free scan in under 2 minutes.
        </p>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-8"
          >
            <div className="flex-1 relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 pl-10 pr-4 py-3.5 rounded-xl focus:outline-none focus:border-crimson-500 focus:bg-white/15 transition-all text-sm"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 shadow-lg shrink-0 text-sm"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-center gap-3 text-green-400 mb-8 py-4">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg font-semibold">Thanks! Check your inbox to get started.</span>
          </div>
        )}

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-gray-400">
          {[
            '✓ 30-day free trial',
            '✓ No credit card',
            '✓ Setup in 2 minutes',
            '✓ Cancel anytime',
          ].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
