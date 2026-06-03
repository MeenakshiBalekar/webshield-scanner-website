import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Shield, Building2, Users, Code, ShieldCheck, Briefcase,
  CheckCircle2, ArrowLeft, Star, AlertCircle, Loader2,
} from 'lucide-react'
import { getSolution } from '../services/api'

const ICONS = {
  enterprise:             Building2,
  smb:                    Users,
  devsecops:              Code,
  compliance:             ShieldCheck,
  'penetration-testing':  Briefcase,
}

const COLORS = {
  enterprise:             'bg-blue-600',
  smb:                    'bg-indigo-600',
  devsecops:              'bg-teal-600',
  compliance:             'bg-purple-600',
  'penetration-testing':  'bg-orange-600',
}

export default function SolutionDetailPage() {
  const { type } = useParams()
  const [sol, setSol] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    setSol(null)
    setError(null)
    getSolution(type)
      .then(setSol)
      .catch((e) => setError(e.message))
  }, [type])

  const Icon     = ICONS[type] || Shield
  const iconBg   = COLORS[type] || 'bg-crimson-500'
  const name     = sol?.Name ?? sol?.name ?? type
  const headline = sol?.Headline ?? sol?.headline ?? sol?.Description ?? sol?.description ?? ''
  const desc     = sol?.LongDescription ?? sol?.longDescription ?? sol?.Description ?? sol?.description ?? ''
  const features     = sol?.Features ?? sol?.features ?? []
  const highlights   = sol?.HighlightFeatures ?? sol?.highlightFeatures ?? []
  const price        = sol?.Price ?? sol?.price
  const planRequired = sol?.PlanRequired ?? sol?.planRequired

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9 rounded-lg" />
          <span className="text-white font-bold text-xl tracking-tight">
            Udyo<span className="text-gray-400 font-normal">360</span>
          </span>
        </Link>
        <Link to="/solutions" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Solutions
        </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-8">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!sol && !error && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-white/30" />
          </div>
        )}

        {sol && (
          <>
            {/* Hero */}
            <div className="flex items-start gap-5 mb-10">
              <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center shrink-0`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1">Solution</p>
                <h1 className="text-3xl font-extrabold text-white mb-2">{name}</h1>
                <p className="text-lg text-gray-400">{headline !== desc ? headline : ''}</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 space-y-10">
                {/* Description */}
                {desc && (
                  <section>
                    <p className="text-gray-300 leading-relaxed text-base">{desc}</p>
                  </section>
                )}

                {/* All features */}
                {features.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-white mb-5">What's included</h2>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {features.map((f, i) => (
                        <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-300">{f}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Highlights */}
                {highlights.length > 0 && (
                  <section>
                    <h2 className="text-xl font-bold text-white mb-5">Key highlights</h2>
                    <div className="space-y-3">
                      {highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Star className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-300">{h}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-5">
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">Plan details</h3>
                  {price && (
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">Price</p>
                      <p className="text-2xl font-extrabold text-white">{price}</p>
                    </div>
                  )}
                  {planRequired && (
                    <div className="mb-5">
                      <p className="text-xs text-gray-500 mb-1">Plan required</p>
                      <span className="text-xs font-semibold bg-crimson-500/15 text-crimson-400 border border-crimson-500/30 px-2.5 py-1 rounded-full capitalize">
                        {planRequired}
                      </span>
                    </div>
                  )}
                  <Link
                    to="/pricing"
                    className="block w-full text-center bg-crimson-500 hover:bg-crimson-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                  >
                    View Pricing
                  </Link>
                  <Link
                    to="/company#contact"
                    className="block w-full text-center border border-white/15 hover:border-white/30 text-gray-300 hover:text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2"
                  >
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
