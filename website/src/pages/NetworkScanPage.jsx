import React, { useState } from 'react'
import {
  Network, ScanLine, Loader2, AlertCircle, ChevronDown, ChevronUp,
  Wifi, Shield, Radio, AlertTriangle, Info, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { startNetworkScan } from '../services/api'
import ApiErrorBanner from '../components/ApiErrorBanner'

/* ── helpers ── */
const RISK_STYLES = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         bar: 'bg-red-500',    icon: AlertTriangle },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', bar: 'bg-orange-500', icon: AlertTriangle },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', bar: 'bg-yellow-400', icon: Info },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       bar: 'bg-blue-400',   icon: Info },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       bar: 'bg-gray-500',   icon: CheckCircle2 },
}
const STATE_STYLES = {
  open:     'text-green-400 bg-green-500/10 border-green-500/30',
  filtered: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  closed:   'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }

function riskStyle(r) { return RISK_STYLES[r] || RISK_STYLES.Info }
function stateStyle(s) { return STATE_STYLES[s?.toLowerCase()] || STATE_STYLES.closed }

/* ── CVE pill ── */
function CvePill({ cve }) {
  const id   = field(cve, 'id', 'Id', 'cveId', 'CveId') || '—'
  const cvss = field(cve, 'cvss', 'Cvss', 'cvssScore', 'CvssScore')
  const sev  = field(cve, 'severity', 'Severity') || 'Medium'
  const desc = field(cve, 'description', 'Description', 'summary', 'Summary')
  const style = riskStyle(sev)
  return (
    <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-lg px-3 py-2 min-w-0">
      <code className="text-xs font-mono text-blue-400 shrink-0">{id}</code>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${style.badge}`}>{sev}</span>
      {cvss != null && <span className="text-xs text-gray-400 shrink-0">CVSS {cvss}</span>}
      {desc && <span className="text-xs text-gray-500 truncate">{desc}</span>}
    </div>
  )
}

/* ── Risk heatmap table ── */
function RiskHeatmapTable({ findings }) {
  const risks    = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const services = [...new Set(findings.map(f =>
    field(f, 'service', 'Service', 'serviceName', 'ServiceName') || 'Unknown'
  ))]

  if (services.length < 2) return null

  const heatCls = (n) => {
    if (n === 0) return ''
    if (n >= 3) return 'bg-red-500/25 text-red-300 font-bold'
    if (n >= 2) return 'bg-orange-500/20 text-orange-300 font-bold'
    return 'bg-yellow-500/15 text-yellow-300 font-semibold'
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Heatmap — Service × Severity</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-2.5 text-gray-500 font-semibold w-32">Service</th>
              {risks.map(r => (
                <th key={r} className="text-center px-4 py-2.5 text-gray-500 font-semibold">{r}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {services.map(svc => (
              <tr key={svc} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-4 py-2.5 font-mono font-semibold text-white">{svc}</td>
                {risks.map(r => {
                  const cnt = findings.filter(f =>
                    (field(f,'service','Service','serviceName','ServiceName') || 'Unknown') === svc &&
                    (field(f,'risk','Risk','severity','Severity') || 'Info') === r
                  ).length
                  return (
                    <td key={r} className={`text-center px-4 py-2.5 transition-colors ${heatCls(cnt)}`}>
                      {cnt > 0 ? cnt : <span className="text-gray-700 font-normal">—</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Port card ── */
function PortCard({ finding }) {
  const [open, setOpen] = useState(false)

  const port     = field(finding, 'port', 'Port')
  const service  = field(finding, 'service', 'Service', 'serviceName', 'ServiceName')
  const state    = field(finding, 'state', 'State', 'status', 'Status') || 'open'
  const risk     = field(finding, 'risk', 'Risk', 'severity', 'Severity') || 'Info'
  const advice   = field(finding, 'advice', 'Advice', 'recommendation', 'Recommendation', 'fix', 'Fix')
  const desc     = field(finding, 'description', 'Description')
  const protocol = field(finding, 'protocol', 'Protocol') || 'tcp'
  const banner   = field(finding, 'banner', 'Banner', 'version', 'Version')
  const cves     = field(finding, 'cves', 'Cves', 'vulnerabilities', 'Vulnerabilities') || []

  const style    = riskStyle(risk)
  const RiskIcon = style.icon

  return (
    <div
      className={`bg-white/3 border rounded-2xl overflow-hidden transition-all cursor-pointer ${
        open ? 'border-crimson-500/40' : 'border-white/10 hover:border-white/20'
      }`}
      onClick={() => setOpen(o => !o)}
    >
      {/* Card header — always visible */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Port number */}
        <div className="w-14 shrink-0 text-center">
          <div className="text-2xl font-extrabold text-white leading-none">{port}</div>
          <div className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{protocol}</div>
        </div>

        {/* Service + state */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold text-white">{service || 'Unknown'}</span>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${stateStyle(state)}`}>
              {state}
            </span>
          </div>
          {desc && !open && (
            <p className="text-xs text-gray-500 truncate">{desc}</p>
          )}
        </div>

        {/* Risk badge + chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${style.badge}`}>
            {risk}
          </span>
          {open
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          }
        </div>
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-white/10 px-5 pb-4 pt-3 space-y-3" onClick={e => e.stopPropagation()}>
          {desc && <p className="text-sm text-gray-400">{desc}</p>}

          {banner && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Banner / Version</p>
              <code className="block bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono break-all">
                {banner}
              </code>
            </div>
          )}

          {cves.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
                CVE Matches ({cves.length})
              </p>
              <div className="space-y-1.5">
                {cves.map((cve, i) => <CvePill key={i} cve={cve} />)}
              </div>
            </div>
          )}

          {advice && (
            <div className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${style.badge} bg-opacity-5`}
              style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
              <RiskIcon className={`w-4 h-4 shrink-0 mt-0.5 ${style.badge.split(' ')[0]}`} />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">What to do</p>
                <p className="text-sm text-gray-300">{advice}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Risk summary bar ── */
function RiskBar({ findings }) {
  const risks   = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const counts  = risks.reduce((acc, r) => {
    acc[r] = findings.filter(f => (field(f,'risk','Risk','severity','Severity') || 'Info') === r).length
    return acc
  }, {})
  const total   = findings.length || 1
  const colors  = { Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-yellow-400', Low: 'bg-blue-400', Info: 'bg-gray-500' }

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Risk Breakdown</p>
        <span className="text-xs text-gray-500">{findings.length} open port{findings.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
        {risks.map(r => counts[r] > 0 && (
          <div key={r} className={colors[r]} style={{ width: `${(counts[r] / total) * 100}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {risks.filter(r => counts[r] > 0).map(r => (
          <div key={r} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${colors[r]}`} />
            <span className="text-xs text-gray-400">{r}: <span className="text-white font-semibold">{counts[r]}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function NetworkScanPage() {
  const [host, setHost]         = useState('')
  const [mode, setMode]         = useState('standard')
  const [scanning, setScanning] = useState(false)
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState(null)
  const [riskFilter, setFilter] = useState('')

  const handleScan = async (e) => {
    e.preventDefault()
    setScanning(true); setError(null); setResults(null)
    try {
      const data = await startNetworkScan({ host, mode })
      setResults(data)
    } catch (err) {
      setError(err)
    }
    setScanning(false)
  }

  const findings  = results?.findings ?? results?.Findings ?? results?.ports ?? results?.Ports ?? []
  const risks     = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const filtered  = riskFilter
    ? findings.filter(f => (field(f,'risk','Risk','severity','Severity') || 'Info') === riskFilter)
    : findings

  const scannedHost = results?.host ?? results?.Host ?? host
  const scanTime    = results?.scanTime ?? results?.ScanTime ?? results?.duration

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <Network className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Network / Port Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Port Exposure Audit</h1>
            <p className="text-gray-400 leading-relaxed">
              Scan a host for open ports and exposed services. Each finding includes a risk rating and
              actionable advice so you know exactly what to close, restrict, or monitor.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {/* Scan form */}
          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-crimson-400" /> Target
            </h2>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Host / IP / Domain *</label>
              <input
                required
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="192.168.1.1 or example.com"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-2">Scan Mode</label>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    id:    'standard',
                    label: 'Standard',
                    desc:  'Top 1,000 ports — fast, covers most exposed services (~30s)',
                    icon:  Wifi,
                  },
                  {
                    id:    'extended',
                    label: 'Extended',
                    desc:  'All 65,535 ports — full coverage for comprehensive audits (~5min)',
                    icon:  Shield,
                  },
                ].map(({ id, label, desc, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setMode(id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      mode === id
                        ? 'bg-crimson-500/10 border-crimson-500/40'
                        : 'bg-white/3 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${mode === id ? 'text-crimson-400' : 'text-gray-400'}`} />
                      <span className={`text-sm font-semibold ${mode === id ? 'text-white' : 'text-gray-300'}`}>
                        {label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && <ApiErrorBanner error={error} />}

            <button
              type="submit"
              disabled={scanning}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {scanning ? 'Scanning…' : 'Start Port Scan'}
            </button>
          </form>

          {/* Results */}
          {results && (
            <div className="space-y-5">
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="font-mono text-white">{scannedHost}</span>
                <span className="text-gray-600">·</span>
                <span className="capitalize">{mode} scan</span>
                {scanTime && (
                  <>
                    <span className="text-gray-600">·</span>
                    <span>Completed in {typeof scanTime === 'number' ? `${scanTime}s` : scanTime}</span>
                  </>
                )}
              </div>

              {findings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                  <p className="text-white font-semibold">No open ports found</p>
                  <p className="text-sm text-gray-500">The host appears to have no exposed services in the scanned range.</p>
                </div>
              ) : (
                <>
                  <RiskBar findings={findings} />

                  <RiskHeatmapTable findings={findings} />

                  {/* Risk filter pills */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilter('')}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        !riskFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'
                      }`}
                    >
                      All ({findings.length})
                    </button>
                    {risks.filter(r =>
                      findings.some(f => (field(f,'risk','Risk','severity','Severity') || 'Info') === r)
                    ).map(r => {
                      const cnt   = findings.filter(f => (field(f,'risk','Risk','severity','Severity') || 'Info') === r).length
                      const style = riskStyle(r)
                      return (
                        <button
                          key={r}
                          onClick={() => setFilter(riskFilter === r ? '' : r)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            riskFilter === r
                              ? `${style.badge} border-current`
                              : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'
                          }`}
                        >
                          {r} ({cnt})
                        </button>
                      )
                    })}
                  </div>

                  {/* Port cards */}
                  <div className="space-y-3">
                    {filtered.map((f, i) => <PortCard key={i} finding={f} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
