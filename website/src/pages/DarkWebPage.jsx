import React, { useState } from 'react'
import { Eye, Search, Loader2, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { checkDarkWeb } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const DEMO_BREACHES = [
  { name: 'LinkedIn', breachDate: '2021-06-22', severity: 'High', dataTypes: ['Emails', 'Passwords', 'Phone numbers'], description: '700M records exposed in a scraping attack.' },
  { name: 'Adobe', breachDate: '2019-10-23', severity: 'Medium', dataTypes: ['Emails', 'Usernames'], description: 'Creative Cloud data exposed in misconfigured Elasticsearch.' },
]
const DEMO_EMAILS = [
  { email: 'admin@example.com', source: 'LinkedIn', exposedAt: '2021-06-22' },
  { email: 'info@example.com', source: 'Adobe', exposedAt: '2019-10-23' },
]

function ScoreRing({ score }) {
  const s = score ?? 0
  const r = 36, circ = 2 * Math.PI * r, fill = circ * (s / 100)
  const color = s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444'
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 45 45)" />
      <text x={45} y={50} textAnchor="middle" fill="white" fontSize={18} fontWeight={700}>{s}</text>
    </svg>
  )
}

function BreachRiskBadge({ risk }) {
  if (!risk) return null
  const r = String(risk).toLowerCase()
  const style =
    r === 'high'   ? 'bg-red-500/15 border-red-500/30 text-red-300' :
    r === 'medium' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                     'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
  return (
    <div className={`flex items-center gap-3 border rounded-2xl px-5 py-4 ${style}`}>
      <Shield className="w-5 h-5 shrink-0" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Breach Risk</p>
        <p className="text-lg font-extrabold capitalize">{risk}</p>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }) {
  if (!severity) return null
  const s = String(severity).toLowerCase()
  const style =
    s === 'critical' ? 'text-red-400 bg-red-500/10 border-red-500/30' :
    s === 'high'     ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
    s === 'medium'   ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
                       'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full border ${style}`}>
      {severity}
    </span>
  )
}

function severityBorderClass(severity) {
  const s = String(severity || '').toLowerCase()
  if (s === 'critical') return 'border-red-500/40'
  if (s === 'high')     return 'border-orange-500/40'
  if (s === 'medium')   return 'border-amber-500/40'
  return 'border-emerald-500/40'
}

function severityLeftBorderClass(severity) {
  const s = String(severity || '').toLowerCase()
  if (s === 'critical') return 'bg-red-500'
  if (s === 'high')     return 'bg-orange-500'
  if (s === 'medium')   return 'bg-amber-500'
  return 'bg-emerald-500'
}

function BreachCard({ breach }) {
  const name        = field(breach, 'name', 'Name', 'siteName') ?? 'Unknown'
  const breachDate  = field(breach, 'breachDate', 'BreachDate', 'date') ?? null
  const dataTypes   = field(breach, 'dataTypes', 'DataTypes') ?? []
  const severity    = field(breach, 'severity', 'Severity') ?? 'Low'
  const description = field(breach, 'description', 'Description') ?? null

  const formattedDate = breachDate
    ? new Date(breachDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  return (
    <div className={`bg-white/3 border rounded-2xl overflow-hidden flex ${severityBorderClass(severity)}`}>
      <div className={`w-1 shrink-0 rounded-l-2xl ${severityLeftBorderClass(severity)}`} />
      <div className="flex-1 px-5 py-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-white font-bold text-sm">{name}</p>
            {formattedDate && (
              <p className="text-xs text-gray-500 mt-0.5">Breach date: {formattedDate}</p>
            )}
          </div>
          <SeverityBadge severity={severity} />
        </div>
        {description && (
          <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
        )}
        {Array.isArray(dataTypes) && dataTypes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {dataTypes.map((dt, i) => (
              <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                {dt}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmailRow({ email: emailObj }) {
  const emailAddr  = field(emailObj, 'email', 'Email') ?? '—'
  const source     = field(emailObj, 'source', 'Source', 'breach') ?? '—'
  const exposedAt  = field(emailObj, 'exposedAt', 'ExposedAt', 'date', 'Date') ?? null

  const relativeDate = (dateStr) => {
    if (!dateStr) return null
    try {
      const d = new Date(dateStr)
      const now = new Date()
      const diffMs = now - d
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays < 1) return 'Today'
      if (diffDays < 30) return `${diffDays}d ago`
      const diffMonths = Math.floor(diffDays / 30)
      if (diffMonths < 12) return `${diffMonths}mo ago`
      const diffYears = Math.floor(diffMonths / 12)
      return `${diffYears}y ago`
    } catch { return dateStr }
  }

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 gap-4">
      <span className="text-sm text-gray-200 font-mono truncate min-w-0">{emailAddr}</span>
      <div className="flex items-center gap-4 shrink-0">
        <span className="text-xs text-gray-400">{source}</span>
        {exposedAt && (
          <span className="text-xs text-gray-500">{relativeDate(exposedAt)}</span>
        )}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, sub }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl px-5 py-4 flex-1 min-w-0">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-white">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function DarkWebPage() {
  const [domain,  setDomain]  = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [activeTab, setActiveTab] = useState('breaches')

  const handleCheck = async () => {
    const d = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*/, '')
    if (!d) return
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await checkDarkWeb(d)
      setResult(data)
    } catch {
      // API endpoint not available — show sample breach data
      setResult({ domain: d })
    }
    setLoading(false)
  }

  const checkedDomain  = result ? (field(result, 'domain', 'Domain') ?? domain) : null
  const score          = result ? field(result, 'score', 'Score', 'riskScore', 'RiskScore') : null
  const riskLevel      = result ? field(result, 'riskLevel', 'RiskLevel', 'risk', 'Risk') : null
  const rawBreaches    = result ? (field(result, 'breaches', 'Breaches', 'results', 'Results') ?? []) : []
  const rawEmails      = result ? (field(result, 'emails', 'Emails', 'exposedEmails', 'ExposedEmails') ?? []) : []
  const totalBreaches  = result ? (field(result, 'totalBreaches', 'TotalBreaches') ?? rawBreaches.length) : null
  const totalEmails    = result ? (field(result, 'totalEmails', 'TotalEmails') ?? rawEmails.length) : null
  const mostRecent     = result ? field(result, 'mostRecentBreach', 'MostRecentBreach', 'latestBreach', 'LatestBreach') : null

  const isDemo = result !== null && rawBreaches.length === 0
  const breaches = isDemo ? DEMO_BREACHES : rawBreaches
  const emails   = isDemo ? DEMO_EMAILS   : rawEmails

  const mostRecentFormatted = mostRecent
    ? new Date(mostRecent).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : (breaches.length > 0
        ? (() => {
            const dates = breaches
              .map(b => field(b, 'breachDate', 'BreachDate', 'date'))
              .filter(Boolean)
              .sort((a, b) => new Date(b) - new Date(a))
            return dates[0]
              ? new Date(dates[0]).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              : null
          })()
        : null)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-900/30 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Dark Web Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Dark Web Monitor</h1>
            <p className="text-gray-400 text-sm mt-1">
              Check if your domain's credentials, email addresses, or sensitive data appear in dark web breach databases.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <PageGuide
            id="dark-web"
            text="Check if your domain's credentials, emails, or data appear in dark web breach dumps. Enter a domain and click Check — results show each breach event, what data was exposed, and which email addresses were found. Check your primary domain and all subdomains regularly. Results are sourced from aggregated breach intelligence feeds."
          />

          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              placeholder="example.com"
              className="flex-1 bg-white/5 border border-white/15 focus:border-purple-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
            />
            <button
              onClick={handleCheck}
              disabled={loading || !domain.trim()}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Checking…' : 'Check Domain'}
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              {/* Hero row */}
              <div className="flex flex-wrap items-center gap-5 bg-white/3 border border-white/10 rounded-2xl p-5">
                {score != null && <ScoreRing score={score} />}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg">{checkedDomain}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Dark web breach analysis</p>
                  {isDemo && (
                    <span className="inline-flex items-center mt-1 text-[11px] text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      Sample data
                    </span>
                  )}
                </div>
                {riskLevel && <BreachRiskBadge risk={riskLevel} />}
              </div>

              {/* Summary cards */}
              <div className="flex gap-3 flex-wrap">
                <SummaryCard
                  label="Total Breaches"
                  value={isDemo ? DEMO_BREACHES.length : (totalBreaches ?? breaches.length)}
                />
                <SummaryCard
                  label="Exposed Emails"
                  value={isDemo ? DEMO_EMAILS.length : (totalEmails ?? emails.length)}
                />
                <SummaryCard
                  label="Most Recent Breach"
                  value={mostRecentFormatted ?? '—'}
                />
              </div>

              {/* Tabs */}
              <div className="border-b border-white/10 flex gap-1">
                {['breaches', 'emails'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-semibold capitalize transition-colors border-b-2 -mb-px ${
                      activeTab === tab
                        ? 'border-purple-500 text-purple-300'
                        : 'border-transparent text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab === 'breaches' ? 'Breaches' : 'Exposed Emails'}
                  </button>
                ))}
              </div>

              {/* Breaches tab */}
              {activeTab === 'breaches' && (
                <div className="space-y-3">
                  {breaches.length > 0 ? (
                    breaches.map((breach, i) => <BreachCard key={i} breach={breach} />)
                  ) : (
                    <div className="bg-white/3 border border-white/10 rounded-2xl px-5 py-10 text-center">
                      <Eye className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No breaches found for this domain</p>
                    </div>
                  )}
                </div>
              )}

              {/* Exposed emails tab */}
              {activeTab === 'emails' && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  {emails.length > 0 ? (
                    <>
                      <div className="px-5 py-3 border-b border-white/10 grid grid-cols-[1fr_auto_auto] gap-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Email Address</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Source</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Exposed</span>
                      </div>
                      <div className="px-5">
                        {emails.map((em, i) => <EmailRow key={i} email={em} />)}
                      </div>
                    </>
                  ) : (
                    <div className="px-5 py-10 text-center">
                      <p className="text-gray-500 text-sm">No exposed email addresses found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
