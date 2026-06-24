import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Clock, Package, ScanLine, Download } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAgents, scanVmdr, getVmdrFindings, getVmdrSummary, updateFindingStatus, scanAgentPackages, getAgentPackageCves } from '../services/api'

function field(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined) return obj[k]
    const lower = k.charAt(0).toLowerCase() + k.slice(1)
    if (obj[lower] !== undefined) return obj[lower]
    const upper = k.charAt(0).toUpperCase() + k.slice(1)
    if (obj[upper] !== undefined) return obj[upper]
  }
  return undefined
}

const SEV = {
  Critical: { bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30'    },
  High:     { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' },
  Medium:   { bg: 'bg-amber-500/15',  text: 'text-amber-400',  border: 'border-amber-500/30'  },
  Low:      { bg: 'bg-blue-500/15',   text: 'text-blue-400',   border: 'border-blue-500/30'   },
}

const STATUS_CFG = {
  Open:     { icon: AlertTriangle, cls: 'text-amber-400' },
  Accepted: { icon: Clock,         cls: 'text-blue-400'  },
  Fixed:    { icon: CheckCircle2,  cls: 'text-green-400' },
}

const TABS = [
  { id: 'findings',  label: 'Findings'      },
  { id: 'vulns',     label: 'Host CVEs'     },
  { id: 'packages',  label: 'Package CVEs'  },
]

function SevBadge({ sev }) {
  const s = SEV[sev] || SEV.Low
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
      {sev}
    </span>
  )
}

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.Open
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}

function SummaryCards({ summary, findings, scanMeta }) {
  const crit = field(summary, 'criticalCount') ?? findings.filter(f => field(f, 'severity') === 'Critical').length
  const high = field(summary, 'highCount')     ?? findings.filter(f => field(f, 'severity') === 'High').length
  const med  = field(summary, 'mediumCount')   ?? findings.filter(f => field(f, 'severity') === 'Medium').length
  const low  = field(summary, 'lowCount')      ?? findings.filter(f => field(f, 'severity') === 'Low').length
  const vulnPkgs = field(scanMeta, 'vulnerablePackages', 'VulnerablePackages')
    ?? field(summary, 'vulnerablePackages', 'VulnerablePackages')
    ?? [...new Set(findings.map(f => field(f, 'packageName', 'PackageName')).filter(Boolean))].length

  const cards = [
    { label: 'Critical',     count: crit,     color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
    { label: 'High',         count: high,     color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Medium',       count: med,      color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
    { label: 'Low',          count: low,      color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
    { label: 'Vuln Packages',count: vulnPkgs, color: 'text-white',      bg: 'bg-white/5',       border: 'border-white/10'      },
  ]

  return (
    <div className="flex flex-wrap gap-4">
      {cards.map(c => (
        <div key={c.label} className={`flex-1 min-w-[110px] ${c.bg} border ${c.border} rounded-xl px-5 py-4`}>
          <div className={`text-2xl font-extrabold ${c.color}`}>{c.count}</div>
          <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
        </div>
      ))}
    </div>
  )
}

function FindingRow({ finding, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const id         = field(finding, 'id')
  const cveId      = field(finding, 'cveId', 'CveId')
  const pkg        = field(finding, 'packageName', 'PackageName')
  const inst       = field(finding, 'installedVersion', 'InstalledVersion')
  const fixed      = field(finding, 'fixedVersion', 'FixedVersion')
  const cvss       = field(finding, 'cvssScore', 'CvssScore')
  const sev        = field(finding, 'severity', 'Severity') || 'Low'
  const epss       = field(finding, 'epssScore', 'EpssScore')
  const isKev      = field(finding, 'isKev', 'IsKev') ?? false
  const kevDueDate = field(finding, 'kevDueDate', 'KevDueDate') ?? null
  const desc       = field(finding, 'description', 'Description')
  const status     = field(finding, 'status', 'Status') || 'Open'

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value
    setUpdating(true)
    try { await onStatusChange(id, newStatus) }
    finally { setUpdating(false) }
  }

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
        </td>
        <td className="px-4 py-3 text-xs font-mono text-sky-400 whitespace-nowrap">
          {isKev && (
            <span className="mr-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-red-600/25 text-red-300 border-red-500/50 animate-pulse whitespace-nowrap">
              ⚠ KEV
            </span>
          )}
          <a
            href={`https://nvd.nist.gov/vuln/detail/${cveId}`}
            target="_blank"
            rel="noreferrer"
            className="hover:underline"
            onClick={e => e.stopPropagation()}
          >
            {cveId}
          </a>
        </td>
        <td className="px-4 py-3 text-sm text-white font-medium">{pkg}</td>
        <td className="px-4 py-3 text-xs font-mono text-gray-400">{inst}</td>
        <td className="px-4 py-3 text-xs font-mono text-green-400">{fixed || '—'}</td>
        <td className="px-4 py-3 text-sm font-bold text-white whitespace-nowrap">
          {cvss != null ? cvss.toFixed(1) : '—'}
        </td>
        <td className="px-4 py-3"><SevBadge sev={sev} /></td>
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          {epss != null ? `${(epss * 100).toFixed(1)}%` : '—'}
        </td>
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          {updating
            ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-500" />
            : (
              <select
                value={status}
                onChange={handleStatusChange}
                className="bg-white/5 border border-white/15 text-xs text-white rounded-lg px-2 py-1 outline-none focus:border-sky-500/50 disabled:opacity-50"
              >
                <option value="Open">Open</option>
                <option value="Accepted">Accepted</option>
                <option value="Fixed">Fixed</option>
              </select>
            )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/5 bg-white/2">
          <td colSpan={9} className="px-6 py-4 space-y-2">
            {isKev && (
              <div className="bg-red-950/60 border border-red-700/50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-0.5">🚨 CISA Known Exploited Vulnerability</p>
                <p className="text-xs text-gray-300">Actively exploited in the wild.</p>
                {kevDueDate && (
                  <p className="text-xs text-red-300 font-bold mt-1">Patch due: {new Date(kevDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                )}
              </div>
            )}
            <p className="text-sm text-gray-300 leading-relaxed">{desc || 'No description available.'}</p>
          </td>
        </tr>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Host Vulnerabilities tab
// ---------------------------------------------------------------------------

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']

function HostVulnRow({ vuln }) {
  const [expanded, setExpanded] = useState(false)

  const cveId      = field(vuln, 'cveId', 'CveId')
  const cvss       = field(vuln, 'cvssScore', 'CvssScore')
  const pkg        = field(vuln, 'affectedPackage', 'AffectedPackage')
  const ver        = field(vuln, 'packageVersion', 'PackageVersion')
  const fixVer     = field(vuln, 'fixVersion', 'FixVersion')
  const sev        = field(vuln, 'severity', 'Severity') || 'Low'
  const epss       = field(vuln, 'epssScore', 'EpssScore')
  const isKev      = field(vuln, 'isKev', 'IsKev') ?? false
  const kevDueDate = field(vuln, 'kevDueDate', 'KevDueDate') ?? null
  const desc       = field(vuln, 'description', 'Description')

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
        </td>
        <td className="px-4 py-3 text-xs font-mono text-red-400 whitespace-nowrap">
          {isKev && (
            <span className="mr-1.5 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-red-600/25 text-red-300 border-red-500/50 animate-pulse">
              ⚠ KEV
            </span>
          )}
          {cveId ? (
            <a
              href={`https://nvd.nist.gov/vuln/detail/${cveId}`}
              target="_blank"
              rel="noreferrer"
              className="hover:underline"
              onClick={e => e.stopPropagation()}
            >
              {cveId}
            </a>
          ) : '—'}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-sm font-bold text-white">{cvss != null ? Number(cvss).toFixed(1) : '—'}</span>
          {epss != null && (
            <span className={`ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              epss >= 0.5 ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : epss >= 0.1 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
            }`}>
              {(epss * 100).toFixed(1)}% EPSS
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-white font-medium">{pkg || '—'}</td>
        <td className="px-4 py-3 text-xs font-mono text-gray-400">{ver || '—'}</td>
        <td className="px-4 py-3 text-xs font-mono text-lime-400">{fixVer || '—'}</td>
        <td className="px-4 py-3"><SevBadge sev={sev} /></td>
        <td className="px-4 py-3 text-xs text-gray-400 max-w-xs">
          <span className="line-clamp-2">{desc || '—'}</span>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/5 bg-white/2">
          <td colSpan={8} className="px-6 py-4 space-y-2">
            {isKev && (
              <div className="bg-red-950/60 border border-red-700/50 rounded-lg px-3 py-2">
                <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-0.5">🚨 CISA Known Exploited Vulnerability</p>
                <p className="text-xs text-gray-300">Actively exploited in the wild.</p>
                {kevDueDate && (
                  <p className="text-xs text-red-300 font-bold mt-1">Patch due: {new Date(kevDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                )}
              </div>
            )}
            <p className="text-sm text-gray-300 leading-relaxed">{desc || 'No description available.'}</p>
          </td>
        </tr>
      )}
    </>
  )
}

function HostVulnsTab({ selectedId }) {
  const [vulns, setVulns]         = useState([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [sevFilter, setSevFilter] = useState('All')

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setError('')
    const token = localStorage.getItem('ws_token')
    fetch(`${BASE}/api/agent/scans/${selectedId}/vulnerabilities`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(data => {
        setVulns(Array.isArray(data) ? data : (data?.vulnerabilities ?? data?.vulns ?? []))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId])

  if (!selectedId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex items-center justify-center">
          <ShieldCheck className="w-7 h-7 text-lime-400" />
        </div>
        <p className="text-gray-400 text-sm">Select an agent to view host vulnerabilities.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-sm">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Loading host vulnerabilities…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
        <XCircle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    )
  }

  // Summary counts
  const counts = SEV_ORDER.reduce((acc, s) => {
    acc[s] = vulns.filter(v => (field(v, 'severity', 'Severity') || 'Low') === s).length
    return acc
  }, {})

  const filtered = sevFilter === 'All'
    ? vulns
    : vulns.filter(v => (field(v, 'severity', 'Severity') || 'Low') === sevFilter)

  const sevChipColor = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      {vulns.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-5 py-4">
          <span className="text-sm font-semibold text-white mr-2">
            {vulns.length} host {vulns.length === 1 ? 'vulnerability' : 'vulnerabilities'}
          </span>
          {SEV_ORDER.map(s => counts[s] > 0 && (
            <span
              key={s}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sevChipColor[s]}`}
            >
              <span>{s}</span>
              <span className="opacity-80">{counts[s]}</span>
            </span>
          ))}
        </div>
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-gray-400 font-medium">Filter:</span>
        {['All', ...SEV_ORDER].map(s => (
          <button
            key={s}
            onClick={() => setSevFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              sevFilter === s
                ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                : 'bg-white/4 text-gray-400 border-white/10 hover:border-white/20'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      {vulns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-500 text-sm">
          <CheckCircle2 className="w-8 h-8 text-green-500/40" />
          No host vulnerabilities found for this agent.
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-500 text-sm">
          <CheckCircle2 className="w-8 h-8 text-green-500/40" />
          No vulnerabilities match the current filter.
        </div>
      ) : (
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="px-4 py-3 w-8" />
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">CVE ID</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">CVSS</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Affected Package</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Version</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fix Version</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Severity</th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <HostVulnRow key={field(v, 'cveId', 'CveId') || i} vuln={v} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Package CVE Scanner tab
// ---------------------------------------------------------------------------

function PackageCveTab({ selectedId }) {
  const [vulns, setVulns]           = useState([])
  const [loading, setLoading]       = useState(false)
  const [scanning, setScanning]     = useState(false)
  const [error, setError]           = useState('')
  const [sevFilter, setSevFilter]   = useState('All')
  const [scannedAt, setScannedAt]   = useState(null)

  const loadResults = useCallback(async (id) => {
    if (!id) return
    setLoading(true); setError('')
    try {
      const data = await getAgentPackageCves(id)
      const list = Array.isArray(data) ? data : (data?.vulnerabilities ?? data?.cves ?? data?.findings ?? [])
      setVulns(list)
      const ts = data?.scannedAt ?? data?.ScannedAt ?? null
      if (ts) setScannedAt(ts)
    } catch { }
    setLoading(false)
  }, [])

  useEffect(() => { loadResults(selectedId) }, [selectedId, loadResults])

  const handleScan = async () => {
    if (!selectedId) return
    setScanning(true); setError('')
    try {
      const data = await scanAgentPackages(selectedId)
      const list = Array.isArray(data) ? data : (data?.vulnerabilities ?? data?.cves ?? data?.findings ?? [])
      setVulns(list)
      const ts = data?.scannedAt ?? data?.ScannedAt ?? new Date().toISOString()
      setScannedAt(ts)
    } catch (e) { setError('Package scan failed') }
    setScanning(false)
  }

  const exportCsv = () => {
    const rows = [
      ['Package', 'Version', 'CVE ID', 'CVSS', 'Severity', 'Fix Version', 'Description'],
      ...vulns.map(v => [
        field(v, 'packageName', 'PackageName', 'package', 'Package'),
        field(v, 'version', 'Version'),
        field(v, 'cveId', 'CveId'),
        field(v, 'cvssScore', 'CvssScore', 'cvss', 'Cvss'),
        field(v, 'severity', 'Severity'),
        field(v, 'fixVersion', 'FixVersion'),
        field(v, 'description', 'Description'),
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a'); a.href = url; a.download = `package-cves-${selectedId || 'export'}.csv`
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
  }

  if (!selectedId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex items-center justify-center">
          <Package className="w-7 h-7 text-lime-400" />
        </div>
        <p className="text-gray-400 text-sm">Select an agent to view package CVEs.</p>
      </div>
    )
  }

  const counts = SEV_ORDER.reduce((acc, s) => {
    acc[s] = vulns.filter(v => (field(v, 'severity', 'Severity') || 'Low') === s).length
    return acc
  }, {})

  const filtered = sevFilter === 'All'
    ? vulns
    : vulns.filter(v => (field(v, 'severity', 'Severity') || 'Low') === sevFilter)

  const sevChipColor = {
    Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
    Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
    Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }

  return (
    <div className="space-y-6">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleScan}
          disabled={scanning || loading}
          className="flex items-center gap-2 px-4 py-2 bg-lime-500 hover:bg-lime-600 text-black font-semibold text-sm rounded-xl disabled:opacity-50 transition-colors"
        >
          {scanning
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning…</>
            : <><ScanLine className="w-4 h-4" /> Run Package Scan</>}
        </button>
        <button
          onClick={() => loadResults(selectedId)}
          disabled={loading || scanning}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-xl border border-white/10 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
        {vulns.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-xl border border-white/10 transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        )}
        {scannedAt && (
          <span className="text-xs text-gray-500 ml-auto">
            Last scanned: {new Date(scannedAt).toLocaleString()}
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
          <XCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-20 text-gray-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading package CVEs…
        </div>
      )}

      {!loading && vulns.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <div className="w-14 h-14 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex items-center justify-center">
            <Package className="w-7 h-7 text-lime-400" />
          </div>
          <p className="text-white font-semibold">No package CVEs found</p>
          <p className="text-gray-400 text-sm">
            Click "Run Package Scan" to scan installed packages on this agent for known CVEs.
          </p>
          <p className="text-xs text-gray-600 font-mono">
            Agent flag: --scan packages
          </p>
        </div>
      )}

      {!loading && vulns.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-5 py-4">
            <span className="text-sm font-semibold text-white mr-2">
              {vulns.length} package CVE{vulns.length !== 1 ? 's' : ''}
            </span>
            {SEV_ORDER.map(s => counts[s] > 0 && (
              <span key={s} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sevChipColor[s]}`}>
                <span>{s}</span><span className="opacity-80">{counts[s]}</span>
              </span>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-medium">Filter:</span>
            {['All', ...SEV_ORDER].map(s => (
              <button key={s} onClick={() => setSevFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  sevFilter === s
                    ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                    : 'bg-white/4 text-gray-400 border-white/10 hover:border-white/20'
                }`}>
                {s}
              </button>
            ))}
            <span className="ml-auto text-xs text-gray-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Table */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Package</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Version</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">CVE ID</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">CVSS</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Severity</th>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fix Version</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v, i) => {
                    const pkg    = field(v, 'packageName', 'PackageName', 'package', 'Package') ?? '—'
                    const ver    = field(v, 'version', 'Version') ?? '—'
                    const cveId  = field(v, 'cveId', 'CveId') ?? null
                    const cvss   = field(v, 'cvssScore', 'CvssScore', 'cvss', 'Cvss') ?? null
                    const sev    = field(v, 'severity', 'Severity') || 'Low'
                    const fixVer = field(v, 'fixVersion', 'FixVersion') ?? null
                    const s      = SEV[sev] || SEV.Low
                    return (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-2.5 text-white font-mono font-medium">{pkg}</td>
                        <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{ver}</td>
                        <td className="px-4 py-2.5">
                          {cveId ? (
                            <a href={`https://nvd.nist.gov/vuln/detail/${cveId}`} target="_blank" rel="noreferrer"
                              className="text-xs font-mono text-red-400 hover:underline">
                              {cveId}
                            </a>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-sm font-bold text-white whitespace-nowrap">
                          {cvss != null ? Number(cvss).toFixed(1) : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${s.bg} ${s.text} ${s.border}`}>
                            {sev}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-mono">
                          {fixVer ? <span className="text-lime-400">{fixVer}</span> : <span className="text-gray-600">No fix</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function VmdrPage() {
  const [agents, setAgents]         = useState([])
  const [agentsLoaded, setAgentsLoaded] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [findings, setFindings]     = useState([])
  const [summary, setSummary]       = useState(null)
  const [scanMeta, setScanMeta]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [scanning, setScanning]     = useState(false)
  const [error, setError]           = useState('')
  const [sevFilter, setSevFilter]   = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [tab, setTab]               = useState('findings')

  useEffect(() => {
    getAgents()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.agents ?? [])
        setAgents(list)
        if (list.length > 0) {
          const firstId = field(list[0], 'id', 'agentId', 'AgentId')
          setSelectedId(firstId || '')
        }
        setAgentsLoaded(true)
      })
      .catch(() => { setAgentsLoaded(true) })

    getVmdrSummary()
      .then(setSummary)
      .catch(() => {})
  }, [])

  const loadFindings = useCallback((agentId) => {
    if (!agentId) return
    setLoading(true)
    setError('')
    getVmdrFindings(agentId)
      .then(data => {
        const list = Array.isArray(data) ? data : (field(data, 'findings') ?? [])
        setFindings(list)
        if (!Array.isArray(data)) setScanMeta(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedId) loadFindings(selectedId)
  }, [selectedId, loadFindings])

  const handleScan = async () => {
    if (!selectedId) return
    setScanning(true)
    setError('')
    try {
      const data = await scanVmdr(selectedId)
      const list = Array.isArray(data) ? data : (field(data, 'findings') ?? [])
      setFindings(list)
      if (!Array.isArray(data)) setScanMeta(data)
      getVmdrSummary().then(setSummary).catch(() => {})
    } catch {
      setError('Scan failed — try again')
    } finally {
      setScanning(false)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    await updateFindingStatus(id, newStatus)
    setFindings(prev =>
      prev.map(f => (field(f, 'id') === id ? { ...f, status: newStatus, Status: newStatus } : f))
    )
    getVmdrSummary().then(setSummary).catch(() => {})
  }

  const filtered = findings.filter(f => {
    const sev    = field(f, 'severity', 'Severity') || 'Low'
    const status = field(f, 'status', 'Status') || 'Open'
    return (sevFilter === 'All' || sev === sevFilter) &&
           (statusFilter === 'All' || status === statusFilter)
  })

  const agentName = scanMeta
    ? (field(scanMeta, 'agentName', 'AgentName') || selectedId)
    : ''

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-lime-500/15 border border-lime-500/30 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-lime-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-lime-400">VMDR</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Vulnerability Management, Detection &amp; Response
            </h1>
            <p className="text-gray-400 max-w-2xl leading-relaxed">
              Select a registered agent, trigger a scan, and see every vulnerable package mapped to CVEs with CVSS scores, EPSS exploit likelihood, and one-click status management.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">

          {/* Agent selector + scan trigger */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Select Agent &amp; Scan</h2>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-gray-400 mb-1 block">Agent</label>
                {agentsLoaded && agents.length === 0 ? (
                  <p className="text-sm text-amber-400 py-2">
                    No agents registered.{' '}
                    <a href="/agent" className="underline text-lime-400 hover:text-lime-300">Download and install the Udyo360 Agent</a>
                    {' '}on your servers to start scanning.
                  </p>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedId}
                      onChange={e => setSelectedId(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white appearance-none focus:outline-none focus:border-lime-500/50"
                    >
                      <option value="">— select an agent —</option>
                      {agents.map(a => {
                        const id   = field(a, 'id', 'agentId', 'AgentId')
                        const name = field(a, 'name', 'Name', 'hostname', 'Hostname') || id
                        const os   = field(a, 'os', 'Os', 'platform', 'Platform') || ''
                        return (
                          <option key={id} value={id}>
                            {name}{os ? ` (${os})` : ''}
                          </option>
                        )
                      })}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              <button
                onClick={handleScan}
                disabled={!selectedId || scanning}
                className="flex items-center gap-2 px-5 py-2.5 bg-lime-500 hover:bg-lime-600 text-black font-semibold text-sm rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scanning
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Scanning…</>
                  : <><ShieldCheck className="w-4 h-4" /> Run Scan</>}
              </button>

              {selectedId && !scanning && (
                <button
                  onClick={() => loadFindings(selectedId)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 text-sm rounded-xl border border-white/10 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              )}
            </div>

            {scanMeta && (
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400 border-t border-white/5 pt-4">
                {agentName && <span>Agent: <span className="text-white font-medium">{agentName}</span></span>}
                {field(scanMeta, 'scannedAt', 'ScannedAt') && (
                  <span>Scanned: <span className="text-white font-medium">
                    {new Date(field(scanMeta, 'scannedAt', 'ScannedAt')).toLocaleString()}
                  </span></span>
                )}
                {field(scanMeta, 'totalPackages', 'TotalPackages') != null && (
                  <span>Packages: <span className="text-white font-medium">{field(scanMeta, 'totalPackages', 'TotalPackages')}</span></span>
                )}
                {field(scanMeta, 'vulnerablePackages', 'VulnerablePackages') != null && (
                  <span>Vulnerable: <span className="text-red-400 font-medium">{field(scanMeta, 'vulnerablePackages', 'VulnerablePackages')}</span></span>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              <XCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Summary cards */}
          {(findings.length > 0 || summary) && (
            <SummaryCards summary={summary || {}} findings={findings} scanMeta={scanMeta} />
          )}

          {/* Tabs */}
          <div>
            <div className="flex gap-1 border-b border-white/10 mb-6">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-lime-400 text-lime-400 bg-lime-500/5'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Findings tab */}
            {tab === 'findings' && (
              <>
                {(findings.length > 0 || loading) ? (
                  <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 px-5 py-4 border-b border-white/5 items-center">
                      <span className="text-xs text-gray-400 font-medium">Severity:</span>
                      {['All', ...SEV_ORDER].map(s => (
                        <button
                          key={s}
                          onClick={() => setSevFilter(s)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            sevFilter === s
                              ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                              : 'bg-white/4 text-gray-400 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <span className="ml-4 text-xs text-gray-400 font-medium">Status:</span>
                      {['All', 'Open', 'Accepted', 'Fixed'].map(s => (
                        <button
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            statusFilter === s
                              ? 'bg-lime-500/20 text-lime-400 border-lime-500/40'
                              : 'bg-white/4 text-gray-400 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <span className="ml-auto text-xs text-gray-500">{filtered.length} finding{filtered.length !== 1 ? 's' : ''}</span>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading findings…
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-2 text-gray-500 text-sm">
                        <CheckCircle2 className="w-8 h-8 text-green-500/40" />
                        No findings match the current filters.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-white/8">
                              <th className="px-4 py-3 w-8" />
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">CVE ID</th>
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Package</th>
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Installed</th>
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Fixed In</th>
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">CVSS</th>
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Severity</th>
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">EPSS</th>
                              <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map((f, i) => (
                              <FindingRow
                                key={field(f, 'id') || i}
                                finding={f}
                                onStatusChange={handleStatusChange}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  !error && selectedId && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                      <div className="w-14 h-14 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-lime-400" />
                      </div>
                      <p className="text-gray-400 text-sm">No findings yet. Run a scan to detect vulnerable packages on this agent.</p>
                    </div>
                  )
                )}
              </>
            )}

            {/* Host CVEs tab */}
            {tab === 'vulns' && (
              <HostVulnsTab selectedId={selectedId} />
            )}

            {/* Package CVEs tab */}
            {tab === 'packages' && (
              <PackageCveTab selectedId={selectedId} />
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
