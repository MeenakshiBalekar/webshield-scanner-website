import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Copy, Check, Loader2, AlertCircle, Library, Download,
  ShieldCheck, BadgeCheck, FileText, FileCheck2, ExternalLink, Boxes,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getLibraryDetail } from '../services/api'

/* Dual-case field accessor */
function f(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
    const cap = k.charAt(0).toUpperCase() + k.slice(1)
    if (obj[cap] !== undefined && obj[cap] !== null) return obj[cap]
  }
  return undefined
}

function compact(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return String(num)
}

function asArray(d, ...keys) {
  if (Array.isArray(d)) return d
  const v = f(d, ...keys)
  return Array.isArray(v) ? v : []
}

/* Derive an install command from the ecosystem when the API doesn't supply one */
function defaultInstall(ecosystem, name, version) {
  const eco = String(ecosystem || '').toLowerCase()
  const v = version ? String(version).replace(/^v/, '') : ''
  if (eco.includes('npm') || eco.includes('node') || eco.includes('javascript'))     return `npm install ${name}${v ? `@${v}` : ''}`
  if (eco.includes('pypi') || eco.includes('python') || eco.includes('pip'))         return `pip install ${name}${v ? `==${v}` : ''}`
  if (eco.includes('maven') || eco.includes('java'))                                 return `<dependency>\n  <artifactId>${name}</artifactId>${v ? `\n  <version>${v}</version>` : ''}\n</dependency>`
  if (eco.includes('cargo') || eco.includes('rust'))                                 return `cargo add ${name}${v ? `@${v}` : ''}`
  if (eco.includes('go') || eco.includes('golang'))                                  return `go get ${name}${v ? `@v${v}` : ''}`
  if (eco.includes('gem') || eco.includes('ruby'))                                   return `gem install ${name}${v ? ` -v ${v}` : ''}`
  if (eco.includes('nuget') || eco.includes('.net') || eco.includes('dotnet'))       return `dotnet add package ${name}${v ? ` --version ${v}` : ''}`
  return `# install ${name}${v ? ` (v${v})` : ''}`
}

/* ── Copy-able command block ── */
function CommandBlock({ label, command }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(command || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-gray-400 font-medium">{label}</span>
        <button onClick={copy} className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
          {copied
            ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied</span></>
            : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
        </button>
      </div>
      <div className="px-4 py-3.5 font-mono text-sm overflow-x-auto">
        <span className="text-green-400 whitespace-pre">{command}</span>
      </div>
    </div>
  )
}

function PostureItem({ icon: Icon, ok, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        ok ? 'bg-green-500/12 border border-green-500/25' : 'bg-white/5 border border-white/10'
      }`}>
        <Icon className={`w-4 h-4 ${ok ? 'text-green-400' : 'text-gray-500'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${ok ? 'text-white' : 'text-gray-400'}`}>{value}</p>
      </div>
    </div>
  )
}

function MetaRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-sm text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-white break-words min-w-0">{value}</span>
    </div>
  )
}

export default function CleanLibraryDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [library, setLibrary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getLibraryDetail(slug)
      .then(setLibrary)
      .catch(() => setError('Could not load this library — it may not exist.'))
      .finally(() => setLoading(false))
  }, [slug])

  const security = f(library, 'security') ?? {}
  const details  = f(library, 'details')  ?? {}

  const name        = f(library, 'name', 'slug', 'id') ?? slug
  const description = f(library, 'description', 'summary', 'longDescription') ?? ''
  const ecosystem   = f(library, 'ecosystem', 'language', 'packageManager', 'registry') ?? f(details, 'ecosystem')
  const pulls       = f(library, 'pulls', 'pullCount', 'downloads')
  const version     = f(details, 'version', 'latestVersion') ?? f(library, 'version', 'latestVersion')
  const license     = f(details, 'license') ?? f(library, 'license', 'licenses')
  const homepage    = f(details, 'homepage', 'home') ?? f(library, 'homepage', 'home')
  const repository  = f(details, 'repository', 'repo') ?? f(library, 'repository', 'repo', 'sourceUrl')

  const cveCount    = f(security, 'cveCount', 'cves') ?? f(library, 'cveCount', 'cves')
  const reduction   = f(security, 'cveReductionPercent', 'cveReduction') ?? f(library, 'cveReductionPercent')
  const sbom        = f(security, 'sbomAvailable', 'sbom') ?? f(library, 'sbomAvailable', 'sbom')
  const provenance  = f(security, 'signedProvenance', 'provenance', 'signed') ?? f(library, 'signedProvenance')
  const fips        = f(security, 'fipsAvailable', 'fips') ?? f(library, 'fipsAvailable', 'fips', 'isFips')

  const versions     = asArray(library, 'versions', 'tags', 'releases')
  const dependencies = asArray(library, 'dependencies', 'deps')

  const licenseStr = Array.isArray(license) ? license.join(', ') : license
  const installCmd = f(library, 'installCommand', 'install') ?? defaultInstall(ecosystem, name, version)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">

        <Link to="/libraries" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> All Aegis Libraries
        </Link>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-crimson-400 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
            <button onClick={() => navigate('/libraries')} className="text-sm text-crimson-400 hover:text-crimson-300 transition-colors">
              ← Back to catalog
            </button>
          </div>
        )}

        {!loading && !error && library && (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
                <Library className="w-7 h-7 text-crimson-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-3xl font-extrabold text-white leading-tight">{name}</h1>
                  {version && (
                    <span className="font-mono text-xs text-gray-300 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                      v{String(version).replace(/^v/, '')}
                    </span>
                  )}
                  {fips && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/25 rounded px-2 py-0.5">
                      FIPS
                    </span>
                  )}
                </div>
                {ecosystem && <p className="text-sm text-gray-500 mt-1">{ecosystem}</p>}
              </div>
              {pulls != null && (
                <div className="text-right shrink-0">
                  <p className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                    <Download className="w-4 h-4 text-gray-500" /> {compact(pulls)}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">downloads</p>
                </div>
              )}
            </div>

            {description && <p className="text-gray-300 leading-relaxed max-w-3xl mb-8">{description}</p>}

            {/* Install */}
            <h2 className="text-lg font-bold text-white mb-3">Install</h2>
            <div className="mb-8">
              <CommandBlock label={ecosystem ? `${ecosystem} install` : 'Install'} command={installCmd} />
            </div>

            {/* Security posture */}
            <h2 className="text-lg font-bold text-white mb-3">Security posture</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              <PostureItem
                icon={ShieldCheck}
                ok={Number(cveCount) === 0 || cveCount == null}
                label="Known CVEs"
                value={Number(cveCount) === 0 || cveCount == null ? '0 — none' : String(cveCount)}
              />
              <PostureItem icon={ShieldCheck} ok={reduction != null} label="CVE reduction" value={reduction != null ? `${reduction}%` : '—'} />
              <PostureItem icon={FileText}    ok={!!sbom}            label="SBOM"              value={sbom ? 'Included' : 'Not available'} />
              <PostureItem icon={FileCheck2}  ok={!!provenance}      label="Signed provenance" value={provenance ? 'Verified' : 'Not signed'} />
            </div>

            {/* Details */}
            <h2 className="text-lg font-bold text-white mb-3">Details</h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl divide-y divide-white/5 mb-8">
              <MetaRow label="Ecosystem" value={ecosystem} />
              <MetaRow label="Latest version" value={version ? `v${String(version).replace(/^v/, '')}` : null} />
              <MetaRow label="License" value={licenseStr} />
              <MetaRow label="FIPS build" value={fips ? 'Available' : null} />
              {homepage && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="text-sm text-gray-400 w-36 shrink-0">Homepage</span>
                  <a href={homepage} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-crimson-400 hover:text-crimson-300 transition-colors inline-flex items-center gap-1 min-w-0 break-all">
                    {homepage} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {repository && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="text-sm text-gray-400 w-36 shrink-0">Repository</span>
                  <a href={repository} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-crimson-400 hover:text-crimson-300 transition-colors inline-flex items-center gap-1 min-w-0 break-all">
                    {repository} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            {/* Versions */}
            {versions.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white mb-3">Versions</h2>
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {versions.map((v, i) => {
                    const label = typeof v === 'string' ? v : (f(v, 'version', 'tag', 'name') ?? String(v))
                    return (
                      <span key={i} className="font-mono text-[11px] text-gray-300 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                        v{String(label).replace(/^v/, '')}
                      </span>
                    )
                  })}
                </div>
              </>
            )}

            {/* Dependencies */}
            {dependencies.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">Dependencies</h2>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                    <Boxes className="w-3.5 h-3.5 text-gray-500" />
                    {dependencies.length} {dependencies.length === 1 ? 'dependency' : 'dependencies'}
                  </span>
                </div>
                <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[440px]">
                    <thead>
                      <tr className="bg-white/3 border-b border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependencies.map((d, i) => {
                        const dName = typeof d === 'string' ? d : (f(d, 'name', 'package') ?? '—')
                        const dVer  = typeof d === 'string' ? '' : (f(d, 'version', 'range') ?? '')
                        return (
                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-200">{dName}</td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{dVer || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
