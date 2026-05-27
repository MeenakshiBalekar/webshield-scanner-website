import React, { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Shield, ArrowLeft, History, ChevronDown, ChevronUp,
  AlertTriangle, AlertCircle, Info, CheckCircle2, ExternalLink, Plus
} from 'lucide-react'

const severityConfig = {
  Critical: { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30',    icon: AlertCircle },
  High:     { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: AlertTriangle },
  Medium:   { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertTriangle },
  Low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   icon: Info },
  Info:     { color: 'text-gray-400',   bg: 'bg-gray-500/10',   border: 'border-gray-500/30',   icon: Info },
}

function getSeverityCfg(severity) {
  return severityConfig[severity] || severityConfig.Info
}

function GradeRing({ grade, score }) {
  const color =
    grade === 'A' ? 'text-green-400' :
    grade === 'B' ? 'text-blue-400' :
    grade === 'C' ? 'text-yellow-400' :
    grade === 'D' ? 'text-orange-400' : 'text-red-400'

  return (
    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${
      grade === 'A' ? 'border-green-500/40' :
      grade === 'B' ? 'border-blue-500/40' :
      grade === 'C' ? 'border-yellow-500/40' :
      grade === 'D' ? 'border-orange-500/40' : 'border-red-500/40'
    }`}>
      <span className={`text-3xl font-extrabold leading-none ${color}`}>{grade ?? '?'}</span>
      <span className="text-xs text-gray-500 mt-0.5">{score}/100</span>
    </div>
  )
}

function SummaryCard({ label, count, color, bg, border }) {
  return (
    <div className={`flex flex-col items-center py-4 px-4 rounded-xl border ${border} ${bg}`}>
      <span className={`text-3xl font-extrabold ${color}`}>{count ?? 0}</span>
      <span className={`text-xs font-bold mt-1 ${color}`}>{label}</span>
    </div>
  )
}

function ResultRow({ result }) {
  const [open, setOpen] = useState(false)
  const cfg = getSeverityCfg(result.severity)
  const Icon = cfg.icon
  const isPassed = result.status === 'Passed'

  return (
    <div className={`border rounded-xl overflow-hidden ${isPassed ? 'border-white/5' : cfg.border}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors text-left"
      >
        {isPassed
          ? <CheckCircle2 className="w-4 h-4 shrink-0 text-green-400" />
          : <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
        }
        <span className="flex-1 text-sm text-white font-medium truncate">{result.checkName}</span>
        <span className="hidden sm:block text-xs text-gray-500 truncate max-w-xs">{result.category}</span>
        {isPassed ? (
          <span className="inline-flex items-center text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">PASS</span>
        ) : (
          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
            {(result.severity ?? 'Info').toUpperCase()}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 py-4 border-t border-white/10 space-y-3 text-sm">
          {result.owaspCategory && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">OWASP Category</p>
              <p className="text-purple-300 text-xs">{result.owaspCategory}</p>
            </div>
          )}
          {result.recommendation && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-green-300 leading-relaxed">{result.recommendation}</p>
            </div>
          )}
          {result.evidence && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Evidence</p>
              <pre className="bg-black/30 rounded-lg px-3 py-2 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">{result.evidence}</pre>
            </div>
          )}
          {result.complianceReference && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Compliance Reference</p>
              <p className="text-gray-400 text-xs">{result.complianceReference}</p>
            </div>
          )}
          {result.riskScore != null && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Risk Score</p>
              <span className="text-white font-bold">{result.riskScore}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ResultsPage() {
  const { state } = useLocation()
  const scan = state?.scan
  const [filter, setFilter] = useState('all')

  if (!scan) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center gap-4">
        <Shield className="w-12 h-12 text-gray-600" />
        <p className="text-white font-semibold">No scan results found.</p>
        <Link
          to="/scanner"
          className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" /> Start a Scan
        </Link>
      </div>
    )
  }

  const results = scan.results ?? []
  const failed = results.filter(r => r.status === 'Failed')
  const passed = results.filter(r => r.status === 'Passed')

  const countBySeverity = (sev) => failed.filter(r => r.severity === sev).length

  const filteredResults =
    filter === 'all'    ? results :
    filter === 'failed' ? failed :
    filter === 'passed' ? passed :
    results.filter(r => r.severity === filter && r.status === 'Failed')

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
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
            <ArrowLeft className="w-4 h-4" /> New Scan
          </Link>
          <Link to="/scanner/history" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <History className="w-4 h-4" /> History
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-start gap-6 mb-8">
          <GradeRing grade={scan.securityGrade} score={scan.securityScore} />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white mb-1">Scan Complete</h1>
            <a
              href={scan.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-crimson-400 hover:text-crimson-300 text-sm transition-colors"
            >
              {scan.targetUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
            {scan.rawServerHeader && (
              <p className="text-xs text-gray-500 mt-1">Server: {scan.rawServerHeader}</p>
            )}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <SummaryCard label="CRITICAL" count={countBySeverity('Critical')} color="text-red-400"    bg="bg-red-500/5"    border="border-red-500/20" />
          <SummaryCard label="HIGH"     count={countBySeverity('High')}     color="text-orange-400" bg="bg-orange-500/5" border="border-orange-500/20" />
          <SummaryCard label="MEDIUM"   count={countBySeverity('Medium')}   color="text-yellow-400" bg="bg-yellow-500/5" border="border-yellow-500/20" />
          <SummaryCard label="LOW"      count={countBySeverity('Low')}      color="text-blue-400"   bg="bg-blue-500/5"   border="border-blue-500/20" />
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-4 border-b border-white/10 mb-6">
          <span>Total checks: <span className="text-white font-semibold">{scan.totalChecks}</span></span>
          <span>Failed: <span className="text-red-400 font-semibold">{scan.failedChecks}</span></span>
          <span>Passed: <span className="text-green-400 font-semibold">{scan.passedChecks}</span></span>
          {scan.httpStatus && <span>HTTP Status: <span className="text-white font-semibold">{scan.httpStatus}</span></span>}
          {scan.alertTriggered && (
            <span className="text-orange-400 font-semibold">⚠ Alert email sent</span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { key: 'all',      label: `All (${results.length})` },
            { key: 'failed',   label: `Failed (${failed.length})` },
            { key: 'Critical', label: `Critical (${countBySeverity('Critical')})` },
            { key: 'High',     label: `High (${countBySeverity('High')})` },
            { key: 'passed',   label: `Passed (${passed.length})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                filter === key
                  ? 'bg-crimson-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Results list */}
        <div className="space-y-2">
          {filteredResults.map((r, i) => (
            <ResultRow key={i} result={r} />
          ))}
          {filteredResults.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No results for this filter.</p>
          )}
        </div>
      </main>
    </div>
  )
}
