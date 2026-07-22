import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, AlertCircle,
  ShieldCheck, Eye, ShieldAlert, Boxes, Activity,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCleanSightStats, getCleanSight } from '../services/api'

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
  { id: 'latest',   label: 'Latest'         },
  { id: 'severity', label: 'Highest Risk'   },
  { id: 'name',     label: 'Name (A–Z)'     },
]

/* Severity → chip style */
const SEV = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/25',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/25',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/25',
  low:      'text-blue-400 bg-blue-500/10 border-blue-500/25',
  none:     'text-green-400 bg-green-500/10 border-green-500/25',
  clean:    'text-green-400 bg-green-500/10 border-green-500/25',
}
function sevKey(raw) {
  const s = String(raw ?? '').toLowerCase()
  return SEV[s] ? s : (s ? 'low' : 'none')
}

/* ── Stat band ── */
function StatBand({ stats }) {
  const items = [
    { icon: Boxes,       value: compact(f(stats, 'totalArtifacts', 'total', 'monitored')),        label: 'Artifacts Monitored' },
    { icon: ShieldCheck, value: compact(f(stats, 'clean', 'cleanCount', 'passing')),              label: 'Clean' },
    { icon: ShieldAlert, value: compact(f(stats, 'atRisk', 'flagged', 'vulnerable')),             label: 'At Risk' },
    { icon: Activity,    value: compact(f(stats, 'cvesRemediated', 'cvesFixed', 'remediated')),   label: 'CVEs Remediated' },
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

/* ── Record card ── */
function SightCard({ record, onOpen }) {
  const id       = f(record, 'id', 'slug', 'name') ?? ''
  const name     = f(record, 'name', 'title', 'artifact', 'id') ?? '—'
  const desc     = f(record, 'description', 'summary') ?? ''
  const type     = f(record, 'type', 'kind', 'category', 'source') ?? ''
  const sev      = f(record, 'severity', 'risk', 'status')
  const cveCount = f(record, 'cveCount', 'cves', 'findings', 'issues')
  const sk       = sevKey(sev)
  const sevLabel = sev ? String(sev) : (Number(cveCount) > 0 ? 'At risk' : 'Clean')

  return (
    <button
      onClick={() => onOpen(id)}
      className="text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-colors flex flex-col h-full group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-crimson-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-crimson-300 transition-colors">{name}</h3>
            {type && <p className="text-[11px] text-gray-500 truncate">{type}</p>}
          </div>
        </div>
        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider rounded px-1.5 py-0.5 border ${SEV[sk]}`}>
          {sevLabel}
        </span>
      </div>

      {desc && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2 mb-4 flex-1">{desc}</p>}

      <div className="flex items-center flex-wrap gap-1.5 mt-auto">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded px-1.5 py-0.5 border ${
          Number(cveCount) > 0 ? SEV.medium : SEV.none
        }`}>
          <ShieldCheck className="w-3 h-3" />
          {Number(cveCount) > 0 ? `${cveCount} findings` : '0 findings'}
        </span>
      </div>
    </button>
  )
}

export default function CleanSightPage() {
  const navigate = useNavigate()

  const [stats, setStats]     = useState(null)
  const [search, setSearch]   = useState('')
  const [sort, setSort]       = useState('latest')
  const [page, setPage]       = useState(1)

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const [sortOpen, setSortOpen] = useState(false)
  const sortRef = useRef(null)
  const debRef  = useRef(null)

  useEffect(() => {
    getCleanSightStats().then(setStats).catch(() => {})
  }, [])

  const fetchRecords = useCallback((opts) => {
    setLoading(true)
    setError(null)
    getCleanSight(opts)
      .then(setData)
      .catch(() => setError('Could not load CleanSight data — please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchRecords({ search, sort, page, pageSize: PAGE_SIZE })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort, page])

  const onSearch = (e) => {
    const q = e.target.value
    setSearch(q)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => {
      setPage(1)
      fetchRecords({ search: q, sort, page: 1, pageSize: PAGE_SIZE })
    }, 300)
  }

  useEffect(() => {
    const close = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const openRecord = (id) => navigate(`/cleansight/${encodeURIComponent(id)}`)

  const items = Array.isArray(data)
    ? data
    : (f(data, 'records', 'items', 'results', 'data', 'artifacts') ?? [])
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
            <Eye className="w-3.5 h-3.5" /> Supply-Chain Visibility
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            Clean<span className="text-crimson-500">Sight</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            One view across your entire Clean supply chain — images, charts, and libraries.
            Track CVE posture, provenance, and SBOM coverage for every artifact, and see
            exactly what's clean and what needs attention.
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
              placeholder="Search artifacts…"
              className="w-full bg-white/5 border border-white/10 focus:border-crimson-500 text-white placeholder-gray-500 pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
            />
          </div>

          <div className="relative sm:w-48" ref={sortRef}>
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
              <div key={i} className="h-36 bg-white/3 border border-white/5 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-white font-semibold mb-1">Nothing to show yet</p>
            <p className="text-gray-500 text-sm">No artifacts match your search.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((rec, i) => (
              <SightCard key={f(rec, 'id', 'slug', 'name') ?? i} record={rec} onOpen={openRecord} />
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
          Visibility across{' '}
          <Link to="/images" className="text-crimson-400 hover:text-crimson-300 transition-colors">Clean Images</Link>
          {' · '}
          <Link to="/helm" className="text-crimson-400 hover:text-crimson-300 transition-colors">Helm Charts</Link>
          {' · '}
          <Link to="/libraries" className="text-crimson-400 hover:text-crimson-300 transition-colors">Clean Libraries</Link>
        </p>
      </main>

      <Footer />
    </div>
  )
}
