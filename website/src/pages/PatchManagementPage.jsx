import React, { useState, useEffect } from 'react'
import {
  Wrench, Loader2, AlertCircle, ChevronDown, ChevronUp,
  ExternalLink, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  ClipboardList, Package, Newspaper,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { lookupCves, auditSoftware, getPatchBulletins } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

function EpssBar({ value }) {
  if (value == null) return <span className="text-gray-600 text-xs font-mono">—</span>
  const pct   = Math.round(value * 100)
  const color = pct >= 50 ? 'text-red-400' : pct >= 20 ? 'text-orange-400' : pct >= 5 ? 'text-amber-400' : 'text-green-400'
  const label = pct >= 50 ? 'Very High' : pct >= 20 ? 'High' : pct >= 5 ? 'Moderate' : 'Low'
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono font-bold ${color}`}>{pct}%</span>
      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV_STYLE[pct >= 50 ? 'Critical' : pct >= 20 ? 'High' : pct >= 5 ? 'Medium' : 'Low']}`}>{label}</span>
    </div>
  )
}

function CveCard({ cve }) {
  const [open, setOpen] = useState(false)
  const id          = field(cve, 'cveId', 'CveId', 'id', 'Id', 'cve', 'Cve') ?? '—'
  const desc        = field(cve, 'description', 'Description', 'summary', 'Summary') ?? ''
  const cvss        = field(cve, 'cvssScore', 'CvssScore', 'score', 'Score')
  const epss        = field(cve, 'epssScore', 'EpssScore', 'epss', 'Epss', 'exploitProbability', 'ExploitProbability')
  const severity    = field(cve, 'severity', 'Severity') ?? 'Unknown'
  const patches     = field(cve, 'patches', 'Patches', 'fixes', 'Fixes', 'vendorPatches', 'VendorPatches') ?? []
  const affected    = field(cve, 'affectedProducts', 'AffectedProducts', 'products', 'Products', 'software', 'Software') ?? []
  const published   = field(cve, 'publishedDate', 'PublishedDate', 'published', 'Published', 'date', 'Date')
  const nvdUrl      = field(cve, 'nvdUrl', 'NvdUrl', 'referenceUrl', 'ReferenceUrl') ?? `https://nvd.nist.gov/vuln/detail/${id}`
  const patchAvail  = patches.length > 0 || field(cve, 'patchAvailable', 'PatchAvailable')

  const sev = severity === 'Unknown' && cvss != null
    ? cvss >= 9 ? 'Critical' : cvss >= 7 ? 'High' : cvss >= 4 ? 'Medium' : 'Low'
    : severity

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-sm font-mono font-bold text-orange-300 shrink-0">{id}</span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${SEV_STYLE[sev] || SEV_STYLE.Medium}`}>{sev}</span>
        {cvss != null && (
          <span className="text-xs text-gray-400 shrink-0">CVSS <span className="font-bold text-white">{cvss}</span></span>
        )}
        <EpssBar value={epss} />
        <span className="flex-1 min-w-0 text-xs text-gray-400 truncate">{desc}</span>
        {patchAvail
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4">
          {desc && <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>}

          {affected.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Affected Products</p>
              <div className="flex flex-wrap gap-1.5">
                {(Array.isArray(affected) ? affected : [affected]).map((p, i) => (
                  <span key={i} className="text-xs bg-white/5 border border-white/15 text-gray-300 px-2 py-0.5 rounded font-mono">
                    {typeof p === 'string' ? p : (p.name ?? p.Name ?? JSON.stringify(p))}
                  </span>
                ))}
              </div>
            </div>
          )}

          {patches.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Available Patches</p>
              <div className="space-y-2">
                {patches.map((patch, i) => {
                  const pName = typeof patch === 'string' ? patch : (field(patch, 'name', 'Name', 'title', 'Title', 'description', 'Description') ?? 'Patch')
                  const pUrl  = typeof patch === 'string' ? null : field(patch, 'url', 'Url', 'link', 'Link', 'href', 'Href')
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="text-xs text-gray-300 flex-1">{pName}</span>
                      {pUrl && (
                        <a href={pUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors shrink-0">
                          <ExternalLink className="w-3 h-3" /> Apply
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            {published && (
              <span className="text-[10px] text-gray-600">Published {new Date(published).toLocaleDateString()}</span>
            )}
            <a href={nvdUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-orange-400 transition-colors">
              <ExternalLink className="w-3 h-3" /> NVD
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Tab 1: CVE Lookup ─── */
function CveLookupTab() {
  const [text, setText]     = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoad]  = useState(false)
  const [error, setError]   = useState(null)

  const lookup = async () => {
    const ids = text.split(/[\n,\s]+/).map(s => s.trim()).filter(s => /CVE-\d{4}-\d+/i.test(s))
    if (!ids.length) { setError('Enter at least one CVE ID (e.g. CVE-2024-1234)'); return }
    setLoad(true); setError(null); setResult(null)
    try { setResult(await lookupCves(ids)) }
    catch (e) { setError(e.message || 'CVE lookup failed') }
    setLoad(false)
  }

  const cves = Array.isArray(result) ? result : (result?.cves ?? result?.Cves ?? result?.results ?? result?.Results ?? [])

  return (
    <div className="space-y-5">
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <label className="block text-xs text-gray-400 mb-2">CVE IDs — one per line or comma-separated</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={'CVE-2024-1234\nCVE-2023-44487\nCVE-2021-44228'}
          rows={5}
          className="w-full bg-white/5 border border-white/15 focus:border-orange-500 text-gray-200 placeholder-gray-700 px-4 py-3 rounded-xl text-sm font-mono outline-none transition-colors resize-y"
        />
        <div className="flex items-center gap-3 mt-3">
          <button onClick={lookup} disabled={loading || !text.trim()}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/30 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
            {loading ? 'Looking up…' : 'Look Up CVEs'}
          </button>
          <span className="text-xs text-gray-600">Returns CVSS score, EPSS exploit probability, and vendor patch links</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {cves.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white">{cves.length} CVE{cves.length !== 1 ? 's' : ''} found</h2>
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-400" /> Patch available</span>
              <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400" /> No patch yet</span>
            </div>
          </div>
          {cves.map((c, i) => <CveCard key={i} cve={c} />)}
        </div>
      )}

      {result && cves.length === 0 && (
        <div className="text-center text-sm text-gray-500 py-8">No CVE data returned for those IDs.</div>
      )}
    </div>
  )
}

/* ─── Tab 2: Software Audit ─── */
const EXAMPLE_SOFTWARE = JSON.stringify([
  { name: 'OpenSSL',   version: '1.1.1t' },
  { name: 'Apache',    version: '2.4.51' },
  { name: 'Log4j',     version: '2.14.1' },
  { name: 'curl',      version: '7.81.0' },
  { name: 'libwebp',   version: '1.2.4'  },
], null, 2)

function SoftwareAuditTab() {
  const [json, setJson]       = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoad]    = useState(false)
  const [error, setError]     = useState(null)
  const [jsonError, setJsonErr] = useState(null)

  const validate = (v) => {
    try { JSON.parse(v); setJsonErr(null) }
    catch { setJsonErr('Invalid JSON') }
    setJson(v)
  }

  const audit = async () => {
    let parsed
    try { parsed = JSON.parse(json) }
    catch { setError('Fix JSON syntax first'); return }
    if (!Array.isArray(parsed) || parsed.length === 0) { setError('Paste a JSON array of software objects'); return }
    setLoad(true); setError(null); setResult(null)
    try { setResult(await auditSoftware(parsed)) }
    catch (e) { setError(e.message || 'Software audit failed') }
    setLoad(false)
  }

  const packages = Array.isArray(result) ? result : (result?.packages ?? result?.Packages ?? result?.results ?? result?.Results ?? [])
  const totalCves = packages.reduce((n, p) => {
    const cves = field(p, 'cves', 'Cves', 'vulnerabilities', 'Vulnerabilities', 'findings', 'Findings') ?? []
    return n + cves.length
  }, 0)

  return (
    <div className="space-y-5">
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-400">Installed software list (JSON array)</label>
          <button onClick={() => { setJson(EXAMPLE_SOFTWARE); setJsonErr(null) }}
            className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors">
            Load example
          </button>
        </div>
        <textarea
          value={json}
          onChange={e => validate(e.target.value)}
          placeholder={'[\n  { "name": "OpenSSL", "version": "1.1.1t" },\n  { "name": "Apache",  "version": "2.4.51" }\n]'}
          rows={10}
          className={`w-full bg-white/5 border focus:border-orange-500 text-gray-200 placeholder-gray-700 px-4 py-3 rounded-xl text-xs font-mono outline-none transition-colors resize-y ${
            jsonError ? 'border-red-500/50' : 'border-white/15'
          }`}
        />
        {jsonError && <p className="text-xs text-red-400 mt-1">{jsonError}</p>}
        <button onClick={audit} disabled={loading || !json.trim() || !!jsonError}
          className="mt-3 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/30 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
          {loading ? 'Auditing…' : 'Audit Software'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {packages.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{packages.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Packages Checked</p>
            </div>
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-extrabold ${totalCves > 0 ? 'text-red-400' : 'text-green-400'}`}>{totalCves}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total CVEs</p>
            </div>
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-extrabold ${packages.filter(p => (field(p,'cves','Cves','findings','Findings') ?? []).length > 0).length > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {packages.filter(p => (field(p, 'cves', 'Cves', 'vulnerabilities', 'Vulnerabilities', 'findings', 'Findings') ?? []).length > 0).length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Vulnerable Packages</p>
            </div>
          </div>

          {packages.map((pkg, i) => {
            const name    = field(pkg, 'name', 'Name', 'package', 'Package', 'software', 'Software') ?? 'Unknown'
            const version = field(pkg, 'version', 'Version', 'installedVersion', 'InstalledVersion') ?? ''
            const latest  = field(pkg, 'latestVersion', 'LatestVersion', 'safeVersion', 'SafeVersion', 'fixedVersion', 'FixedVersion')
            const cves    = field(pkg, 'cves', 'Cves', 'vulnerabilities', 'Vulnerabilities', 'findings', 'Findings') ?? []
            const clean   = cves.length === 0

            return (
              <div key={i} className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 flex items-center gap-3 flex-wrap border-b border-white/5">
                  {clean
                    ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <span className="font-bold text-white text-sm">{name}</span>
                  <span className="text-xs font-mono text-gray-400">v{version}</span>
                  {latest && latest !== version && (
                    <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded font-mono">
                      → {latest} available
                    </span>
                  )}
                  {cves.length > 0 && (
                    <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded ml-auto">
                      {cves.length} CVE{cves.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {clean && <span className="text-xs text-green-400 ml-auto">No known CVEs</span>}
                </div>
                {cves.length > 0 && (
                  <div className="divide-y divide-white/5">
                    {cves.map((c, j) => <CveCard key={j} cve={c} />)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Tab 3: Security Bulletins ─── */
function BulletinsTab() {
  const [bulletins, setBulletins] = useState([])
  const [loading, setLoad]        = useState(false)
  const [error, setError]         = useState(null)
  const [sev, setSev]             = useState('all')

  const load = async () => {
    setLoad(true); setError(null)
    try {
      const data = await getPatchBulletins()
      const list = Array.isArray(data) ? data : (data?.bulletins ?? data?.Bulletins ?? data?.items ?? data?.Items ?? [])
      setBulletins(list)
    } catch (e) { setError(e.message || 'Failed to load bulletins') }
    setLoad(false)
  }

  useEffect(() => { load() }, [])

  const filtered = sev === 'all'
    ? bulletins
    : bulletins.filter(b => {
        const s = (field(b, 'severity', 'Severity') ?? '').toLowerCase()
        return s === sev
      })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {['all', 'critical', 'high'].map(v => (
            <button key={v} onClick={() => setSev(v)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors capitalize ${sev === v ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors text-xs">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-12 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading bulletins…
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <div className="text-center text-sm text-gray-500 py-12">No bulletins found.</div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <span className="col-span-3">CVE ID</span>
            <span className="col-span-1">CVSS</span>
            <span className="col-span-2">Severity</span>
            <span className="col-span-2">EPSS</span>
            <span className="col-span-2">Product</span>
            <span className="col-span-1">Published</span>
            <span className="col-span-1 text-right">Patch</span>
          </div>
          <div className="divide-y divide-white/5">
            {filtered.map((b, i) => {
              const id        = field(b, 'cveId', 'CveId', 'id', 'Id', 'cve', 'Cve') ?? '—'
              const cvss      = field(b, 'cvssScore', 'CvssScore', 'score', 'Score')
              const severity  = field(b, 'severity', 'Severity') ?? 'Unknown'
              const epss      = field(b, 'epssScore', 'EpssScore', 'epss', 'Epss', 'exploitProbability', 'ExploitProbability')
              const product   = field(b, 'product', 'Product', 'affectedProduct', 'AffectedProduct', 'software', 'Software') ?? '—'
              const published = field(b, 'publishedDate', 'PublishedDate', 'published', 'Published', 'date', 'Date')
              const patchUrl  = field(b, 'patchUrl', 'PatchUrl', 'url', 'Url', 'link', 'Link', 'href', 'Href')
              const sStyle    = SEV_STYLE[severity] || SEV_STYLE.Medium

              return (
                <div key={i} className="grid grid-cols-12 px-5 py-3 items-center hover:bg-white/3 transition-colors">
                  <div className="col-span-3">
                    <a href={`https://nvd.nist.gov/vuln/detail/${id}`} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-mono text-orange-400 hover:text-orange-300 transition-colors">
                      {id}
                    </a>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs font-bold text-white">{cvss ?? '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sStyle}`}>{severity}</span>
                  </div>
                  <div className="col-span-2">
                    <EpssBar value={epss} />
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-400 truncate block" title={typeof product === 'string' ? product : undefined}>
                      {typeof product === 'string' ? product : (product?.name ?? product?.Name ?? '—')}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-[10px] text-gray-600 font-mono">
                      {published ? new Date(published).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    {patchUrl
                      ? <a href={patchUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-end gap-1 text-[10px] text-green-400 hover:text-green-300 transition-colors">
                          <ExternalLink className="w-3 h-3" /> Patch
                        </a>
                      : <XCircle className="w-3.5 h-3.5 text-gray-600 ml-auto" />}
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

/* ─── Page ─── */
const TABS = [
  { id: 'lookup',    label: 'CVE Lookup',        icon: ClipboardList },
  { id: 'audit',     label: 'Software Audit',     icon: Package },
  { id: 'bulletins', label: 'Security Bulletins', icon: Newspaper },
]

export default function PatchManagementPage() {
  const [tab, setTab] = useState('lookup')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-500/15 border border-orange-500/30 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Patch Management</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Patch Management</h1>
            <p className="text-gray-400">Look up CVEs with EPSS exploit probability, audit installed software for vulnerabilities, and track vendor security bulletins.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Tab bar */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                  tab === id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {tab === 'lookup'    && <CveLookupTab />}
          {tab === 'audit'     && <SoftwareAuditTab />}
          {tab === 'bulletins' && <BulletinsTab />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
