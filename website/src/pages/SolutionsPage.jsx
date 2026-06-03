import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Building2, Users, Code, ShieldCheck, Briefcase, ArrowRight, CheckCircle2 } from 'lucide-react'
import { getSolutions } from '../services/api'

const ICONS = {
  enterprise:             Building2,
  smb:                    Users,
  devsecops:              Code,
  compliance:             ShieldCheck,
  'penetration-testing':  Briefcase,
}

const COLORS = {
  enterprise:             { bg: 'bg-blue-600',   border: 'border-blue-500/30',   badge: 'text-blue-400 bg-blue-500/10' },
  smb:                    { bg: 'bg-indigo-600',  border: 'border-indigo-500/30', badge: 'text-indigo-400 bg-indigo-500/10' },
  devsecops:              { bg: 'bg-teal-600',    border: 'border-teal-500/30',   badge: 'text-teal-400 bg-teal-500/10' },
  compliance:             { bg: 'bg-purple-600',  border: 'border-purple-500/30', badge: 'text-purple-400 bg-purple-500/10' },
  'penetration-testing':  { bg: 'bg-orange-600',  border: 'border-orange-500/30', badge: 'text-orange-400 bg-orange-500/10' },
}

export default function SolutionsPage() {
  const [solutions, setSolutions] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSolutions()
      .then(setSolutions)
      .catch((e) => setError(e.message))
  }, [])

  const entries = solutions ? Object.entries(solutions) : []

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9" />
          <span className="text-white font-bold text-xl tracking-tight">
            Udy◎<span className="text-crimson-500">360</span>
          </span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to home</Link>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-3">Solutions</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Purpose-built security tools for every team — from solo pen testers to enterprise security operations.
          </p>
        </div>

        {error && (
          <p className="text-red-400 text-sm text-center mb-8">{error}</p>
        )}

        {!solutions && !error && (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {entries.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map(([key, sol]) => {
              const Icon    = ICONS[key] || Shield
              const color   = COLORS[key] || COLORS.enterprise
              const name    = sol?.Name ?? sol?.name ?? key
              const desc    = sol?.Description ?? sol?.description ?? ''
              const features = sol?.Features ?? sol?.features ?? []
              const price   = sol?.Price ?? sol?.price

              return (
                <Link
                  key={key}
                  to={`/solutions/${key}`}
                  className={`group bg-white/3 border ${color.border} hover:border-white/30 rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-0.5`}
                >
                  <div className={`w-11 h-11 ${color.bg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-lg font-bold text-white">{name}</h2>
                    {price && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color.badge}`}>
                        {price}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-400 leading-relaxed mb-5 flex-1">{desc}</p>

                  {features.slice(0, 4).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="text-xs text-gray-300">{f}</span>
                    </div>
                  ))}

                  <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-crimson-400 group-hover:text-crimson-300 transition-colors">
                    View details <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
