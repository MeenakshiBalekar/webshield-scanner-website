import React, { useState, useEffect } from 'react'
import { Building2, Code, ShieldCheck, Briefcase, Users, CheckCircle2, ArrowRight } from 'lucide-react'
import { getSolutions, getSolution } from '../services/api'

const ICONS = {
  enterprise: Building2,
  smb: Users,
  devsecops: Code,
  compliance: ShieldCheck,
  'penetration-testing': Briefcase,
}

const VISUALS = {
  enterprise: { main: '#0D1F3C', accent: '#E31837' },
  smb:        { main: '#1e3a5f', accent: '#3b82f6' },
  devsecops:  { main: '#1d4ed8', accent: '#10b981' },
  compliance: { main: '#7c3aed', accent: '#f59e0b' },
  'penetration-testing': { main: '#0f766e', accent: '#f97316' },
}

function SolutionVisual({ type }) {
  const c = VISUALS[type] || VISUALS.enterprise
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: c.main }}>
      <div className="p-8 h-72 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-32 rounded-full opacity-30 bg-white" />
            <div className="h-3 w-24 rounded-full opacity-20 bg-white" />
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: c.accent }}>
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[80, 95, 70, 88, 60, 92].map((h, i) => (
            <div key={i} className="space-y-1">
              <div className="w-full rounded-lg opacity-60" style={{ height: `${h / 4}px`, background: i % 2 === 0 ? c.accent : 'rgba(255,255,255,0.3)' }} />
              <div className="h-1.5 w-3/4 rounded-full bg-white opacity-10" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-2 rounded-full opacity-80" style={{ background: c.accent }} />
          <div className="flex-1 h-2 rounded-full bg-white opacity-20" />
          <div className="w-8 h-2 rounded-full bg-white opacity-10" />
        </div>
      </div>
    </div>
  )
}

export default function Solutions() {
  const [tabs, setTabs] = useState([])
  const [active, setActive] = useState('')
  const [detail, setDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    getSolutions()
      .then((data) => {
        const keys = Object.keys(data)
        if (keys.length) {
          setTabs(keys.map((k) => ({ id: k, ...data[k] })))
          setActive(keys[0])
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!active) return
    setDetail(null)
    setLoadingDetail(true)
    getSolution(active)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false))
  }, [active])

  const sol = detail || tabs.find((t) => t.id === active)
  const Icon = ICONS[active] || Building2

  const name        = sol?.Name ?? sol?.name ?? active
  const headline    = sol?.Headline ?? sol?.headline ?? sol?.Description ?? sol?.description ?? ''
  const description = sol?.LongDescription ?? sol?.longDescription ?? sol?.Description ?? sol?.description ?? ''
  const features    = sol?.Features ?? sol?.features ?? []
  const highlights  = sol?.HighlightFeatures ?? sol?.highlightFeatures ?? features.slice(0, 5)

  if (!tabs.length) {
    return (
      <section id="solutions" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-center">
          <span className="w-6 h-6 border-2 border-gray-300 border-t-navy-900 rounded-full animate-spin" />
        </div>
      </section>
    )
  }

  return (
    <section id="solutions" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="section-tag">Solutions</span>
          <h2 className="section-heading mb-4">Built for Every Security Team</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Whether you're an enterprise CISO, a DevOps team lead, or a solo pen tester — WebShield has a solution tailored to your workflow.
          </p>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((t) => {
            const TabIcon = ICONS[t.id] || Building2
            const label   = t.Name ?? t.name ?? t.id
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === t.id ? 'bg-navy-900 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            {loadingDetail ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-navy-900 rounded-full animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{name}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4">{headline}</h3>
                {description !== headline && (
                  <p className="text-gray-500 leading-relaxed mb-6">{description}</p>
                )}
                {highlights.length > 0 && (
                  <ul className="space-y-2.5 mb-7">
                    {highlights.map((pt, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                )}
                <a href="#contact" className="inline-flex items-center gap-2 text-navy-900 font-semibold hover:text-crimson-500 transition-colors">
                  Explore {name} solution <ArrowRight className="w-4 h-4" />
                </a>
              </>
            )}
          </div>
          <div>
            <SolutionVisual type={active} />
          </div>
        </div>
      </div>
    </section>
  )
}
