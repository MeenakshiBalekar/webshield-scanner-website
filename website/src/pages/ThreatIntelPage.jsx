import React, { useState } from 'react'
import {
  Target, Loader2, AlertCircle, CheckCircle2, XCircle,
  ExternalLink, Globe, Shield, Wifi,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { mapAttackTechniques, checkIocs, getShodanHost } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

/* ── Tactic colour palette ── */
const TACTIC_COLORS = {
  'Reconnaissance':       { bg: 'bg-gray-500/10',    border: 'border-gray-500/20',    text: 'text-gray-400'   },
  'Resource Development': { bg: 'bg-gray-500/10',    border: 'border-gray-500/20',    text: 'text-gray-400'   },
  'Initial Access':       { bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400' },
  'Execution':            { bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400'    },
  'Persistence':          { bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400'    },
  'Privilege Escalation': { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    text: 'text-rose-400'   },
  'Defense Evasion':      { bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400' },
  'Credential Access':    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400'   },
  'Discovery':            { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20',    text: 'text-cyan-400'   },
  'Lateral Movement':     { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400'  },
  'Collection':           { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20',  text: 'text-yellow-400' },
  'Command and Control':  { bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400'    },
  'Exfiltration':         { bg: 'bg-orange-500/10',  border: 'border-orange-500/20',  text: 'text-orange-400' },
  'Impact':               { bg: 'bg-red-500/10',     border: 'border-red-500/20',     text: 'text-red-400'    },
}
const DEFAULT_TACTIC = { bg: 'bg-gray-500/10', border: 'border-gray-500/20', text: 'text-gray-400' }

function ErrorBanner({ error }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />{error}
    </div>
  )
}

/* ─────────────────────────────────────────
   Tab 1 — ATT&CK Mapper
───────────────────────────────────────── */
function AttackMapperTab() {
  const [mode, setMode]     = useState('cve')
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState(null)

  const map = async () => {
    if (!input.trim()) return
    setLoad(true); setError(null); setResult(null)
    try {
      const payload = mode === 'cve'
        ? { cveIds: input.split(/[\n,\s]+/).map(s => s.trim()).filter(s => /CVE-\d{4}-\d+/i.test(s)) }
        : { findings: input.trim() }
      setResult(await mapAttackTechniques(payload))
    } catch (e) { setError(e.message || 'ATT&CK mapping failed') }
    setLoad(false)
  }

  const tactics = (() => {
    if (!result) return []
    const direct = field(result, 'tactics', 'Tactics')
    if (Array.isArray(direct)) return direct
    const flat = field(result, 'techniques', 'Techniques') ?? (Array.isArray(result) ? result : [])
    const grouped = {}
    flat.forEach(t => {
      const tac = field(t, 'tactic', 'Tactic', 'tacticName', 'TacticName') ?? 'Unknown'
      if (!grouped[tac]) grouped[tac] = []
      grouped[tac].push(t)
    })
    return Object.entries(grouped).map(([name, techniques]) => ({ name, techniques }))
  })()

  const techCount = tactics.reduce((n, t) => n + ((t.techniques ?? t.Techniques ?? []).length), 0)

  return (
    <div className="space-y-5">
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-4 w-fit">
          {[['cve', 'CVE IDs'], ['findings', 'Scan Findings']].map(([v, l]) => (
            <button key={v} onClick={() => setMode(v)}
              className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${mode === v ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={mode === 'cve'
            ? 'CVE-2024-1234\nCVE-2023-44487\nCVE-2021-44228'
            : 'Paste raw scan findings, JSON output, or any security report text…'}
          rows={mode === 'cve' ? 5 : 9}
          className="w-full bg-white/5 border border-white/15 focus:border-rose-500 text-gray-200 placeholder-gray-700 px-4 py-3 rounded-xl text-sm font-mono outline-none transition-colors resize-y"
        />

        <button onClick={map} disabled={loading || !input.trim()}
          className="mt-3 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-500/25 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
          {loading ? 'Mapping…' : 'Map to ATT&CK'}
        </button>
      </div>

      {error && <ErrorBanner error={error} />}

      {tactics.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-4">
            {techCount} technique{techCount !== 1 ? 's' : ''} mapped across {tactics.length} tactic{tactics.length !== 1 ? 's' : ''}
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {tactics.map((tactic, i) => {
              const name  = field(tactic, 'name', 'Name', 'tactic', 'Tactic') ?? 'Unknown'
              const techs = field(tactic, 'techniques', 'Techniques') ?? []
              const col   = TACTIC_COLORS[name] ?? DEFAULT_TACTIC
              return (
                <div key={i} className={`${col.bg} border ${col.border} rounded-2xl p-4`}>
                  <p className={`text-xs font-bold uppercase tracking-wider ${col.text} mb-3`}>{name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {techs.map((t, j) => {
                      const id   = field(t, 'id', 'Id', 'techniqueId', 'TechniqueId') ?? ''
                      const tech = field(t, 'name', 'Name', 'techniqueName', 'TechniqueName') ?? id
                      const url  = field(t, 'url', 'Url', 'link', 'Link')
                        ?? (id ? `https://attack.mitre.org/techniques/${id.replace('.', '/')}` : null)
                      const chip = (
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${col.border} ${col.text}`}
                          title={tech}>{id || tech}</span>
                      )
                      return url
                        ? <a key={j} href={url} target="_blank" rel="noopener noreferrer"
                            className="hover:opacity-70 transition-opacity">{chip}</a>
                        : <React.Fragment key={j}>{chip}</React.Fragment>
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {result && tactics.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">No ATT&CK techniques mapped for those inputs.</div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Tab 2 — IOC Checker
───────────────────────────────────────── */
function IocCheckerTab() {
  const [input, setInput]   = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState(null)

  const check = async () => {
    const indicators = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    if (!indicators.length) return
    setLoad(true); setError(null); setResult(null)
    try { setResult(await checkIocs(indicators)) }
    catch (e) { setError(e.message || 'IOC check failed') }
    setLoad(false)
  }

  const iocs = Array.isArray(result) ? result
    : (result?.results ?? result?.Results ?? result?.iocs ?? result?.Iocs ?? [])

  return (
    <div className="space-y-5">
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <label className="block text-xs text-gray-400 mb-2">Indicators — IPs, domains, or file hashes (one per line)</label>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={'1.2.3.4\nevil-domain.com\nd41d8cd98f00b204e9800998ecf8427e'}
          rows={5}
          className="w-full bg-white/5 border border-white/15 focus:border-rose-500 text-gray-200 placeholder-gray-700 px-4 py-3 rounded-xl text-sm font-mono outline-none transition-colors resize-y"
        />
        <button onClick={check} disabled={loading || !input.trim()}
          className="mt-3 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-500/25 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {loading ? 'Checking…' : 'Check IOCs'}
        </button>
        <p className="text-xs text-gray-600 mt-2">Checks AbuseIPDB + VirusTotal reputation for each indicator.</p>
      </div>

      {error && <ErrorBanner error={error} />}

      {iocs.length > 0 && (
        <div className="space-y-3">
          {iocs.map((ioc, i) => {
            const indicator  = field(ioc, 'indicator', 'Indicator', 'value', 'Value', 'ip', 'Ip', 'domain', 'Domain', 'hash', 'Hash') ?? '—'
            const type       = field(ioc, 'type', 'Type', 'indicatorType', 'IndicatorType') ?? 'Unknown'
            const malicious  = field(ioc, 'isMalicious', 'IsMalicious', 'malicious', 'Malicious')
            const abuseConf  = field(ioc, 'abuseConfidence', 'AbuseConfidence', 'abuseScore', 'AbuseScore')
            const vtScore    = field(ioc, 'virusTotalScore', 'VirusTotalScore', 'vtDetections', 'VtDetections', 'vtPositives', 'VtPositives')
            const vtTotal    = field(ioc, 'virusTotalTotal', 'VirusTotalTotal', 'vtTotal', 'VtTotal')
            const country    = field(ioc, 'country', 'Country', 'countryCode', 'CountryCode')
            const isp        = field(ioc, 'isp', 'Isp', 'org', 'Org', 'asn', 'Asn')
            const categories = field(ioc, 'categories', 'Categories', 'tags', 'Tags') ?? []
            const lastReport = field(ioc, 'lastReported', 'LastReported', 'lastSeen', 'LastSeen')

            const isBad = malicious === true || malicious === 'true' || abuseConf > 50 || vtScore > 5

            return (
              <div key={i} className={`bg-white/3 border rounded-xl p-4 ${isBad ? 'border-red-500/30' : 'border-white/10'}`}>
                <div className="flex items-center gap-3 flex-wrap">
                  {isBad
                    ? <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                  <code className="text-sm font-mono text-white flex-1 break-all">{indicator}</code>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-gray-400 bg-gray-500/10 border-gray-500/25 shrink-0">
                    {type}
                  </span>
                  {isBad
                    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-red-400 bg-red-500/10 border-red-500/30 shrink-0">Malicious</span>
                    : <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-green-400 bg-green-500/10 border-green-500/30 shrink-0">Clean</span>}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                  {abuseConf != null && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">AbuseIPDB</p>
                      <p className={`text-sm font-bold ${abuseConf >= 50 ? 'text-red-400' : abuseConf >= 20 ? 'text-amber-400' : 'text-green-400'}`}>
                        {abuseConf}% <span className="text-xs font-normal text-gray-500">confidence</span>
                      </p>
                    </div>
                  )}
                  {vtScore != null && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">VirusTotal</p>
                      <p className={`text-sm font-bold ${vtScore > 5 ? 'text-red-400' : vtScore > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                        {vtScore}{vtTotal ? `/${vtTotal}` : ''} <span className="text-xs font-normal text-gray-500">engines</span>
                      </p>
                    </div>
                  )}
                  {country && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">Country</p>
                      <p className="text-sm text-white">{country}</p>
                    </div>
                  )}
                  {isp && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-0.5">ISP / Org</p>
                      <p className="text-xs text-gray-300 truncate">{isp}</p>
                    </div>
                  )}
                </div>

                {Array.isArray(categories) && categories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {categories.map((cat, j) => (
                      <span key={j} className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded">
                        {typeof cat === 'string' ? cat : (cat.name ?? cat.Name ?? String(cat))}
                      </span>
                    ))}
                  </div>
                )}

                {lastReport && (
                  <p className="text-[10px] text-gray-600 mt-2">
                    Last reported {new Date(lastReport).toLocaleDateString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {result && iocs.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">No IOC results returned.</div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Tab 3 — Shodan Lookup
───────────────────────────────────────── */
function ShodanLookupTab() {
  const [ip, setIp]         = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState(null)

  const lookup = async () => {
    const target = ip.trim()
    if (!target) return
    setLoad(true); setError(null); setResult(null)
    try { setResult(await getShodanHost(target)) }
    catch (e) { setError(e.message || 'Shodan lookup failed') }
    setLoad(false)
  }

  const services = field(result, 'data', 'Data', 'services', 'Services', 'ports', 'Ports') ?? []
  const hostnames = field(result, 'hostnames', 'Hostnames') ?? []
  const tags = field(result, 'tags', 'Tags') ?? []

  const vulnsRaw = field(result, 'vulns', 'Vulns', 'cves', 'Cves', 'vulnerabilities', 'Vulnerabilities')
  const vulnEntries = vulnsRaw
    ? Array.isArray(vulnsRaw)
      ? vulnsRaw.map(v => [field(v, 'id', 'Id', 'cve', 'Cve') ?? '', v])
      : Object.entries(vulnsRaw)
    : []

  return (
    <div className="space-y-5">
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <label className="block text-xs text-gray-400 mb-2">IP Address</label>
        <div className="flex gap-3">
          <input
            value={ip}
            onChange={e => setIp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="8.8.8.8"
            className="flex-1 bg-white/5 border border-white/15 focus:border-rose-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors"
          />
          <button onClick={lookup} disabled={loading || !ip.trim()}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-500/25 disabled:text-white/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? 'Querying…' : 'Shodan Lookup'}
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">Returns open ports, service banners, product versions, and known CVEs from Shodan.</p>
      </div>

      {error && <ErrorBanner error={error} />}

      {result && (
        <div className="space-y-4">
          {/* Host overview */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-3">Host Overview</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-xs">
              {[
                ['IP',        field(result, 'ip', 'Ip', 'ipStr', 'IpStr') ?? ip],
                ['Org',       field(result, 'org', 'Org', 'organization', 'Organization') ?? '—'],
                ['ISP',       field(result, 'isp', 'Isp') ?? '—'],
                ['Country',   field(result, 'countryName', 'CountryName', 'country', 'Country') ?? '—'],
                ['City',      field(result, 'city', 'City') ?? '—'],
                ['Last Seen', (() => {
                  const ts = field(result, 'lastUpdate', 'LastUpdate', 'lastSeen', 'LastSeen')
                  return ts ? new Date(ts).toLocaleDateString() : '—'
                })()],
              ].map(([k, v]) => (
                <div key={k}>
                  <p className="text-gray-500 mb-0.5">{k}</p>
                  <p className="text-white font-mono truncate">{v}</p>
                </div>
              ))}
            </div>

            {hostnames.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] text-gray-500 mb-1.5">Hostnames</p>
                <div className="flex flex-wrap gap-1.5">
                  {hostnames.map((h, i) => (
                    <span key={i} className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">{h}</span>
                  ))}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {tags.map((tag, i) => (
                  <span key={i} className="text-[10px] bg-gray-500/10 border border-gray-500/20 text-gray-400 px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Open Ports / Services */}
          {services.length > 0 && (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <p className="px-5 py-3 text-xs font-bold text-white border-b border-white/10">
                Open Ports ({services.length})
              </p>
              <div className="divide-y divide-white/5">
                {services.map((svc, i) => {
                  const port    = field(svc, 'port', 'Port') ?? svc
                  const proto   = field(svc, 'transport', 'Transport', 'protocol', 'Protocol') ?? 'tcp'
                  const product = field(svc, 'product', 'Product') ?? ''
                  const version = field(svc, 'version', 'Version') ?? ''
                  const banner  = field(svc, 'banner', 'Banner', 'data', 'Data') ?? ''
                  const cpes    = field(svc, 'cpe', 'Cpe') ?? []

                  return (
                    <div key={i} className="px-5 py-3.5">
                      <div className="flex items-center gap-3 flex-wrap mb-1">
                        <span className="text-sm font-mono font-bold text-rose-400 shrink-0">{port}/{proto}</span>
                        {product && <span className="text-xs text-white">{product}</span>}
                        {version && <span className="text-xs text-gray-400">v{version}</span>}
                        {cpes.length > 0 && (
                          <span className="text-[10px] text-gray-600 font-mono truncate">{cpes[0]}</span>
                        )}
                      </div>
                      {banner && (
                        <pre className="text-[10px] text-gray-500 font-mono whitespace-pre-wrap line-clamp-3 bg-black/20 rounded px-2 py-1.5 mt-1">
                          {String(banner).slice(0, 300)}
                        </pre>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* CVEs from Shodan */}
          {vulnEntries.length > 0 && (
            <div className="bg-white/3 border border-red-500/15 rounded-2xl overflow-hidden">
              <p className="px-5 py-3 text-xs font-bold text-red-400 border-b border-white/10">
                CVEs from Shodan ({vulnEntries.length})
              </p>
              <div className="px-5 py-4 space-y-2.5">
                {vulnEntries.map(([id, v], i) => {
                  const cvss    = field(v, 'cvss', 'Cvss', 'cvssScore', 'CvssScore') ?? (typeof v === 'number' ? v : null)
                  const summary = field(v, 'summary', 'Summary', 'description', 'Description') ?? ''
                  return (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <a href={`https://nvd.nist.gov/vuln/detail/${id}`} target="_blank" rel="noopener noreferrer"
                        className="font-mono text-rose-400 hover:text-rose-300 shrink-0 flex items-center gap-0.5">
                        {id} <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                      {cvss != null && (
                        <span className="text-gray-500 shrink-0">CVSS {cvss}</span>
                      )}
                      {summary && (
                        <span className="text-gray-400 truncate">{summary}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
const TABS = [
  { id: 'attack', label: 'ATT&CK Mapper',       icon: Target },
  { id: 'ioc',    label: 'IOC Checker',          icon: Shield },
  { id: 'shodan', label: 'Shodan Lookup',        icon: Wifi   },
]

export default function ThreatIntelPage() {
  const [tab, setTab] = useState('attack')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-rose-500/15 border border-rose-500/30 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Threat Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Threat Intelligence</h1>
            <p className="text-gray-400">Map CVEs and findings to MITRE ATT&CK techniques, check IPs and domains against threat feeds, and query Shodan for live host exposure.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${tab === id ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {tab === 'attack' && <AttackMapperTab />}
          {tab === 'ioc'    && <IocCheckerTab />}
          {tab === 'shodan' && <ShodanLookupTab />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
