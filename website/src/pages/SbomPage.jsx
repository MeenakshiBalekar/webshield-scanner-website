import React, { useState, useEffect, useRef } from 'react'
import { Package, Upload, FileText, AlertCircle, Loader2, ChevronRight, ChevronDown, Shield, RefreshCw } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const FORMATS = [
  { id: 'cyclonedx', label: 'CycloneDX', ext: '.json, .xml' },
  { id: 'spdx',      label: 'SPDX',      ext: '.json, .spdx' },
]

const RISK_STYLE = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
  none:     'text-gray-500 bg-white/5 border-white/10',
}

function riskLabel(score) {
  if (score == null) return 'none'
  if (score >= 9) return 'critical'
  if (score >= 7) return 'high'
  if (score >= 4) return 'medium'
  if (score > 0)  return 'low'
  return 'none'
}

function RiskBadge({ score }) {
  const level = riskLabel(score)
  const style = RISK_STYLE[level]
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${style}`}>
      {score != null ? `${score} ${level.charAt(0).toUpperCase() + level.slice(1)}` : 'No risk'}
    </span>
  )
}

function DepTree({ pkg, depth = 0 }) {
  const [open, setOpen] = useState(depth < 1)
  const deps = field(pkg, 'dependencies', 'Dependencies', 'deps', 'Deps') ?? []
  const name  = field(pkg, 'name', 'Name', 'packageName', 'PackageName') ?? '(unknown)'
  const ver   = field(pkg, 'version', 'Version') ?? ''
  const score = field(pkg, 'riskScore', 'RiskScore', 'risk', 'Risk')

  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <div className="flex items-center gap-2 py-1 hover:bg-white/3 rounded px-2 -mx-2 cursor-pointer"
        onClick={() => deps.length && setOpen(o => !o)}>
        {deps.length > 0
          ? (open ? <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />)
          : <div className="w-3.5 h-3.5 shrink-0" />}
        <span className="text-sm text-gray-200 font-mono">{name}</span>
        {ver && <span className="text-xs text-gray-500">@{ver}</span>}
        {score != null && <RiskBadge score={score} />}
      </div>
      {open && deps.map((d, i) => <DepTree key={i} pkg={d} depth={depth + 1} />)}
    </div>
  )
}

function SbomList({ sboms, onSelect, selected }) {
  if (!sboms.length) return (
    <div className="text-center py-12 text-gray-500 text-sm">No SBOMs imported yet</div>
  )
  return (
    <div className="divide-y divide-white/5">
      {sboms.map(s => {
        const id       = field(s, 'id', 'Id') ?? ''
        const name     = field(s, 'name', 'Name', 'fileName', 'FileName') ?? 'Untitled'
        const pkgCount = field(s, 'packageCount', 'PackageCount', 'packages', 'Packages') ?? '?'
        const score    = field(s, 'riskScore', 'RiskScore')
        const createdAt = field(s, 'createdAt', 'CreatedAt', 'importedAt', 'ImportedAt')
        const dateStr  = createdAt ? new Date(createdAt).toLocaleDateString() : '—'
        return (
          <div key={id}
            className={`flex items-center justify-between px-6 py-3.5 cursor-pointer hover:bg-white/3 transition-colors ${selected === id ? 'bg-white/5' : ''}`}
            onClick={() => onSelect(id)}>
            <div>
              <p className="text-sm text-white font-medium">{name}</p>
              <p className="text-xs text-gray-500">{pkgCount} packages · {dateStr}</p>
            </div>
            {score != null && <RiskBadge score={score} />}
          </div>
        )
      })}
    </div>
  )
}

export default function SbomPage() {
  const [format, setFormat]       = useState('cyclonedx')
  const [file, setFile]           = useState(null)
  const [importing, setImporting] = useState(false)
  const [importErr, setImportErr] = useState(null)
  const [sboms, setSboms]         = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listErr, setListErr]     = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail]       = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [tab, setTab]             = useState('packages') // 'packages' | 'tree'
  const inputRef = useRef(null)

  const token = () => localStorage.getItem('ws_token')
  const authH = () => token() ? { Authorization: `Bearer ${token()}` } : {}

  const loadList = () => {
    setListLoading(true); setListErr(null)
    fetch(`${BASE}/api/sbom`, { headers: authH() })
      .then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => {
        const list = Array.isArray(data) ? data : (field(data, 'sboms', 'Sboms', 'items', 'Items') ?? [])
        setSboms(list)
      })
      .catch(e => setListErr(e.message))
      .finally(() => setListLoading(false))
  }

  useEffect(() => { loadList() }, [])

  const loadDetail = (id) => {
    setDetailLoading(true); setDetail(null)
    fetch(`${BASE}/api/sbom/${id}`, { headers: authH() })
      .then(async r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => setDetail(data))
      .catch(() => {})
      .finally(() => setDetailLoading(false))
  }

  const handleSelect = (id) => {
    setSelectedId(id)
    loadDetail(id)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true); setImportErr(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('format', format)
      const res = await fetch(`${BASE}/api/sbom/import`, {
        method: 'POST',
        headers: authH(),
        body: fd,
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const b = await res.json(); msg = b.error ?? b.message ?? msg } catch {}
        throw new Error(msg)
      }
      setFile(null)
      loadList()
    } catch (e) { setImportErr(e.message || 'Import failed') }
    setImporting(false)
  }

  const packages = detail
    ? (Array.isArray(detail) ? detail : (field(detail, 'packages', 'Packages', 'components', 'Components') ?? []))
    : []
  const roots = detail
    ? (field(detail, 'tree', 'Tree', 'root', 'Root', 'dependencies', 'Dependencies') ?? null)
    : null

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Software Bill of Materials</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">SBOM</h1>
            <p className="text-gray-400 text-sm mt-1">
              Import and analyze software bills of materials to identify vulnerable dependencies.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <PageGuide id="sbom" text="Import and analyze CycloneDX or SPDX SBOM files to identify vulnerable, outdated, or license-risky components in your software. Click Import, select the format, and upload your SBOM file. The report shows component risk scores, known CVEs per package, license compliance flags (GPL, AGPL), and a prioritized list of packages to update." />
          {/* Import */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
              <Upload className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white">Import SBOM</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-3">
                {FORMATS.map(f => (
                  <button key={f.id} onClick={() => setFormat(f.id)}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-sm text-left transition-colors ${
                      format === f.id
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/3 border-white/10 text-gray-300 hover:border-white/20'
                    }`}>
                    <div className="font-semibold">{f.label}</div>
                    <div className="text-xs text-gray-500">{f.ext}</div>
                  </button>
                ))}
              </div>
              <div
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex items-center gap-4 cursor-pointer transition-colors ${
                  file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/15 hover:border-white/25'
                }`}>
                <input ref={inputRef} type="file" className="hidden" onChange={e => { setFile(e.target.files?.[0] ?? null); setImportErr(null) }} />
                <FileText className={`w-8 h-8 shrink-0 ${file ? 'text-emerald-400' : 'text-gray-600'}`} />
                {file
                  ? <div><p className="text-white font-medium text-sm">{file.name}</p><p className="text-gray-500 text-xs">{(file.size/1024).toFixed(1)} KB · click to change</p></div>
                  : <p className="text-gray-400 text-sm">Click to select or drag & drop a {format.toUpperCase()} file</p>}
              </div>
              {importErr && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{importErr}</span>
                </div>
              )}
              <button onClick={handleImport} disabled={!file || importing}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>

          {/* List + Detail */}
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            {/* List */}
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h2 className="text-sm font-bold text-white">Imported SBOMs</h2>
                <button onClick={loadList} disabled={listLoading}
                  className="text-gray-500 hover:text-gray-300 transition-colors">
                  <RefreshCw className={`w-4 h-4 ${listLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {listLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-gray-500 animate-spin" /></div>
              ) : listErr ? (
                <div className="px-6 py-4 text-sm text-red-400">{listErr}</div>
              ) : (
                <SbomList sboms={sboms} onSelect={handleSelect} selected={selectedId} />
              )}
            </div>

            {/* Detail */}
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              {!selectedId ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Package className="w-10 h-10 text-gray-700 mb-3" />
                  <p className="text-gray-500 text-sm">Select an SBOM to view packages and dependency tree</p>
                </div>
              ) : detailLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-gray-500 animate-spin" /></div>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex border-b border-white/10">
                    {['packages', 'tree'].map(t => (
                      <button key={t} onClick={() => setTab(t)}
                        className={`px-6 py-3.5 text-sm font-semibold transition-colors ${tab === t ? 'text-white border-b-2 border-emerald-400' : 'text-gray-500 hover:text-gray-300'}`}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {tab === 'packages' && (
                    <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
                      {packages.length === 0 && (
                        <div className="text-center py-10 text-gray-500 text-sm">No packages found</div>
                      )}
                      {packages.map((p, i) => {
                        const name    = field(p, 'name', 'Name', 'packageName', 'PackageName') ?? '(unknown)'
                        const ver     = field(p, 'version', 'Version') ?? ''
                        const license = field(p, 'license', 'License', 'licenses', 'Licenses')
                        const score   = field(p, 'riskScore', 'RiskScore', 'risk', 'Risk')
                        const cves    = field(p, 'cveCount', 'CveCount', 'vulnCount', 'VulnCount')
                        return (
                          <div key={i} className="flex items-center justify-between px-6 py-3">
                            <div>
                              <span className="text-sm text-white font-mono">{name}</span>
                              {ver && <span className="text-xs text-gray-500 ml-2">@{ver}</span>}
                              {license && <span className="text-xs text-gray-600 ml-2">{license}</span>}
                            </div>
                            <div className="flex items-center gap-3">
                              {cves != null && cves > 0 && (
                                <span className="text-xs text-red-400">{cves} CVE{cves !== 1 ? 's' : ''}</span>
                              )}
                              <RiskBadge score={score} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {tab === 'tree' && (
                    <div className="px-4 py-4 max-h-[480px] overflow-y-auto font-mono text-xs">
                      {roots == null
                        ? <p className="text-gray-500 text-sm text-center py-10">No dependency tree available</p>
                        : Array.isArray(roots)
                          ? roots.map((r, i) => <DepTree key={i} pkg={r} />)
                          : <DepTree pkg={roots} />}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
