import React, { useState, useEffect, useCallback } from 'react'
import { ShieldCheck, RefreshCw, ChevronDown, ChevronRight, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAgents, scanVmdr, getVmdrFindings, getVmdrSummary, updateFindingStatus } from '../services/api'

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

function SummaryCards({ summary, findings }) {
  const crit = field(summary, 'criticalCount') ?? findings.filter(f => field(f, 'severity') === 'Critical').length
  const high = field(summary, 'highCount')     ?? findings.filter(f => field(f, 'severity') === 'High').length
  const med  = field(summary, 'mediumCount')   ?? findings.filter(f => field(f, 'severity') === 'Medium').length
  const low  = field(summary, 'lowCount')      ?? findings.filter(f => field(f, 'severity') === 'Low').length
  const risk = field(summary, 'riskScore') ?? Math.min(100, Math.round(crit * 20 + high * 8 + med * 2 + low * 0.5))

  const cards = [
    { label: 'Critical', count: crit, color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20'    },
    { label: 'High',     count: high, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: 'Medium',   count: med,  color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20'  },
    { label: 'Low',      count: low,  color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20'   },
  ]

  const riskColor = risk >= 75 ? 'text-red-400' : risk >= 50 ? 'text-orange-400' : risk >= 25 ? 'text-amber-400' : 'text-green-400'
  const circ = 2 * Math.PI * 30
  const offset = circ - (risk / 100) * circ
  const strokeColor = risk >= 75 ? '#f87171' : risk >= 50 ? '#fb923c' : risk >= 25 ? '#fbbf24' : '#4ade80'

  return (
    <div className="flex flex-wrap gap-4">
      {cards.map(c => (
        <div key={c.label} className={`flex-1 min-w-[120px] ${c.bg} border ${c.border} rounded-xl px-5 py-4`}>
          <div className={`text-2xl font-extrabold ${c.color}`}>{c.count}</div>
          <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
        </div>
      ))}
      <div className="flex-1 min-w-[140px] bg-white/3 border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4">
        <svg width="70" height="70" viewBox="0 0 70 70">
          <circle cx="35" cy="35" r="30" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="6" />
          <circle
            cx="35" cy="35" r="30" fill="none"
            stroke={strokeColor} strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 35 35)"
          />
          <text x="35" y="39" textAnchor="middle" fill="white" fontSize="13" fontWeight="800">{risk}</text>
        </svg>
        <div>
          <div className={`text-lg font-extrabold ${riskColor}`}>Risk Score</div>
          <div className="text-xs text-gray-400">0 = safe · 100 = critical</div>
        </div>
      </div>
    </div>
  )
}

function FindingRow({ finding, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const id      = field(finding, 'id')
  const cveId   = field(finding, 'cveId', 'CveId')
  const pkg     = field(finding, 'packageName', 'PackageName')
  const inst    = field(finding, 'installedVersion', 'InstalledVersion')
  const fixed   = field(finding, 'fixedVersion', 'FixedVersion')
  const cvss    = field(finding, 'cvssScore', 'CvssScore')
  const sev     = field(finding, 'severity', 'Severity') || 'Low'
  const epss    = field(finding, 'epssScore', 'EpssScore')
  const desc    = field(finding, 'description', 'Description')
  const status  = field(finding, 'status', 'Status') || 'Open'

  const handleStatus = async (newStatus) => {
    setUpdating(true)
    try {
      await onStatusChange(id, newStatus)
    } finally {
      setUpdating(false)
    }
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
          <StatusPill status={status} />
        </td>
        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
          {status !== 'Fixed' && (
            <div className="flex gap-1 justify-end">
              {status !== 'Accepted' && (
                <button
                  disabled={updating}
                  onClick={() => handleStatus('Accepted')}
                  className="px-2 py-1 text-[10px] font-semibold rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-50"
                >
                  Accept
                </button>
              )}
              <button
                disabled={updating}
                onClick={() => handleStatus('Fixed')}
                className="px-2 py-1 text-[10px] font-semibold rounded bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 disabled:opacity-50"
              >
                Mark Fixed
              </button>
            </div>
          )}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-white/5 bg-white/2">
          <td colSpan={10} className="px-6 py-4">
            <p className="text-sm text-gray-300 leading-relaxed">{desc || 'No description available.'}</p>
          </td>
        </tr>
      )}
    </>
  )
}

export default function VmdrPage() {
  const [agents, setAgents]         = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [findings, setFindings]     = useState([])
  const [summary, setSummary]       = useState(null)
  const [scanMeta, setScanMeta]     = useState(null)
  const [loading, setLoading]       = useState(false)
  const [scanning, setScanning]     = useState(false)
  const [error, setError]           = useState('')
  const [sevFilter, setSevFilter]   = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    getAgents()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.agents ?? [])
        setAgents(list)
        if (list.length > 0) {
          const firstId = field(list[0], 'id', 'agentId', 'AgentId')
          setSelectedId(firstId || '')
        }
      })
      .catch(() => {})

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
      .catch(e => setError(e.message))
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
    } catch (e) {
      setError(e.message)
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

  const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low']

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
            <SummaryCards summary={summary || {}} findings={findings} />
          )}

          {/* Findings table */}
          {(findings.length > 0 || loading) && (
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
                        <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 text-right">Actions</th>
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
          )}

          {!loading && findings.length === 0 && !error && selectedId && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="w-14 h-14 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-lime-400" />
              </div>
              <p className="text-gray-400 text-sm">No findings yet. Run a scan to detect vulnerable packages on this agent.</p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  )
}
