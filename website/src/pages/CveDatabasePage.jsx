import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Search, AlertCircle, ChevronDown, ChevronUp, ExternalLink, Tag } from 'lucide-react'
import { searchCVE, getCVECategories } from '../services/api'

const SEVERITIES = ['', 'Critical', 'High', 'Medium', 'Low']

const SEVERITY_STYLE = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Low:      'text-green-400 bg-green-500/10 border-green-500/30',
}

function CveRow({ cve }) {
  const [open, setOpen] = useState(false)
  const id          = cve.Id ?? cve.id ?? cve.CveId ?? cve.cveId ?? ''
  const name        = cve.Name ?? cve.name ?? id
  const desc        = cve.Description ?? cve.description ?? ''
  const severity    = cve.Severity ?? cve.severity ?? ''
  const cvss        = cve.CvssScore ?? cve.cvssScore ?? cve.Cvss ?? cve.cvss
  const affected    = cve.AffectedSystems ?? cve.affectedSystems ?? []
  const tags        = cve.Tags ?? cve.tags ?? []
  const published   = cve.PublishedDate ?? cve.publishedDate

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white font-mono">{id}</span>
            {severity && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SEVERITY_STYLE[severity] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                {severity}
              </span>
            )}
            {cvss != null && (
              <span className="text-xs text-gray-400 font-semibold">CVSS {Number(cvss).toFixed(1)}</span>
            )}
          </div>
          <p className="text-sm text-gray-300 font-medium">{name !== id ? name : ''}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{desc}</p>
        </div>
        <div className="shrink-0 mt-1">
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>

          {affected.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1.5">Affected Systems</p>
              <div className="flex flex-wrap gap-1.5">
                {affected.map((s, i) => (
                  <span key={i} className="text-xs text-gray-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs text-crimson-400 bg-crimson-500/10 border border-crimson-500/20 px-2 py-0.5 rounded-full">
                  <Tag className="w-3 h-3" /> {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            {published && (
              <p className="text-xs text-gray-500">
                Published: {new Date(published).toLocaleDateString()}
              </p>
            )}
            <a
              href={`https://nvd.nist.gov/vuln/detail/${id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-crimson-400 hover:text-crimson-300 transition-colors"
            >
              NVD details <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CvePage() {
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('')
  const [results, setResults] = useState(null)
  const [total, setTotal] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getCVECategories()
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.Categories ?? data?.categories ?? []
        setCategories(arr)
      })
      .catch(() => {})
    // Initial load — show latest/all
    runSearch('', '')
  }, [])

  const runSearch = (q, sev) => {
    setLoading(true)
    setError(null)
    searchCVE({ q, severity: sev })
      .then((data) => {
        const list = data?.Results ?? data?.results ?? (Array.isArray(data) ? data : [])
        setResults(list)
        setTotal(data?.Total ?? data?.total ?? list.length)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    runSearch(query, severity)
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to home</Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white mb-2">CVE Database</h1>
          <p className="text-gray-400">Search known vulnerabilities by keyword, ID, or severity.</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search CVE ID, name, description, system…"
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 pl-10 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
            />
          </div>
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="bg-white/5 border border-white/15 text-white px-4 py-3 rounded-xl text-sm outline-none"
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s} className="bg-navy-900">{s || 'All Severities'}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors shrink-0"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Results */}
          <div className="lg:col-span-3">
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading && !results && (
              <div className="flex justify-center py-16">
                <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}

            {results && (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  {total != null ? `${total} result${total !== 1 ? 's' : ''}` : `${results.length} results`}
                  {query && ` for "${query}"`}
                  {severity && ` · ${severity}`}
                </p>
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  {results.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-12">No CVEs found.</p>
                  )}
                  {results.map((cve, i) => <CveRow key={i} cve={cve} />)}
                </div>
              </>
            )}
          </div>

          {/* Category sidebar */}
          {categories.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-3">Categories</h2>
              <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                {categories.map((cat, i) => {
                  const name  = cat.Category ?? cat.category ?? cat.Name ?? cat.name ?? ''
                  const count = cat.Count ?? cat.count ?? 0
                  return (
                    <button
                      key={i}
                      onClick={() => { setQuery(name); runSearch(name, severity) }}
                      className="w-full flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="text-sm text-gray-300">{name}</span>
                      <span className="text-xs text-gray-500 font-semibold">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
