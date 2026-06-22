import React, { useState, useEffect } from 'react'
import {
  BarChart2, Loader2, AlertCircle, ShieldCheck,
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { getExecutiveDashboard } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

/* ── Score ring ── */
function ScoreRing({ score, grade }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const pct  = Math.min(100, Math.max(0, score ?? 0))
  const dash = (pct / 100) * circ
  const gradeColor = grade === 'A' ? '#22c55e' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#eab308' : grade === 'D' ? '#f97316' : '#ef4444'

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={gradeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
        <text x="64" y="58" textAnchor="middle" fill="white" fontSize="26" fontWeight="800">{grade ?? '?'}</text>
        <text x="64" y="76" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="13">{pct}/100</text>
      </svg>
      <p className="text-xs text-gray-500 mt-1">Overall Security Score</p>
    </div>
  )
}

/* ── 30-day line chart (formerly 12-week) ── */
function WeeklyChart({ data }) {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-36 text-sm text-gray-600">No trend data available</div>
  )
  const W = 560, H = 140
  const pad = { t: 12, r: 12, b: 28, l: 36 }
  const cw  = W - pad.l - pad.r
  const ch  = H - pad.t - pad.b
  const n   = data.length

  const vals = data.map(d => field(d, 'avgScore', 'AvgScore', 'score', 'Score') ?? 0)
  const minV = Math.max(0, Math.min(...vals) - 5)
  const maxV = Math.min(100, Math.max(...vals) + 5)

  const xOf = (i) => pad.l + (n === 1 ? cw / 2 : (i / (n - 1)) * cw)
  const yOf = (v) => pad.t + ch - ((v - minV) / (maxV - minV || 1)) * ch

  const linePath = vals.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(v)}`).join(' ')
  const areaPath = `${linePath} L${xOf(n - 1)},${H - pad.b} L${xOf(0)},${H - pad.b} Z`
  const gridVals = [0, 25, 50, 75, 100].filter(v => v >= minV - 10 && v <= maxV + 10)
  const labels   = data.map(d => field(d, 'label', 'Label', 'week', 'Week') ?? '')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E31837" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#E31837" stopOpacity="0" />
        </linearGradient>
      </defs>
      {gridVals.map(v => (
        <g key={v}>
          <line x1={pad.l} y1={yOf(v)} x2={W - pad.r} y2={yOf(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={pad.l - 6} y={yOf(v) + 4} textAnchor="end" fill="rgba(255,255,255,0.28)" fontSize="9">{v}</text>
        </g>
      ))}
      <path d={areaPath} fill="url(#chartFill)" />
      <path d={linePath} fill="none" stroke="#E31837" strokeWidth="2" strokeLinejoin="round" />
      {vals.map((v, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3" fill="#E31837" />
      ))}
      {labels.map((lbl, i) => (
        <text key={i} x={xOf(i)} y={H - 6} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="9">{lbl}</text>
      ))}
    </svg>
  )
}

/* ── Compliance bar ── */
function ComplianceBar({ pct }) {
  const p = Math.min(100, Math.max(0, pct ?? 0))
  const color = p >= 80 ? 'bg-green-500' : p >= 60 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-white">Compliance Coverage</p>
        <span className={`text-sm font-extrabold ${p >= 80 ? 'text-green-400' : p >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{p}%</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${p}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
        <span>0%</span><span>Target: 80%</span><span>100%</span>
      </div>
    </div>
  )
}

/* ── OWASP Coverage Donut ── */
function OWASPDonut({ categories }) {
  const total  = Array.isArray(categories) ? categories.length : 0
  const passed = Array.isArray(categories) ? categories.filter(c => c.passed).length : 0
  const pct    = total > 0 ? Math.round((passed / total) * 100) : 0

  const r   = 48
  const sw  = 12
  const circ = 2 * Math.PI * r
  const greenDash = (pct / 100) * circ
  const redDash   = circ - greenDash

  if (!total) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-4">
        {/* Placeholder donut */}
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
          <text x="70" y="74" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="13">No data</text>
        </svg>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Covered</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Gaps</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="140" height="140" viewBox="0 0 140 140">
        {/* Background ring */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} />
        {/* Red (gap) ring — drawn first as full circle */}
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke="#ef4444"
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${redDash} ${circ}`}
          strokeDashoffset={-(greenDash - circ / 4)}
        />
        {/* Green (passed) ring */}
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth={sw}
          strokeLinecap="butt"
          strokeDasharray={`${greenDash} ${circ}`}
          strokeDashoffset={circ / 4}
        />
        <text x="70" y="64" textAnchor="middle" fill="white" fontSize="22" fontWeight="800">{pct}%</text>
        <text x="70" y="80" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">{passed}/{total}</text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Covered</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Gaps</span>
      </div>

      {/* Categories grid — up to 10 */}
      {Array.isArray(categories) && categories.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full mt-1">
          {categories.slice(0, 10).map((cat, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <span className={cat.passed ? 'text-green-400' : 'text-red-400'}>{cat.passed ? '✓' : '✗'}</span>
              <span className="text-gray-300 truncate" title={cat.name}>{cat.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const SEV_STYLES = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
}

/* ── Relative time helper ── */
function relativeTime(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)  return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function ExecutiveDashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    getExecutiveDashboard()
      .then(setData)
      .catch(e => setError(e.message || 'Failed to load executive dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const score        = field(data, 'overallScore', 'OverallScore', 'score', 'Score') ?? 0
  const grade        = field(data, 'grade', 'Grade') ?? '?'
  const openFindings = field(data, 'openFindings', 'OpenFindings', 'openCount', 'OpenCount') ?? 0
  const overdue      = field(data, 'overdueCount', 'OverdueCount', 'overdue', 'Overdue') ?? 0
  const mttr         = field(data, 'mttrDays', 'MttrDays', 'mttr', 'Mttr') ?? 0
  const pctPassing   = field(data, 'percentPassing', 'PercentPassing', 'compliance', 'Compliance') ?? 0
  const topThreats   = field(data, 'topThreats', 'TopThreats', 'threats', 'Threats') ?? []
  const trend        = field(data, 'scoreTrend12Weeks', 'ScoreTrend12Weeks', 'trend', 'Trend') ?? []

  const kevCount        = field(data, 'kevCount', 'KevCount', 'activelyExploited', 'ActivelyExploited') ?? 0
  const criticalIssues  = field(data, 'criticalIssues', 'CriticalIssues', 'openCritical', 'OpenCritical') ?? []
  const owaspCategories = field(data, 'owaspCategories', 'OwaspCategories', 'owasp', 'Owasp') ?? []
  const velocity        = field(data, 'remediationVelocity', 'RemediationVelocity', 'fixesPerWeek', 'FixesPerWeek') ?? null
  const velocityTrend   = field(data, 'velocityTrend', 'VelocityTrend') ?? []

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-crimson-500/15 border border-crimson-500/30 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-4 h-4 text-crimson-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-crimson-400">Executive Dashboard</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Security Posture Overview</h1>
            <p className="text-gray-400">CISO-level view of risk, compliance, and remediation progress.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
          <PageGuide id="executive-dashboard" text="High-level security overview designed for leadership and board reporting. Shows your overall security score trend, compliance posture across SOC 2/ISO 27001/PCI-DSS, open critical findings count, and mean time to remediate. Data is automatically sourced from your scan history — no configuration needed." />

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-16 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading dashboard…
            </div>
          ) : (
            <>
              {/* Top row: score ring + 4 KPI cards (5 cols total) */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="sm:col-span-1 bg-white/3 border border-white/10 rounded-2xl p-5 flex items-center justify-center">
                  <ScoreRing score={score} grade={grade} />
                </div>
                {[
                  { label: 'Open Findings',  value: openFindings, icon: AlertTriangle, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' },
                  { label: 'Overdue',        value: overdue,      icon: Clock,        color: 'text-red-400',    border: 'border-red-500/20',    bg: 'bg-red-500/5' },
                  { label: 'MTTR (days)',    value: typeof mttr === 'number' ? mttr.toFixed(1) : mttr, icon: TrendingUp, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
                  { label: 'KEV Findings',   value: kevCount,     icon: AlertTriangle, color: 'text-red-400',   border: 'border-red-500/20',    bg: 'bg-red-500/5' },
                ].map(({ label, value, icon: Icon, color, border, bg }) => (
                  <div key={label} className={`bg-white/3 border ${border} ${bg} rounded-2xl p-5 flex flex-col items-center justify-center text-center`}>
                    <Icon className={`w-5 h-5 ${color} mb-2`} />
                    <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                    <p className="text-xs text-gray-500 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Compliance bar */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <ComplianceBar pct={pctPassing} />
              </div>

              {/* 30-Day Risk Score Trend */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-crimson-400" />
                  <h2 className="text-sm font-bold text-white">30-Day Risk Score Trend</h2>
                </div>
                <WeeklyChart data={trend} />
              </div>

              {/* OWASP Coverage */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <ShieldCheck className="w-4 h-4 text-crimson-400" />
                  <h2 className="text-sm font-bold text-white">OWASP Top 10 Coverage</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  <div className="flex justify-center">
                    <OWASPDonut categories={owaspCategories} />
                  </div>
                  {owaspCategories.length > 0 && (
                    <div className="space-y-1.5">
                      {owaspCategories.slice(0, 10).map((cat, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={`shrink-0 font-bold ${cat.passed ? 'text-green-400' : 'text-red-400'}`}>
                            {cat.passed ? '✓' : '✗'}
                          </span>
                          <span className="text-gray-300 truncate">{cat.name}</span>
                          <span className={`ml-auto shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            cat.passed ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                          }`}>
                            {cat.passed ? 'Pass' : 'Fail'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {owaspCategories.length === 0 && (
                    <div className="flex items-center justify-center text-gray-600 text-sm">
                      No OWASP data available
                    </div>
                  )}
                </div>
              </div>

              {/* Top threats table */}
              {topThreats.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <h2 className="text-sm font-bold text-white">Top Threats</h2>
                  </div>
                  <div className="divide-y divide-white/5">
                    <div className="grid grid-cols-12 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      <span className="col-span-6">Check</span>
                      <span className="col-span-3 text-center">Affected</span>
                      <span className="col-span-3 text-right">Severity</span>
                    </div>
                    {topThreats.map((t, i) => {
                      const name = field(t, 'checkName', 'CheckName', 'name', 'Name') ?? `Threat ${i + 1}`
                      const cnt  = field(t, 'affectedCount', 'AffectedCount', 'count', 'Count') ?? 0
                      const sev  = field(t, 'severity', 'Severity') ?? 'Info'
                      return (
                        <div key={i} className="grid grid-cols-12 px-5 py-3 hover:bg-white/3 transition-colors items-center">
                          <span className="col-span-6 text-sm text-white font-medium truncate">{name}</span>
                          <span className="col-span-3 text-center text-sm font-bold text-crimson-400">{cnt}</span>
                          <span className="col-span-3 flex justify-end">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${SEV_STYLES[sev] ?? SEV_STYLES.Low}`}>
                              {sev}
                            </span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Empty threat state */}
              {!loading && topThreats.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-8 text-center bg-white/3 border border-white/10 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                  <p className="text-white font-semibold text-sm">No top threats identified</p>
                </div>
              )}

              {/* Top 5 Open Critical Issues */}
              <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-bold text-white">🔴 Top 5 Open Critical Issues</h2>
                </div>
                {Array.isArray(criticalIssues) && criticalIssues.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-8 text-center">
                    <CheckCircle2 className="w-7 h-7 text-green-400" />
                    <p className="text-green-400 font-semibold text-sm">No open critical issues</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {(Array.isArray(criticalIssues) ? criticalIssues : []).slice(0, 5).map((issue, i) => {
                      const checkName  = field(issue, 'checkName', 'CheckName', 'name', 'Name') ?? 'Unknown'
                      const severity   = field(issue, 'severity', 'Severity') ?? 'Critical'
                      const affUrl     = field(issue, 'affectedUrl', 'AffectedUrl', 'url', 'Url') ?? ''
                      const firstSeen  = field(issue, 'firstSeen', 'FirstSeen', 'createdAt', 'CreatedAt') ?? null
                      const rel        = relativeTime(firstSeen)
                      return (
                        <div key={i} className="px-5 py-3 flex items-center gap-3">
                          <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${SEV_STYLES[severity] ?? SEV_STYLES.Critical}`}>
                            {severity}
                          </span>
                          <span className="text-sm text-white font-medium flex-1 min-w-0 truncate">{checkName}</span>
                          {affUrl && (
                            <span className="text-xs text-gray-500 font-mono truncate max-w-[160px] hidden sm:block">{affUrl}</span>
                          )}
                          {rel && (
                            <span className="text-xs text-gray-600 shrink-0 whitespace-nowrap">{rel}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Remediation Velocity */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-bold text-white">Remediation Velocity</h2>
                </div>

                {velocity == null && velocityTrend.length === 0 ? (
                  <p className="text-sm text-gray-500">Velocity data will appear after multiple scans.</p>
                ) : (
                  <div className="space-y-4">
                    {/* KPI */}
                    {velocity != null && (
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3 text-center">
                          <p className="text-2xl font-extrabold text-emerald-400">{typeof velocity === 'number' ? velocity.toFixed(1) : velocity}</p>
                          <p className="text-xs text-gray-500 mt-1">Fixes / Week</p>
                        </div>
                      </div>
                    )}

                    {/* Inline bar chart — last 6 weeks */}
                    {velocityTrend.length > 0 && (() => {
                      const bars   = velocityTrend.slice(-6)
                      const maxVal = Math.max(...bars.map(b => (typeof b === 'number' ? b : (b.value ?? b.Value ?? 0))), 1)
                      const BAR_H  = 12
                      const BAR_W  = 200
                      const GAP    = 2
                      const total  = bars.length * (BAR_H + GAP) - GAP
                      return (
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Last {bars.length} periods</p>
                          <svg width={BAR_W} height={total} viewBox={`0 0 ${BAR_W} ${total}`}>
                            {bars.map((b, i) => {
                              const val = typeof b === 'number' ? b : (b.value ?? b.Value ?? 0)
                              const w   = Math.max(2, (val / maxVal) * BAR_W)
                              return (
                                <rect
                                  key={i}
                                  x={0}
                                  y={i * (BAR_H + GAP)}
                                  width={w}
                                  height={BAR_H}
                                  rx={3}
                                  fill="#10b981"
                                />
                              )
                            })}
                          </svg>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
