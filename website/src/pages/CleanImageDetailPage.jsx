import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Copy, Check, Loader2, AlertCircle, Package, Download,
  ShieldCheck, BadgeCheck, FileText, FileCheck2, Tag, HardDrive,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getImageDetail } from '../services/api'

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

export default function CleanImageDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()

  const [image, setImage]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getImageDetail(slug)
      .then(setImage)
      .catch(() => setError('Could not load this image — it may not exist.'))
      .finally(() => setLoading(false))
  }, [slug])

  const name        = f(image, 'name', 'slug', 'id') ?? slug
  const description = f(image, 'description', 'summary', 'longDescription') ?? ''
  const category    = f(image, 'category') ?? ''
  const pulls       = f(image, 'pulls', 'pullCount', 'downloads')
  const size        = f(image, 'compressedSize', 'size')
  const cveCount    = f(image, 'cveCount', 'cves', 'vulnerabilities')
  const reduction   = f(image, 'cveReduction', 'reductionPercent')
  const fips        = f(image, 'fipsAvailable', 'fips', 'isFips')
  const sbom        = f(image, 'sbom', 'hasSbom', 'sbomAvailable')
  const provenance  = f(image, 'signedProvenance', 'provenance', 'signed', 'hasProvenance')
  const tags        = f(image, 'tags', 'versions', 'availableTags') ?? []
  const related     = f(image, 'related', 'relatedImages') ?? []

  const defaultTag  = f(image, 'latestTag', 'version', 'tag') ?? 'latest'
  const pullCommand = f(image, 'pullCommand', 'dockerPull') ??
    `docker pull ${f(image, 'registry') ?? 'registry.udyo360.com'}/${name}:${defaultTag}`

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">

        {/* Back link */}
        <Link
          to="/images"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" /> All Clean Images
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
              <p className="text-gray-300 leading-relaxed max-w-3xl mb-8">{description}</p>
            )}

            {/* Pull command */}
            <div className="mb-8">
              <PullCommand command={pullCommand} />
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
              <PostureItem
                icon={FileText}
                ok={!!sbom}
                label="SBOM"
                value={sbom ? 'Included' : 'Not available'}
              />
              <PostureItem
                icon={FileCheck2}
                ok={!!provenance}
                label="Signed provenance"
                value={provenance ? 'Verified' : 'Not signed'}
              />
            </div>

            {/* Details */}
            <h2 className="text-lg font-bold text-white mb-3">Details</h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl divide-y divide-white/5 mb-8">
              <DetailRow icon={BadgeCheck} label="FIPS build" value={fips ? 'Available' : 'Not available'} />
              <DetailRow icon={HardDrive}  label="Compressed size" value={size ? String(size) : '—'} />
              <DetailRow icon={Tag}        label="Latest tag" value={defaultTag} />
              {Array.isArray(tags) && tags.length > 0 && (
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
            {Array.isArray(related) && related.length > 0 && (
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
        )}
      </main>

      <Footer />
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
