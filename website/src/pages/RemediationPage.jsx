import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Copy, Check, ChevronLeft, ChevronRight,
  ExternalLink, AlertCircle, Loader2, Info,
} from 'lucide-react'
import Navbar from '../components/Navbar'

/* ─── API constants ─────────────────────────────────────────── */
const API = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

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

/* ─── CVSS Gauge (270° arc speedometer) ─────────────────────── */
function CvssGauge({ score, severity }) {
  const sev = normSev(severity)
  const num = parseFloat(score) || 0
  const clamped = Math.min(Math.max(num, 0), 10)
  const R = 32
  const cx = 44
  const cy = 44
  const strokeWidth = 6
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
  const largeArcBg = totalDeg > 180 ? 1 : 0
  const largeArcFg = sweepDeg > 180 ? 1 : 0

  const bgPath = `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArcBg} 1 ${bgEnd.x} ${bgEnd.y}`
  const fgPath = sweepDeg > 0
    ? `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArcFg} 1 ${fgEnd.x} ${fgEnd.y}`
    : ''

  const color = SEV_STROKE[sev] ?? SEV_STROKE.Info

  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
      <path
        d={bgPath}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {fgPath && (
        <path
          d={fgPath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      )}
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="13"
        fontWeight="700"
      >
        {num.toFixed(1)}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="rgba(255,255,255,0.45)"
        fontSize="8"
      >
        CVSS
      </text>
    </svg>
  )
}

/* ─── Copy button ────────────────────────────────────────────── */
function CopyButton({ text, className = '' }) {
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
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-green-400" />
          <span className="text-green-400">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </>
      )}
    </button>
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
  const [detail, setDetail]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [activeFixTab, setActiveFixTab] = useState(0)
  const [copiedCmd, setCopiedCmd] = useState(null)

  useEffect(() => {
    if (!checkId) { setDetail(null); return }
    setLoading(true)
    setError(null)
    setActiveFixTab(0)
    fetch(`${BACKEND}/api/remediation/${checkId}`, { headers: authHeaders() })
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

  /* ── Empty state ── */
  if (!checkId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-600">
        <Info className="w-10 h-10 mb-3 opacity-40" />
        <p className="text-sm font-semibold">Select a check from the list</p>
        <p className="text-xs mt-1 opacity-70">
          Click any item on the left to view its remediation details.
        </p>
      </div>
    )
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-crimson-400 animate-spin" />
      </div>
    )
  }

  /* ── Error ── */
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

  /* ── Parse detail fields ── */
  const title       = f(detail, 'title')
  const severity    = normSev(f(detail, 'severity'))
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

  const pciDss   = compliance.pciDss   ?? compliance.PciDss   ?? compliance.pci_dss   ?? ''
  const iso27001 = compliance.iso27001  ?? compliance.Iso27001  ?? compliance.iso_27001  ?? ''
  const soc2     = compliance.soc2     ?? compliance.Soc2     ?? compliance.SOC2      ?? ''
  const nist     = compliance.nist80053 ?? compliance.Nist80053 ?? compliance.nist_800_53 ?? ''

  const activeFix = fixes[activeFixTab] ?? null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* ── Sticky header ── */}
      <div className="shrink-0 sticky top-0 z-10 backdrop-blur-md bg-[#0a0f1a]/80 border-b border-white/10 px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={[
                  'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded',
                  SEV_BADGE[severity] ?? SEV_BADGE.Info,
                ].join(' ')}
              >
                {severity}
              </span>
              {cweId && (
                <span className="font-mono text-[10px] bg-white/[0.08] border border-white/[0.15] px-2 py-0.5 rounded text-gray-300">
                  CWE-{cweId}
                </span>
              )}
              {owasp && (
                <span
                  className="text-[10px] text-gray-400 truncate max-w-[200px]"
                  title={owasp}
                >
                  {owasp}
                </span>
              )}
            </div>
            {/* Title */}
            <h2 className="text-base font-bold text-white leading-snug">{title}</h2>
            {/* CVSS vector */}
            {cvssVector && (
              <p
                className="font-mono text-[10px] text-gray-500 mt-1 truncate"
                title={cvssVector}
              >
                {cvssVector}
              </p>
            )}
          </div>
          {/* CVSS gauge top-right */}
          <div className="shrink-0">
            <CvssGauge score={cvssScore} severity={severity} />
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* 1. Four-card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* What it is */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              What it is
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
              {shortDesc || detailedDesc || '—'}
            </p>
          </div>

          {/* Business Impact */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Business Impact
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">{bizImpact || '—'}</p>
          </div>

          {/* Attack Scenario */}
          <div className="bg-[#0d1117] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Attack Scenario
            </p>
            <div className="max-h-32 overflow-y-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">
                {attackScen || '—'}
              </pre>
            </div>
          </div>

          {/* Compliance Impact */}
          <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
              Compliance Impact
            </p>
            <div className="space-y-1.5">
              {[
                { label: 'PCI-DSS',     value: pciDss },
                { label: 'ISO 27001',   value: iso27001 },
                { label: 'SOC 2',       value: soc2 },
                { label: 'NIST 800-53', value: nist },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-20 shrink-0">{label}</span>
                  {value
                    ? (
                      <span className="font-mono text-[10px] bg-white/[0.08] border border-white/[0.15] px-1.5 py-0.5 rounded text-gray-300 truncate">
                        {value}
                      </span>
                    )
                    : <span className="text-[10px] text-gray-600">—</span>
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Fix Snippets */}
        {fixes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
              Fix Snippets
            </p>

            {/* Framework tab bar */}
            <div className="flex border-b border-white/10">
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
                    {/* top bar: language chip + copy button */}
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.08]">
                      {lang
                        ? (
                          <span className="font-mono text-[10px] bg-white/[0.08] border border-white/[0.15] px-2 py-0.5 rounded text-gray-400">
                            {lang}
                          </span>
                        )
                        : <span />
                      }
                      <CopyButton text={code} />
                    </div>
                    <div className="max-h-72 overflow-y-auto p-4">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">
                        {code}
                      </pre>
                    </div>
                  </div>
                  {notes && (
                    <div className="mt-2 flex items-start gap-2 bg-yellow-500/[0.08] border border-yellow-500/25 rounded-lg px-3 py-2">
                      <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-300 leading-relaxed">{notes}</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}

        {/* 3. Verification Commands */}
        {verCmds.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
              Verification Commands
            </p>
            <div className="space-y-2">
              {verCmds.map((cmd, idx) => {
                const text = typeof cmd === 'string'
                  ? cmd
                  : (cmd.command ?? cmd.Command ?? String(cmd))
                return (
                  <div
                    key={idx}
                    className="relative bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-3 py-1 border-b border-white/[0.08]">
                      <span className="text-[10px] text-gray-600 font-mono">shell</span>
                      <button
                        onClick={() => handleCopyCmd(idx, text)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-1 py-0.5 rounded"
                      >
                        {copiedCmd === idx ? (
                          <>
                            <Check className="w-3 h-3 text-green-400" />
                            <span className="text-green-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="px-4 py-3">
                      <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                        {text}
                      </pre>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 4. References */}
        {refs.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">
              References
            </p>
            <div className="space-y-1.5">
              {refs.map((ref, idx) => {
                const url   = typeof ref === 'string'
                  ? ref
                  : (ref.url ?? ref.Url ?? ref.href ?? ref.Href ?? String(ref))
                const label = typeof ref === 'string'
                  ? ref
                  : (ref.title ?? ref.Title ?? ref.label ?? ref.Label ?? url)
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

        {/* 5. Prev / Next navigation */}
        <div className="flex items-center justify-between pt-2 pb-1 border-t border-white/[0.08]">
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

/* ─── Main page ──────────────────────────────────────────────── */
export default function RemediationPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  /* list state */
  const [allItems, setAllItems]         = useState([])
  const [displayItems, setDisplayItems] = useState([])
  const [categories, setCategories]     = useState([])
  const [listLoading, setListLoading]   = useState(true)
  const [listError, setListError]       = useState(null)

  /* filter state */
  const [searchQuery, setSearchQuery]   = useState('')
  const [sevFilter, setSevFilter]       = useState('All')
  const [catFilter, setCatFilter]       = useState('')

  /* selection */
  const [selectedId, setSelectedId]     = useState(() => searchParams.get('check') ?? null)

  const debounceRef = useRef(null)

  /* ── Apply all active filters to a base array ── */
  const applyFilters = useCallback((base, sev, cat) => {
    let result = base
    if (sev && sev !== 'All') {
      result = result.filter((i) => normSev(f(i, 'severity')) === sev)
    }
    if (cat) {
      result = result.filter(
        (i) => (f(i, 'category') ?? '').toLowerCase() === cat.toLowerCase()
      )
    }
    setDisplayItems(result)
  }, [])

  /* ── Initial load: list + summary in parallel ── */
  useEffect(() => {
    setListLoading(true)
    setListError(null)
    Promise.all([
      fetch(`${BACKEND}/api/remediation`, { headers: authHeaders() }),
      fetch(`${BACKEND}/api/remediation/summary`, { headers: authHeaders() }),
    ])
      .then(async ([itemsRes, summaryRes]) => {
        if (!itemsRes.ok) throw new Error(`Server error ${itemsRes.status}`)
        const itemsData = await itemsRes.json()
        const arr = Array.isArray(itemsData)
          ? itemsData
          : (itemsData?.items ?? itemsData?.Items ?? [])
        setAllItems(arr)
        setDisplayItems(arr)

        if (summaryRes.ok) {
          const sumData = await summaryRes.json()
          const cats = (Array.isArray(sumData) ? sumData : [])
            .map((c) => c.category ?? c.Category ?? '')
            .filter(Boolean)
          setCategories([...new Set(cats)])
        }

        // Auto-select: URL param first, else first item
        const preselect = searchParams.get('check')
        if (preselect) {
          setSelectedId(preselect)
        } else if (arr.length > 0) {
          const firstId = f(arr[0], 'id')
          setSelectedId(firstId)
          setSearchParams({ check: firstId }, { replace: true })
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
        const res = await fetch(
          `${BACKEND}/api/remediation/search?q=${encodeURIComponent(q)}`,
          { headers: authHeaders() }
        )
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
    if (sev === 'All') {
      applyFilters(allItems, 'All', catFilter)
      return
    }
    try {
      const res = await fetch(
        `${BACKEND}/api/remediation/severity/${sev}`,
        { headers: authHeaders() }
      )
      if (!res.ok) {
        applyFilters(allItems, sev, catFilter)
        return
      }
      const data = await res.json()
      const arr = Array.isArray(data) ? data : (data?.items ?? [])
      applyFilters(arr, sev, catFilter)
    } catch {
      applyFilters(allItems, sev, catFilter)
    }
  }, [allItems, catFilter, applyFilters])

  /* ── Category filter (client-side) ── */
  const handleCatFilter = useCallback((cat) => {
    setCatFilter(cat)
    applyFilters(allItems, sevFilter, cat)
  }, [allItems, sevFilter, applyFilters])

  /* ── Select a check, update URL ── */
  const selectCheck = useCallback((id) => {
    setSelectedId(id)
    setSearchParams({ check: id })
  }, [setSearchParams])

  const SEVS = ['All', 'Critical', 'High', 'Medium', 'Low', 'Info']

  return (
    <div className="h-screen page-bg flex flex-col overflow-hidden pt-16">
      <Navbar />

      {/* Page header bar */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4 bg-[#0a0f1a]">
        <h1 className="text-lg font-bold text-white leading-none">Remediation Playbooks</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Step-by-step fix guides, code snippets, and compliance mappings for every detected check.
        </p>
      </div>

      {/* Split container */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Left panel ── */}
        <div className="w-[380px] shrink-0 border-r border-white/10 flex flex-col overflow-hidden">

          {/* Filters area */}
          <div className="px-4 py-3 border-b border-white/10 space-y-3 shrink-0">

            {/* Search input */}
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

            {/* Category dropdown */}
            <select
              value={catFilter}
              onChange={(e) => handleCatFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-crimson-500 text-gray-300 px-3 py-2 rounded-lg text-xs outline-none transition-colors"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* List area */}
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
      </div>
    </div>
  )
}
