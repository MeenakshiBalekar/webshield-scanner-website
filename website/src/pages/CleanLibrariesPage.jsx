import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, AlertCircle,
  ShieldCheck, Library, Download, BadgeCheck, Boxes,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getLibraryStats, getLibraryCategories, getLibraries } from '../services/api'

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
    { icon: Boxes,       value: compact(f(stats, 'totalLibraries', 'libraries', 'totalImages')),  label: 'Hardened Libraries' },
    { icon: BadgeCheck,  value: compact(f(stats, 'ecosystems', 'totalEcosystems')),               label: 'Ecosystems'         },
    { icon: Download,    value: compact(f(stats, 'totalPulls', 'pulls', 'downloads')),            label: 'Total Downloads'    },
    { icon: ShieldCheck, value: compact(f(stats, 'cvesRemediated', 'cvesFixed', 'totalCves')),    label: 'CVEs Remediated'    },
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

/* ── Library card ── */
function LibraryCard({ library, onOpen }) {
  const security = f(library, 'security') ?? {}
  const name    = f(library, 'name', 'slug', 'id') ?? '—'
  const slug    = f(library, 'slug', 'name', 'id') ?? ''
  const desc    = f(library, 'description', 'summary', 'shortDescription') ?? ''
  const category = f(library, 'category') ?? ''
  const ecosystem = f(library, 'ecosystem', 'language', 'packageManager', 'registry')
  const pulls   = f(library, 'pulls', 'pullCount', 'downloads')
  const version = f(library, 'version', 'latestVersion')
  const fips    = f(security, 'fipsAvailable', 'fips') ?? f(library, 'fipsAvailable', 'fips', 'isFips')
  const cveCount = f(security, 'cveCount', 'cves') ?? f(library, 'cveCount', 'cves', 'vulnerabilities')

  return (
    <button
      onClick={() => onOpen(slug)}
      className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-colors flex flex-col h-full group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
            <Library className="w-4 h-4 text-crimson-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-crimson-300 transition-colors">{name}</h3>
            <p className="text-[11px] text-gray-500 truncate">{ecosystem || category}</p>
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
        {version && (
          <span className="font-mono text-[10px] text-gray-400 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 truncate max-w-[110px]">
            v{String(version).replace(/^v/, '')}
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

export default function CleanLibrariesPage() {
  const navigate = useNavigate()

  const [stats, setStats]           = useState(null)
  const [categories, setCategories] = useState([])

  const [search, setSearch]     = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort]         = useState('popular')
  const [page, setPage]         = useState(1)

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [sortOpen, setSortOpen] = useState(false)
  const sortRef  = useRef(null)
  const debRef   = useRef(null)

  useEffect(() => {
    getLibraryStats().then(setStats).catch(() => {})
    getLibraryCategories()
      .then((d) => {
        const arr = Array.isArray(d) ? d : (f(d, 'categories', 'items') ?? [])
        setCategories(Array.isArray(arr) ? arr : [])
      })
      .catch(() => {})
  }, [])

  const fetchLibraries = useCallback((opts) => {
    setLoading(true)
    setError(null)
    getLibraries(opts)
      .then(setData)
      .catch(() => setError('Could not load libraries — please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchLibraries({ search, category, sort, page, pageSize: PAGE_SIZE })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, sort, page])

  const onSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => {
      setPage(1)
      fetchLibraries({ search: q, category, sort, page: 1, pageSize: PAGE_SIZE })
    }, 300)
  }

  useEffect(() => {
    const close = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openLibrary = (slug) => navigate(`/libraries/${encodeURIComponent(slug)}`)

  const items = Array.isArray(data)
    ? data
    : (f(data, 'libraries', 'items', 'results', 'data') ?? [])
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
            <ShieldCheck className="w-3.5 h-3.5" /> Hardened · Signed · Near-Zero CVE
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Clean <span className="text-crimson-500">Libraries</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Hardened, rebuilt language packages across npm, PyPI, Maven, and more —
            with signed provenance, a complete SBOM, and near-zero known vulnerabilities.
            A secure drop-in for the dependencies you already use.
          </p>
        </div>

        {/* Stat band */}
        <div className="mb-10">
          <StatBand stats={stats} />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={onSearch}
              placeholder="Search libraries — lodash, requests, jackson…"
              className="w-full bg-white/5 border border-white/10 focus:border-crimson-500 text-white placeholder-gray-500 pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
            />
          </div>

          <div className="relative sm:w-56">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1) }}
              className="w-full appearance-none bg-white/5 border border-white/10 focus:border-crimson-500 text-white px-4 py-3 pr-9 rounded-xl text-sm outline-none transition-colors cursor-pointer"
            >
              <option value="">All Ecosystems</option>
              {categories.map((c, i) => {
                const cname = f(c, 'name', 'category', 'ecosystem') ?? (typeof c === 'string' ? c : '')
                const count = f(c, 'count')
                return (
                  <option key={i} value={cname}>
                    {cname}{count != null ? ` (${count})` : ''}
                  </option>
                )
              })}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

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
            <p className="text-white font-semibold mb-1">No libraries found</p>
            <p className="text-gray-500 text-sm">Try a different search term or ecosystem.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((lib, i) => (
              <LibraryCard key={f(lib, 'slug', 'name', 'id') ?? i} library={lib} onOpen={openLibrary} />
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

        {/* Footer note */}
        <p className="text-center text-xs text-gray-600 mt-12">
          Part of the Clean supply-chain family.{' '}
          <Link to="/images" className="text-crimson-400 hover:text-crimson-300 transition-colors">Clean Images</Link>
          {' · '}
          <Link to="/helm" className="text-crimson-400 hover:text-crimson-300 transition-colors">Helm Charts</Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
