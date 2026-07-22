import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, Loader2, AlertCircle,
  ShieldCheck, Package, Download, BadgeCheck, Boxes, Hammer, Send,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import RequestImageModal from '../components/RequestImageModal'
import { getImageStats, getImageCategories, getImages } from '../services/api'

/* Dual-case field accessor — backend may serialize camelCase or PascalCase */
function f(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
    const cap = k.charAt(0).toUpperCase() + k.slice(1)
    if (obj[cap] !== undefined && obj[cap] !== null) return obj[cap]
  }
  return undefined
}

/* Compact large numbers: 3980000 -> 3.98M */
function compact(n) {
  const num = Number(n)
  if (!Number.isFinite(num)) return '—'
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return String(num)
}

const PAGE_SIZE = 12

const SORTS = [
  { id: 'latest',  label: 'Latest'       },
  { id: 'popular', label: 'Most Popular' },
  { id: 'name',    label: 'Name (A–Z)'   },
  { id: 'secure',  label: 'Most Secure'  },
]

/* ── Stat band ── */
function StatBand({ stats }) {
  const items = [
    { icon: Boxes,       value: compact(f(stats, 'totalImages', 'images')),                    label: 'Hardened Images' },
    { icon: BadgeCheck,  value: compact(f(stats, 'fipsImages', 'fips')),                        label: 'FIPS Available'  },
    { icon: Download,    value: compact(f(stats, 'totalPulls', 'pulls')),                       label: 'Total Pulls'     },
    { icon: ShieldCheck, value: compact(f(stats, 'cvesRemediated', 'cvesFixed', 'totalCves')), label: 'CVEs Remediated' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map(({ icon: Icon, value, label }) => (
        <div key={label} className="bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-5 text-center">
          <Icon className="w-5 h-5 text-crimson-400 mx-auto mb-2" />
          <p className="text-2xl font-extrabold text-white leading-none">{value}</p>
          <p className="text-xs text-gray-500 mt-1.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Image card ── */
function ImageCard({ image, onOpen }) {
  const security = f(image, 'security') ?? {}
  const name    = f(image, 'name', 'slug', 'id') ?? '—'
  const slug    = f(image, 'slug', 'name', 'id') ?? ''
  const desc    = f(image, 'description', 'summary', 'shortDescription') ?? ''
  const category = f(image, 'category') ?? ''
  const pulls   = f(image, 'pulls', 'pullCount', 'downloads')
  const tag     = f(image, 'latestTag', 'version', 'tag')
  const fips    = f(security, 'fipsAvailable', 'fips') ?? f(image, 'fipsAvailable', 'fips', 'isFips')
  const cveCount = f(security, 'cveCount', 'cves') ?? f(image, 'cveCount', 'cves', 'vulnerabilities')
  const reduction = f(security, 'cveReductionPercent', 'cveReduction') ?? f(image, 'cveReductionPercent', 'cveReduction', 'reductionPercent')

  return (
    <button
      onClick={() => onOpen(slug)}
      className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-colors flex flex-col h-full group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-crimson-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-crimson-300 transition-colors">{name}</h3>
            {category && <p className="text-[11px] text-gray-500 truncate">{category}</p>}
          </div>
        </div>
        {fips && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/25 rounded px-1.5 py-0.5">
            FIPS
          </span>
        )}
      </div>

      {desc && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4 flex-1">{desc}</p>}

      <div className="flex items-center flex-wrap gap-1.5 mt-auto">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5">
          <ShieldCheck className="w-3 h-3" />
          {Number(cveCount) === 0 || cveCount == null ? '0 CVEs' : `${cveCount} CVEs`}
        </span>
        {reduction != null && (
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">
            {reduction}% reduced
          </span>
        )}
        {tag && (
          <span className="font-mono text-[10px] text-gray-400 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 truncate max-w-[100px]">
            {tag}
          </span>
        )}
        {pulls != null && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-gray-500">
            <Download className="w-3 h-3" /> {compact(pulls)}
          </span>
        )}
      </div>
    </button>
  )
}

export default function CleanImagesPage() {
  const navigate = useNavigate()

  const [stats, setStats]           = useState(null)
  const [categories, setCategories] = useState([])   // [{ name, count }]

  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort]         = useState('popular')
  const [page, setPage]         = useState(1)

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [sortOpen, setSortOpen]       = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)
  const sortRef  = useRef(null)
  const debRef   = useRef(null)

  /* Static metadata — stats + categories (once) */
  useEffect(() => {
    getImageStats().then(setStats).catch(() => {})
    getImageCategories()
      .then((d) => {
        const arr = Array.isArray(d) ? d : (f(d, 'categories', 'items') ?? [])
        setCategories(Array.isArray(arr) ? arr : [])
      })
      .catch(() => {})
  }, [])

  /* Catalog fetch — re-runs on filter/sort/page change */
  const fetchImages = useCallback((opts) => {
    setLoading(true)
    setError(null)
    getImages(opts)
      .then(setData)
      .catch(() => setError('Could not load images — please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchImages({ search, category, sort, page, pageSize: PAGE_SIZE })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, page])

  /* Debounced search */
  const onSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => {
      setPage(1)
      fetchImages({ search: q, category, sort, page: 1, pageSize: PAGE_SIZE })
    }, 300)
  }

  /* Close sort dropdown on outside click */
  useEffect(() => {
    const close = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openImage = (slug) => navigate(`/images/${encodeURIComponent(slug)}`)

  /* Normalize list response — support several shapes */
  const items = Array.isArray(data)
    ? data
    : (f(data, 'images', 'items', 'results', 'data') ?? [])
  const total      = f(data, 'total', 'totalCount', 'count') ?? (Array.isArray(items) ? items.length : 0)
  const totalPages = f(data, 'totalPages', 'pages') ?? Math.max(1, Math.ceil(total / PAGE_SIZE))

  const activeSortLabel = SORTS.find((s) => s.id === sort)?.label ?? 'Sort'

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-24 pb-16">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-crimson-500/10 border border-crimson-500/25 text-crimson-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <ShieldCheck className="w-3.5 h-3.5" /> Hardened · Near-Zero CVE · Signed
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Aegis <span className="text-crimson-500">Images</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Minimal, hardened container images with near-zero known vulnerabilities.
            FIPS-ready builds, signed provenance, and a complete SBOM for every image —
            a secure drop-in replacement for your base images.
          </p>
        </div>

        {/* Stat band */}
        <div className="mb-10">
          <StatBand stats={stats} />
        </div>

        {/* Controls: search + category + sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={onSearch}
              placeholder="Search images — nginx, postgres, python…"
              className="w-full bg-white/5 border border-white/10 focus:border-crimson-500 text-white placeholder-gray-500 pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
            />
          </div>

          {/* Category dropdown (native select for reliability) */}
          <div className="relative sm:w-56">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="w-full appearance-none bg-white/5 border border-white/10 focus:border-crimson-500 text-white px-4 py-3 pr-9 rounded-xl text-sm outline-none transition-colors cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map((c, i) => {
                const name  = f(c, 'name', 'category') ?? (typeof c === 'string' ? c : '')
                const count = f(c, 'count')
                return (
                  <option key={i} value={name}>
                    {name}{count != null ? ` (${count})` : ''}
                  </option>
                )
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* Sort dropdown */}
          <div className="relative sm:w-44" ref={sortRef}>
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 hover:border-white/20 text-white px-4 py-3 rounded-xl text-sm transition-colors"
            >
              <span className="truncate">{activeSortLabel}</span>
              <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 ml-2" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-full bg-navy-900 border border-white/10 rounded-xl shadow-2xl py-1.5 z-20">
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSort(s.id); setPage(1); setSortOpen(false) }}
                    className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                      sort === s.id ? 'text-crimson-400 bg-white/5' : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-white/3 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-white font-semibold mb-1">No images found</p>
            <p className="text-gray-500 text-sm">Try a different search term or category.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((img, i) => (
              <ImageCard key={f(img, 'slug', 'name', 'id') ?? i} image={img} onOpen={openImage} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10 text-sm text-gray-400">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-gray-500">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Community / Enterprise band */}
        <div className="grid md:grid-cols-2 gap-4 mt-14">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Boxes className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Community</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Pull any Aegis Image for free. Every build is minimal, hardened, and ships
              with a signed SBOM — no account required.
            </p>
            <Link
              to="/agent"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Download className="w-4 h-4" /> Get the Udyo360 Agent
            </Link>
          </div>
          <div className="bg-crimson-500/10 border border-crimson-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-crimson-400" />
              <h3 className="text-base font-bold text-white">Enterprise</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              Private image mirrors, custom hardened builds, FIPS attestations, SLA-backed
              CVE remediation, and compliance evidence for your auditors.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                to="/images/builder"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-crimson-400 hover:text-crimson-300 transition-colors"
              >
                <Hammer className="w-4 h-4" /> Custom Image Builder
              </Link>
              <button
                onClick={() => setRequestOpen(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-crimson-400 hover:text-crimson-300 transition-colors"
              >
                <Send className="w-4 h-4" /> Request a Custom Image
              </button>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-crimson-400 hover:text-crimson-300 transition-colors"
              >
                Talk to sales <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        <RequestImageModal open={requestOpen} onClose={() => setRequestOpen(false)} />

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-12">
          Every image ships with a signed SBOM and provenance attestation.{' '}
          <Link to="/agent" className="text-crimson-400 hover:text-crimson-300 transition-colors">
            Scan your own servers with the Udyo360 Agent →
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
