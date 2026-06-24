import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, Search, CheckCircle2, Copy, Check, Loader2, AlertTriangle } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getTrustData } from '../services/api'

const GRADE_COLOR = {
  'A+': 'text-green-400', A: 'text-green-400', B: 'text-amber-400',
  C: 'text-orange-400',   D: 'text-red-400',   F: 'text-red-500', '—': 'text-gray-500',
}

const RISK_STYLE = {
  Low:      'bg-green-500/15 text-green-400 border-green-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function ScoreRing({ score }) {
  const r = 64
  const circ = 2 * Math.PI * r
  const pct  = Math.min(100, Math.max(0, score))
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#E31837'
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      <circle cx="80" cy="80" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="12" fill="none" />
      <circle cx="80" cy="80" r={r} stroke={color} strokeWidth="12" fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 80 80)" style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <text x="80" y="72" textAnchor="middle" fill="white" fontSize="32" fontWeight="800">{score}</text>
      <text x="80" y="92" textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="13">/100</text>
    </svg>
  )
}

function CopyBlock({ label, value }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-gray-500 font-medium">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-crimson-400 hover:text-crimson-300 font-semibold">
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-4 py-3 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap break-all">{value}</pre>
    </div>
  )
}

function TrustDisplay({ data, domain }) {
  const score     = data.securityScore  ?? data.SecurityScore  ?? 0
  const grade     = data.securityGrade  ?? data.SecurityGrade  ?? '—'
  const risk      = data.riskLevel      ?? data.RiskLevel      ?? 'Medium'
  const lastScan  = data.lastScannedAt  ?? data.LastScannedAt  ?? ''
  const passed    = data.passedChecks   ?? data.PassedChecks   ?? 0
  const total     = data.totalChecks    ?? data.TotalChecks    ?? 0
  const compliance = data.complianceHighlights ?? data.ComplianceHighlights ?? []
  const powered   = data.poweredBy ?? 'Udyo360'

  const badgeUrl  = `${import.meta.env.VITE_API_URL || ''}/api/trust/badge/${domain}`
  const imgTag    = `<img src="${badgeUrl}" alt="Security Score: ${grade}" />`
  const mdSnippet = `[![Security Score](${badgeUrl})](https://udyo360.com/trust/${domain})`

  return (
    <div className="space-y-6">
      {/* Score ring + grade */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-2">
          <ScoreRing score={score} />
        </div>
        <p className={`text-4xl font-extrabold mt-2 ${GRADE_COLOR[grade] || 'text-white'}`}>Grade {grade}</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${RISK_STYLE[risk] || RISK_STYLE.Medium}`}>{risk} Risk</span>
        </div>
        {lastScan && <p className="text-gray-500 text-xs mt-3">Last scanned {new Date(lastScan).toLocaleString()}</p>}
        {total > 0 && (
          <p className="text-gray-400 text-sm mt-2 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            {passed} / {total} checks passed
          </p>
        )}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Shield className="w-4 h-4 text-crimson-400" />
          <span className="text-xs text-gray-500">Secured by <span className="text-crimson-400 font-semibold">{powered}</span></span>
        </div>
      </div>

      {/* Compliance */}
      {compliance.length > 0 && (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-3">Compliance Highlights</h2>
          <div className="flex flex-wrap gap-2">
            {compliance.map((c, i) => (
              <span key={i} className="text-xs font-medium bg-white/5 border border-white/15 text-gray-300 px-3 py-1.5 rounded-full">{c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Embed code */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Embed Your Badge</h2>
        <p className="text-xs text-gray-500 mb-4">Add a live security score badge to your README or website. Updates every scan.</p>
        <div className="space-y-3">
          <CopyBlock label="HTML" value={imgTag} />
          <CopyBlock label="Markdown" value={mdSnippet} />
        </div>
      </div>
    </div>
  )
}

export default function TrustPage() {
  const { domain: paramDomain } = useParams()
  const [inputDomain, setInputDomain] = useState(paramDomain || '')
  const [domain, setDomain]           = useState(paramDomain || '')
  const [data, setData]               = useState(null)
  const [loading, setLoading]         = useState(!!paramDomain)
  const [error, setError]             = useState(null)

  useEffect(() => {
    if (!domain) return
    setLoading(true); setError(null); setData(null)
    getTrustData(domain)
      .then(setData)
      .catch(() => setError('No trust data found for this domain'))
      .finally(() => setLoading(false))
  }, [domain])

  const handleSearch = () => {
    const d = inputDomain.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    if (d) setDomain(d)
  }

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          <div className="mb-10 text-center">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Trust Centre</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center justify-center gap-3">
              <Shield className="w-8 h-8 text-crimson-400" /> Security Trust Badge
            </h1>
            <p className="text-gray-400">Look up the live security score for any scanned domain.</p>
          </div>

          {/* Search */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="flex gap-3">
              <input
                value={inputDomain}
                onChange={(e) => setInputDomain(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="example.com"
                className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              />
              <button
                onClick={handleSearch}
                disabled={loading || !inputDomain.trim()}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Loading…' : 'Look up'}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
              <Link to="/scanner" className="ml-auto text-crimson-400 hover:text-crimson-300 font-semibold text-xs shrink-0">Scan this domain →</Link>
            </div>
          )}

          {data && <TrustDisplay data={data} domain={domain} />}

          {!domain && !data && (
            <div className="text-center py-12 text-gray-600">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enter a domain name above to view its security trust score.</p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
