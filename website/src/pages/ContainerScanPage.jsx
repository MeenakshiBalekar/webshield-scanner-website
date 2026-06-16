import React, { useState, useEffect } from 'react'
import {
  Container, ScanLine, Loader2, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, Link2, FileText, Trash2,
  Package, Download, History, Image, AlertTriangle, Server,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { startContainerScan, scanContainerImage, getImageScanHistory } from '../services/api'

const SEVERITY_STYLES = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         dot: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       dot: 'bg-blue-400'   },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       dot: 'bg-gray-400'   },
}
const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }
const sevStyle = (s) => SEVERITY_STYLES[s] || SEVERITY_STYLES.Info
const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 }

/* ── Dockerfile scan row ── */
function FindingRow({ finding }) {
  const [open, setOpen] = useState(false)
  const checkName  = field(finding, 'checkName', 'CheckName', 'name', 'Name', 'type', 'Type')
  const severity   = field(finding, 'severity', 'Severity')
  const details    = field(finding, 'technicalDetails', 'TechnicalDetails', 'description', 'Description', 'details', 'Details')
  const rec        = field(finding, 'recommendation', 'Recommendation', 'fix', 'Fix')
  const compliance = field(finding, 'complianceReference', 'ComplianceReference', 'compliance', 'Compliance')
  const cveId      = field(finding, 'cveId', 'CveId')
  const cvssScore  = field(finding, 'cvssScore', 'CvssScore')
  const line       = field(finding, 'line', 'Line', 'lineNumber', 'LineNumber')
  const style      = sevStyle(severity)

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{checkName}</p>
          {line && <p className="text-[10px] text-gray-500 font-mono">Line {line}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cveId && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30">{cveId}</span>}
          {cvssScore && <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">CVSS {cvssScore}</span>}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>{severity || 'Info'}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          {details    && <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Details</p><p className="text-sm text-gray-300">{details}</p></div>}
          {rec        && <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Recommendation</p><p className="text-sm text-gray-300">{rec}</p></div>}
          {compliance && <div><p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Compliance Reference</p><p className="text-xs text-gray-400 font-mono">{compliance}</p></div>}
        </div>
      )}
    </div>
  )
}

const EXAMPLE_DOCKERFILE = `FROM ubuntu:latest

ENV DB_PASSWORD=supersecret123
ENV API_KEY=abc123xyz

RUN apt-get update && curl -sSL https://install.example.com | bash

USER root

COPY . /app
WORKDIR /app

RUN npm install
`

/* ── Dockerfile scan tab ── */
function DockerfileTab() {
  const [mode, setMode]       = useState('paste')
  const [content, setContent] = useState('')
  const [url, setUrl]         = useState('')
  const [scanning, setScanning] = useState(false)
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState(null)
  const [sevFilter, setSevFilter] = useState('')
  const [showPassed, setShowPassed] = useState(false)

  const handleScan = async (e) => {
    e.preventDefault()
    const payload = mode === 'paste' ? { content: content.trim() } : { url: url.trim() }
    if (mode === 'paste' && !content.trim()) { setError('Paste a Dockerfile first.'); return }
    if (mode === 'url'   && !url.trim())     { setError('Enter a Dockerfile URL first.'); return }
    setScanning(true); setError(null); setResults(null)
    try {
      setResults(await startContainerScan(payload))
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const handleClear = () => { setContent(''); setUrl(''); setResults(null); setError(null); setSevFilter('') }

  const summary    = results?.summary ?? results?.Summary ?? {}
  const allFindings = results?.findings ?? results?.Findings ?? []
  const issueFindings = allFindings.filter(f => {
    const sev = field(f, 'severity', 'Severity')
    return sev && sev !== 'Pass' && field(f, 'status', 'Status') !== 'pass'
  })
  const passedFindings = allFindings.filter(f => {
    const sev = field(f, 'severity', 'Severity')
    return !sev || sev === 'Pass' || field(f, 'status', 'Status') === 'pass'
  })
  const displayFindings = issueFindings.length > 0 ? issueFindings : allFindings
  const severities = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const counts = severities.reduce((acc, s) => {
    acc[s] = displayFindings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === s).length
    return acc
  }, {})
  const filtered = sevFilter
    ? displayFindings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === sevFilter)
    : displayFindings

  const summaryTotal    = summary.total    ?? summary.Total    ?? allFindings.length
  const summaryCritical = summary.critical ?? summary.Critical ?? counts.Critical
  const summaryHigh     = summary.high     ?? summary.High     ?? counts.High
  const summaryMedium   = summary.medium   ?? summary.Medium   ?? counts.Medium
  const summaryLow      = summary.low      ?? summary.Low      ?? counts.Low

  return (
    <div className="space-y-6">
      <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 self-start w-fit">
          {[
            { val: 'paste', icon: FileText, label: 'Paste Content' },
            { val: 'url',   icon: Link2,    label: 'URL' },
          ].map(({ val, icon: Icon, label }) => (
            <button key={val} type="button" onClick={() => { setMode(val); setError(null) }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === val ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {mode === 'paste' ? (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-gray-400">Dockerfile Content</label>
              {!content && (
                <button type="button" onClick={() => setContent(EXAMPLE_DOCKERFILE)}
                  className="text-[10px] text-crimson-400 hover:text-crimson-300 transition-colors">
                  Load example
                </button>
              )}
            </div>
            <textarea rows={14} value={content} onChange={e => setContent(e.target.value)}
              placeholder={`FROM node:latest\n\nENV SECRET_KEY=abc123\n\nUSER root\n...`}
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm outline-none transition-colors resize-y font-mono leading-relaxed" />
          </div>
        ) : (
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Dockerfile URL</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://raw.githubusercontent.com/org/repo/main/Dockerfile"
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono" />
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={scanning}
            className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {scanning ? 'Scanning…' : 'Scan Dockerfile'}
          </button>
          {(content || url) && !scanning && (
            <button type="button" onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </form>

      {results && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[72px]">
              <div className="text-xl font-extrabold text-white">{summaryTotal}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Total</div>
            </div>
            {[
              { label: 'Critical', val: summaryCritical, cls: 'text-red-400' },
              { label: 'High',     val: summaryHigh,     cls: 'text-orange-400' },
              { label: 'Medium',   val: summaryMedium,   cls: 'text-yellow-400' },
              { label: 'Low',      val: summaryLow,      cls: 'text-blue-400' },
            ].map(({ label, val, cls }) => val > 0 && (
              <div key={label} className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[72px]">
                <div className={`text-xl font-extrabold ${cls}`}>{val}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {displayFindings.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSevFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!sevFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'}`}>
                All ({displayFindings.length})
              </button>
              {severities.filter(s => counts[s] > 0).map(s => {
                const st = sevStyle(s)
                return (
                  <button key={s} onClick={() => setSevFilter(sevFilter === s ? '' : s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sevFilter === s ? `${st.badge} border-current` : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'}`}>
                    {s} ({counts[s]})
                  </button>
                )
              })}
            </div>
          )}

          {filtered.length === 0 && displayFindings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
              <p className="text-white font-semibold">No issues found</p>
              <p className="text-sm text-gray-500">Your Dockerfile looks clean.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">No findings match this filter.</div>
          ) : (
            <div className="space-y-2">{filtered.map((f, i) => <FindingRow key={i} finding={f} />)}</div>
          )}

          {passedFindings.length > 0 && (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <button onClick={() => setShowPassed(p => !p)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/3 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="flex-1 text-left">{passedFindings.length} check{passedFindings.length !== 1 ? 's' : ''} passed</span>
                {showPassed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showPassed && (
                <div className="border-t border-white/10 px-4 py-3 space-y-2">
                  {passedFindings.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      {field(f, 'checkName', 'CheckName', 'name', 'Name', 'type', 'Type')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Image CVE scan tab ── */
function ImageCveTab() {
  const [image, setImage]     = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult]   = useState(null)
  const [error, setError]     = useState(null)
  const [sevFilter, setSevFilter] = useState('')
  const [history, setHistory] = useState([])
  const [histLoading, setHistLoading] = useState(true)

  useEffect(() => {
    getImageScanHistory()
      .then(d => setHistory(Array.isArray(d) ? d : (d?.scans ?? d?.history ?? [])))
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [])

  const handleScan = async (e) => {
    e.preventDefault()
    if (!image.trim()) { setError('Enter a container image name.'); return }
    setScanning(true); setError(null); setResult(null)
    try {
      const data = await scanContainerImage(image.trim())
      setResult(data)
      setHistory(prev => [data, ...prev].slice(0, 20))
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const exportCsv = () => {
    if (!result) return
    const findings = result.findings ?? result.Findings ?? []
    const rows = [
      ['Package', 'Version', 'CVE ID', 'CVSS Score', 'Severity', 'Fix Version', 'Source'],
      ...findings.map(f => [
        field(f, 'packageName', 'PackageName'),
        field(f, 'version', 'Version'),
        field(f, 'cveId', 'CveId'),
        field(f, 'cvssScore', 'CvssScore'),
        field(f, 'severity', 'Severity'),
        field(f, 'fixVersion', 'FixVersion'),
        field(f, 'source', 'Source'),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `image-scan-${(image || 'result').replace(/[/:]/g, '-')}.csv`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  const findings = result?.findings ?? result?.Findings ?? []
  const filtered = sevFilter
    ? findings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === sevFilter)
    : findings

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  findings.forEach(f => {
    const s = field(f, 'severity', 'Severity')
    if (counts[s] !== undefined) counts[s]++
  })
  const sortedFindings = [...filtered].sort((a, b) =>
    (SEV_ORDER[field(a, 'severity', 'Severity')] ?? 99) - (SEV_ORDER[field(b, 'severity', 'Severity')] ?? 99)
  )

  const criticalCount = result?.criticalCount ?? result?.CriticalCount ?? counts.Critical
  const highCount     = result?.highCount     ?? result?.HighCount     ?? counts.High
  const mediumCount   = result?.mediumCount   ?? result?.MediumCount   ?? counts.Medium
  const lowCount      = result?.lowCount      ?? result?.LowCount      ?? counts.Low
  const totalPackages      = result?.totalPackages ?? result?.TotalPackages ?? null
  const secretsFound       = result?.secretsFound ?? result?.SecretsFound ?? []
  const benchmarkFindings  = result?.benchmarkFindings ?? result?.BenchmarkFindings ?? null

  const downloadSbom = async (scanId, imageName) => {
    const token = localStorage.getItem('ws_token')
    const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'
    const res = await fetch(`${BASE}/api/docker/image-scans/${scanId}/sbom`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
    if (!res.ok) return
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `sbom-${(imageName || 'image').replace(/[/:]/g, '-')}.json`
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Container Image</label>
          <div className="flex gap-3">
            <input
              value={image}
              onChange={e => setImage(e.target.value)}
              placeholder="nginx:latest  or  ubuntu:22.04  or  myrepo/myapp:v1.2"
              className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
            />
            <button type="submit" disabled={scanning}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {scanning ? 'Scanning…' : 'Scan Image'}
            </button>
          </div>
          <p className="text-[10px] text-gray-600 mt-1.5">Scans installed packages for known CVEs using the NVD and OSV databases.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}
      </form>

      {result && (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'Critical',          val: criticalCount,    cls: 'text-red-400'    },
              { label: 'High',              val: highCount,        cls: 'text-orange-400' },
              { label: 'Medium',            val: mediumCount,      cls: 'text-yellow-400' },
              { label: 'Low',               val: lowCount,         cls: 'text-blue-400'   },
              { label: 'Total Packages',    val: totalPackages,    cls: 'text-white'      },
              ...(benchmarkFindings != null ? [{ label: 'Benchmark Issues', val: benchmarkFindings, cls: 'text-amber-400' }] : []),
            ].map(({ label, val, cls }) => (
              <div key={label} className="bg-white/3 border border-white/10 rounded-xl px-3 py-3 text-center">
                <div className={`text-xl font-extrabold ${cls}`}>{val ?? '—'}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Filter bar + export */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setSevFilter('')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!sevFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'}`}>
                All ({findings.length})
              </button>
              {['Critical', 'High', 'Medium', 'Low'].filter(s => counts[s] > 0).map(s => {
                const st = sevStyle(s)
                return (
                  <button key={s} onClick={() => setSevFilter(sevFilter === s ? '' : s)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${sevFilter === s ? `${st.badge} border-current` : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'}`}>
                    {s} ({counts[s]})
                  </button>
                )
              })}
            </div>
            {findings.length > 0 && (
              <button onClick={exportCsv}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white border border-white/15 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            )}
          </div>

          {/* Findings table */}
          {sortedFindings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
              <p className="text-white font-semibold">No CVEs found</p>
              <p className="text-sm text-gray-500">This image has no known vulnerabilities matching your filter.</p>
            </div>
          ) : (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500">
                      <th className="text-left px-4 py-3">Package</th>
                      <th className="text-left px-4 py-3">Version</th>
                      <th className="text-left px-4 py-3">CVE ID</th>
                      <th className="text-left px-4 py-3">CVSS</th>
                      <th className="text-left px-4 py-3">Severity</th>
                      <th className="text-left px-4 py-3">Fix Version</th>
                      <th className="text-left px-4 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedFindings.map((f, i) => {
                      const pkg   = field(f, 'packageName', 'PackageName')
                      const ver   = field(f, 'version', 'Version')
                      const cve   = field(f, 'cveId', 'CveId')
                      const cvss  = field(f, 'cvssScore', 'CvssScore')
                      const sev   = field(f, 'severity', 'Severity')
                      const fix   = field(f, 'fixVersion', 'FixVersion')
                      const src   = field(f, 'source', 'Source')
                      const st    = sevStyle(sev)
                      return (
                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-2.5 text-white font-mono font-medium">{pkg}</td>
                          <td className="px-4 py-2.5 text-gray-400 font-mono">{ver || '—'}</td>
                          <td className="px-4 py-2.5">
                            {cve
                              ? <span className="font-mono text-red-400 font-semibold">{cve}</span>
                              : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {cvss
                              ? <span className={`font-bold ${Number(cvss) >= 9 ? 'text-red-400' : Number(cvss) >= 7 ? 'text-orange-400' : 'text-yellow-400'}`}>{cvss}</span>
                              : <span className="text-gray-600">—</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${st.badge}`}>{sev || '—'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 font-mono">
                            {fix ? <span className="text-green-400">{fix}</span> : <span className="text-gray-600">No fix</span>}
                          </td>
                          <td className="px-4 py-2.5">
                            {src && <span className="text-[10px] bg-white/8 border border-white/10 text-gray-300 px-1.5 py-0.5 rounded">{src}</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Secrets detected */}
          {secretsFound.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm font-semibold text-red-300">Secrets Detected</p>
                <span className="ml-auto text-[10px] font-bold bg-red-500/20 border border-red-500/30 text-red-400 px-2 py-0.5 rounded-full">
                  {secretsFound.length}
                </span>
              </div>
              <div className="space-y-2">
                {secretsFound.map((s, i) => {
                  const secretType = field(s, 'secretType', 'SecretType')
                  const location   = field(s, 'location', 'Location')
                  const preview    = field(s, 'preview', 'Preview')
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                      {secretType && (
                        <span className="font-bold uppercase px-2 py-0.5 rounded border bg-red-500/15 text-red-400 border-red-500/30 shrink-0">
                          {secretType}
                        </span>
                      )}
                      {location && (
                        <span className="font-mono text-gray-400 truncate">{location}</span>
                      )}
                      {preview && (
                        <span className="font-mono text-xs text-red-300 truncate">{preview}…</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scan history */}
      {!histLoading && history.length > 0 && (
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
            <History className="w-4 h-4 text-gray-500" />
            <p className="text-sm font-semibold text-white">Scan History</p>
            <span className="ml-auto text-xs text-gray-500">{history.length} scans</span>
          </div>
          <div className="divide-y divide-white/5">
            {history.map((h, i) => {
              const img    = field(h, 'image', 'Image')
              const ts     = field(h, 'scannedAt', 'ScannedAt', 'createdAt', 'CreatedAt')
              const crit   = field(h, 'criticalCount', 'CriticalCount') || 0
              const high   = field(h, 'highCount', 'HighCount') || 0
              const medium = field(h, 'mediumCount', 'MediumCount') || 0
              const low    = field(h, 'lowCount', 'LowCount') || 0
              const scanId = field(h, 'id', 'Id', 'scanId', 'ScanId')
              return (
                <div key={i} className="group flex items-center gap-4 px-4 py-3 hover:bg-white/3 transition-colors">
                  <Package className="w-4 h-4 text-gray-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono text-white truncate">{img || '—'}</p>
                    <p className="text-[10px] text-gray-500">{ts ? new Date(ts).toLocaleString() : ''}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    {crit > 0 && <span className="text-red-400 font-bold">{crit}C</span>}
                    {high > 0 && <span className="text-orange-400 font-bold">{high}H</span>}
                    {medium > 0 && <span className="text-yellow-400 font-bold">{medium}M</span>}
                    {low > 0 && <span className="text-blue-400 font-bold">{low}L</span>}
                    {!crit && !high && !medium && !low && <span className="text-green-400 font-semibold">Clean</span>}
                    {scanId && (
                      <button
                        onClick={() => downloadSbom(scanId, img)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] font-semibold text-gray-400 hover:text-white border border-white/15 hover:border-white/30 px-2 py-0.5 rounded transition-all"
                      >
                        <Download className="w-3 h-3" /> SBOM
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Kubernetes scan tab ── */
function KubernetesTab() {
  const [manifestUrl, setManifestUrl]       = useState('')
  const [clusterContext, setClusterContext] = useState('')
  const [scanning, setScanning]             = useState(false)
  const [result, setResult]                 = useState(null)
  const [error, setError]                   = useState(null)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!manifestUrl.trim() && !clusterContext.trim()) {
      setError('Enter a Manifest URL or a Cluster Context.')
      return
    }
    setScanning(true); setError(null); setResult(null)
    try {
      const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BASE}/api/k8s/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          manifestUrl: manifestUrl.trim() || undefined,
          clusterContext: clusterContext.trim() || undefined,
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.message || `Error ${res.status}`)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const podFindings     = result?.podFindings            ?? []
  const rbacFindings    = result?.rbacFindings           ?? []
  const netFindings     = result?.networkPolicyFindings  ?? []
  const runtimeFindings = result?.runtimeFindings        ?? []

  /* small reusable finding table */
  const FindingTable = ({ rows, withNamespace }) => {
    const [expandedRows, setExpandedRows] = useState({})
    if (!rows.length) return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="w-8 h-8 text-green-400" />
        <p className="text-sm text-gray-400">No issues found</p>
      </div>
    )
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[560px]">
          <thead>
            <tr className="border-b border-white/10 text-gray-500">
              <th className="text-left px-4 py-3">Resource</th>
              {withNamespace && <th className="text-left px-4 py-3">Namespace</th>}
              <th className="text-left px-4 py-3">Check</th>
              <th className="text-left px-4 py-3">Severity</th>
              <th className="text-left px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const st = sevStyle(r.severity)
              const isExpanded = expandedRows[i]
              const details = r.details || ''
              const truncated = details.length > 80 && !isExpanded
              return (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-2.5 text-white font-mono font-medium">{r.resource || '—'}</td>
                  {withNamespace && <td className="px-4 py-2.5 text-gray-400 font-mono">{r.namespace || '—'}</td>}
                  <td className="px-4 py-2.5 text-gray-300">{r.check || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${st.badge}`}>
                      {r.severity || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-400 max-w-[260px]">
                    {truncated ? (
                      <span>
                        {details.slice(0, 80)}…{' '}
                        <button
                          onClick={() => setExpandedRows(prev => ({ ...prev, [i]: true }))}
                          className="text-cyan-400 hover:text-cyan-300 underline ml-1"
                        >
                          more
                        </button>
                      </span>
                    ) : (
                      <span>
                        {details}
                        {details.length > 80 && (
                          <button
                            onClick={() => setExpandedRows(prev => ({ ...prev, [i]: false }))}
                            className="text-cyan-400 hover:text-cyan-300 underline ml-1"
                          >
                            less
                          </button>
                        )}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Input form */}
      <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Manifest URL</label>
          <input
            type="url"
            value={manifestUrl}
            onChange={e => setManifestUrl(e.target.value)}
            placeholder="https://raw.githubusercontent.com/org/repo/main/k8s/deployment.yaml"
            className="w-full bg-white/5 border border-white/15 focus:border-cyan-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-gray-500 font-semibold">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1.5">
            Cluster Context <span className="text-gray-600">(optional — for agent-based scanning)</span>
          </label>
          <input
            type="text"
            value={clusterContext}
            onChange={e => setClusterContext(e.target.value)}
            placeholder="my-prod-cluster"
            className="w-full bg-white/5 border border-white/15 focus:border-cyan-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
          </div>
        )}

        <button
          type="submit"
          disabled={scanning}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-600/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
          {scanning ? 'Scanning…' : 'Scan Kubernetes Config'}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Pod Issues',            val: podFindings.length,     cls: 'text-red-400'    },
              { label: 'RBAC Issues',           val: rbacFindings.length,    cls: 'text-orange-400' },
              { label: 'Network Policy Issues', val: netFindings.length,     cls: 'text-yellow-400' },
              { label: 'Runtime Issues',        val: runtimeFindings.length, cls: 'text-purple-400' },
            ].map(({ label, val, cls }) => (
              <div key={label} className="bg-white/3 border border-white/10 rounded-xl px-3 py-3 text-center">
                <div className={`text-xl font-extrabold ${cls}`}>{val}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Scanned at */}
          {result.scannedAt && (
            <p className="text-[10px] text-gray-600">
              Scanned at {new Date(result.scannedAt).toLocaleString()}
            </p>
          )}

          {/* Pod Security */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-sm font-semibold text-white">Pod Security</p>
              <span className="ml-auto text-xs text-gray-500">{podFindings.length} issue{podFindings.length !== 1 ? 's' : ''}</span>
            </div>
            <FindingTable rows={podFindings} withNamespace={true} />
          </div>

          {/* RBAC Findings */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <p className="text-sm font-semibold text-white">RBAC Findings</p>
              <span className="ml-auto text-xs text-gray-500">{rbacFindings.length} issue{rbacFindings.length !== 1 ? 's' : ''}</span>
            </div>
            <FindingTable rows={rbacFindings} withNamespace={false} />
          </div>

          {/* Network Policy */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <p className="text-sm font-semibold text-white">Network Policy</p>
              <span className="ml-auto text-xs text-gray-500">{netFindings.length} issue{netFindings.length !== 1 ? 's' : ''}</span>
            </div>
            <FindingTable rows={netFindings} withNamespace={false} />
          </div>

          {/* Runtime Container Status */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <p className="text-sm font-semibold text-white">Runtime Container Status</p>
              <span className="ml-auto text-xs text-gray-500">{runtimeFindings.length} container{runtimeFindings.length !== 1 ? 's' : ''}</span>
            </div>
            {runtimeFindings.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
                <p className="text-sm text-gray-400">No runtime issues found</p>
              </div>
            ) : (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {runtimeFindings.map((r, i) => {
                  const st = sevStyle(r.severity)
                  return (
                    <div key={i} className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3 relative">
                      {/* Severity badge — top-right corner */}
                      <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${st.badge}`}>
                        {r.severity || '—'}
                      </span>

                      {/* Container + pod name */}
                      <div>
                        <p className="text-sm font-semibold text-white font-mono truncate pr-16">{r.container || '—'}</p>
                        {r.pod && <p className="text-[10px] text-gray-500 font-mono truncate">{r.pod}</p>}
                      </div>

                      {/* Status chips */}
                      <div className="flex flex-wrap gap-2">
                        {/* Privileged */}
                        {r.privileged ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/30">
                            ⚠ Privileged
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/30">
                            ✓ Unprivileged
                          </span>
                        )}

                        {/* Resource limits */}
                        {r.noResourceLimits ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/30">
                            ✗ No Limits
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/30">
                            ✓ Limits Set
                          </span>
                        )}

                        {/* Mounted secrets */}
                        {Array.isArray(r.mountedSecrets) && r.mountedSecrets.map((secret, si) => (
                          <span key={si} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/30 font-mono">
                            {secret}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function ContainerScanPage() {
  const [tab, setTab] = useState('dockerfile')

  const TABS = [
    { id: 'dockerfile', label: 'Dockerfile Scan', icon: FileText },
    { id: 'image',      label: 'Image CVE Scan',  icon: Image    },
    { id: 'k8s',        label: 'Kubernetes',       icon: Server   },
  ]

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <Container className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Container Security</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Container Security Scanner</h1>
            <p className="text-gray-400 leading-relaxed">
              Scan Dockerfiles for misconfigurations and container images for known CVEs before they reach production.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Tab bar */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === id ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {tab === 'dockerfile' && <DockerfileTab    />}
          {tab === 'image'      && <ImageCveTab     />}
          {tab === 'k8s'        && <KubernetesTab   />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
