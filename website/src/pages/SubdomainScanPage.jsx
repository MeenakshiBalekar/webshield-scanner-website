import React, { useState } from 'react'
import {
  Globe, ScanLine, Loader2, AlertCircle, AlertTriangle,
  CheckCircle2, ExternalLink, Save, ChevronDown, ChevronUp,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { discoverSubdomains, saveDiscoveredAssets } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function TakeoverBadge({ risk }) {
  if (!risk) return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/50">
      <AlertTriangle className="w-3 h-3" /> Takeover Risk
    </span>
  )
}

function SubdomainRow({ sub, idx }) {
  const [open, setOpen] = useState(false)

  const fqdn        = field(sub, 'fqdn', 'Fqdn', 'subdomain', 'Subdomain', 'host', 'Host') ?? `Subdomain ${idx + 1}`
  const ips         = field(sub, 'ips', 'Ips', 'ip', 'Ip', 'addresses', 'Addresses') ?? []
  const ipList      = Array.isArray(ips) ? ips : [ips].filter(Boolean)
  const cname       = field(sub, 'cname', 'Cname', 'cnameTarget', 'CnameTarget', 'cname_target') ?? ''
  const takeoverRisk = field(sub, 'takeoverRisk', 'TakeoverRisk', 'takeover_risk')
  const statusCode  = field(sub, 'statusCode', 'StatusCode', 'status', 'Status')
  const provider    = field(sub, 'provider', 'Provider')
  const ports       = field(sub, 'openPorts', 'OpenPorts', 'ports', 'Ports') ?? []
  const portList    = Array.isArray(ports) ? ports : []
  const hasTakeover = takeoverRisk !== null && takeoverRisk !== undefined && takeoverRisk !== ''

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${
      hasTakeover ? 'border-red-500/40 bg-red-500/3' : open ? 'border-crimson-500/20' : 'border-white/10'
    }`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        {hasTakeover
          ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          : <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white font-mono truncate">{fqdn}</p>
            {hasTakeover && <TakeoverBadge risk={takeoverRisk} />}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            {ipList.length > 0 && (
              <p className="text-[10px] text-gray-500 font-mono">{ipList.slice(0, 2).join(', ')}{ipList.length > 2 ? ` +${ipList.length - 2}` : ''}</p>
            )}
            {cname && <p className="text-[10px] text-gray-600 font-mono truncate max-w-[200px]">→ {cname}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {statusCode && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
              Number(statusCode) >= 500 ? 'text-red-400 bg-red-500/10 border-red-500/30'
              : Number(statusCode) >= 400 ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
              : 'text-green-400 bg-green-500/10 border-green-500/30'
            }`}>{statusCode}</span>
          )}
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 space-y-3 text-xs">
          {hasTakeover && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
              <p className="text-red-400 font-semibold mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Subdomain Takeover Risk
              </p>
              <p className="text-gray-300">{typeof takeoverRisk === 'string' ? takeoverRisk : 'Dangling CNAME — the target no longer exists and can be claimed by an attacker.'}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {ipList.length > 0 && (
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider mb-1">IP Addresses</p>
                {ipList.map((ip, i) => (
                  <p key={i} className="text-gray-300 font-mono">{ip}</p>
                ))}
              </div>
            )}
            {cname && (
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider mb-1">CNAME Target</p>
                <p className="text-gray-300 font-mono break-all">{cname}</p>
              </div>
            )}
            {provider && (
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider mb-1">Provider</p>
                <p className="text-gray-300">{provider}</p>
              </div>
            )}
            {portList.length > 0 && (
              <div>
                <p className="text-gray-500 font-semibold uppercase tracking-wider mb-1">Open Ports</p>
                <div className="flex flex-wrap gap-1">
                  {portList.map((p, i) => (
                    <span key={i} className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 font-mono text-gray-300">{p}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <a
            href={`https://${fqdn}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-crimson-400 hover:text-crimson-300 transition-colors"
          >
            Visit {fqdn} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  )
}

export default function SubdomainScanPage() {
  const [domain, setDomain]     = useState('')
  const [scanning, setScanning] = useState(false)
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [filter, setFilter]     = useState('all')

  const handleScan = async (e) => {
    e.preventDefault()
    let d = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
    if (!d) { setError('Enter a domain name.'); return }
    setScanning(true); setError(null); setResults(null); setSaved(false)
    try {
      const data = await discoverSubdomains(d)
      setResults(data)
    } catch (err) {
      setError('Subdomain discovery failed')
    }
    setScanning(false)
  }

  const handleSave = async () => {
    if (!results) return
    setSaving(true)
    try {
      await saveDiscoveredAssets({ domain: domain.trim(), subdomains: subdomains })
      setSaved(true)
    } catch (err) {
      alert('Failed to save assets')
    }
    setSaving(false)
  }

  const subdomains = (() => {
    if (!results) return []
    if (Array.isArray(results)) return results
    return results.subdomains ?? results.Subdomains ?? results.results ?? results.Results ?? results.hosts ?? []
  })()

  const takeoverCount = subdomains.filter(s => {
    const r = field(s, 'takeoverRisk', 'TakeoverRisk', 'takeover_risk')
    return r !== null && r !== undefined && r !== ''
  }).length

  const display = filter === 'takeover'
    ? subdomains.filter(s => {
        const r = field(s, 'takeoverRisk', 'TakeoverRisk', 'takeover_risk')
        return r !== null && r !== undefined && r !== ''
      })
    : subdomains

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-teal-500/15 border border-teal-500/30 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Attack Surface Discovery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Subdomain Scanner</h1>
            <p className="text-gray-400 leading-relaxed">
              Discover live subdomains, resolve their IPs and CNAME chains, and
              flag dangling DNS entries at risk of subdomain takeover.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
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
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {scanning ? 'Discovering…' : 'Discover Subdomains'}
            </button>
          </form>

          {results && (
            <div className="space-y-5">
              {/* Summary bar */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <div className="text-xl font-extrabold text-white">{subdomains.length}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Live subdomains</div>
                </div>
                <div className={`bg-white/3 border rounded-xl px-4 py-3 text-center min-w-[80px] ${
                  takeoverCount > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-white/10'
                }`}>
                  <div className={`text-xl font-extrabold ${takeoverCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {takeoverCount}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Takeover risks</div>
                </div>
                {takeoverCount > 0 && (
                  <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {takeoverCount} dangling CNAME{takeoverCount !== 1 ? 's' : ''} — critical
                  </div>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving || saved}
                  className="ml-auto flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saved ? 'Saved to Assets' : saving ? 'Saving…' : 'Save to Assets'}
                </button>
              </div>

              {/* Filter pills */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    filter === 'all' ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'
                  }`}
                >
                  All ({subdomains.length})
                </button>
                {takeoverCount > 0 && (
                  <button
                    onClick={() => setFilter('takeover')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      filter === 'takeover'
                        ? 'bg-red-500 text-white'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    Takeover Risk ({takeoverCount})
                  </button>
                )}
              </div>

              {/* Subdomain list */}
              {display.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                  <p className="text-white font-semibold">No subdomains found</p>
                  <p className="text-sm text-gray-500">Try a different domain or check back after DNS propagation.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {display.map((s, i) => <SubdomainRow key={i} sub={s} idx={i} />)}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
