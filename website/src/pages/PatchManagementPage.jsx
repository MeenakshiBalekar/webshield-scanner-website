import React, { useState, useEffect, useRef } from 'react'
import {
  Wrench, Loader2, AlertCircle, ChevronDown, ChevronUp,
  ExternalLink, CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  ClipboardList, Package, Newspaper, Plus, Rocket, Terminal, X, Cpu,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  lookupCves, auditSoftware, getPatchBulletins,
  deployPatch, getPatchDeployments, getAgents,
} from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const JOB_STATUS_STYLE = {
  Pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Running: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Success: 'bg-green-500/15 text-green-400 border-green-500/30',
  Failed:  'bg-red-500/15 text-red-400 border-red-500/30',
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

/* ─── Deploy Modal ─── */
function DeployModal({ pkg, cves, onClose, onDeployed }) {
  const [agents, setAgents]   = useState([])
  const [agentId, setAgentId] = useState('')
  const [loading, setLoad]    = useState(true)
  const [deploying, setDep]   = useState(false)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getAgents()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.agents ?? data?.Agents ?? [])
        setAgents(list)
        if (list.length > 0) setAgentId(field(list[0], 'agentId', 'AgentId', 'id', 'Id') ?? '')
      })
      .catch(() => {})
      .finally(() => setLoad(false))
  }, [])

  const confirm = async () => {
    if (!agentId) return
    setDep(true); setError(null)
    try {
      const cveIds = cves.map(c => field(c, 'cveId', 'CveId', 'id', 'Id', 'cve', 'Cve')).filter(Boolean)
      await deployPatch({ agentId, packageName: pkg.name, cveIds })
      setDone(true)
      onDeployed?.()
    } catch (e) { setError(e.message || 'Deploy failed') }
    setDep(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0f14] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold text-white">Deploy Fix</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {done ? (
          <div className="px-5 py-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <p className="text-sm font-semibold text-white">Deployment job created</p>
            <p className="text-xs text-gray-400">Track progress in the Deployments tab.</p>
            <button onClick={onClose} className="mt-2 text-sm text-orange-400 hover:text-orange-300 transition-colors">Close</button>
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Package</p>
              <p className="text-sm font-mono text-white">{pkg.name} <span className="text-gray-500">v{pkg.version}</span></p>
            </div>

            {cves.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">CVEs to patch ({cves.length})</p>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {cves.map((c, i) => {
                    const id = field(c, 'cveId', 'CveId', 'id', 'Id', 'cve', 'Cve') ?? `CVE-${i}`
                    return (
                      <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded">{id}</span>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Target Agent</p>
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-gray-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading agents…</div>
              ) : agents.length === 0 ? (
                <p className="text-xs text-gray-500">No agents available. Deploy an agent first.</p>
              ) : (
                <select
                  value={agentId}
                  onChange={e => setAgentId(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 focus:border-orange-500 text-white px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
                >
                  {agents.map((a, i) => {
                    const id   = field(a, 'agentId', 'AgentId', 'id', 'Id') ?? i
                    const name = field(a, 'name', 'Name', 'hostname', 'Hostname') ?? `Agent ${i + 1}`
                    return <option key={id} value={id} className="bg-gray-900">{name}</option>
                  })}
                </select>
              )}
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}

        {!done && (
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={confirm}
              disabled={deploying || loading || !agentId}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/30 disabled:text-white/30 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {deploying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {deploying ? 'Deploying…' : 'Confirm Deploy'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          </div>
        )}
      </div>
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
const OS_OPTIONS = [
  { value: 'linux-debian',  label: 'Linux — Debian / Ubuntu' },
  { value: 'linux-rhel',    label: 'Linux — RHEL / CentOS / Rocky' },
  { value: 'linux-alpine',  label: 'Linux — Alpine' },
  { value: 'windows',       label: 'Windows Server' },
  { value: 'macos',         label: 'macOS' },
  { value: 'generic',       label: 'Generic / Unknown' },
]

const EXAMPLE_ROWS = [
  { name: 'OpenSSL',   version: '1.1.1t' },
  { name: 'Apache',    version: '2.4.51'  },
  { name: 'Log4j',     version: '2.14.1'  },
  { name: 'curl',      version: '7.81.0'  },
  { name: 'libwebp',   version: '1.2.4'   },
]

function SoftwareAuditTab({ onDeployCreated }) {
  const [os, setOs]               = useState('linux-debian')
  const [rows, setRows]           = useState([{ name: '', version: '' }])
  const [result, setResult]       = useState(null)
  const [loading, setLoad]        = useState(false)
  const [error, setError]         = useState(null)
  const [deployTarget, setDeploy] = useState(null)

  const setRow = (i, k, v) => setRows(r => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row))
  const addRow    = () => setRows(r => [...r, { name: '', version: '' }])
  const removeRow = (i) => setRows(r => r.filter((_, idx) => idx !== i))
  const loadExample = () => setRows(EXAMPLE_ROWS.map(r => ({ ...r })))

  const validRows = rows.filter(r => r.name.trim())

  const audit = async () => {
    if (!validRows.length) { setError('Add at least one package'); return }
    setLoad(true); setError(null); setResult(null)
    try { setResult(await auditSoftware({ os, software: validRows })) }
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
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Operating System</label>
          <select value={os} onChange={e => setOs(e.target.value)}
            className="bg-white/5 border border-white/15 focus:border-orange-500 text-white px-3 py-2.5 rounded-xl text-sm outline-none transition-colors">
            {OS_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>)}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-400">Installed Packages</label>
            <button onClick={loadExample}
              className="text-[10px] text-orange-400 hover:text-orange-300 transition-colors">
              Load example
            </button>
          </div>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={row.name}
                  onChange={e => setRow(i, 'name', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addRow()}
                  placeholder="Package name (e.g. OpenSSL)"
                  className="flex-1 bg-white/5 border border-white/15 focus:border-orange-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                />
                <input
                  value={row.version}
                  onChange={e => setRow(i, 'version', e.target.value)}
                  placeholder="Version"
                  className="w-36 bg-white/5 border border-white/15 focus:border-orange-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm font-mono outline-none transition-colors"
                />
                <button
                  onClick={() => removeRow(i)}
                  disabled={rows.length === 1}
                  className="text-gray-600 hover:text-red-400 disabled:opacity-25 transition-colors shrink-0"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addRow}
            className="mt-2.5 flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-400 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add package
          </button>
        </div>

        <button onClick={audit} disabled={loading || !validRows.length}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/30 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
          {loading ? 'Auditing…' : `Audit ${validRows.length || ''} Package${validRows.length !== 1 ? 's' : ''}`}
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
                    <>
                      <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded">
                        {cves.length} CVE{cves.length !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={() => setDeploy({ name, version, cves })}
                        className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-2.5 py-0.5 rounded hover:bg-orange-500/20 transition-colors ml-auto"
                      >
                        <Rocket className="w-3 h-3" /> Deploy Fix
                      </button>
                    </>
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

      {deployTarget && (
        <DeployModal
          pkg={deployTarget}
          cves={deployTarget.cves}
          onClose={() => setDeploy(null)}
          onDeployed={() => { setDeploy(null); onDeployCreated?.() }}
        />
      )}
    </div>
  )
}

/* ─── Tab 3: Security Bulletins ─── */
const DAY_OPTIONS = [3, 7, 14, 30]

function BulletinsTab() {
  const [bulletins, setBulletins] = useState([])
  const [loading, setLoad]        = useState(false)
  const [error, setError]         = useState(null)
  const [days, setDays]           = useState(7)

  const load = async (d) => {
    setLoad(true); setError(null)
    try {
      const data = await getPatchBulletins(d ?? days)
      const list = Array.isArray(data) ? data : (data?.bulletins ?? data?.Bulletins ?? data?.items ?? data?.Items ?? [])
      setBulletins(list)
    } catch (e) { setError(e.message || 'Failed to load bulletins') }
    setLoad(false)
  }

  useEffect(() => { load(days) }, [days])

  const switchDays = (d) => { setDays(d); setBulletins([]) }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
          {DAY_OPTIONS.map(d => (
            <button key={d} onClick={() => switchDays(d)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${days === d ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
              {d}d
            </button>
          ))}
        </div>
        <button onClick={() => load(days)} disabled={loading}
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

      {!loading && bulletins.length === 0 && !error && (
        <div className="text-center text-sm text-gray-500 py-12">No bulletins found for the last {days} days.</div>
      )}

      {!loading && bulletins.length > 0 && (
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-2.5 border-b border-white/10">
            <span className="text-xs text-gray-500">{bulletins.length} Critical / High CVE{bulletins.length !== 1 ? 's' : ''} in the last {days} days</span>
          </div>
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
            {bulletins.map((b, i) => {
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
                      className="text-xs font-mono text-orange-400 hover:text-orange-300 transition-colors">{id}</a>
                  </div>
                  <div className="col-span-1">
                    <span className="text-xs font-bold text-white">{cvss ?? '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${sStyle}`}>{severity}</span>
                  </div>
                  <div className="col-span-2"><EpssBar value={epss} /></div>
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

/* ─── Tab 4: Deployments ─── */
function DeploymentsTab({ refreshTrigger }) {
  const [jobs, setJobs]         = useState([])
  const [loading, setLoad]      = useState(true)
  const [error, setError]       = useState(null)
  const [expanded, setExpanded] = useState({})
  const timerRef                = useRef(null)

  const load = async (silent = false) => {
    if (!silent) setLoad(true)
    setError(null)
    try {
      const data = await getPatchDeployments()
      const list = Array.isArray(data) ? data : (data?.jobs ?? data?.Jobs ?? data?.deployments ?? data?.Deployments ?? [])
      setJobs(list)
      return list
    } catch (e) {
      setError(e.message || 'Failed to load deployments')
      return []
    } finally {
      if (!silent) setLoad(false)
    }
  }

  const scheduleNext = (list) => {
    clearTimeout(timerRef.current)
    const active = list.some(j => {
      const s = (field(j, 'status', 'Status') ?? '').toLowerCase()
      return s === 'pending' || s === 'running'
    })
    if (active) {
      timerRef.current = setTimeout(async () => {
        const updated = await load(true)
        scheduleNext(updated)
      }, 10000)
    }
  }

  useEffect(() => {
    load().then(scheduleNext)
    return () => clearTimeout(timerRef.current)
  }, [refreshTrigger])

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }))

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-400 py-16 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading deployments…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />{error}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center">
          <Rocket className="w-7 h-7 text-orange-400" />
        </div>
        <p className="text-gray-400 text-sm">No deployments yet. Use "Deploy Fix" in Software Audit to create a job.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{jobs.length} deployment job{jobs.length !== 1 ? 's' : ''}</p>
        <button onClick={() => load().then(scheduleNext)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          <span className="col-span-2">Job ID</span>
          <span className="col-span-2">Agent</span>
          <span className="col-span-3">Package</span>
          <span className="col-span-2">Started At</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1 text-right">Output</span>
        </div>
        <div className="divide-y divide-white/5">
          {jobs.map((job, i) => {
            const id        = field(job, 'jobId', 'JobId', 'id', 'Id') ?? i
            const agent     = field(job, 'agentName', 'AgentName', 'agent', 'Agent') ?? '—'
            const pkg       = field(job, 'packageName', 'PackageName', 'package', 'Package') ?? '—'
            const startedAt = field(job, 'startedAt', 'StartedAt', 'createdAt', 'CreatedAt')
            const status    = field(job, 'status', 'Status') ?? 'Pending'
            const output    = field(job, 'output', 'Output', 'log', 'Log') ?? ''
            const isOpen    = expanded[id]
            const statusCls = JOB_STATUS_STYLE[status] || JOB_STATUS_STYLE.Pending
            const isActive  = status === 'Pending' || status === 'Running'

            return (
              <React.Fragment key={id}>
                <div className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/2 transition-colors">
                  <div className="col-span-2">
                    <span className="text-[10px] font-mono text-gray-500">{String(id).slice(0, 8)}</span>
                  </div>
                  <div className="col-span-2 min-w-0">
                    <span className="text-xs text-gray-300 truncate block">{agent}</span>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <span className="text-xs font-mono text-white truncate block">{pkg}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {startedAt ? new Date(startedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border ${statusCls}`}>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block" />}
                      {status}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    {output && (
                      <button
                        onClick={() => toggleExpand(id)}
                        className="flex items-center justify-end gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        {isOpen ? 'Hide' : 'View'}
                      </button>
                    )}
                  </div>
                </div>
                {isOpen && output && (
                  <div className="px-5 pb-4 pt-2 bg-white/2">
                    <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-green-300 leading-relaxed whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">
                      {output}
                    </div>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ─── Page ─── */
const TABS = [
  { id: 'lookup',      label: 'CVE Lookup',         icon: ClipboardList },
  { id: 'audit',       label: 'Software Audit',      icon: Package },
  { id: 'bulletins',   label: 'Security Bulletins',  icon: Newspaper },
  { id: 'deployments', label: 'Deployments',         icon: Rocket },
]

export default function PatchManagementPage() {
  const [tab, setTab]               = useState('lookup')
  const [deployRefresh, setDeplRef] = useState(0)

  const handleDeployCreated = () => {
    setTab('deployments')
    setDeplRef(n => n + 1)
  }

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
          <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${
                  tab === id ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {tab === 'lookup'      && <CveLookupTab />}
          {tab === 'audit'       && <SoftwareAuditTab onDeployCreated={handleDeployCreated} />}
          {tab === 'bulletins'   && <BulletinsTab />}
          {tab === 'deployments' && <DeploymentsTab refreshTrigger={deployRefresh} />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
