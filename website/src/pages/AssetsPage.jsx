import React, { useState, useEffect, useCallback } from 'react'
import { Server, Globe, Database, Wifi, Shield, ChevronDown, ChevronUp, RefreshCw, Loader2, AlertCircle, Filter, Tag } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const TYPE_ICONS = { host: Server, domain: Globe, service: Database, ip: Wifi }

function typeIcon(type) {
  const Icon = TYPE_ICONS[(type || '').toLowerCase()] || Globe
  return <Icon className="w-4 h-4" />
}

function riskLevel(score) {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

const RISK_BADGE = {
  Critical: 'text-red-400 bg-red-500/10 border border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border border-orange-500/30',
  Medium:   'text-amber-400 bg-amber-500/10 border border-amber-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border border-blue-500/30',
}

function RiskBadge({ score }) {
  if (score == null) return <span className="text-gray-500 text-xs">—</span>
  const level = riskLevel(score)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_BADGE[level]}`}>
      {score} <span className="font-normal opacity-70">{level}</span>
    </span>
  )
}

function relativeDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d)) return '—'
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays}d ago`
}

function PortsChip({ ports }) {
  const count = Array.isArray(ports) ? ports.length : (ports ?? 0)
  if (!count) return <span className="text-gray-600 text-xs">—</span>
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-full">
      {count} {count === 1 ? 'port' : 'ports'}
    </span>
  )
}

function TechStackChips({ stack }) {
  const arr = Array.isArray(stack) ? stack : []
  const display = arr.slice(0, 3)
  const overflow = arr.length - 3
  if (!arr.length) return <span className="text-gray-600 text-xs">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {display.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1 text-xs font-medium bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
          <Tag className="w-2.5 h-2.5" />
          {typeof t === 'string' ? t : (t.name ?? t.Name ?? JSON.stringify(t))}
        </span>
      ))}
      {overflow > 0 && (
        <span className="text-xs text-gray-500 px-1">+{overflow}</span>
      )}
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value ?? '—'}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function ExpandedRow({ asset }) {
  const ports = field(asset, 'openPorts', 'open_ports', 'ports') ?? []
  const stack = field(asset, 'techStack', 'tech_stack', 'technologies') ?? []
  const score = field(asset, 'riskScore', 'risk_score', 'score')
  const level = score != null ? riskLevel(score) : null

  const id = field(asset, 'id', 'Id', 'assetId')

  const [owner,       setOwner]       = useState(field(asset, 'owner', 'Owner') ?? '')
  const [environment, setEnvironment] = useState(field(asset, 'environment', 'Environment', 'env') ?? '')
  const [criticality, setCriticality] = useState(field(asset, 'criticality', 'Criticality') ?? '')
  const [pciScope,    setPciScope]    = useState(field(asset, 'pciScope', 'PciScope', 'pci_scope') ?? false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BASE}/api/assets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ owner, environment, criticality, pciScope }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch {}
    setSaving(false)
  }

  return (
    <div>
      <div className="px-6 py-4 bg-violet-500/5 border-t border-violet-500/10 grid sm:grid-cols-3 gap-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Open Ports</p>
          {Array.isArray(ports) && ports.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {ports.map((p, i) => (
                <span key={i} className="text-xs font-mono bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded">
                  {typeof p === 'object' ? (p.port ?? p.Port ?? JSON.stringify(p)) : p}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xs">None detected</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Full Tech Stack</p>
          {stack.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {stack.map((t, i) => (
                <span key={i} className="text-xs font-medium bg-violet-500/10 border border-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">
                  {typeof t === 'string' ? t : (t.name ?? t.Name ?? JSON.stringify(t))}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-xs">None detected</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Risk Score Detail</p>
          {score != null ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${level === 'Critical' ? 'text-red-400' : level === 'High' ? 'text-orange-400' : level === 'Medium' ? 'text-amber-400' : 'text-blue-400'}`}>{score}</span>
                <span className="text-gray-500 text-xs">/ 100 · {level}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-32">
                <div
                  className={`h-full rounded-full ${level === 'Critical' ? 'bg-red-500' : level === 'High' ? 'bg-orange-500' : level === 'Medium' ? 'bg-amber-400' : 'bg-blue-400'}`}
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-gray-600 text-xs">Not scanned</p>
          )}
        </div>
      </div>

      {/* Asset Configuration */}
      <div className="px-6 py-4 bg-violet-500/5 border-t border-violet-500/10">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Asset Configuration</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Owner */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Owner</label>
            <input
              type="text"
              value={owner}
              onChange={e => setOwner(e.target.value)}
              placeholder="team@company.com"
              className="w-full bg-white/5 border border-white/15 focus:border-violet-500/50 text-white placeholder-gray-600 px-3 py-2 rounded-lg text-xs outline-none transition-colors"
            />
          </div>

          {/* Environment */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Environment</label>
            <select
              value={environment}
              onChange={e => setEnvironment(e.target.value)}
              className="w-full bg-white/5 border border-white/15 focus:border-violet-500/50 text-white px-3 py-2 rounded-lg text-xs outline-none transition-colors appearance-none"
              style={{ colorScheme: 'dark' }}
            >
              <option value="">— Select —</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
              <option value="QA">QA</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Criticality */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Criticality</label>
            <div className="flex gap-1 flex-wrap">
              {['Critical', 'High', 'Medium', 'Low'].map(c => {
                const active = criticality === c
                const activeStyle = {
                  Critical: active ? 'bg-red-500 text-white border-red-500' : 'border-red-500/30 text-red-400 hover:border-red-500/60',
                  High:     active ? 'bg-orange-500 text-white border-orange-500' : 'border-orange-500/30 text-orange-400 hover:border-orange-500/60',
                  Medium:   active ? 'bg-amber-500 text-white border-amber-500' : 'border-amber-500/30 text-amber-400 hover:border-amber-500/60',
                  Low:      active ? 'bg-blue-500 text-white border-blue-500' : 'border-blue-500/30 text-blue-400 hover:border-blue-500/60',
                }
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCriticality(active ? '' : c)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-colors ${activeStyle[c]}`}
                  >
                    {c}
                  </button>
                )
              })}
            </div>
          </div>

          {/* PCI Scope */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">PCI Scope</label>
            <div className="flex items-center gap-2.5 mt-1.5">
              <button
                type="button"
                onClick={() => setPciScope(v => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  pciScope ? 'bg-violet-500' : 'bg-white/15'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${pciScope ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className={`text-xs font-medium ${pciScope ? 'text-violet-300' : 'text-gray-500'}`}>
                {pciScope ? 'In PCI Scope' : 'Out of scope'}
              </span>
            </div>
          </div>

        </div>

        {/* Save button */}
        <div className="flex items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !id}
            className="flex items-center gap-1.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-400 font-semibold px-4 py-2 rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            {saving
              ? <><span className="w-3 h-3 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> Saving…</>
              : 'Save Configuration'
            }
          </button>
          {saved && (
            <span className="text-xs text-green-400 flex items-center gap-1">
              ✓ Saved
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState({})
  const [expanded, setExpanded] = useState({})
  const [filterRisk, setFilterRisk] = useState('All')
  const [filterType, setFilterType] = useState('All')
  const [filterSeen, setFilterSeen] = useState('All time')

  const authHeaders = () => {
    const token = localStorage.getItem('ws_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [summaryRes, listRes] = await Promise.allSettled([
        fetch(`${BASE}/api/assets/summary`, { headers: authHeaders() }),
        fetch(`${BASE}/api/assets`, { headers: authHeaders() }),
      ])

      if (summaryRes.status === 'fulfilled' && summaryRes.value.ok) {
        const data = await summaryRes.value.json()
        setSummary(data)
      }

      if (listRes.status === 'fulfilled' && listRes.value.ok) {
        const data = await listRes.value.json()
        const arr = Array.isArray(data) ? data : (field(data, 'assets', 'Assets', 'data') ?? [])
        setAssets(arr)
      } else {
        setError('Failed to load assets.')
      }
    } catch (ex) {
      setError(ex.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleScan = async (asset, e) => {
    e.stopPropagation()
    const id = field(asset, 'id', 'Id')
    setScanning(s => ({ ...s, [id]: true }))
    try {
      await fetch(`${BASE}/api/assets/${id}/scan`, {
        method: 'POST',
        headers: authHeaders(),
      })
      await load()
    } catch {}
    setScanning(s => ({ ...s, [id]: false }))
  }

  const toggleRow = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const computedSummary = (() => {
    if (summary) return summary
    const counts = { total: assets.length, critical: 0, high: 0, medium: 0, low: 0 }
    assets.forEach(a => {
      const score = field(a, 'riskScore', 'risk_score', 'score')
      if (score == null) return
      const level = riskLevel(score).toLowerCase()
      if (counts[level] != null) counts[level]++
    })
    return counts
  })()

  const total    = field(computedSummary, 'total', 'Total', 'totalAssets', 'total_assets') ?? assets.length
  const critical = field(computedSummary, 'critical', 'Critical', 'criticalCount', 'critical_count') ?? 0
  const high     = field(computedSummary, 'high', 'High', 'highCount', 'high_count') ?? 0
  const medium   = field(computedSummary, 'medium', 'Medium', 'mediumCount', 'medium_count') ?? 0
  const low      = field(computedSummary, 'low', 'Low', 'lowCount', 'low_count') ?? 0

  const filtered = assets.filter(a => {
    const score = field(a, 'riskScore', 'risk_score', 'score')
    const type  = (field(a, 'type', 'Type', 'assetType', 'asset_type') ?? '').toLowerCase()
    const lastSeen = field(a, 'lastScanned', 'last_scanned', 'lastScan', 'last_scan', 'updatedAt', 'updated_at')

    if (filterRisk !== 'All') {
      if (score == null) return false
      if (riskLevel(score) !== filterRisk) return false
    }

    if (filterType !== 'All') {
      if (type !== filterType.toLowerCase()) return false
    }

    if (filterSeen !== 'All time' && lastSeen) {
      const diffDays = (Date.now() - new Date(lastSeen)) / 86400000
      if (filterSeen === 'Last 7 days' && diffDays > 7) return false
      if (filterSeen === 'Last 30 days' && diffDays > 30) return false
    }

    return true
  })

  const selectCls = 'bg-white/5 border border-white/10 text-gray-300 text-sm px-3 py-2 rounded-xl outline-none focus:border-violet-500/50 transition-colors appearance-none cursor-pointer'

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 px-4 py-10 bg-violet-500/5">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2 block">Asset Inventory</span>
              <h1 className="text-3xl font-extrabold text-white">Asset Inventory</h1>
              <p className="text-gray-400 text-sm mt-1">Monitor and manage all your external-facing assets.</p>
            </div>
            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <SummaryCard label="Total Assets" value={total}    color="text-violet-400" />
            <SummaryCard label="Critical"     value={critical} color="text-red-400"    />
            <SummaryCard label="High"         value={high}     color="text-orange-400" />
            <SummaryCard label="Medium"       value={medium}   color="text-amber-400"  />
            <SummaryCard label="Low"          value={low}      color="text-blue-400"   />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-gray-500">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
              </div>
              <div style={{ colorScheme: 'dark' }}>
                <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className={selectCls}>
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map(v => (
                    <option key={v} value={v} className="bg-[#0d1020]">{v === 'All' ? 'All Risks' : v}</option>
                  ))}
                </select>
              </div>
              <div style={{ colorScheme: 'dark' }}>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className={selectCls}>
                  {['All', 'host', 'domain', 'service', 'ip'].map(v => (
                    <option key={v} value={v} className="bg-[#0d1020]">{v === 'All' ? 'All Types' : v}</option>
                  ))}
                </select>
              </div>
              <div style={{ colorScheme: 'dark' }}>
                <select value={filterSeen} onChange={e => setFilterSeen(e.target.value)} className={selectCls}>
                  {['All time', 'Last 7 days', 'Last 30 days'].map(v => (
                    <option key={v} value={v} className="bg-[#0d1020]">{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <span className="text-sm text-gray-500 font-medium">{filtered.length} asset{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
              <button onClick={load} className="ml-auto text-xs underline">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-12 text-center">
              <Shield className="w-12 h-12 text-violet-400/40 mx-auto mb-4" />
              <p className="text-white font-semibold text-lg mb-2">No assets found</p>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Run an EASM (External Attack Surface Management) scan to automatically discover and inventory your external-facing assets.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-10 text-center">
              <p className="text-gray-400 font-semibold">No assets match the current filters</p>
              <button onClick={() => { setFilterRisk('All'); setFilterType('All'); setFilterSeen('All time') }}
                className="mt-3 text-sm text-violet-400 hover:text-violet-300 underline transition-colors">
                Clear filters
              </button>
            </div>
          ) : (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/3">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Asset</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Risk Score</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Last Scanned</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Open Ports</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Tech Stack</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                      <th className="w-8 px-2 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((asset, i) => {
                      const id         = field(asset, 'id', 'Id') ?? i
                      const name       = field(asset, 'name', 'Name', 'hostname', 'host') ?? 'Unknown'
                      const type       = field(asset, 'type', 'Type', 'assetType', 'asset_type') ?? ''
                      const score      = field(asset, 'riskScore', 'risk_score', 'score')
                      const lastScan   = field(asset, 'lastScanned', 'last_scanned', 'lastScan', 'last_scan', 'updatedAt', 'updated_at')
                      const ports      = field(asset, 'openPorts', 'open_ports', 'ports') ?? []
                      const stack      = field(asset, 'techStack', 'tech_stack', 'technologies') ?? []
                      const isExpanded = !!expanded[id]
                      const isScanning = !!scanning[id]

                      return (
                        <React.Fragment key={id}>
                          <tr
                            onClick={() => toggleRow(id)}
                            className="border-b border-white/5 hover:bg-violet-500/5 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center shrink-0 text-violet-400">
                                  {typeIcon(type)}
                                </div>
                                <div>
                                  <p className="text-white font-semibold">{name}</p>
                                  {type && <p className="text-gray-500 text-xs capitalize">{type}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <RiskBadge score={score} />
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-gray-400 text-xs">{relativeDate(lastScan)}</span>
                            </td>
                            <td className="px-4 py-4">
                              <PortsChip ports={ports} />
                            </td>
                            <td className="px-4 py-4">
                              <TechStackChips stack={stack} />
                            </td>
                            <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={e => handleScan(asset, e)}
                                disabled={isScanning}
                                className="flex items-center gap-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {isScanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                Scan
                              </button>
                            </td>
                            <td className="px-2 py-4 text-gray-600">
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="border-b border-white/5">
                              <td colSpan={7} className="p-0">
                                <ExpandedRow asset={asset} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
