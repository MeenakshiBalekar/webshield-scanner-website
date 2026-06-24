import React, { useState } from 'react'
import {
  Globe, ScanLine, Loader2, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { startCrawlScan } from '../services/api'

const SEVERITY_STYLES = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         dot: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       dot: 'bg-blue-400'   },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       dot: 'bg-gray-400'   },
}
const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }
const sevStyle = (s) => SEVERITY_STYLES[s] || SEVERITY_STYLES.Info

function statusChip(code) {
  if (!code) return <span className="text-[10px] text-gray-600">—</span>
  const n = Number(code)
  const cls = n >= 500 ? 'text-red-400 bg-red-500/10 border-red-500/30'
    : n >= 400 ? 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    : n >= 300 ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    : 'text-green-400 bg-green-500/10 border-green-500/30'
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cls}`}>{code}</span>
  )
}

function FindingRow({ finding }) {
  const [open, setOpen] = useState(false)
  const checkName  = field(finding, 'checkName', 'CheckName', 'name', 'Name', 'type', 'Type')
  const severity   = field(finding, 'severity', 'Severity')
  const details    = field(finding, 'technicalDetails', 'TechnicalDetails', 'description', 'Description', 'details', 'Details')
  const rec        = field(finding, 'recommendation', 'Recommendation', 'fix', 'Fix')
  const pageUrl    = field(finding, 'pageUrl', 'PageUrl', 'url', 'Url', 'page', 'Page')
  const cveId      = field(finding, 'cveId', 'CveId')
  const cvssScore  = field(finding, 'cvssScore', 'CvssScore')
  const style      = sevStyle(severity)

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{checkName}</p>
          {pageUrl && <p className="text-[10px] text-gray-500 font-mono truncate">{pageUrl}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cveId && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30">
              {cveId}
            </span>
          )}
          {cvssScore && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">
              CVSS {cvssScore}
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
            {severity || 'Info'}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          {details && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Details</p>
              <p className="text-sm text-gray-300">{details}</p>
            </div>
          )}
          {rec && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Recommendation</p>
              <p className="text-sm text-gray-300">{rec}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CrawlScanPage() {
  const [url, setUrl]           = useState('')
  const [maxDepth, setMaxDepth] = useState(2)
  const [maxPages, setMaxPages] = useState(20)
  const [scanning, setScanning] = useState(false)
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState(null)
  const [selectedPage, setSelectedPage] = useState(null)
  const [sevFilter, setSevFilter] = useState('')

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url.trim()) { setError('Enter a URL to crawl.'); return }
    setScanning(true); setError(null); setResults(null); setSelectedPage(null); setSevFilter('')
    try {
      const data = await startCrawlScan({ url: url.trim(), maxDepth, maxPages })
      setResults(data)
    } catch (err) {
      setError('Crawl scan failed')
    }
    setScanning(false)
  }

  const pages      = results?.pages      ?? results?.Pages      ?? []
  const allFindings = results?.findings  ?? results?.Findings   ?? []
  const seedUrl    = results?.seedUrl    ?? results?.SeedUrl    ?? results?.url ?? url
  const totalPages = results?.totalPages ?? results?.TotalPages ?? pages.length
  const pagesWithIssues = results?.pagesWithIssues ?? results?.PagesWithIssues
    ?? pages.filter(p => (p.findingCount ?? p.FindingCount ?? 0) > 0).length

  const displayFindings = selectedPage
    ? allFindings.filter(f => {
        const fu = field(f, 'pageUrl', 'PageUrl', 'url', 'Url', 'page', 'Page')
        const pu = field(selectedPage, 'url', 'Url')
        return fu === pu
      })
    : allFindings

  const severities = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const counts = severities.reduce((acc, s) => {
    acc[s] = displayFindings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === s).length
    return acc
  }, {})
  const filtered = sevFilter
    ? displayFindings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === sevFilter)
    : displayFindings

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-violet-500/15 border border-violet-500/30 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Web Crawler Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Crawl & Scan Entire Sites</h1>
            <p className="text-gray-400 leading-relaxed">
              Automatically crawl your website and scan every discovered page for missing security headers,
              mixed content, exposed info, and other web vulnerabilities.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* Scan form */}
          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start URL</label>
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Max Depth</span>
                  <span className="text-white font-bold">{maxDepth}</span>
                </label>
                <input
                  type="range" min={1} max={3} step={1}
                  value={maxDepth}
                  onChange={e => setMaxDepth(Number(e.target.value))}
                  className="w-full accent-crimson-500"
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>1 (shallow)</span><span>3 (deep)</span>
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Max Pages</span>
                  <span className="text-white font-bold">{maxPages}</span>
                </label>
                <input
                  type="range" min={5} max={50} step={5}
                  value={maxPages}
                  onChange={e => setMaxPages(Number(e.target.value))}
                  className="w-full accent-crimson-500"
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                  <span>5</span><span>50</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={scanning}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {scanning ? 'Crawling…' : 'Start Crawl Scan'}
            </button>
          </form>

          {/* Results: two-panel layout */}
          {results && (
            <div className="space-y-4">
              {/* Stats row */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <div className="text-xl font-extrabold text-white">{totalPages}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Pages crawled</div>
                </div>
                <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <div className="text-xl font-extrabold text-orange-400">{pagesWithIssues}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">With issues</div>
                </div>
                <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[80px]">
                  <div className="text-xl font-extrabold text-crimson-400">{allFindings.length}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Total findings</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left: pages list */}
                {pages.length > 0 && (
                  <div className="lg:col-span-2 bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <p className="text-xs font-semibold text-gray-300">Crawled Pages</p>
                      {selectedPage && (
                        <button
                          onClick={() => setSelectedPage(null)}
                          className="text-[10px] text-gray-500 hover:text-white transition-colors"
                        >
                          Show all
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
                      {pages.map((page, i) => {
                        const pu = field(page, 'url', 'Url')
                        const sc = field(page, 'statusCode', 'StatusCode', 'status', 'Status')
                        const fc = field(page, 'findingCount', 'FindingCount') || 0
                        const err = field(page, 'error', 'Error')
                        const isSelected = selectedPage && field(selectedPage, 'url', 'Url') === pu
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedPage(isSelected ? null : page)}
                            className={`w-full text-left px-4 py-3 hover:bg-white/3 transition-colors ${
                              isSelected ? 'bg-crimson-500/10 border-l-2 border-crimson-500' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-300 font-mono truncate">{pu || `Page ${i + 1}`}</p>
                                {err && <p className="text-[10px] text-red-400 truncate mt-0.5">{err}</p>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {statusChip(sc)}
                                {fc > 0 && (
                                  <span className="text-[10px] font-bold text-crimson-400 bg-crimson-500/10 border border-crimson-500/30 px-1.5 py-0.5 rounded">
                                    {fc}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Right: findings */}
                <div className={pages.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'}>
                  <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-xs font-semibold text-gray-300">
                        {selectedPage
                          ? `Findings — ${field(selectedPage, 'url', 'Url')}`
                          : `All Findings (${allFindings.length})`}
                      </p>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Severity filter */}
                      {displayFindings.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSevFilter('')}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                              !sevFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'
                            }`}
                          >
                            All ({displayFindings.length})
                          </button>
                          {severities.filter(s => counts[s] > 0).map(s => {
                            const style = sevStyle(s)
                            return (
                              <button
                                key={s}
                                onClick={() => setSevFilter(sevFilter === s ? '' : s)}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                  sevFilter === s
                                    ? `${style.badge} border-current`
                                    : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'
                                }`}
                              >
                                {s} ({counts[s]})
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 py-10 text-center">
                          <CheckCircle2 className="w-8 h-8 text-green-400" />
                          <p className="text-white font-semibold text-sm">
                            {displayFindings.length === 0 ? 'No issues found' : 'No findings match this filter'}
                          </p>
                          {selectedPage && displayFindings.length === 0 && (
                            <p className="text-xs text-gray-500">This page has no security findings.</p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filtered.map((f, i) => <FindingRow key={i} finding={f} />)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
