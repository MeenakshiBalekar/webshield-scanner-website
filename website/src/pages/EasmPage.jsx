import React, { useState, useEffect } from 'react'
import {
  Globe2, ScanLine, Loader2, AlertCircle, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Shield, Trash2, Bell, BellOff,
  Clock, RefreshCw,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { scanEasm, addEasmMonitor, getEasmMonitors, removeEasmMonitor } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const RISK_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

function RiskBadge({ risk }) {
  const s = RISK_STYLE[risk] || RISK_STYLE.Info
  return <span className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded border ${s}`}>{risk || 'Info'}</span>
}

function DnsPassFail({ status }) {
  const pass = String(status).toLowerCase() === 'pass'
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${pass ? 'text-green-400' : 'text-red-400'}`}>
      {pass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
      {pass ? 'Pass' : 'Fail'}
    </span>
  )
}

/* ── Risk Score ring ── */
function RiskRing({ score }) {
  const r = 38
  const circ  = 2 * Math.PI * r
  const pct   = Math.min(100, Math.max(0, score ?? 0))
  const offset = circ - (pct / 100) * circ
  const color = pct >= 75 ? '#ef4444' : pct >= 50 ? '#f97316' : pct >= 25 ? '#f59e0b' : '#22c55e'
  const cls   = pct >= 75 ? 'text-red-400' : pct >= 50 ? 'text-orange-400' : pct >= 25 ? 'text-amber-400' : 'text-green-400'
  const label = pct >= 75 ? 'Critical' : pct >= 50 ? 'High' : pct >= 25 ? 'Medium' : 'Low'
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
          <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="7"
            strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-white">{pct}</span>
          <span className="text-[9px] text-gray-500">/100</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-gray-400 mb-0.5">Attack Surface Risk</p>
        <p className={`text-lg font-extrabold ${cls}`}>{label}</p>
        <p className="text-[10px] text-gray-600 mt-0.5">0 = minimal exposure</p>
      </div>
    </div>
  )
}

/* ── Tab 1: Subdomains ── */
function SubdomainsTab({ subdomains }) {
  const [expanded, setExpanded] = useState({})
  if (!subdomains?.length) return <Empty text="No subdomains discovered." />
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        <span className="col-span-1" />
        <span className="col-span-4">Subdomain</span>
        <span className="col-span-2">IP</span>
        <span className="col-span-3">Open Ports</span>
        <span className="col-span-2 text-right">Risk</span>
      </div>
      <div className="divide-y divide-white/5">
        {subdomains.map((s, i) => {
          const sub   = field(s, 'subdomain', 'Subdomain', 'host', 'Host') ?? '—'
          const ip    = field(s, 'ip', 'Ip', 'IP') ?? '—'
          const ports = field(s, 'openPorts', 'OpenPorts', 'ports', 'Ports') ?? []
          const risk  = field(s, 'risk', 'Risk') ?? 'Info'
          const dns   = field(s, 'dnsRecords', 'DnsRecords', 'records', 'Records') ?? {}
          const hasDns = Object.keys(dns).length > 0 || Object.keys(s).some(k => ['A','AAAA','MX','TXT','CNAME','NS'].includes(k.toUpperCase()))
          const isOpen = expanded[i]

          return (
            <React.Fragment key={i}>
              <div
                className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/3 transition-colors cursor-pointer"
                onClick={() => hasDns && setExpanded(e => ({ ...e, [i]: !e[i] }))}
              >
                <div className="col-span-1">
                  {hasDns && (isOpen
                    ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                    : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />)}
                </div>
                <div className="col-span-4 min-w-0">
                  <span className="text-xs font-mono text-green-300 truncate block">{sub}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-mono text-gray-400">{ip}</span>
                </div>
                <div className="col-span-3">
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(ports) ? ports : []).slice(0, 6).map(p => (
                      <span key={p} className="text-[10px] font-mono bg-white/5 border border-white/10 text-gray-300 px-1.5 py-0.5 rounded">{p}</span>
                    ))}
                    {ports.length > 6 && <span className="text-[10px] text-gray-500">+{ports.length - 6}</span>}
                  </div>
                </div>
                <div className="col-span-2 text-right">
                  <RiskBadge risk={risk} />
                </div>
              </div>
              {isOpen && hasDns && (
                <div className="px-8 pb-3 pt-1 bg-white/2 border-b border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">DNS Records</p>
                  <div className="space-y-1">
                    {Object.entries(dns).map(([type, val]) => (
                      <div key={type} className="flex gap-2 text-xs">
                        <span className="w-12 text-green-400 font-mono font-bold shrink-0">{type}</span>
                        <span className="text-gray-300 font-mono break-all">{Array.isArray(val) ? val.join(', ') : String(val)}</span>
                      </div>
                    ))}
                    {['A','AAAA','MX','TXT','CNAME','NS'].map(t => {
                      const v = s[t] || s[t.toLowerCase()]
                      if (!v || dns[t]) return null
                      return (
                        <div key={t} className="flex gap-2 text-xs">
                          <span className="w-12 text-green-400 font-mono font-bold shrink-0">{t}</span>
                          <span className="text-gray-300 font-mono break-all">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

/* ── Tab 2: Certificates ── */
function CertificatesTab({ certificates }) {
  if (!certificates?.length) return <Empty text="No certificates found." />
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        <span className="col-span-3">Domain</span>
        <span className="col-span-2">Issuer</span>
        <span className="col-span-2">Issued</span>
        <span className="col-span-2">Expires</span>
        <span className="col-span-1">Days Left</span>
        <span className="col-span-2 text-right">Status</span>
      </div>
      <div className="divide-y divide-white/5">
        {certificates.map((c, i) => {
          const domain   = field(c, 'domain', 'Domain', 'commonName', 'CommonName') ?? '—'
          const issuer   = field(c, 'issuer', 'Issuer') ?? '—'
          const issued   = field(c, 'issuedAt', 'IssuedAt', 'issued', 'Issued', 'notBefore', 'NotBefore')
          const expires  = field(c, 'expiresAt', 'ExpiresAt', 'expires', 'Expires', 'notAfter', 'NotAfter')
          const daysLeft = field(c, 'daysLeft', 'DaysLeft', 'daysRemaining', 'DaysRemaining')
          const status   = field(c, 'status', 'Status') ?? (daysLeft < 0 ? 'Expired' : daysLeft < 30 ? 'Expiring Soon' : 'Valid')
          const statusCls = status === 'Expired' ? 'text-red-400'
            : status === 'Expiring Soon' || status?.toLowerCase().includes('expir') ? 'text-orange-400'
            : 'text-green-400'
          const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'

          return (
            <div key={i} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/3 transition-colors">
              <div className="col-span-3 min-w-0">
                <span className="text-xs font-mono text-white truncate block">{domain}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-400 truncate block">{issuer}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-gray-500 font-mono">{fmtDate(issued)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-gray-500 font-mono">{fmtDate(expires)}</span>
              </div>
              <div className="col-span-1">
                <span className={`text-xs font-bold ${daysLeft < 0 ? 'text-red-400' : daysLeft < 30 ? 'text-orange-400' : 'text-gray-300'}`}>
                  {daysLeft != null ? daysLeft : '—'}
                </span>
              </div>
              <div className="col-span-2 text-right">
                <span className={`text-[10px] font-bold ${statusCls}`}>{status}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Tab 3: Exposed Services ── */
function ExposedServicesTab({ services }) {
  if (!services?.length) return <Empty text="No exposed services found." />
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="text-sm text-gray-300">
          <span className="font-bold text-white">{services.length}</span> service{services.length !== 1 ? 's' : ''} exposed to the internet
        </span>
      </div>
      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          <span className="col-span-3">Host</span>
          <span className="col-span-1">Port</span>
          <span className="col-span-2">Service</span>
          <span className="col-span-4">Banner</span>
          <span className="col-span-2 text-right">Risk</span>
        </div>
        <div className="divide-y divide-white/5">
          {services.map((s, i) => {
            const host    = field(s, 'host', 'Host', 'ip', 'Ip') ?? '—'
            const port    = field(s, 'port', 'Port') ?? '—'
            const service = field(s, 'service', 'Service', 'protocol', 'Protocol') ?? '—'
            const banner  = field(s, 'banner', 'Banner', 'version', 'Version') ?? ''
            const risk    = field(s, 'risk', 'Risk') ?? 'Info'
            return (
              <div key={i} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/3 transition-colors">
                <div className="col-span-3 min-w-0">
                  <span className="text-xs font-mono text-white truncate block">{host}</span>
                </div>
                <div className="col-span-1">
                  <span className="text-xs font-mono text-green-300">{port}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs font-semibold text-gray-300">{service}</span>
                </div>
                <div className="col-span-4 min-w-0">
                  <span className="text-[10px] font-mono text-gray-500 truncate block">{banner || '—'}</span>
                </div>
                <div className="col-span-2 text-right">
                  <RiskBadge risk={risk} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Tab 4: DNS Security ── */
function DnsSecurityTab({ checks }) {
  if (!checks?.length) return <Empty text="No DNS security checks available." />
  const passed = checks.filter(c => String(field(c,'status','Status')||'').toLowerCase() === 'pass').length
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3">
          <p className="text-xl font-extrabold text-green-400">{passed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Passed</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3">
          <p className="text-xl font-extrabold text-red-400">{checks.length - passed}</p>
          <p className="text-xs text-gray-400 mt-0.5">Failed</p>
        </div>
      </div>
      <div className="bg-white/3 border border-white/10 rounded-2xl divide-y divide-white/5">
        {checks.map((c, i) => {
          const name    = field(c, 'check', 'Check', 'name', 'Name', 'checkName', 'CheckName') ?? '—'
          const status  = field(c, 'status', 'Status') ?? 'Fail'
          const details = field(c, 'details', 'Details', 'description', 'Description', 'value', 'Value') ?? ''
          return (
            <div key={i} className="flex items-start gap-4 px-5 py-4">
              <DnsPassFail status={status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{name}</p>
                {details && <p className="text-xs text-gray-400 mt-0.5 font-mono break-all">{details}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Monitor section ── */
function MonitorSection({ domain, onMonitorAdded }) {
  const [monitors, setMonitors] = useState([])
  const [adding, setAdding]     = useState(false)
  const [removing, setRemoving] = useState({})
  const [error, setError]       = useState(null)

  useEffect(() => {
    getEasmMonitors()
      .then(data => setMonitors(Array.isArray(data) ? data : (data?.monitors ?? [])))
      .catch(() => {})
  }, [])

  const isMonitored = monitors.some(m => (field(m,'domain','Domain') || '').toLowerCase() === (domain || '').toLowerCase())

  const handleAdd = async () => {
    if (!domain) return
    setAdding(true); setError(null)
    try {
      const m = await addEasmMonitor(domain)
      setMonitors(prev => [...prev, m])
      onMonitorAdded?.()
    } catch (e) { setError(e.message || 'Failed to add monitor') }
    setAdding(false)
  }

  const handleRemove = async (id) => {
    setRemoving(r => ({ ...r, [id]: true }))
    try {
      await removeEasmMonitor(id)
      setMonitors(prev => prev.filter(m => (field(m,'id','Id','monitorId','MonitorId')) !== id))
    } catch (e) { setError(e.message || 'Failed to remove monitor') }
    setRemoving(r => ({ ...r, [id]: false }))
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-bold text-white mb-0.5">Domain Monitoring</p>
          <p className="text-xs text-gray-500">Get alerted when the attack surface changes.</p>
        </div>
        {domain && (
          <button
            onClick={handleAdd}
            disabled={adding || isMonitored}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
              isMonitored
                ? 'bg-green-500/10 border-green-500/25 text-green-400 cursor-default'
                : 'bg-white/5 hover:bg-white/10 border-white/15 text-gray-300 hover:text-white'
            } disabled:opacity-60`}
          >
            {adding
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : isMonitored ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {isMonitored ? 'Monitoring active' : `Monitor ${domain}`}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {monitors.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Monitored Domains</p>
          {monitors.map((m, i) => {
            const id     = field(m, 'id', 'Id', 'monitorId', 'MonitorId') ?? i
            const dom    = field(m, 'domain', 'Domain') ?? '—'
            const since  = field(m, 'createdAt', 'CreatedAt', 'addedAt', 'AddedAt')
            return (
              <div key={id} className="flex items-center gap-3 bg-white/3 border border-white/8 rounded-xl px-4 py-2.5">
                <Bell className="w-3.5 h-3.5 text-green-400 shrink-0" />
                <span className="text-sm text-white flex-1 font-mono">{dom}</span>
                {since && (
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(since).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => handleRemove(id)}
                  disabled={removing[id]}
                  className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  {removing[id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Empty({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-500 text-sm">
      <Globe2 className="w-8 h-8 opacity-30" />
      {text}
    </div>
  )
}

const TABS = [
  { id: 'subdomains', label: 'Subdomains'       },
  { id: 'certs',      label: 'Certificates'     },
  { id: 'services',   label: 'Exposed Services' },
  { id: 'dns',        label: 'DNS Security'     },
]

export default function EasmPage() {
  const [domain, setDomain]     = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [tab, setTab]           = useState('subdomains')

  const handleScan = async (e) => {
    e.preventDefault()
    const d = domain.trim().replace(/^https?:\/\//i, '').split('/')[0]
    if (!d) return
    setScanning(true); setError(null); setResult(null)
    try {
      const data = await scanEasm(d)
      setResult(data)
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const subdomains = result ? (field(result,'subdomains','Subdomains') ?? []) : []
  const certs      = result ? (field(result,'certificates','Certificates') ?? []) : []
  const services   = result ? (field(result,'exposedServices','ExposedServices') ?? []) : []
  const dnsChecks  = result ? (field(result,'dnsChecks','DnsChecks') ?? []) : []
  const riskScore  = result ? field(result,'riskScore','RiskScore') : null
  const scannedDomain = result ? (field(result,'domain','Domain') || domain) : ''

  const tabCounts = {
    subdomains: subdomains.length,
    certs:      certs.length,
    services:   services.length,
    dns:        dnsChecks.length,
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-green-500/15 border border-green-500/30 rounded-lg flex items-center justify-center">
                <Globe2 className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-green-400">EASM</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              External Attack Surface Management
            </h1>
            <p className="text-gray-400 max-w-2xl leading-relaxed">
              Discover subdomains, audit TLS certificates, enumerate exposed services, and validate DNS security controls across your external attack surface.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

          {/* Scan form */}
          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6">
            <label className="block text-xs text-gray-400 mb-2">Domain to scan</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                className="flex-1 bg-white/5 border border-white/15 focus:border-green-500/50 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={scanning || !domain.trim()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/30 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                {scanning
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
                  : <><ScanLine className="w-4 h-4" /> Scan Attack Surface</>}
              </button>
            </div>
            <p className="text-[10px] text-gray-600 mt-2">Enter a root domain without protocol. Subdomains are discovered automatically.</p>
          </form>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {result && (
            <>
              {/* Summary row */}
              <div className="flex flex-wrap gap-4 items-center">
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                  <RiskRing score={riskScore} />
                </div>
                <div className="flex flex-wrap gap-3 flex-1">
                  {[
                    { label: 'Subdomains',       count: subdomains.length, cls: 'text-green-400' },
                    { label: 'Certificates',      count: certs.length,     cls: 'text-blue-400'  },
                    { label: 'Exposed Services', count: services.length,   cls: 'text-orange-400'},
                    { label: 'DNS Checks',        count: dnsChecks.length, cls: 'text-purple-400'},
                  ].map(({ label, count, cls }) => (
                    <div key={label} className="bg-white/3 border border-white/10 rounded-xl px-5 py-4 min-w-[110px]">
                      <p className={`text-2xl font-extrabold ${cls}`}>{count}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                  {field(result,'scannedAt','ScannedAt') && (
                    <div className="bg-white/3 border border-white/10 rounded-xl px-5 py-4 min-w-[140px]">
                      <p className="text-xs text-gray-500 mb-0.5">Scanned</p>
                      <p className="text-xs text-white font-mono">
                        {new Date(field(result,'scannedAt','ScannedAt')).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tab bar */}
              <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                      tab === id ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                    {tabCounts[id] > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-white/20' : 'bg-white/10'}`}>
                        {tabCounts[id]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {tab === 'subdomains' && <SubdomainsTab subdomains={subdomains} />}
              {tab === 'certs'      && <CertificatesTab certificates={certs} />}
              {tab === 'services'   && <ExposedServicesTab services={services} />}
              {tab === 'dns'        && <DnsSecurityTab checks={dnsChecks} />}
            </>
          )}

          {/* Monitor section — always visible */}
          <MonitorSection domain={scannedDomain || domain.trim().replace(/^https?:\/\//i,'').split('/')[0]} />

        </div>
      </main>

      <Footer />
    </div>
  )
}
