import React, { useState, useEffect, useCallback } from 'react'
import { Search, Copy, Check, ChevronDown, ChevronUp, AlertCircle, Loader2, RefreshCw, BookOpen, Shield, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getRemediations, getRemediationPlaybook } from '../services/api'

const TABS = ['Nginx', 'Apache', 'IIS', 'Ansible', 'Verify']

const SEVERITY_STYLES = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

function severityStyle(sev) {
  const key = sev ? (sev.charAt(0).toUpperCase() + sev.slice(1).toLowerCase()) : 'Info'
  return SEVERITY_STYLES[key] || SEVERITY_STYLES.Info
}

function field(obj, ...keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k]
  }
  return ''
}

/* ──────── Code panel with tab switcher and copy button ──────── */
function CodePanel({ playbook }) {
  const [activeTab, setActiveTab] = useState(TABS[0])
  const [copied, setCopied] = useState(false)

  const getCode = (tab) => {
    if (!playbook) return ''
    const key = tab.toLowerCase()
    return (
      playbook[tab] ??
      playbook[key] ??
      playbook[tab.toUpperCase()] ??
      ''
    )
  }

  const code = getCode(activeTab)

  const handleCopy = () => {
    if (!code) return
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!playbook) return null

  return (
    <div className="mt-4 bg-navy-950 border border-white/10 rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-3">
        <div className="flex">
          {TABS.map((tab) => {
            const hasContent = !!getCode(tab)
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2.5 text-xs font-semibold transition-colors border-b-2 -mb-px ${
                  activeTab === tab
                    ? 'border-crimson-500 text-white'
                    : hasContent
                      ? 'border-transparent text-gray-400 hover:text-white'
                      : 'border-transparent text-gray-600 cursor-default'
                }`}
              >
                {tab}
              </button>
            )
          })}
        </div>
        <button
          onClick={handleCopy}
          disabled={!code}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors py-2 px-1"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <div className="p-4 overflow-x-auto max-h-64">
        {code ? (
          <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">{code}</pre>
        ) : (
          <p className="text-xs text-gray-600 italic">No configuration snippet available for {activeTab}.</p>
        )}
      </div>
    </div>
  )
}

/* ──────── Single playbook card ──────── */
function PlaybookCard({ item, expanded, onToggle }) {
  const [playbook, setPlaybook] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const checkName = field(item, 'checkName', 'CheckName', 'check_name', 'name', 'Name', 'id', 'Id')
  const title     = field(item, 'title', 'Title', 'name', 'Name', 'checkName', 'CheckName')
  const desc      = field(item, 'description', 'Description', 'summary', 'Summary')
  const severity  = field(item, 'severity', 'Severity', 'risk', 'Risk')
  const category  = field(item, 'category', 'Category', 'type', 'Type')

  useEffect(() => {
    if (!expanded || playbook || !checkName) return
    setLoading(true)
    setError(null)
    getRemediationPlaybook(checkName)
      .then((data) => setPlaybook(data))
      .catch((err) => setError(err.message || 'Failed to load playbook'))
      .finally(() => setLoading(false))
  }, [expanded, checkName, playbook])

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${expanded ? 'border-crimson-500/40' : 'border-white/10'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {severity && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityStyle(severity)}`}>
                {severity}
              </span>
            )}
            {category && (
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{category}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{title || checkName}</p>
          {desc && !expanded && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{desc}</p>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
        }
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3">
          {desc && <p className="text-sm text-gray-400 leading-relaxed mb-4">{desc}</p>}

          {/* Extra fields */}
          {(() => {
            const impact  = field(item, 'impact', 'Impact')
            const fix     = field(item, 'fix', 'Fix', 'remediation', 'Remediation', 'recommendation', 'Recommendation')
            const ref     = field(item, 'references', 'References', 'reference', 'Reference')
            return (
              <>
                {impact && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Impact</p>
                    <p className="text-sm text-gray-300">{impact}</p>
                  </div>
                )}
                {fix && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Remediation</p>
                    <p className="text-sm text-gray-300">{fix}</p>
                  </div>
                )}
                {ref && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">References</p>
                    {Array.isArray(ref)
                      ? ref.map((r, i) => (
                          <a key={i} href={r} target="_blank" rel="noopener noreferrer"
                            className="block text-xs text-crimson-400 hover:underline truncate">{r}</a>
                        ))
                      : <p className="text-sm text-gray-300">{ref}</p>
                    }
                  </div>
                )}
              </>
            )
          })()}

          {/* Playbook code */}
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading configuration playbook…
            </div>
          )}
          {error && (
            <p className="text-xs text-red-400 py-2">{error}</p>
          )}
          {!loading && !error && (
            <CodePanel playbook={playbook} />
          )}
        </div>
      )}
    </div>
  )
}

/* ──────── Main page ──────── */
export default function RemediationPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(null)
    getRemediations()
      .then((data) => {
        const arr = Array.isArray(data) ? data : data?.items ?? data?.remediations ?? data?.Remediations ?? []
        setItems(arr)
      })
      .catch((err) => setError(err.message || 'Failed to load remediations'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const severities = ['Critical', 'High', 'Medium', 'Low', 'Info']

  const filtered = items.filter((item) => {
    const title    = field(item, 'title', 'Title', 'name', 'Name', 'checkName', 'CheckName').toLowerCase()
    const desc     = field(item, 'description', 'Description').toLowerCase()
    const sev      = field(item, 'severity', 'Severity').toLowerCase()
    const cat      = field(item, 'category', 'Category').toLowerCase()
    const q        = search.toLowerCase()
    const matchQ   = !q || title.includes(q) || desc.includes(q) || cat.includes(q)
    const matchSev = !severityFilter || sev === severityFilter.toLowerCase()
    return matchQ && matchSev
  })

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const getItemId = (item, idx) =>
    field(item, 'checkName', 'CheckName', 'check_name', 'id', 'Id', 'name', 'Name') || String(idx)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-crimson-500/15 border border-crimson-500/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-crimson-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-crimson-400">Remediation Playbooks</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Fix Vulnerabilities Fast</h1>
            <p className="text-gray-400 max-w-2xl">
              Browse ready-to-use configuration snippets and step-by-step guides for Nginx, Apache, IIS, and Ansible.
              One-click copy to get patched in minutes.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search checks, headers, vulnerabilities…"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-white/5 border border-white/15 focus:border-crimson-500 text-gray-300 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            >
              <option value="">All Severities</option>
              {severities.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Stats row */}
          {!loading && !error && (
            <div className="flex flex-wrap gap-4 mb-6">
              {[
                { label: 'Total Playbooks', value: items.length, icon: BookOpen, color: 'text-blue-400' },
                { label: 'Critical',        value: items.filter(i => field(i,'severity','Severity').toLowerCase() === 'critical').length, icon: Shield, color: 'text-red-400' },
                { label: 'Showing',         value: filtered.length, icon: Zap, color: 'text-green-400' },
              ].map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-xl px-4 py-2.5">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-lg font-bold text-white">{s.value}</span>
                    <span className="text-xs text-gray-400">{s.label}</span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 text-crimson-400 animate-spin" />
              <p className="text-gray-400 text-sm">Loading remediation playbooks…</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Search className="w-8 h-8 text-gray-600" />
              <p className="text-white font-semibold">No playbooks found</p>
              <p className="text-sm text-gray-500">
                {items.length === 0
                  ? 'No remediation data available from the server.'
                  : 'Try adjusting your search or severity filter.'}
              </p>
            </div>
          )}

          {/* Playbook list */}
          {!loading && !error && filtered.length > 0 && (
            <div className="space-y-3">
              {filtered.map((item, idx) => {
                const id = getItemId(item, idx)
                return (
                  <PlaybookCard
                    key={id}
                    item={item}
                    expanded={expandedId === id}
                    onToggle={() => toggle(id)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
