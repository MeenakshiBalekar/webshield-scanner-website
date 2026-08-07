import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Copy, Check, Loader2, AlertCircle, Package, Download,
  ShieldCheck, BadgeCheck, FileText, FileCheck2, Tag, HardDrive, Boxes, Send,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import RequestImageModal from '../components/RequestImageModal'
import { getImageDetail, getImageTags, getImageSbom } from '../services/api'
import { BACKEND } from '../utils/backend.js'

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

/* ── Copy-able pull command ── */
function PullCommand({ command }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(command || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
        <span className="text-xs text-gray-400 font-medium">Pull command</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
        >
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

/* ── Security posture pill ── */
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

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="w-4 h-4 text-gray-500 shrink-0" />
      <span className="text-sm text-gray-400 flex-1">{label}</span>
      <span className="text-sm font-medium text-white text-right">{value}</span>
    </div>
  )
}

/* Small helpers for tab async states */
function TabLoading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-crimson-400 animate-spin" />
    </div>
  )
}
function TabError({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" /> {msg}
    </div>
  )
}

/* ── Overview tab ── */
function OverviewTab({ image }) {
  /* API nests security posture under `security` and metadata under `details` */
  const security = f(image, 'security') ?? {}
  const details  = f(image, 'details')  ?? {}

  const name        = f(image, 'name', 'slug', 'id')
  const size        = f(details, 'compressedSize', 'size') ?? f(image, 'compressedSize', 'size')
  const cveCount    = f(security, 'cveCount', 'cves') ?? f(image, 'cveCount', 'cves', 'vulnerabilities')
  const reduction   = f(security, 'cveReductionPercent', 'cveReduction') ?? f(image, 'cveReductionPercent', 'cveReduction', 'reductionPercent')
  const fips        = f(security, 'fipsAvailable', 'fips') ?? f(details, 'fipsAvailable') ?? f(image, 'fipsAvailable', 'fips', 'isFips')
  const sbom        = f(security, 'sbomAvailable', 'sbom') ?? f(image, 'sbomAvailable', 'sbom', 'hasSbom')
  const provenance  = f(security, 'signedProvenance', 'provenance') ?? f(image, 'signedProvenance', 'provenance', 'signed', 'hasProvenance')
  const tags        = asArray(image, 'tags', 'versions', 'availableTags')
  const related     = asArray(image, 'related', 'relatedImages')
  const defaultTag  = f(details, 'latestTag') ?? f(image, 'latestTag', 'version', 'tag') ?? 'latest'
  const pullCommand = f(image, 'pullCommand', 'dockerPull') ?? f(details, 'pullCommand') ??
    `docker pull ${f(image, 'registry') ?? 'registry.udyo360.com'}/${name}:${defaultTag}`

  const slug = f(image, 'slug', 'name', 'id')

  return (
    <>
      {/* Pull command + SBOM download */}
      <div className="mb-8 space-y-3">
        <PullCommand command={pullCommand} />
        <a
          href={`${BACKEND}/api/images/${encodeURIComponent(slug)}/sbom/download`}
          download
          className="inline-flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          <FileText className="w-4 h-4" /> Download SBOM
        </a>
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
        <PostureItem
          icon={ShieldCheck}
          ok={reduction != null}
          label="CVE reduction"
          value={reduction != null ? `${reduction}%` : '—'}
        />
        <PostureItem icon={FileText}   ok={!!sbom}       label="SBOM"              value={sbom ? 'Included' : 'Not available'} />
        <PostureItem icon={FileCheck2} ok={!!provenance} label="Signed provenance" value={provenance ? 'Verified' : 'Not signed'} />
      </div>

      {/* Details */}
      <h2 className="text-lg font-bold text-white mb-3">Details</h2>
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl divide-y divide-white/5 mb-8">
        <DetailRow icon={BadgeCheck} label="FIPS build" value={fips ? 'Available' : 'Not available'} />
        <DetailRow icon={HardDrive}  label="Compressed size" value={size ? String(size) : '—'} />
        <DetailRow icon={Tag}        label="Latest tag" value={defaultTag} />
        {tags.length > 0 && (
          <div className="flex items-start gap-3 px-4 py-3.5">
            <Tag className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 mb-1.5">Available tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t, i) => {
                  const label = typeof t === 'string' ? t : (f(t, 'tag', 'name', 'version') ?? String(t))
                  return (
                    <span key={i} className="font-mono text-[11px] text-gray-300 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Related images */}
      {related.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-white mb-3">Related images</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {related.map((r, i) => {
              const rName = typeof r === 'string' ? r : (f(r, 'name', 'slug', 'id') ?? '—')
              const rSlug = typeof r === 'string' ? r : (f(r, 'slug', 'name', 'id') ?? rName)
              const rDesc = typeof r === 'string' ? '' : (f(r, 'description', 'category') ?? '')
              return (
                <Link
                  key={i}
                  to={`/images/${encodeURIComponent(rSlug)}`}
                  className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-crimson-300 transition-colors">{rName}</p>
                    {rDesc && <p className="text-[11px] text-gray-500 truncate">{rDesc}</p>}
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </>
  )
}

/* ── Tags tab ── */
function TagsTab({ slug }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    getImageTags(slug)
      .then(setData)
      .catch(() => setError('Could not load tags — please try again.'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <TabLoading />
  if (error)   return <TabError msg={error} />

  const tags = asArray(data, 'tags', 'items', 'results')
  if (tags.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">No tags available for this image.</p>
  }

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="bg-white/3 border-b border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            <th className="text-left px-4 py-3">Tag</th>
            <th className="text-left px-4 py-3">Digest</th>
            <th className="text-left px-4 py-3">Size</th>
            <th className="text-left px-4 py-3">Architectures</th>
            <th className="text-left px-4 py-3">Last pushed</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((t, i) => {
            const tag    = f(t, 'tag', 'name', 'version') ?? '—'
            const digest = f(t, 'digest', 'sha', 'hash') ?? ''
            const size   = f(t, 'size', 'compressedSize')
            const archsRaw = f(t, 'architectures', 'archs', 'platforms', 'arch')
            const archs  = Array.isArray(archsRaw)
              ? archsRaw.map((a) => (typeof a === 'string' ? a : (f(a, 'arch', 'name') ?? String(a))))
              : (archsRaw ? [String(archsRaw)] : [])
            const pushed = f(t, 'lastPushed', 'pushedAt', 'updated', 'updatedAt', 'created') ?? ''
            const shortDigest = digest ? (String(digest).length > 19 ? `${String(digest).slice(0, 19)}…` : String(digest)) : '—'
            return (
              <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-crimson-400 font-semibold">{tag}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[11px] text-gray-500" title={digest}>{shortDigest}</span>
                </td>
                <td className="px-4 py-3 text-gray-300">{size != null ? String(size) : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {archs.length > 0
                      ? archs.map((a, j) => (
                          <span key={j} className="font-mono text-[10px] text-gray-300 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{a}</span>
                        ))
                      : <span className="text-gray-600">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{pushed || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── SBOM & Scan tab ── */
const SEV_STYLE = {
  critical: 'text-red-400 border-red-500/30 bg-red-500/10',
  high:     'text-orange-400 border-orange-500/30 bg-orange-500/10',
  medium:   'text-amber-400 border-amber-500/30 bg-amber-500/10',
  low:      'text-blue-400 border-blue-500/30 bg-blue-500/10',
}

function SbomTab({ slug }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true); setError(null)
    getImageSbom(slug)
      .then(setData)
      .catch(() => setError('Could not load SBOM & scan — please try again.'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return <TabLoading />
  if (error)   return <TabError msg={error} />

  /* Vulnerability summary — support flat or nested shapes */
  const vuln = f(data, 'vulnerabilities', 'scan', 'summary', 'vulnerabilitySummary') ?? data ?? {}
  const critical = Number(f(vuln, 'critical') ?? 0)
  const high     = Number(f(vuln, 'high')     ?? 0)
  const medium   = Number(f(vuln, 'medium')   ?? 0)
  const low      = Number(f(vuln, 'low')      ?? 0)
  const totalVuln = critical + high + medium + low

  const packages = asArray(data, 'packages', 'sbom', 'components', 'items')

  const sevCounts = [
    { label: 'Critical', key: 'critical', n: critical },
    { label: 'High',     key: 'high',     n: high },
    { label: 'Medium',   key: 'medium',   n: medium },
    { label: 'Low',      key: 'low',      n: low },
  ]

  return (
    <div className="space-y-8">
      {/* Vulnerability scan summary */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3">Vulnerability scan</h2>
        <div className={`rounded-2xl border p-6 ${
          totalVuln === 0 ? 'bg-green-500/[0.06] border-green-500/25' : 'bg-white/[0.03] border-white/10'
        }`}>
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              totalVuln === 0 ? 'bg-green-500/15 border border-green-500/30' : 'bg-amber-500/15 border border-amber-500/30'
            }`}>
              <ShieldCheck className={`w-5 h-5 ${totalVuln === 0 ? 'text-green-400' : 'text-amber-400'}`} />
            </div>
            <div>
              <p className={`text-lg font-bold ${totalVuln === 0 ? 'text-green-400' : 'text-white'}`}>
                {totalVuln === 0 ? 'No known vulnerabilities' : `${totalVuln} known ${totalVuln === 1 ? 'vulnerability' : 'vulnerabilities'}`}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Latest scan of this image</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {sevCounts.map(({ label, key, n }) => (
              <div key={key} className={`rounded-xl border px-4 py-3 text-center ${
                n > 0 ? SEV_STYLE[key] : 'border-white/10 bg-white/[0.02]'
              }`}>
                <p className={`text-2xl font-extrabold leading-none ${n > 0 ? '' : 'text-gray-400'}`}>{n}</p>
                <p className={`text-[11px] mt-1.5 ${n > 0 ? '' : 'text-gray-600'}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SBOM package table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Software Bill of Materials</h2>
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-full px-3 py-1">
            <Boxes className="w-3.5 h-3.5 text-gray-500" />
            {packages.length} {packages.length === 1 ? 'package' : 'packages'}
          </span>
        </div>
        {packages.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center border border-white/10 rounded-2xl">
            No SBOM package data available.
          </p>
        ) : (
          <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-white/3 border-b border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Package</th>
                  <th className="text-left px-4 py-3">Version</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">License</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((p, i) => {
                  const pName    = f(p, 'name', 'package', 'packageName') ?? '—'
                  const pVersion = f(p, 'version', 'ver') ?? '—'
                  const pType    = f(p, 'type', 'ecosystem', 'purlType') ?? '—'
                  const pLicense = f(p, 'license', 'licenses', 'spdx') ?? '—'
                  const licenseStr = Array.isArray(pLicense) ? pLicense.join(', ') : String(pLicense)
                  return (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-200">{pName}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{pVersion}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-[10px] text-gray-400 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{pType}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-400">{licenseStr || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tags',     label: 'Tags' },
  { id: 'sbom',     label: 'SBOM & Scan' },
]

export default function AegisImageDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [image, setImage]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [requestOpen, setRequestOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setActiveTab('overview')
    getImageDetail(slug)
      .then(setImage)
      .catch(() => setError('Could not load this image — it may not exist.'))
      .finally(() => setLoading(false))
  }, [slug])

  const name        = f(image, 'name', 'slug', 'id') ?? slug
  const description = f(image, 'description', 'summary', 'longDescription') ?? ''
  const category    = f(image, 'category') ?? ''
  const pulls       = f(image, 'pulls', 'pullCount', 'downloads') ?? f(f(image, 'details'), 'pulls', 'pullCount')
  const fips        = f(f(image, 'security'), 'fipsAvailable', 'fips') ?? f(image, 'fipsAvailable', 'fips', 'isFips')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">

        {/* Back link */}
        <Link
          to="/images"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> All Aegis Images
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
            <button
              onClick={() => navigate('/images')}
              className="text-sm text-crimson-400 hover:text-crimson-300 transition-colors"
            >
              ← Back to catalog
            </button>
          </div>
        )}

        {!loading && !error && image && (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
                <Package className="w-7 h-7 text-crimson-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-3xl font-extrabold text-white leading-tight">{name}</h1>
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
                  <p className="text-[11px] text-gray-600 mt-0.5">pulls</p>
                </div>
              )}
            </div>

            {description && (
              <p className="text-gray-300 leading-relaxed max-w-3xl mb-6">{description}</p>
            )}

            {/* Tab bar */}
            <div className="flex border-b border-white/10 mb-8">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    activeTab === t.id
                      ? 'border-crimson-500 text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            {activeTab === 'overview' && <OverviewTab image={image} />}
            {activeTab === 'tags'     && <TagsTab slug={slug} />}
            {activeTab === 'sbom'     && <SbomTab slug={slug} />}

            {/* Request a custom variant */}
            <div className="mt-12 bg-crimson-500/10 border border-crimson-500/20 rounded-2xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Need a custom variant of {name}?</p>
                <p className="text-xs text-gray-400 mt-0.5">Extra packages, FIPS builds, or a different base — we'll harden it for you.</p>
              </div>
              <button
                onClick={() => setRequestOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
              >
                <Send className="w-4 h-4" /> Request a Custom Image
              </button>
            </div>

            <RequestImageModal
              open={requestOpen}
              onClose={() => setRequestOpen(false)}
              defaultImage={name}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
