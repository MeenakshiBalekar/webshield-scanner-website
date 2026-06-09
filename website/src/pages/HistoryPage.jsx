import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Plus, AlertCircle, ChevronDown, ChevronUp, Search, X } from 'lucide-react'
import { getScans, getScanDetail } from '../services/api'
import Navbar from '../components/Navbar'

function ScoreRing({ score }) {
  const s = typeof score === 'number' ? score : 0
  const r = 20
  const circ = 2 * Math.PI * r
  const fill = circ * (s / 100)
  const color =
    s >= 90 ? '#4ade80' :
    s >= 75 ? '#60a5fa' :
    s >= 60 ? '#facc15' :
    s >= 40 ? '#fb923c' : '#f87171'

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0">
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
      <circle
        cx="26" cy="26" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{s}</text>
    </svg>
  )
}

function GradeBadge({ grade }) {
  const color =
    grade === 'A' ? 'text-green-400 bg-green-500/10 border-green-500/30' :
    grade === 'B' ? 'text-blue-400 bg-blue-500/10 border-blue-500/30' :
    grade === 'C' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' :
    grade === 'D' ? 'text-orange-400 bg-orange-500/10 border-orange-500/30' :
                    'text-red-400 bg-red-500/10 border-red-500/30'
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-extrabold ${color}`}>
      {grade ?? '?'}
    </span>
  )
}

function SeverityBadge({ severity }) {
  const s = (severity ?? '').toLowerCase()
  const color =
    s === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
    s === 'high'     ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
    s === 'medium'   ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    s === 'low'      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                       'bg-white/10 text-gray-400 border-white/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${color}`}>
      {severity || 'info'}
    </span>
  )
}

function StatusBadge({ passed }) {
  return passed
    ? <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold bg-green-500/10 text-green-400 border-green-500/30">Passed</span>
    : <span className="inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold bg-red-500/10 text-red-400 border-red-500/30">Failed</span>
}

function FindingRow({ finding }) {
  const name    = finding.checkName   ?? finding.CheckName   ?? finding.name   ?? finding.Name   ?? '—'
  const passed  = finding.passed      ?? finding.Passed      ?? false
  const sev     = finding.severity    ?? finding.Severity    ?? ''
  const detail  = finding.description ?? finding.Description ?? finding.details ?? finding.Details ?? ''
  const fix     = finding.remediation ?? finding.Remediation ?? ''

  return (
    <div className="flex flex-col gap-1 py-2.5 border-b border-white/5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge passed={passed} />
        <SeverityBadge severity={sev} />
        <span className="text-sm text-white font-medium">{name}</span>
      </div>
      {detail && <p className="text-xs text-gray-400 ml-0.5">{detail}</p>}
      {fix && <p className="text-xs text-emerald-400 ml-0.5">Fix: {fix}</p>}
    </div>
  )
}

function ScanRow({ scan, findingTab }) {
  const [open, setOpen]       = useState(false)
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState(null)

  const id       = scan.id        ?? scan.Id
  const url      = scan.targetUrl ?? scan.TargetUrl ?? scan.url ?? scan.Url ?? '—'
  const date     = scan.scanDate  ?? scan.ScanDate  ?? scan.createdAt ?? scan.CreatedAt
  const score    = scan.securityScore ?? scan.SecurityScore ?? 0
  const grade    = scan.securityGrade ?? scan.SecurityGrade ?? '?'
  const total    = scan.totalChecks   ?? scan.TotalChecks   ?? 0
  const failed   = scan.failedChecks  ?? scan.FailedChecks  ?? 0

  const handleToggle = useCallback(async () => {
    if (!open && !detail) {
      setLoading(true)
      setErr(null)
      try {
        const d = await getScanDetail(id)
        setDetail(d)
      } catch (e) {
        setErr(e.message)
      }
      setLoading(false)
    }
    setOpen((v) => !v)
  }, [open, detail, id])

  const findings = detail
    ? (detail.results ?? detail.Results ?? detail.findings ?? detail.Findings ?? [])
    : []

  const filtered = findingTab === 'failed'
    ? findings.filter((f) => !(f.passed ?? f.Passed ?? false))
    : findingTab === 'passed'
      ? findings.filter((f) => (f.passed ?? f.Passed ?? false))
      : findings

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="border-b border-white/5 last:border-b-0">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <ScoreRing score={score} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">{url}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDate(date)}</p>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <GradeBadge grade={grade} />
          <div className="text-xs text-gray-400 text-right">
            <span className="text-red-400 font-semibold">{failed}</span>
            <span className="text-gray-500"> / {total} failed</span>
          </div>
        </div>
        <button
          onClick={handleToggle}
          className="ml-2 flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          aria-label="Expand scan findings"
        >
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4">
          <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
            {loading && (
              <div className="flex justify-center py-6">
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
            {err && (
              <div className="flex items-center gap-2 text-red-400 text-sm py-3">
                <AlertCircle className="w-4 h-4" /> {err}
              </div>
            )}
            {!loading && !err && filtered.length === 0 && (
              <p className="text-gray-500 text-sm py-3 text-center">No findings to display.</p>
            )}
            {!loading && !err && filtered.map((f, i) => (
              <FindingRow key={f.id ?? f.Id ?? i} finding={f} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const GRADES = ['A', 'B', 'C', 'D', 'F']

export default function HistoryPage() {
  const [scans, setScans]         = useState(null)
  const [error, setError]         = useState(null)
  const [tab, setTab]             = useState('all')       // all | failed | passed
  const [search, setSearch]       = useState('')
  const [gradeFilter, setGradeFilter] = useState([])     // [] = all
  const [findingTab, setFindingTab]   = useState('all')  // all | failed | passed (per-row finding filter)

  useEffect(() => {
    getScans()
      .then((data) => setScans(Array.isArray(data) ? data : (data.scans ?? data.items ?? [])))
      .catch((err) => setError(err.message))
  }, [])

  const toggleGrade = (g) =>
    setGradeFilter((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g])

  const filtered = (scans ?? []).filter((scan) => {
    const url    = (scan.targetUrl ?? scan.TargetUrl ?? scan.url ?? '').toLowerCase()
    const grade  = scan.securityGrade ?? scan.SecurityGrade ?? ''
    const failed = scan.failedChecks  ?? scan.FailedChecks  ?? 0

    if (search && !url.includes(search.toLowerCase())) return false
    if (gradeFilter.length && !gradeFilter.includes(grade)) return false
    if (tab === 'failed' && failed === 0) return false
    if (tab === 'passed' && failed > 0)  return false
    return true
  })

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Scan History</h1>
          <Link
            to="/scanner"
            className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> New Scan
          </Link>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!scans && !error && (
          <div className="flex items-center justify-center py-24">
            <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {scans && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              {/* Tab pills */}
              <div className="flex rounded-xl overflow-hidden border border-white/10 self-start">
                {['all', 'failed', 'passed'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 text-sm font-semibold capitalize transition-colors ${
                      tab === t ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by URL…"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 pl-9 pr-8 py-2 rounded-xl text-sm outline-none focus:border-crimson-500 transition-colors"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Grade chips */}
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-xs text-gray-500 self-center mr-1">Grade:</span>
              {GRADES.map((g) => {
                const active = gradeFilter.includes(g)
                const color =
                  g === 'A' ? active ? 'bg-green-500 text-white border-green-500'  : 'text-green-400 border-green-500/30 hover:border-green-500/60' :
                  g === 'B' ? active ? 'bg-blue-500 text-white border-blue-500'    : 'text-blue-400 border-blue-500/30 hover:border-blue-500/60' :
                  g === 'C' ? active ? 'bg-yellow-500 text-white border-yellow-500': 'text-yellow-400 border-yellow-500/30 hover:border-yellow-500/60' :
                  g === 'D' ? active ? 'bg-orange-500 text-white border-orange-500': 'text-orange-400 border-orange-500/30 hover:border-orange-500/60' :
                              active ? 'bg-red-500 text-white border-red-500'      : 'text-red-400 border-red-500/30 hover:border-red-500/60'
                return (
                  <button
                    key={g}
                    onClick={() => toggleGrade(g)}
                    className={`w-8 h-8 rounded-lg border text-sm font-extrabold transition-colors ${color}`}
                  >
                    {g}
                  </button>
                )
              })}
              {gradeFilter.length > 0 && (
                <button onClick={() => setGradeFilter([])} className="text-xs text-gray-500 hover:text-gray-300 self-center ml-1">
                  Clear
                </button>
              )}
            </div>

            {/* Per-finding tab (shown when any row is expanded) */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-gray-500">Show findings:</span>
              {['all', 'failed', 'passed'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFindingTab(t)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-colors ${
                    findingTab === t ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-24">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                {scans.length === 0 ? (
                  <>
                    <h2 className="text-lg font-semibold text-white mb-2">No scans yet</h2>
                    <p className="text-gray-400 mb-6">Run your first scan to see results here.</p>
                    <Link
                      to="/scanner"
                      className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Go to Scanner Hub
                    </Link>
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-white mb-2">No matching scans</h2>
                    <p className="text-gray-400">Try adjusting your filters.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="border border-white/10 rounded-2xl overflow-hidden">
                {filtered.map((scan, i) => (
                  <ScanRow
                    key={scan.id ?? scan.Id ?? i}
                    scan={scan}
                    findingTab={findingTab}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
