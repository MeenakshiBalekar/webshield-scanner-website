import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useParams, Link } from 'react-router-dom'
import {
  Search, Copy, Check, ChevronLeft, ChevronRight,
  ExternalLink, AlertCircle, Loader2, Info, X, Database,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ─── API constants (public — no auth required) ──────────────── */
const API = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'

/* ─── Severity style maps ────────────────────────────────────── */
const SEV_BADGE = {
  Critical: 'bg-red-700 text-white',
  High:     'bg-orange-600 text-white',
  Medium:   'bg-yellow-600 text-black',
  Low:      'bg-blue-600 text-white',
  Info:     'bg-slate-500 text-white',
}

const SEV_TEXT = {
  Critical: 'text-red-400',
  High:     'text-orange-400',
  Medium:   'text-yellow-400',
  Low:      'text-blue-400',
  Info:     'text-slate-400',
}

const SEV_STROKE = {
  Critical: '#b91c1c',
  High:     '#ea580c',
  Medium:   '#ca8a04',
  Low:      '#2563eb',
  Info:     '#64748b',
}

/* ─── CVE severity badge classes ────────────────────────────── */
const SEV_BADGE_CLS = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

/* ─── Relative time helper ───────────────────────────────────── */
function timeAgo(date) {
  if (!date) return '—'
  const diffMs = Date.now() - new Date(date).getTime()
  const diffD  = Math.floor(diffMs / 86400000)
  if (diffD < 1)   return 'today'
  if (diffD < 30)  return `${diffD}d ago`
  const diffM = Math.floor(diffD / 30)
  if (diffM < 12)  return `${diffM}mo ago`
  return `${Math.floor(diffM / 12)}yr ago`
}

/* ─── Dual-case field accessor ───────────────────────────────── */
function f(obj, ...keys) {
  if (!obj) return ''
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
    const cap = k.charAt(0).toUpperCase() + k.slice(1)
    if (obj[cap] !== undefined && obj[cap] !== null) return obj[cap]
  }
  return ''
}

function normSev(raw) {
  if (!raw) return 'Info'
  const s = String(raw).trim()
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/* ─── CVSS Gauge (SVG arc) ───────────────────────────────────── */
function CvssGauge({ score, severity }) {
  const sev = normSev(severity)
  const num = parseFloat(score) || 0
  const clamped = Math.min(Math.max(num, 0), 10)
  const R = 32
  const cx = 44
  const cy = 44
  const sw = 6
  const startAngle = 135
  const totalDeg = 270
  const sweepDeg = (clamped / 10) * totalDeg
  const toRad = (deg) => (deg * Math.PI) / 180

  function polar(angleDeg) {
    return {
      x: cx + R * Math.cos(toRad(angleDeg)),
      y: cy + R * Math.sin(toRad(angleDeg)),
    }
  }

  const start = polar(startAngle)
  const bgEnd = polar(startAngle + totalDeg)
  const fgEnd = polar(startAngle + sweepDeg)
  const bgPath = `M ${start.x} ${start.y} A ${R} ${R} 0 ${totalDeg > 180 ? 1 : 0} 1 ${bgEnd.x} ${bgEnd.y}`
  const fgPath = sweepDeg > 0
    ? `M ${start.x} ${start.y} A ${R} ${R} 0 ${sweepDeg > 180 ? 1 : 0} 1 ${fgEnd.x} ${fgEnd.y}`
    : ''

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={sw} strokeLinecap="round" />
      {fgPath && (
        <path d={fgPath} fill="none" stroke={SEV_STROKE[sev] ?? SEV_STROKE.Info} strokeWidth={sw} strokeLinecap="round" />
      )}
      <text x={cx} y={cy - 4} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="13" fontWeight="700">
        {num.toFixed(1)}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" dominantBaseline="middle" fill="rgba(255,255,255,0.45)" fontSize="8">
        CVSS
      </text>
    </svg>
  )
}

/* ─── Copy button ────────────────────────────────────────────── */
function CopyBtn({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text || '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handle}
      title="Copy"
      className={`flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded ${className}`}
    >
      {copied
        ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied</span></>
        : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
    </button>
  )
}

/* ─── CodeBlock helper ───────────────────────────────────────── */
function CodeBlock({ lang, code, maxH = 'max-h-72' }) {
  return (
    <div className="relative bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/8">
        {lang
          ? <span className="font-mono text-[10px] bg-white/8 border border-white/15 px-2 py-0.5 rounded text-gray-400">{lang}</span>
          : <span />
        }
        <CopyBtn text={code} />
      </div>
      <div className={`${maxH} overflow-y-auto p-4`}>
        <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">{code}</pre>
      </div>
    </div>
  )
}

/* ─── ComplianceSection helper ───────────────────────────────── */
function ComplianceSection({ compliance }) {
  const c = compliance ?? {}
  const rows = [
    { label: 'PCI-DSS',     value: c.pciDss    ?? c.PciDss    ?? c.pci_dss    ?? '' },
    { label: 'ISO 27001',   value: c.iso27001   ?? c.Iso27001  ?? c.iso_27001  ?? '' },
    { label: 'SOC 2',       value: c.soc2       ?? c.Soc2      ?? c.SOC2       ?? '' },
    { label: 'NIST 800-53', value: c.nist80053  ?? c.Nist80053 ?? c.nist_800_53 ?? '' },
  ]
  return (
    <div className="space-y-1.5">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
          {value
            ? <span className="font-mono text-[10px] bg-white/8 border border-white/15 px-1.5 py-0.5 rounded text-gray-300 truncate">{value}</span>
            : <span className="text-[10px] text-gray-600">—</span>
          }
        </div>
      ))}
    </div>
  )
}

/* ─── CheckRow (left panel list item) ───────────────────────── */
function CheckRow({ item, selected, onClick }) {
  const id       = f(item, 'id')
  const title    = f(item, 'title')
  const category = f(item, 'category')
  const cweId    = f(item, 'cweId')
  const severity = normSev(f(item, 'severity'))
  const cvss     = parseFloat(f(item, 'cvssScore')) || 0

  return (
    <button
      onClick={() => onClick(id)}
      className={[
        'w-full text-left px-3 py-3 border-b border-white/5 last:border-0',
        'border-l-2 transition-colors',
        selected
          ? 'border-l-crimson-500 bg-white/[0.03]'
          : 'border-l-transparent hover:bg-white/[0.02]',
      ].join(' ')}
    >
      <div className="flex items-start gap-2">
        <span
          className={[
            'shrink-0 mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded',
            SEV_BADGE[severity] ?? SEV_BADGE.Info,
          ].join(' ')}
        >
          {severity}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white leading-snug truncate">{title}</p>
          <p className="text-[10px] text-gray-500 mt-0.5 truncate">
            {category}{cweId ? ` • CWE-${cweId}` : ''}
          </p>
        </div>
        <span className={['text-xs font-bold shrink-0', SEV_TEXT[severity] ?? SEV_TEXT.Info].join(' ')}>
          {cvss > 0 ? cvss.toFixed(1) : '—'}
        </span>
      </div>
    </button>
  )
}

/* ─── CheckDetail (right panel) ─────────────────────────────── */
function CheckDetail({ checkId, list, onNavigate }) {
  const [detail, setDetail]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [activeFixTab, setActiveFixTab] = useState(0)
  const [copiedCmd, setCopiedCmd]   = useState(null)

  useEffect(() => {
    if (!checkId) { setDetail(null); return }
    setLoading(true)
    setError(null)
    setActiveFixTab(0)
    fetch(`${BACKEND}/api/remediation/${checkId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then((d) => setDetail(d))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [checkId])

  const currentIdx = list.findIndex((c) => f(c, 'id') === checkId)
  const prevItem   = currentIdx > 0 ? list[currentIdx - 1] : null
  const nextItem   = currentIdx < list.length - 1 ? list[currentIdx + 1] : null

  const handleCopyCmd = (idx, text) => {
    navigator.clipboard.writeText(text || '').then(() => {
      setCopiedCmd(idx)
      setTimeout(() => setCopiedCmd(null), 2000)
    })
  }

  if (!checkId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-600">
        <Info className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-semibold">Select a check from the list</p>
        <p className="text-xs mt-1 opacity-70">Click any item on the left to view its details.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-crimson-400 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      </div>
    )
  }

  if (!detail) return null

  const severity    = normSev(f(detail, 'severity'))
  const title       = f(detail, 'title')
  const category    = f(detail, 'category')
  const cweId       = f(detail, 'cweId')
  const owasp       = f(detail, 'owaspTop10')
  const shortDesc   = f(detail, 'shortDescription')
  const detailedDesc = f(detail, 'detailedDescription')
  const bizImpact   = f(detail, 'businessImpact')
  const attackScen  = f(detail, 'attackScenario')
  const cvssObj     = detail.cvss ?? detail.Cvss ?? {}
  const cvssScore   = cvssObj.score ?? cvssObj.Score ?? f(detail, 'cvssScore') ?? 0
  const cvssVector  = cvssObj.vector ?? cvssObj.Vector ?? ''
  const compliance  = detail.compliance ?? detail.Compliance ?? {}
  const fixes       = detail.fixes ?? detail.Fixes ?? []
  const verCmds     = detail.verificationCommands ?? detail.VerificationCommands ?? []
  const refs        = detail.references ?? detail.References ?? []

  const activeFix = fixes[activeFixTab] ?? null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sticky header */}
      <div className="shrink-0 sticky top-0 z-10 backdrop-blur-md bg-[#0a0f1a]/80 border-b border-white/10 px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={['text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded', SEV_BADGE[severity] ?? SEV_BADGE.Info].join(' ')}>
                {severity}
              </span>
              {cweId && (
                <span className="font-mono text-[10px] bg-white/8 border border-white/15 px-2 py-0.5 rounded text-gray-300">
                  CWE-{cweId}
                </span>
              )}
              {owasp && (
                <span className="text-[10px] text-gray-400 truncate max-w-[200px]" title={owasp}>
                  {owasp}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white leading-snug">{title}</h2>
            {cvssVector && (
              <p className="font-mono text-[10px] text-gray-500 mt-1 truncate" title={cvssVector}>
                {cvssVector}
              </p>
            )}
          </div>
          <div className="shrink-0">
            <CvssGauge score={cvssScore} severity={severity} />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* 4-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* What it is */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">What it is</p>
            <p className="text-xs text-gray-300 leading-relaxed">{shortDesc || detailedDesc || '—'}</p>
          </div>

          {/* Business Impact */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Business Impact</p>
            <p className="text-xs text-gray-300 leading-relaxed">{bizImpact || '—'}</p>
          </div>

          {/* Attack Scenario */}
          <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Attack Scenario</p>
            <div className="max-h-32 overflow-y-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                {attackScen || '—'}
              </pre>
            </div>
          </div>

          {/* Compliance Impact */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Compliance Impact</p>
            <ComplianceSection compliance={compliance} />
          </div>
        </div>

        {/* Fix Snippets */}
        {fixes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Fix Snippets</p>
            {/* Framework tab bar */}
            <div className="flex border-b border-white/10 mb-0">
              {fixes.map((fix, idx) => {
                const fw = fix.framework ?? fix.Framework ?? `Fix ${idx + 1}`
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveFixTab(idx)}
                    className={[
                      'px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors',
                      activeFixTab === idx
                        ? 'border-crimson-500 text-white'
                        : 'border-transparent text-gray-500 hover:text-gray-300',
                    ].join(' ')}
                  >
                    {fw}
                  </button>
                )
              })}
            </div>

            {activeFix && (() => {
              const lang  = activeFix.language ?? activeFix.Language ?? ''
              const code  = activeFix.code     ?? activeFix.Code     ?? ''
              const notes = activeFix.notes    ?? activeFix.Notes    ?? null
              return (
                <div>
                  <div className="relative bg-[#0d1117] border border-white/10 rounded-b-xl rounded-tr-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/8">
                      {lang
                        ? <span className="font-mono text-[10px] bg-white/8 border border-white/15 px-2 py-0.5 rounded text-gray-400">{lang}</span>
                        : <span />
                      }
                      <CopyBtn text={code} />
                    </div>
                    <div className="max-h-72 overflow-y-auto p-4">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">{code}</pre>
                    </div>
                  </div>
                  {notes && (
                    <div className="mt-2 flex items-start gap-2 bg-yellow-500/8 border border-yellow-500/25 rounded-lg px-3 py-2">
                      <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-300 leading-relaxed">{notes}</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* Verification Commands */}
        {verCmds.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Verification Commands</p>
            <div className="space-y-2">
              {verCmds.map((cmd, idx) => {
                const text = typeof cmd === 'string' ? cmd : (cmd.command ?? cmd.Command ?? String(cmd))
                return (
                  <div key={idx} className="relative bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-1 border-b border-white/8">
                      <span className="text-[10px] text-gray-600 font-mono">shell</span>
                      <button
                        onClick={() => handleCopyCmd(idx, text)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-1 py-0.5 rounded"
                      >
                        {copiedCmd === idx
                          ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
                          : <><Copy className="w-3 h-3" /><span>Copy</span></>}
                      </button>
                    </div>
                    <div className="px-4 py-3">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{text}</pre>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* References */}
        {refs.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">References</p>
            <div className="space-y-1.5">
              {refs.map((ref, idx) => {
                const url   = typeof ref === 'string' ? ref : (ref.url ?? ref.Url ?? ref.href ?? ref.Href ?? String(ref))
                const label = typeof ref === 'string' ? ref : (ref.title ?? ref.Title ?? ref.label ?? ref.Label ?? url)
                return (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-crimson-400 hover:text-crimson-300 transition-colors group"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100" />
                    <span className="truncate">{label}</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Prev / Next navigation */}
        <div className="flex items-center justify-between pt-2 pb-1 border-t border-white/8">
          <button
            onClick={() => prevItem && onNavigate(f(prevItem, 'id'))}
            disabled={!prevItem}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-xs text-gray-600">
            {currentIdx >= 0 ? `${currentIdx + 1} / ${list.length}` : ''}
          </span>
          <button
            onClick={() => nextItem && onNavigate(f(nextItem, 'id'))}
            disabled={!nextItem}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── CVE Database tab ───────────────────────────────────────── */
const CVE_LIMIT = 25

function CveSearchTab() {
  const [query, setQuery]           = useState('')
  const [sevFilter, setSevFilter]   = useState('')
  const [minCvss, setMinCvss]       = useState('')
  const [afterDate, setAfterDate]   = useState('')
  const [page, setPage]             = useState(1)
  const [data, setData]             = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const debRef = useRef(null)

  const fetchCves = useCallback(async (q, sev, cvss, after, pg) => {
    setLoading(true); setError(null)
    const token = localStorage.getItem('ws_token')
    const hdrs  = token ? { Authorization: `Bearer ${token}` } : {}
    const params = new URLSearchParams({ page: pg, limit: CVE_LIMIT })
    if (q)     params.set('q', q)
    if (sev)   params.set('severity', sev)
    if (cvss)  params.set('minCvss', cvss)
    if (after) params.set('publishedAfter', after)
    try {
      const res = await fetch(`${BACKEND}/api/cve/search?${params}`, { headers: hdrs })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
    } catch (e) { setError(e.message) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchCves('', '', '', '', 1) }, [fetchCves])

  const handleSearch = (e) => {
    const q = e.target.value; setQuery(q)
    if (debRef.current) clearTimeout(debRef.current)
    debRef.current = setTimeout(() => { setPage(1); fetchCves(q, sevFilter, minCvss, afterDate, 1) }, 300)
  }

  const handleSev = (s) => {
    const next = sevFilter === s ? '' : s; setSevFilter(next); setPage(1)
    fetchCves(query, next, minCvss, afterDate, 1)
  }

  const goPage = (p) => { setPage(p); fetchCves(query, sevFilter, minCvss, afterDate, p) }

  const items      = data?.items      ?? data?.Items      ?? []
  const total      = data?.total      ?? data?.Total      ?? 0
  const totalPages = Math.ceil(total / CVE_LIMIT)
  const start      = Math.min((page - 1) * CVE_LIMIT + 1, total)
  const end        = Math.min(page * CVE_LIMIT, total)

  return (
    <div className="max-w-6xl mx-auto px-6 py-6">
      {/* Search */}
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={query} onChange={handleSearch}
            placeholder="Search by CVE ID, product, or keyword…"
            className="w-full bg-white/5 border border-white/10 focus:border-crimson-500 text-white placeholder-gray-500 pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-colors" />
          {query && (
            <button onClick={() => { setQuery(''); setPage(1); fetchCves('', sevFilter, minCvss, afterDate, 1) }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5 flex-wrap">
            {['Critical', 'High', 'Medium', 'Low'].map(s => (
              <button key={s} onClick={() => handleSev(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  sevFilter === s
                    ? 'bg-crimson-500 text-white border-crimson-500'
                    : 'bg-transparent text-gray-400 border-white/15 hover:text-white hover:border-white/30'
                }`}>{s}</button>
            ))}
            {sevFilter && (
              <button onClick={() => { setSevFilter(''); setPage(1); fetchCves(query, '', minCvss, afterDate, 1) }}
                className="text-xs text-gray-500 hover:text-white transition-colors">Clear</button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">Min CVSS</span>
            <input type="number" min="0" max="10" step="0.1" value={minCvss}
              onChange={e => { setMinCvss(e.target.value); setPage(1); fetchCves(query, sevFilter, e.target.value, afterDate, 1) }}
              placeholder="0.0"
              className="w-16 bg-white/5 border border-white/10 focus:border-crimson-500 text-white px-2 py-1.5 rounded-lg text-xs outline-none transition-colors" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">After</span>
            <input type="date" value={afterDate}
              onChange={e => { setAfterDate(e.target.value); setPage(1); fetchCves(query, sevFilter, minCvss, e.target.value, 1) }}
              className="bg-white/5 border border-white/10 focus:border-crimson-500 text-white px-2 py-1.5 rounded-lg text-xs outline-none transition-colors" />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="space-y-2 mb-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 bg-white/3 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="border border-white/10 rounded-2xl overflow-hidden mb-4">
          <div className="hidden lg:grid grid-cols-[2fr_1.2fr_1.2fr_1fr_70px_90px_90px_55px] gap-3 px-4 py-3 bg-white/3 border-b border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            <span>CVE ID</span>
            <span>Product</span>
            <span>Affected Versions</span>
            <span>Fixed</span>
            <span>CVSS</span>
            <span>Severity</span>
            <span>Published</span>
            <span>KEV</span>
          </div>
          {items.map((cve, i) => {
            const cveId      = cve.id            ?? cve.Id            ?? cve.cveId         ?? '—'
            const product    = cve.product       ?? cve.Product       ?? '—'
            const affected   = cve.affectedVersions ?? cve.AffectedVersions ?? ''
            const fixed      = cve.fixedVersion  ?? cve.FixedVersion  ?? null
            const score      = parseFloat(cve.cvssScore ?? cve.CvssScore ?? 0)
            const severity   = cve.severity      ?? cve.Severity      ?? 'Low'
            const published  = cve.publishedAt   ?? cve.PublishedAt   ?? null
            const isKev      = !!(cve.isKev      ?? cve.IsKev)
            const scoreColor = score >= 9 ? 'text-red-400' : score >= 7 ? 'text-orange-400' : score >= 4 ? 'text-yellow-400' : 'text-blue-400'
            return (
              <div key={i} className="grid lg:grid-cols-[2fr_1.2fr_1.2fr_1fr_70px_90px_90px_55px] gap-3 items-center px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <span className="font-mono text-xs text-crimson-400 font-semibold truncate">{cveId}</span>
                <span className="text-xs text-gray-300 truncate">{product}</span>
                <span className="font-mono text-xs text-amber-400 truncate">{affected || '—'}</span>
                {fixed
                  ? <span className="inline-flex text-[10px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5 w-fit truncate">{fixed}</span>
                  : <span className="inline-flex text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded px-1.5 py-0.5 w-fit">No fix</span>
                }
                <span className={`font-mono text-sm font-bold ${scoreColor}`}>{score.toFixed(1)}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border w-fit ${SEV_BADGE_CLS[severity] || SEV_BADGE_CLS.Low}`}>{severity}</span>
                <span className="text-xs text-gray-500">{timeAgo(published)}</span>
                {isKev
                  ? <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5 animate-pulse">⚠ KEV</span>
                  : <span />
                }
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-10 h-10 text-gray-600 mb-3" />
          <p className="text-white font-semibold mb-1">No CVEs found</p>
          <p className="text-gray-500 text-sm">Try a different product name or CVE ID.</p>
        </div>
      )}

      {total > CVE_LIMIT && (
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <span>Showing {start}–{end} of {total.toLocaleString()} results</span>
          <div className="flex items-center gap-3">
            <button onClick={() => goPage(page - 1)} disabled={page <= 1}
              className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button onClick={() => goPage(page + 1)} disabled={page >= totalPages}
              className="flex items-center gap-1 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
const SEVS = ['All', 'Critical', 'High', 'Medium', 'Low', 'Info']

export default function CveDatabasePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { checkId: routeCheckId } = useParams()  // from /cve-database/:checkId

  /* Tab: 'checks' (security knowledge base) | 'cve' (CVE database search) */
  const [activeTab, setActiveTab] = useState('checks')

  /* list state */
  const [allItems, setAllItems]         = useState([])
  const [displayItems, setDisplayItems] = useState([])
  const [categories, setCategories]     = useState([])   // [{ category, count }]
  const [listLoading, setListLoading]   = useState(true)
  const [listError, setListError]       = useState(null)

  /* filter state */
  const [searchQuery, setSearchQuery]   = useState('')
  const [sevFilter, setSevFilter]       = useState('All')
  const [catFilter, setCatFilter]       = useState('')

  /* selection — route param takes priority over query param */
  const [selectedId, setSelectedId]     = useState(routeCheckId ?? searchParams.get('check') ?? null)

  const debounceRef = useRef(null)

  /* ── Initial load ── */
  useEffect(() => {
    setListLoading(true)
    setListError(null)
    Promise.all([
      fetch(`${BACKEND}/api/remediation`),
      fetch(`${BACKEND}/api/remediation/summary`),
    ])
      .then(async ([itemsRes, summaryRes]) => {
        if (!itemsRes.ok) throw new Error(`Server error ${itemsRes.status}`)
        const itemsData = await itemsRes.json()
        const arr = Array.isArray(itemsData) ? itemsData : (itemsData?.items ?? itemsData?.Items ?? [])
        setAllItems(arr)
        setDisplayItems(arr)

        if (summaryRes.ok) {
          const sumData = await summaryRes.json()
          const cats = Array.isArray(sumData) ? sumData : []
          setCategories(cats)
        }

        const preselect = routeCheckId ?? searchParams.get('check')
        if (preselect) {
          setSelectedId(preselect)
        } else if (arr.length > 0) {
          const firstId = f(arr[0], 'id')
          setSelectedId(firstId)
        }
      })
      .catch((e) => setListError(e.message))
      .finally(() => setListLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Search with 350ms debounce ── */
  const handleSearchChange = (e) => {
    const q = e.target.value
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!q.trim()) {
        applyFilters(allItems, sevFilter, catFilter)
        return
      }
      try {
        const res = await fetch(`${BACKEND}/api/remediation/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data = await res.json()
        const arr = Array.isArray(data) ? data : (data?.items ?? [])
        applyFilters(arr, sevFilter, catFilter)
      } catch { /* ignore */ }
    }, 350)
  }

  /* ── Severity chip click ── */
  const handleSevFilter = useCallback(async (sev) => {
    setSevFilter(sev)
    setSearchParams({})
    if (sev === 'All') {
      applyFilters(allItems, 'All', catFilter)
      return
    }
    try {
      const res = await fetch(`${BACKEND}/api/remediation/severity/${sev}`)
      if (!res.ok) { applyFilters(allItems, sev, catFilter); return }
      const data = await res.json()
      const arr = Array.isArray(data) ? data : (data?.items ?? [])
      applyFilters(arr, sev, catFilter)
    } catch {
      applyFilters(allItems, sev, catFilter)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, catFilter, setSearchParams])

  /* ── Category filter (client-side on full list) ── */
  const handleCatFilter = useCallback((cat) => {
    setCatFilter(cat)
    setSearchParams({})
    applyFilters(allItems, sevFilter, cat)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, sevFilter, setSearchParams])

  /* ── Apply severity + category filters to a base array ── */
  function applyFilters(base, sev, cat) {
    let result = base
    if (sev && sev !== 'All') {
      result = result.filter((i) => normSev(f(i, 'severity')) === sev)
    }
    if (cat) {
      result = result.filter((i) =>
        (f(i, 'category') ?? '').toLowerCase() === cat.toLowerCase()
      )
    }
    setDisplayItems(result)
  }

  /* ── Select a check, update URL ── */
  const selectCheck = useCallback((id) => {
    setSelectedId(id)
    setSearchParams({ check: id })
  }, [setSearchParams])

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />

      {/* Marketing page header — sits below fixed Navbar (pt-16 accounts for navbar height) */}
      <div className="pt-16 shrink-0 border-b border-white/10 bg-[#0a0f1a]">
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-white leading-tight">Security Knowledge Base</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Vulnerability checks, CVE database, and framework-specific fix guidance
              </p>
            </div>
            <Link
              to="/"
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Back to home
            </Link>
          </div>
          {/* Tab bar */}
          <div className="flex">
            <button onClick={() => setActiveTab('checks')}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === 'checks'
                  ? 'border-crimson-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              Security Checks
            </button>
            <button onClick={() => setActiveTab('cve')}
              className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === 'cve'
                  ? 'border-crimson-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}>
              <Database className="w-3.5 h-3.5" /> CVE Database
            </button>
          </div>
        </div>
      </div>

      {/* CVE Database tab */}
      {activeTab === 'cve' && (
        <div className="flex-1 overflow-y-auto">
          <CveSearchTab />
        </div>
      )}

      {/* Two-panel split — fills remaining viewport height (Security Checks tab) */}
      {activeTab === 'checks' && <div className="h-[calc(100vh-130px)] flex overflow-hidden min-h-0">

        {/* ── Left panel ── */}
        <div className="w-[380px] shrink-0 border-r border-white/10 flex flex-col overflow-hidden">

          {/* Filters */}
          <div className="px-4 py-3 border-b border-white/10 space-y-3 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search checks…"
                className="w-full bg-white/5 border border-white/10 focus:border-crimson-500 text-white placeholder-gray-600 pl-8 pr-3 py-2 rounded-lg text-xs outline-none transition-colors"
              />
            </div>

            {/* Severity chips */}
            <div className="flex flex-wrap gap-1.5">
              {SEVS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSevFilter(s)}
                  className={[
                    'px-2.5 py-1 rounded text-[10px] font-semibold transition-colors',
                    sevFilter === s
                      ? 'bg-crimson-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10',
                  ].join(' ')}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Category sidebar (scrollable list of clickable buttons) */}
            {categories.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-0.5">
                <button
                  onClick={() => handleCatFilter('')}
                  className={[
                    'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors text-left',
                    catFilter === ''
                      ? 'bg-crimson-500/15 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5',
                  ].join(' ')}
                >
                  <span>All Categories</span>
                </button>
                {categories.map((cat, i) => {
                  const name  = cat.category ?? cat.Category ?? cat.name ?? cat.Name ?? ''
                  const count = cat.count    ?? cat.Count    ?? 0
                  return (
                    <button
                      key={i}
                      onClick={() => handleCatFilter(name)}
                      className={[
                        'w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors text-left',
                        catFilter === name
                          ? 'bg-crimson-500/15 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5',
                      ].join(' ')}
                    >
                      <span className="truncate">{name}</span>
                      <span className="shrink-0 ml-2 text-gray-600">{count}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Check list */}
          <div className="flex-1 overflow-y-auto">
            {listLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-crimson-400 animate-spin" />
              </div>
            )}
            {!listLoading && listError && (
              <div className="p-4">
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {listError}
                </div>
              </div>
            )}
            {!listLoading && !listError && displayItems.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Search className="w-6 h-6 text-gray-600 mb-2" />
                <p className="text-xs text-gray-500">No checks match your filters.</p>
              </div>
            )}
            {!listLoading && !listError && displayItems.map((item) => {
              const id = f(item, 'id')
              return (
                <CheckRow
                  key={id}
                  item={item}
                  selected={id === selectedId}
                  onClick={selectCheck}
                />
              )
            })}
          </div>

          {/* Footer count */}
          <div className="px-4 py-2 border-t border-white/10 text-xs text-gray-600 shrink-0">
            {displayItems.length} check{displayItems.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <CheckDetail
            checkId={selectedId}
            list={displayItems}
            onNavigate={selectCheck}
          />
        </div>
      </div>}

      <Footer />
    </div>
  )
}
