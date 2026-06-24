import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import {
  Shield, ArrowLeft, History, ChevronDown, ChevronUp,
  AlertTriangle, AlertCircle, Info, CheckCircle2, ExternalLink,
  Plus, Loader2, ShieldCheck, Zap,
} from 'lucide-react'
import { getRiskHeatmap, getRemediation } from '../services/api'
import { getScanType } from '../config/scanTypes'
import Navbar from '../components/Navbar'

function extractJwtAlg(text) {
  if (!text || typeof text !== 'string') return null
  const m = text.match(/\b(HS|RS|ES|PS)(256|384|512)\b|none\b/i)
  return m ? m[0].toUpperCase() : null
}

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
  const colorMap = { A: 'text-green-400 border-green-500/40', B: 'text-blue-400 border-blue-500/40', C: 'text-yellow-400 border-yellow-500/40', D: 'text-orange-400 border-orange-500/40' }
  const cls = colorMap[grade] || 'text-red-400 border-red-500/40'
  return (
    <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-4 ${cls}`}>
      <span className={`text-3xl font-extrabold leading-none ${cls.split(' ')[0]}`}>{grade ?? '?'}</span>
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

function RemediationPanel({ checkName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRemediation(checkName)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [checkName])

  if (loading) return <div className="flex items-center gap-2 text-xs text-gray-400 py-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading remediation…</div>
  if (!data) return null

  return (
    <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl space-y-2 text-xs">
      <p className="text-green-400 font-semibold uppercase tracking-wider">Fix Guide</p>
      {data.description && <p className="text-gray-300">{data.description}</p>}
      {data.iISFix && (
        <div>
          <p className="text-gray-400 mb-1">IIS Fix:</p>
          <pre className="bg-black/30 rounded px-2 py-1.5 text-gray-300 overflow-x-auto whitespace-pre-wrap">{data.iISFix}</pre>
        </div>
      )}
      {data.webConfigFix && (
        <div>
          <p className="text-gray-400 mb-1">web.config:</p>
          <pre className="bg-black/30 rounded px-2 py-1.5 text-gray-300 overflow-x-auto whitespace-pre-wrap">{data.webConfigFix}</pre>
        </div>
      )}
      {data.powerShellFix && (
        <div>
          <p className="text-gray-400 mb-1">PowerShell:</p>
          <pre className="bg-black/30 rounded px-2 py-1.5 text-gray-300 overflow-x-auto whitespace-pre-wrap">{data.powerShellFix}</pre>
        </div>
      )}
      {data.businessImpact && <p className="text-orange-300 italic">{data.businessImpact}</p>}
    </div>
  )
}

function ResultRow({ result }) {
  const [open, setOpen] = useState(false)
  const cfg = getSeverityCfg(result.severity)
  const Icon = cfg.icon
  const isPassed = result.status === 'Passed'
  const isJwt   = result.checkName?.toLowerCase().includes('jwt')
  const isCsrf  = result.checkName?.toLowerCase().includes('csrf')
  const techDetails = result.technicalDetails ?? result.TechnicalDetails ?? result.details ?? ''
  const jwtAlg  = isJwt ? extractJwtAlg(techDetails) : null

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
        {isPassed
          ? <span className="inline-flex items-center text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">PASS</span>
          : <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>{(result.severity ?? 'Info').toUpperCase()}</span>
        }
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 py-4 border-t border-white/10 space-y-3 text-sm">
          {/* CSRF inline warning */}
          {isCsrf && !isPassed && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-300 rounded-lg px-3 py-2 text-xs font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Forms unprotected — CSRF tokens missing
            </div>
          )}
          {/* JWT algorithm */}
          {isJwt && (techDetails || jwtAlg) && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">JWT Algorithm</p>
              <div className="flex items-center gap-2">
                {jwtAlg && (
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded border ${
                    jwtAlg === 'NONE' || jwtAlg.startsWith('HS')
                      ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
                      : 'text-green-400 bg-green-500/10 border-green-500/30'
                  }`}>{jwtAlg}</span>
                )}
                {techDetails && <p className="text-gray-400 text-xs">{techDetails}</p>}
              </div>
            </div>
          )}
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
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Compliance</p>
              <p className="text-gray-400 text-xs">{result.complianceReference}</p>
            </div>
          )}
          {result.riskScore != null && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Risk Score</p>
              <span className="text-white font-bold">{result.riskScore}</span>
            </div>
          )}

          {/* CVE / CWE / CVSS chips */}
          {(result.cveId ?? result.CveId ?? result.cweId ?? result.CweId ?? result.cvssScore ?? result.CvssScore) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {(result.cveId ?? result.CveId) && (
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${result.cveId ?? result.CveId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 transition-colors"
                >
                  {result.cveId ?? result.CveId}
                </a>
              )}
              {(result.cweId ?? result.CweId) && (
                <a
                  href={`https://cwe.mitre.org/data/definitions/${(result.cweId ?? result.CweId).replace(/^CWE-/i,'')}.html`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-orange-500/10 text-orange-400 border-orange-500/30 hover:bg-orange-500/20 transition-colors"
                >
                  {result.cweId ?? result.CweId}
                </a>
              )}
              {(result.cvssScore ?? result.CvssScore) != null && (() => {
                const score = result.cvssScore ?? result.CvssScore
                const sev   = (result.cvssSeverity ?? result.CvssSeverity ?? '').toLowerCase()
                const cls   = sev === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/30'
                            : sev === 'high'     ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            : sev === 'medium'   ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                            :                     'bg-blue-500/10 text-blue-400 border-blue-500/30'
                return (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${cls}`}
                    title={result.cvssVector ?? result.CvssVector ?? ''}>
                    CVSS {Number(score).toFixed(1)}
                    {(result.cvssSeverity ?? result.CvssSeverity) && ` · ${result.cvssSeverity ?? result.CvssSeverity}`}
                  </span>
                )
              })()}
              {(result.cvssVector ?? result.CvssVector) && (
                <span className="text-[9px] font-mono text-gray-600 self-center truncate max-w-[240px]" title={result.cvssVector ?? result.CvssVector}>
                  {result.cvssVector ?? result.CvssVector}
                </span>
              )}
            </div>
          )}

          {!isPassed && <RemediationPanel checkName={result.checkName} />}
        </div>
      )}
    </div>
  )
}

function OWASPHeatmap({ url }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getRiskHeatmap(url)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [url])

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading OWASP heatmap…
    </div>
  )
  if (error) return <p className="text-red-400 text-sm py-4">Could not load heatmap: {error}</p>
  if (!data?.OWASP?.length) return <p className="text-gray-500 text-sm py-4">No OWASP data available.</p>

  return (
    <div className="space-y-3">
      {data.OWASP.map((item) => (
        <div key={item.category} className="bg-white/3 border border-white/10 rounded-xl px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-white truncate">{item.category}</span>
            <span className="text-xs font-bold text-crimson-400 ml-2 shrink-0">{item.issueCount} issue{item.issueCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 mb-2">
            <div
              className="h-full bg-gradient-to-r from-crimson-500 to-orange-400 rounded-full transition-all"
              style={{ width: `${Math.min((item.issueCount / (data.TopOWASP?.issueCount || 1)) * 100, 100)}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {item.checks?.map((c) => (
              <span key={c} className="text-[10px] text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">{c}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ResultsPage() {
  const { state } = useLocation()
  const scan = state?.scan
  const scanType = state?.scanType || 'vuln'
  const config = getScanType(scanType)

  const [tab, setTab] = useState('findings')
  const [filter, setFilter] = useState('all')

  if (!scan) {
    return (
      <div className="min-h-screen page-bg flex flex-col items-center justify-center gap-4">
        <Shield className="w-12 h-12 text-gray-600" />
        <p className="text-white font-semibold">No scan results found.</p>
        <Link to="/scanner" className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
          <Plus className="w-4 h-4" /> Start a Scan
        </Link>
      </div>
    )
  }

  const allResults = scan.results ?? []

  // Special result flags
  const wafActive  = allResults.some(r => r.checkName === 'WAF Protection' && r.status === 'Passed')
  const csrfFailed = allResults.some(r => r.checkName?.toLowerCase().includes('csrf') && r.status === 'Failed')
  const deepScan   = state?.deepScan ?? false

  // Apply product-type filter if applicable
  const typeFiltered = config.resultFilter
    ? allResults.filter(config.resultFilter)
    : allResults

  const failed = typeFiltered.filter((r) => r.status === 'Failed')
  const passed = typeFiltered.filter((r) => r.status === 'Passed')
  const countBySeverity = (sev) => failed.filter((r) => r.severity === sev).length

  const displayResults =
    filter === 'all'      ? typeFiltered :
    filter === 'failed'   ? failed :
    filter === 'passed'   ? passed :
    typeFiltered.filter((r) => r.severity === filter && r.status === 'Failed')

  const tabs = [
    { key: 'findings', label: 'Findings' },
    ...(config.showHeatmap ? [{ key: 'owasp', label: 'OWASP Heatmap' }] : []),
  ]

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-10">
        {/* Product badge + header */}
        <div className="flex flex-wrap items-start gap-6 mb-8">
          <GradeRing grade={scan.securityGrade} score={scan.securityScore} />
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border mb-2 ${config.badgeColor}`}>
              {config.badge}
            </span>
            <h1 className="text-xl font-bold text-white mb-1">Scan Complete</h1>
            <a href={scan.targetUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-crimson-400 hover:text-crimson-300 text-sm transition-colors">
              {scan.targetUrl} <ExternalLink className="w-3 h-3" />
            </a>
            {scan.rawServerHeader && <p className="text-xs text-gray-500 mt-1">Server: {scan.rawServerHeader}</p>}
            <div className="flex flex-wrap gap-2 mt-2">
              {wafActive && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" /> WAF Active
                </span>
              )}
              {deepScan && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-crimson-400 bg-crimson-500/10 border border-crimson-500/30 px-2.5 py-1 rounded-full">
                  <Zap className="w-3.5 h-3.5" /> Deep Scan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <SummaryCard label="CRITICAL" count={countBySeverity('Critical')} color="text-red-400"    bg="bg-red-500/5"    border="border-red-500/20" />
          <SummaryCard label="HIGH"     count={countBySeverity('High')}     color="text-orange-400" bg="bg-orange-500/5" border="border-orange-500/20" />
          <SummaryCard label="MEDIUM"   count={countBySeverity('Medium')}   color="text-yellow-400" bg="bg-yellow-500/5" border="border-yellow-500/20" />
          <SummaryCard label="LOW"      count={countBySeverity('Low')}      color="text-blue-400"   bg="bg-blue-500/5"   border="border-blue-500/20" />
        </div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 pb-4 border-b border-white/10 mb-6">
          <span>Showing <span className="text-white font-semibold">{typeFiltered.length}</span> of {allResults.length} checks</span>
          <span>Failed: <span className="text-red-400 font-semibold">{scan.failedChecks}</span></span>
          <span>Passed: <span className="text-green-400 font-semibold">{scan.passedChecks}</span></span>
          {scan.alertTriggered && <span className="text-orange-400 font-semibold">⚠ Alert email sent</span>}
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="flex gap-2 mb-6">
            {tabs.map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                  tab === key ? 'bg-crimson-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {tab === 'owasp' && (
          <OWASPHeatmap url={scan.targetUrl} />
        )}

        {tab === 'findings' && (
          <>
            {/* CSRF global warning */}
            {csrfFailed && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl px-4 py-3 text-sm mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><span className="font-semibold">Forms unprotected</span> — CSRF tokens are missing on one or more endpoints</span>
              </div>
            )}
            {/* Filter pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'all',      label: `All (${typeFiltered.length})` },
                { key: 'failed',   label: `Failed (${failed.length})` },
                { key: 'Critical', label: `Critical (${countBySeverity('Critical')})` },
                { key: 'High',     label: `High (${countBySeverity('High')})` },
                { key: 'passed',   label: `Passed (${passed.length})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setFilter(key)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    filter === key ? 'bg-crimson-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {displayResults.map((r, i) => <ResultRow key={i} result={r} />)}
              {displayResults.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">No results for this filter.</p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
