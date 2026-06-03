import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Plus, AlertCircle, BarChart3, Target,
  Server, Calendar, TrendingUp, ArrowRight, AlertTriangle,
} from 'lucide-react'
import { getDashboard, getScans, getRemediations } from '../services/api'

const SVCVSS_BADGE = {
  critical: 'bg-red-700 text-white',
  high:     'bg-orange-600 text-white',
  medium:   'bg-yellow-600 text-black',
  low:      'bg-blue-600 text-white',
}
function sevBadge(s) {
  return SVCVSS_BADGE[(s ?? '').toLowerCase()] || 'bg-slate-600 text-white'
}

function OpenVulnsWidget() {
  const [findings, setFindings] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getScans(), getRemediations()])
      .then(([scansData, remList]) => {
        const scans = Array.isArray(scansData) ? scansData : scansData?.scans ?? scansData?.Scans ?? []
        const remMap = {}
        const remArr = Array.isArray(remList) ? remList : remList?.items ?? remList?.data ?? []
        for (const r of remArr) {
          const id = r.id ?? r.Id
          if (id) remMap[id] = r.cvssScore ?? r.CvssScore ?? r.cvss?.score ?? 0
        }
        // Collect all failed results across scans
        const rows = []
        const seenId = new Set()
        for (const scan of scans) {
          const results = scan.results ?? scan.Results ?? scan.checks ?? scan.Checks ?? scan.findings ?? []
          const assetUrl = scan.targetUrl ?? scan.TargetUrl ?? scan.url ?? scan.Url ?? ''
          for (const r of results) {
            const rid = r.remediationId ?? r.RemediationId ?? ''
            const status = (r.status ?? r.Status ?? '').toLowerCase()
            const failed = status === 'failed' || status === 'fail' || r.passed === false
            if (!failed || seenId.has(rid || r.checkName)) continue
            seenId.add(rid || r.checkName)
            const cvss = rid ? (remMap[rid] ?? 0) : 0
            rows.push({
              checkName:    r.checkName ?? r.CheckName ?? r.name ?? r.Name ?? '—',
              severity:     r.severity  ?? r.Severity  ?? '',
              remediationId: rid,
              cvss,
              assetUrl,
            })
          }
        }
        rows.sort((a, b) => b.cvss - a.cvss)
        setFindings(rows.slice(0, 5))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 animate-pulse h-48" />
  )
  if (findings.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Open Vulnerabilities</h2>
        <Link to="/remediation" className="text-xs text-crimson-400 hover:text-crimson-300 flex items-center gap-1">
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        {findings.map((f, i) => (
          <Link
            key={i}
            to={f.remediationId ? `/remediation?check=${encodeURIComponent(f.remediationId)}` : '/remediation'}
            className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
          >
            {f.severity && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${sevBadge(f.severity)}`}>
                {f.severity}
              </span>
            )}
            {f.cvss > 0 && (
              <span className={`text-sm font-extrabold shrink-0 w-8 text-right ${
                f.cvss >= 9 ? 'text-red-400' : f.cvss >= 7 ? 'text-orange-400' : f.cvss >= 4 ? 'text-yellow-400' : 'text-blue-400'
              }`}>{Number(f.cvss).toFixed(1)}</span>
            )}
            <p className="flex-1 text-sm text-white font-medium truncate">{f.checkName}</p>
            {f.assetUrl && <p className="text-xs text-gray-500 truncate max-w-[120px]">{f.assetUrl.replace(/https?:\/\//, '')}</p>}
            <ArrowRight className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function GradeBadge({ grade }) {
  const c = {
    A: 'text-green-400 bg-green-500/10 border-green-500/20',
    B: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    C: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    D: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  }
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-extrabold ${c[grade] || 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
      {grade ?? '?'}
    </span>
  )
}

function ScoreBar({ label, count, total, color }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-semibold ${color}`}>{label}</span>
        <span className="text-xs text-gray-400">{count ?? 0}</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color.replace('text-', 'bg-')}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const PRODUCTS = [
  { type: 'web',   label: 'Web Vuln',    color: 'border-blue-500/30 hover:border-blue-500/60' },
  { type: 'xss',   label: 'XSS',         color: 'border-orange-500/30 hover:border-orange-500/60' },
  { type: 'sqli',  label: 'SQLi',         color: 'border-red-500/30 hover:border-red-500/60' },
  { type: 'owasp', label: 'OWASP',        color: 'border-purple-500/30 hover:border-purple-500/60' },
  { type: 'api',   label: 'API Security', color: 'border-teal-500/30 hover:border-teal-500/60' },
]

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  const fmt = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

  const summary = data?.Summary ?? data?.summary ?? {}
  const dist    = data?.ScoreDistribution ?? data?.scoreDistribution ?? {}
  const recent  = data?.RecentScans ?? data?.recentScans ?? []
  const risky   = data?.TopRiskyAssets ?? data?.topRiskyAssets ?? []
  const trend   = data?.ScanTrend ?? data?.scanTrend ?? []

  const distTotal = (dist.Low ?? 0) + (dist.Medium ?? 0) + (dist.High ?? 0) + (dist.Critical ?? 0)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9 rounded-lg" />
          <span className="text-white font-bold text-xl tracking-tight">
            Udy◎<span className="text-crimson-500">360</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/schedule" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <Calendar className="w-4 h-4" /> Schedules
          </Link>
          <Link to="/products/web" className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Scan
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!data && !error && (
          <div className="flex justify-center py-20">
            <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {data && (
          <>
            {/* Summary stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard label="Total Scans"     value={summary.TotalScans ?? summary.totalScans}     icon={BarChart3}     color="bg-crimson-500" />
              <StatCard label="Avg Score"        value={summary.AverageScore ?? summary.averageScore} icon={TrendingUp}    color="bg-blue-600"    sub="/100" />
              <StatCard label="Assets"           value={summary.AssetsMonitored ?? summary.assetsMonitored} icon={Server}  color="bg-indigo-600" />
              <StatCard label="Scheduled Scans"  value={summary.ScheduledScans ?? summary.scheduledScans}  icon={Calendar} color="bg-purple-600" />
              <StatCard label="Critical Assets"  value={summary.CriticalAssets ?? summary.criticalAssets}  icon={AlertTriangle} color="bg-orange-600" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-8">
              {/* Recent scans */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Recent Scans</h2>
                  <Link to="/scanner/history" className="text-xs text-crimson-400 hover:text-crimson-300 flex items-center gap-1">
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="border border-white/10 rounded-2xl overflow-hidden">
                  {recent.length === 0 && <p className="text-gray-500 text-sm text-center py-10">No scans yet.</p>}
                  {recent.map((s, i) => {
                    const grade = s.SecurityGrade ?? s.securityGrade ?? s.Grade ?? s.grade
                    const url   = s.TargetUrl ?? s.targetUrl ?? s.Url ?? s.url
                    const date  = s.ScanDate ?? s.scanDate ?? s.Date ?? s.date
                    const score = s.SecurityScore ?? s.securityScore ?? s.Score ?? s.score
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
                        <GradeBadge grade={grade} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{url}</p>
                          <p className="text-xs text-gray-500">{fmt(date)}</p>
                        </div>
                        <span className="text-xs text-gray-400 font-semibold shrink-0">{score}/100</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Score Distribution */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Score Distribution</h2>
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
                  <ScoreBar label="Critical" count={dist.Critical ?? dist.critical ?? 0} total={distTotal} color="text-red-400" />
                  <ScoreBar label="High"     count={dist.High ?? dist.high ?? 0}         total={distTotal} color="text-orange-400" />
                  <ScoreBar label="Medium"   count={dist.Medium ?? dist.medium ?? 0}     total={distTotal} color="text-yellow-400" />
                  <ScoreBar label="Low"      count={dist.Low ?? dist.low ?? 0}           total={distTotal} color="text-green-400" />
                </div>

                {/* Top risky assets */}
                {risky.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Target className="w-4 h-4 text-crimson-400" /> Riskiest Assets
                    </h2>
                    <div className="space-y-2">
                      {risky.map((a, i) => {
                        const url   = a.Url ?? a.url ?? a.TargetUrl ?? a.targetUrl
                        const score = a.SecurityScore ?? a.securityScore ?? a.Score ?? a.score
                        const grade = a.SecurityGrade ?? a.securityGrade ?? a.Grade ?? a.grade
                        return (
                          <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-3 py-2.5">
                            <GradeBadge grade={grade} />
                            <p className="flex-1 text-xs text-white truncate">{url}</p>
                            <span className="text-xs text-red-400 font-bold shrink-0">{score}/100</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scan trend */}
            {trend.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">7-Day Scan Trend</h2>
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-end gap-2 h-24">
                    {trend.map((t, i) => {
                      const count    = t.ScanCount ?? t.scanCount ?? t.Count ?? t.count ?? 0
                      const avgScore = t.AvgScore ?? t.avgScore ?? 0
                      const maxCount = Math.max(...trend.map((x) => x.ScanCount ?? x.scanCount ?? x.Count ?? x.count ?? 0), 1)
                      const heightPct = Math.max((count / maxCount) * 100, 4)
                      const date = t.Date ?? t.date ?? ''
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${count} scans · avg ${avgScore}/100`}>
                          <div
                            className="w-full rounded-t-md bg-crimson-500/70 hover:bg-crimson-500 transition-colors"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-[10px] text-gray-500">
                            {date ? new Date(date).toLocaleDateString('en', { weekday: 'short' }) : i}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Open Vulnerabilities widget */}
            <OpenVulnsWidget />

            {/* Launch scanners */}
            <div>
              <h2 className="text-lg font-bold text-white mb-4">Launch a Scanner</h2>
              <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {PRODUCTS.map(({ type, label, color }) => (
                  <Link
                    key={type}
                    to={`/products/${type}`}
                    className={`flex items-center justify-center gap-2 bg-white/3 border ${color} rounded-xl py-3 text-sm font-semibold text-white transition-colors`}
                  >
                    <Plus className="w-4 h-4" /> {label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
