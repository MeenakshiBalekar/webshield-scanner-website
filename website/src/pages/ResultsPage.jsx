import React, { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Shield, ArrowLeft, History, ChevronDown, ChevronUp,
  AlertTriangle, AlertCircle, Info, CheckCircle2, ExternalLink, Clock
} from 'lucide-react'
import { getScan } from '../services/api'

const POLL_MS = 3000
const RUNNING_STATUSES = ['pending', 'running', 'queued', 'processing', 'Pending', 'Running', 'Queued', 'Processing']

const severityConfig = {
  critical: { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: AlertCircle },
  high:     { label: 'HIGH',     color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle },
  medium:   { label: 'MEDIUM',   color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertTriangle },
  low:      { label: 'LOW',      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   icon: Info },
  info:     { label: 'INFO',     color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   icon: Info },
}

function normalizeSeverity(s = '') {
  return s.toLowerCase()
}

function SeverityBadge({ severity }) {
  const s = normalizeSeverity(severity)
  const cfg = severityConfig[s] || severityConfig.info
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
      {cfg.label}
    </span>
  )
}

function VulnRow({ vuln }) {
  const [open, setOpen] = useState(false)
  const s = normalizeSeverity(vuln.severity)
  const cfg = severityConfig[s] || severityConfig.info
  const Icon = cfg.icon

  return (
    <div className={`border ${cfg.border} rounded-xl overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors text-left"
      >
        <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
        <span className="flex-1 text-sm text-white font-medium truncate">{vuln.type || vuln.name || 'Vulnerability'}</span>
        <span className="text-xs text-gray-400 hidden sm:block truncate max-w-xs">{vuln.location || vuln.url || vuln.path || '—'}</span>
        <SeverityBadge severity={vuln.severity} />
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 py-4 border-t border-white/10 space-y-3 text-sm">
          {vuln.description && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Description</p>
              <p className="text-gray-200 leading-relaxed">{vuln.description}</p>
            </div>
          )}
          {vuln.location && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Location</p>
              <code className="text-crimson-400 font-mono text-xs">{vuln.location}</code>
            </div>
          )}
          {vuln.evidence && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Evidence</p>
              <pre className="bg-black/30 rounded-lg px-3 py-2 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">{vuln.evidence}</pre>
            </div>
          )}
          {vuln.recommendation && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-green-300 leading-relaxed">{vuln.recommendation}</p>
            </div>
          )}
          {vuln.cvssScore != null && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">CVSS Score</p>
              <span className="text-white font-bold">{vuln.cvssScore}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ScanningAnimation({ url }) {
  const steps = [
    'Crawling pages and discovering endpoints…',
    'Testing for SQL injection vulnerabilities…',
    'Scanning for XSS attack vectors…',
    'Checking OWASP Top 10 compliance…',
    'Analyzing authentication and session management…',
    'Testing API endpoints and parameters…',
    'Running advanced payload detection…',
    'Generating vulnerability report…',
  ]
  const [stepIdx, setStepIdx] = useState(0)
  const [progress, setProgress] = useState(5)

  useEffect(() => {
    const t = setInterval(() => {
      setStepIdx((i) => (i + 1) % steps.length)
      setProgress((p) => Math.min(p + Math.floor(Math.random() * 8 + 3), 92))
    }, 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center py-16 px-4 text-center max-w-xl mx-auto">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-crimson-500/20 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-crimson-500 border-r-crimson-500/50 border-b-transparent border-l-transparent absolute inset-0 animate-spin" />
          <Shield className="w-10 h-10 text-crimson-500" />
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">Scanning in Progress</h2>
      <p className="text-gray-400 text-sm mb-6 truncate max-w-md">{url}</p>

      <div className="w-full bg-white/10 rounded-full h-2 mb-3">
        <div
          className="h-full bg-gradient-to-r from-crimson-500 to-crimson-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between w-full text-xs text-gray-500 mb-6">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>

      <p className="text-sm text-crimson-400 animate-pulse min-h-[1.5rem]">{steps[stepIdx]}</p>
    </div>
  )
}

function SummaryCard({ label, count, color, bg, border }) {
  return (
    <div className={`flex flex-col items-center py-4 px-6 rounded-xl border ${border} ${bg}`}>
      <span className={`text-3xl font-extrabold ${color}`}>{count ?? 0}</span>
      <span className={`text-xs font-bold mt-1 ${color}`}>{label}</span>
    </div>
  )
}

export default function ResultsPage() {
  const { id } = useParams()
  const [scan, setScan] = useState(null)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const pollRef = useRef(null)

  const fetchScan = async () => {
    try {
      const data = await getScan(id)
      setScan(data)
      if (!RUNNING_STATUSES.includes(data.status)) {
        clearInterval(pollRef.current)
      }
    } catch (err) {
      setError(err.message)
      clearInterval(pollRef.current)
    }
  }

  useEffect(() => {
    fetchScan()
    pollRef.current = setInterval(fetchScan, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [id])

  const isRunning = scan && RUNNING_STATUSES.includes(scan.status)
  const vulns = scan?.vulnerabilities ?? []
  const summary = scan?.summary ?? {}

  const filtered = filter === 'all'
    ? vulns
    : vulns.filter((v) => normalizeSeverity(v.severity) === filter)

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString()
  }

  const duration = (scan?.startedAt && scan?.completedAt)
    ? Math.round((new Date(scan.completedAt) - new Date(scan.startedAt)) / 1000)
    : null

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/scanner" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            New Scan
          </Link>
          <Link to="/scanner/history" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <History className="w-4 h-4" />
            History
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!scan && !error && (
          <div className="flex items-center justify-center py-24">
            <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {scan && isRunning && (
          <ScanningAnimation url={scan.url || id} />
        )}

        {scan && !isRunning && scan.status?.toLowerCase() === 'failed' && (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Scan Failed</h2>
            <p className="text-gray-400 mb-6">{scan.error || 'An unexpected error occurred during the scan.'}</p>
            <Link to="/scanner" className="btn-primary inline-flex">Try Again</Link>
          </div>
        )}

        {scan && !isRunning && scan.status?.toLowerCase() !== 'failed' && (
          <>
            {/* Scan metadata */}
            <div className="mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2 flex-wrap">
                    <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                    Scan Complete
                  </h1>
                  <a
                    href={scan.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-crimson-400 hover:text-crimson-300 text-sm mt-1 transition-colors"
                  >
                    {scan.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                {duration != null && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    Completed in {duration}s
                  </div>
                )}
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                <SummaryCard label="CRITICAL" count={summary.critical} color="text-red-400"    bg="bg-red-500/5"    border="border-red-500/20" />
                <SummaryCard label="HIGH"     count={summary.high}     color="text-orange-400" bg="bg-orange-500/5" border="border-orange-500/20" />
                <SummaryCard label="MEDIUM"   count={summary.medium}   color="text-yellow-400" bg="bg-yellow-500/5" border="border-yellow-500/20" />
                <SummaryCard label="LOW"      count={summary.low}      color="text-blue-400"   bg="bg-blue-500/5"   border="border-blue-500/20" />
              </div>

              {/* Scan metadata strip */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-4 border-b border-white/10">
                <span>Started: {formatDate(scan.startedAt)}</span>
                {scan.completedAt && <span>Finished: {formatDate(scan.completedAt)}</span>}
                <span>Total findings: <span className="text-white font-semibold">{summary.total ?? vulns.length}</span></span>
              </div>
            </div>

            {/* Vulnerability list */}
            {vulns.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">No Vulnerabilities Found</h2>
                <p className="text-gray-400">Great news! The scan completed with no findings.</p>
              </div>
            ) : (
              <>
                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {['all', 'critical', 'high', 'medium', 'low'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-colors ${
                        filter === f
                          ? 'bg-crimson-500 text-white'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {f === 'all' ? `All (${vulns.length})` : `${f} (${vulns.filter(v => normalizeSeverity(v.severity) === f).length})`}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {filtered.map((v, i) => (
                    <VulnRow key={v.id ?? i} vuln={v} />
                  ))}
                  {filtered.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8">No {filter} severity findings.</p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
