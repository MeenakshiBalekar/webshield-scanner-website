import React, { useState, useEffect } from 'react'
import {
  ShieldCheck, Loader2, AlertTriangle, CheckCircle2,
  XCircle, ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCompliance } from '../services/api'

const FRAMEWORK_META = {
  'PCI-DSS': { emoji: '💳', desc: 'Payment Card Industry Data Security Standard' },
  'SOC2':    { emoji: '🏢', desc: 'Service Organization Control 2' },
  'ISO27001':{ emoji: '🌐', desc: 'ISO/IEC 27001 Information Security Management' },
  'HIPAA':   { emoji: '🏥', desc: 'Health Insurance Portability and Accountability Act' },
  'GDPR':    { emoji: '🇪🇺', desc: 'General Data Protection Regulation' },
}

const STATUS_STYLE = {
  Compliant:      { badge: 'bg-green-500/15 text-green-400 border-green-500/30',  bar: 'bg-green-500' },
  Partial:        { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  bar: 'bg-amber-500' },
  'Non-Compliant':{ badge: 'bg-red-500/15 text-red-400 border-red-500/30',        bar: 'bg-red-500' },
  Unknown:        { badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30',     bar: 'bg-gray-500' },
}

function CoverageBar({ pct }) {
  const p = Math.min(100, Math.max(0, pct || 0))
  const color = p >= 80 ? 'bg-green-500' : p >= 50 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${p}%` }} />
    </div>
  )
}

function FrameworkCard({ fw }) {
  const [open, setOpen] = useState(false)

  const name      = fw.framework     ?? fw.Framework     ?? fw.name ?? ''
  const coverage  = fw.coverage      ?? fw.Coverage      ?? fw.coveragePercent ?? fw.CoveragePercent ?? 0
  const status    = fw.status        ?? fw.Status        ?? 'Unknown'
  const checks    = fw.checks        ?? fw.Checks        ?? fw.requirements ?? fw.Requirements ?? []
  const gaps      = fw.gaps          ?? fw.Gaps          ?? fw.failedChecks ?? fw.FailedChecks ?? []
  const meta      = FRAMEWORK_META[name] || { emoji: '📋', desc: name }
  const ss        = STATUS_STYLE[status] || STATUS_STYLE.Unknown

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-6 py-5 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-start gap-4">
          <span className="text-3xl shrink-0">{meta.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="text-white font-bold">{name}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${ss.badge}`}>{status}</span>
            </div>
            <p className="text-gray-500 text-xs mb-3">{meta.desc}</p>
            <div className="flex items-center gap-3">
              <CoverageBar pct={coverage} />
              <span className="text-sm font-bold text-white shrink-0">{coverage}%</span>
            </div>
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
        </div>
      </button>

      {open && (checks.length > 0 || gaps.length > 0) && (
        <div className="border-t border-white/10 px-6 py-4 space-y-4">
          {gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />Gaps ({gaps.length})
              </p>
              <ul className="space-y-1">
                {gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span>
                    {typeof g === 'string' ? g : (g.name ?? g.Name ?? g.check ?? '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {checks.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />Passing Checks ({checks.length})
              </p>
              <ul className="space-y-1">
                {checks.slice(0, 10).map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    {typeof c === 'string' ? c : (c.name ?? c.Name ?? c.check ?? '')}
                  </li>
                ))}
                {checks.length > 10 && <li className="text-xs text-gray-600">+{checks.length - 10} more</li>}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CompliancePage() {
  const [frameworks, setFrameworks] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    getCompliance()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.frameworks ?? data?.items ?? data?.compliance ?? [])
        setFrameworks(list)
      })
      .catch((e) => setError(e.message || 'Failed to load compliance data'))
      .finally(() => setLoading(false))
  }, [])

  const overallScore = frameworks.length > 0
    ? Math.round(frameworks.reduce((sum, f) => sum + (f.coverage ?? f.Coverage ?? f.coveragePercent ?? 0), 0) / frameworks.length)
    : null

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Security Intelligence</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-crimson-400" /> Compliance Coverage
            </h1>
            <p className="text-gray-400">How your security posture maps to major compliance frameworks.</p>
          </div>

          {overallScore !== null && (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-crimson-500/20 border border-crimson-500/40 flex items-center justify-center shrink-0">
                <span className="text-crimson-400 font-extrabold text-lg">{overallScore}%</span>
              </div>
              <div>
                <p className="text-white font-bold">Overall Compliance Score</p>
                <p className="text-gray-500 text-xs mt-0.5">Average coverage across {frameworks.length} framework{frameworks.length !== 1 ? 's' : ''}</p>
              </div>
              {overallScore < 70 && (
                <div className="ml-auto flex items-center gap-1.5 text-xs text-amber-400">
                  <Info className="w-3.5 h-3.5" />Action required
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />Loading compliance data…
            </div>
          ) : frameworks.length === 0 ? (
            <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl text-gray-500">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No compliance data available yet.</p>
              <p className="text-xs mt-1">Run a scan to generate compliance coverage.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {frameworks.map((fw, i) => (
                <FrameworkCard key={fw.framework ?? fw.Framework ?? fw.name ?? i} fw={fw} />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
