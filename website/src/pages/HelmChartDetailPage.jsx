import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Copy, Check, Loader2, AlertCircle, Ship, Download,
  ShieldCheck, BadgeCheck, Tag, Boxes, Package, ExternalLink,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getHelmChartDetail } from '../services/api'

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

function MetaRow({ label, value }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-sm text-gray-400 w-36 shrink-0">{label}</span>
      <span className="text-sm font-medium text-white break-words min-w-0">{value}</span>
    </div>
  )
}

export default function HelmChartDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [chart, setChart]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getHelmChartDetail(slug)
      .then(setChart)
      .catch(() => setError('Could not load this chart — it may not exist.'))
      .finally(() => setLoading(false))
  }, [slug])

  const security = f(chart, 'security') ?? {}
  const meta     = f(chart, 'metadata', 'chart') ?? chart ?? {}

  const name        = f(chart, 'name', 'slug', 'id') ?? slug
  const description = f(chart, 'description', 'summary', 'longDescription') ?? ''
  const category    = f(chart, 'category') ?? ''
  const pulls       = f(chart, 'pulls', 'pullCount', 'downloads', 'installs')
  const version     = f(meta, 'version', 'chartVersion') ?? f(chart, 'version', 'chartVersion', 'latestVersion')
  const appVersion  = f(meta, 'appVersion') ?? f(chart, 'appVersion')
  const apiVersion  = f(meta, 'apiVersion') ?? f(chart, 'apiVersion')
  const chartType   = f(meta, 'type') ?? f(chart, 'type')
  const home        = f(meta, 'home', 'homepage') ?? f(chart, 'home', 'homepage')
  const keywords    = asArray(meta, 'keywords').length ? asArray(meta, 'keywords') : asArray(chart, 'keywords')
  const maintainers = asArray(meta, 'maintainers').length ? asArray(meta, 'maintainers') : asArray(chart, 'maintainers')
  const sources     = asArray(meta, 'sources').length ? asArray(meta, 'sources') : asArray(chart, 'sources')

  const fips        = f(security, 'fipsAvailable', 'fips') ?? f(chart, 'fipsAvailable', 'fips', 'isFips')
  const cveCount    = f(security, 'cveCount', 'cves') ?? f(chart, 'cveCount', 'cves')
  const reduction   = f(security, 'cveReductionPercent', 'cveReduction') ?? f(chart, 'cveReductionPercent')
  const provenance  = f(security, 'signedProvenance', 'provenance', 'signed') ?? f(chart, 'signedProvenance')

  const dependencies = asArray(chart, 'dependencies', 'deps')
  const values       = asArray(chart, 'values', 'valuesSchema', 'configuration')
  const valuesYaml   = f(chart, 'valuesYaml', 'defaultValues', 'valuesFile')

  const repoName = f(chart, 'repoName', 'repositoryName') ?? 'udyo360'
  const repoUrl  = f(chart, 'repoUrl', 'repository', 'repositoryUrl') ?? 'https://charts.udyo360.com'
  const addCmd     = f(chart, 'repoAddCommand')     ?? `helm repo add ${repoName} ${repoUrl}`
  const installCmd = f(chart, 'installCommand')     ?? `helm install ${name} ${repoName}/${name}${version ? ` --version ${String(version).replace(/^v/, '')}` : ''}`

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">

        <Link to="/helm" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> All Aegis Charts
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
            <button onClick={() => navigate('/helm')} className="text-sm text-crimson-400 hover:text-crimson-300 transition-colors">
              ← Back to catalog
            </button>
          </div>
        )}

        {!loading && !error && chart && (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
                <Ship className="w-7 h-7 text-crimson-400" />
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
                {category && <p className="text-sm text-gray-500 mt-1">{category}</p>}
              </div>
              {pulls != null && (
                <div className="text-right shrink-0">
                  <p className="inline-flex items-center gap-1.5 text-sm text-gray-300">
                    <Download className="w-4 h-4 text-gray-500" /> {compact(pulls)}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5">installs</p>
                </div>
              )}
            </div>

            {description && <p className="text-gray-300 leading-relaxed max-w-3xl mb-8">{description}</p>}

            {/* Install commands */}
            <h2 className="text-lg font-bold text-white mb-3">Install</h2>
            <div className="space-y-3 mb-8">
              <CommandBlock label="Add the repository" command={addCmd} />
              <CommandBlock label="Install the chart" command={installCmd} />
            </div>

            {/* Security posture */}
            <h2 className="text-lg font-bold text-white mb-3">Security posture</h2>
            <div className="grid sm:grid-cols-3 gap-3 mb-8">
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  Number(cveCount) === 0 || cveCount == null ? 'bg-green-500/12 border border-green-500/25' : 'bg-amber-500/12 border border-amber-500/25'
                }`}>
                  <ShieldCheck className={`w-4 h-4 ${Number(cveCount) === 0 || cveCount == null ? 'text-green-400' : 'text-amber-400'}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Known CVEs</p>
                  <p className="text-sm font-semibold text-white">{Number(cveCount) === 0 || cveCount == null ? '0 — none' : String(cveCount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${reduction != null ? 'bg-green-500/12 border border-green-500/25' : 'bg-white/5 border border-white/10'}`}>
                  <ShieldCheck className={`w-4 h-4 ${reduction != null ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">CVE reduction</p>
                  <p className="text-sm font-semibold text-white">{reduction != null ? `${reduction}%` : '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${provenance ? 'bg-green-500/12 border border-green-500/25' : 'bg-white/5 border border-white/10'}`}>
                  <BadgeCheck className={`w-4 h-4 ${provenance ? 'text-green-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Signed provenance</p>
                  <p className="text-sm font-semibold text-white">{provenance ? 'Verified' : 'Not signed'}</p>
                </div>
              </div>
            </div>

            {/* Chart metadata */}
            <h2 className="text-lg font-bold text-white mb-3">Chart metadata</h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl divide-y divide-white/5 mb-8">
              <MetaRow label="Chart version" value={version ? `v${String(version).replace(/^v/, '')}` : null} />
              <MetaRow label="App version" value={appVersion} />
              <MetaRow label="API version" value={apiVersion} />
              <MetaRow label="Type" value={chartType} />
              {home && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="text-sm text-gray-400 w-36 shrink-0">Home</span>
                  <a href={home} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-crimson-400 hover:text-crimson-300 transition-colors inline-flex items-center gap-1 min-w-0 break-all">
                    {home} <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {maintainers.length > 0 && (
                <MetaRow label="Maintainers" value={maintainers.map((m) => (typeof m === 'string' ? m : (f(m, 'name', 'email') ?? ''))).filter(Boolean).join(', ')} />
              )}
              {sources.length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="text-sm text-gray-400 w-36 shrink-0">Sources</span>
                  <div className="min-w-0 space-y-1">
                    {sources.map((s, i) => (
                      <a key={i} href={s} target="_blank" rel="noopener noreferrer" className="block text-sm text-crimson-400 hover:text-crimson-300 transition-colors break-all">{s}</a>
                    ))}
                  </div>
                </div>
              )}
              {keywords.length > 0 && (
                <div className="flex items-start gap-3 px-4 py-3">
                  <span className="text-sm text-gray-400 w-36 shrink-0">Keywords</span>
                  <div className="flex flex-wrap gap-1.5 min-w-0">
                    {keywords.map((k, i) => (
                      <span key={i} className="text-[11px] text-gray-300 bg-white/5 border border-white/10 rounded px-2 py-0.5">{String(k)}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dependencies */}
            {dependencies.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white mb-3">Dependencies</h2>
                <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto mb-8">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="bg-white/3 border-b border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Version</th>
                        <th className="text-left px-4 py-3">Repository</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dependencies.map((d, i) => (
                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-white">{f(d, 'name') ?? '—'}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{f(d, 'version') ?? '—'}</td>
                          <td className="px-4 py-2.5 text-xs text-gray-500 break-all">{f(d, 'repository', 'repo') ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Values */}
            {(values.length > 0 || valuesYaml) && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-white">Values</h2>
                  {values.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                      <Boxes className="w-3.5 h-3.5 text-gray-500" />
                      {values.length} {values.length === 1 ? 'key' : 'keys'}
                    </span>
                  )}
                </div>

                {values.length > 0 ? (
                  <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead>
                        <tr className="bg-white/3 border-b border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                          <th className="text-left px-4 py-3">Key</th>
                          <th className="text-left px-4 py-3">Default</th>
                          <th className="text-left px-4 py-3">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {values.map((v, i) => {
                          const key  = f(v, 'key', 'name', 'path') ?? '—'
                          const dflt = f(v, 'default', 'value', 'defaultValue')
                          const desc = f(v, 'description', 'desc') ?? ''
                          const dfltStr = dflt == null ? '—' : (typeof dflt === 'object' ? JSON.stringify(dflt) : String(dflt))
                          return (
                            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors align-top">
                              <td className="px-4 py-2.5 font-mono text-xs text-crimson-400">{key}</td>
                              <td className="px-4 py-2.5 font-mono text-xs text-gray-300 break-all">{dfltStr}</td>
                              <td className="px-4 py-2.5 text-xs text-gray-400">{desc || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 border-b border-white/10">
                      <span className="font-mono text-xs text-gray-400">values.yaml</span>
                    </div>
                    <div className="p-4 overflow-x-auto max-h-[420px] overflow-y-auto">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">{valuesYaml}</pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
