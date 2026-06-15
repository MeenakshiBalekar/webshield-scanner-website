import React, { useState, useEffect } from 'react'
import {
  BarChart2, Loader2, AlertCircle, ShieldCheck,
  TrendingUp, Clock, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
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

/* ── 12-week line chart ── */
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

const SEV_STYLES = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
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
              {/* Top row: score ring + 3 KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1 bg-white/3 border border-white/10 rounded-2xl p-5 flex items-center justify-center">
                  <ScoreRing score={score} grade={grade} />
                </div>
                {[
                  { label: 'Open Findings',  value: openFindings, icon: AlertTriangle, color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5' },
                  { label: 'Overdue',        value: overdue,      icon: Clock,        color: 'text-red-400',    border: 'border-red-500/20',    bg: 'bg-red-500/5' },
                  { label: 'MTTR (days)',    value: typeof mttr === 'number' ? mttr.toFixed(1) : mttr, icon: TrendingUp, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
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

              {/* 12-week score trend */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-crimson-400" />
                  <h2 className="text-sm font-bold text-white">12-Week Score Trend</h2>
                </div>
                <WeeklyChart data={trend} />
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
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
