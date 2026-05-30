import React, { useState, useEffect, useCallback } from 'react'
import {
  Search, Copy, Check, ChevronDown, ChevronUp, AlertCircle, Loader2,
  RefreshCw, BookOpen, Shield, Zap, CheckCircle, Clock, ExternalLink,
  Eye, XCircle,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getRemediations, getRemediationPlaybook } from '../services/api'

const API = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const TABS_NAV = ['Tasks', 'Playbooks']
const PLAYBOOK_TABS = ['Nginx', 'Apache', 'IIS', 'Ansible', 'Verify']

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

/* ── Summary banner ── */
function SummaryBanner({ summary, loading }) {
  const open     = summary?.openCount     ?? summary?.OpenCount     ?? summary?.open     ?? 0
  const critical = summary?.criticalCount ?? summary?.CriticalCount ?? summary?.critical ?? 0
  const resolved = summary?.resolvedCount ?? summary?.ResolvedCount ?? summary?.resolved ?? 0

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white/3 border border-white/10 rounded-2xl p-4 animate-pulse h-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Open Tasks',     value: open,     color: 'text-yellow-400', bg: 'border-yellow-500/20' },
        { label: 'Critical',       value: critical,  color: 'text-red-400',    bg: 'border-red-500/20' },
        { label: 'Resolved',       value: resolved,  color: 'text-green-400',  bg: 'border-green-500/20' },
      ].map((s) => (
        <div key={s.label} className={`bg-white/3 border ${s.bg} rounded-2xl p-4 text-center`}>
          <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Task card ── */
function TaskCard({ task, onAcknowledge, onResolve }) {
  const [actioning, setActioning] = useState(null)
  const [localStatus, setLocalStatus] = useState(null)

  const id          = field(task, 'id', 'Id', 'taskId', 'TaskId')
  const checkName   = field(task, 'checkName', 'CheckName', 'check_name', 'name', 'Name')
  const severity    = field(task, 'severity', 'Severity')
  const status      = localStatus ?? field(task, 'status', 'Status') ?? 'open'
  const desc        = field(task, 'description', 'Description', 'details', 'Details')
  const targetUrl   = field(task, 'targetUrl', 'TargetUrl', 'url', 'Url')
  const playbookUrl = field(task, 'playbookUrl', 'PlaybookUrl', 'playbook_url')
  const createdAt   = field(task, 'createdAt', 'CreatedAt', 'created', 'Created')

  const statusLower = status.toLowerCase()
  const isResolved  = statusLower === 'resolved' || statusLower === 'done'
  const isAcked     = statusLower === 'acknowledged' || statusLower === 'ack'

  const action = async (type) => {
    setActioning(type)
    try {
      await onAcknowledge && type === 'acknowledge' && onAcknowledge(id)
      await onResolve    && type === 'resolve'    && onResolve(id)
      setLocalStatus(type === 'acknowledge' ? 'Acknowledged' : 'Resolved')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className={`border rounded-2xl p-4 transition-all ${isResolved ? 'border-green-500/20 opacity-60' : 'border-white/10'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {severity && (
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${severityStyle(severity)}`}>
                {severity}
              </span>
            )}
            <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              isResolved ? 'text-green-400 bg-green-400/10' :
              isAcked    ? 'text-blue-400 bg-blue-400/10' :
                           'text-yellow-400 bg-yellow-400/10'
            }`}>
              {status}
            </span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{checkName}</p>
          {targetUrl && <p className="text-xs text-gray-500 mt-0.5 truncate">{targetUrl}</p>}
        </div>
        {createdAt && (
          <p className="text-xs text-gray-600 shrink-0 hidden sm:block">
            {new Date(createdAt).toLocaleDateString()}
          </p>
        )}
      </div>

      {desc && <p className="text-xs text-gray-400 leading-relaxed mb-3">{desc}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {!isAcked && !isResolved && (
          <button
            onClick={() => action('acknowledge')}
            disabled={!!actioning}
            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {actioning === 'acknowledge'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Eye className="w-3 h-3" />}
            Acknowledge
          </button>
        )}
        {!isResolved && (
          <button
            onClick={() => action('resolve')}
            disabled={!!actioning}
            className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {actioning === 'resolve'
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <CheckCircle className="w-3 h-3" />}
            Resolve
          </button>
        )}
        {isResolved && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle className="w-3.5 h-3.5" /> Resolved
          </span>
        )}
        {playbookUrl && (
          <a
            href={playbookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-crimson-400 hover:text-crimson-300 text-xs font-semibold ml-auto transition-colors"
          >
            <BookOpen className="w-3 h-3" /> View Playbook
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

/* ── Tasks tab ── */
function TasksTab() {
  const [summary, setSummary]     = useState(null)
  const [tasks, setTasks]         = useState([])
  const [loadingSum, setLoadingSum] = useState(true)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [sevFilter, setSevFilter] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setLoadingSum(true)
    setError(null)
    try {
      const [sumRes, tasksRes] = await Promise.all([
        fetch(`${BACKEND}/api/remediationtasks/summary`, { headers: authHeaders() }),
        fetch(`${BACKEND}/api/remediationtasks`,         { headers: authHeaders() }),
      ])
      if (sumRes.ok) setSummary(await sumRes.json())
      setLoadingSum(false)
      if (!tasksRes.ok) throw new Error(`Server error ${tasksRes.status}`)
      const data = await tasksRes.json()
      setTasks(Array.isArray(data) ? data : data?.tasks ?? data?.Tasks ?? data?.items ?? [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
    setLoadingSum(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const patchTask = async (id, action) => {
    const res = await fetch(`${BACKEND}/api/remediationtasks/${id}/${action}`, {
      method: 'PATCH',
      headers: authHeaders(),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.message ?? d.error ?? `Failed to ${action}`)
    }
  }

  const severities = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const filtered = tasks.filter((t) => {
    const sev = field(t, 'severity', 'Severity').toLowerCase()
    return !sevFilter || sev === sevFilter.toLowerCase()
  })

  return (
    <div>
      <SummaryBanner summary={summary} loading={loadingSum} />

      {/* Severity filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setSevFilter('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${!sevFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}
        >
          All
        </button>
        {severities.map((s) => (
          <button
            key={s}
            onClick={() => setSevFilter(s === sevFilter ? '' : s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${sevFilter === s ? 'bg-crimson-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={fetchAll}
          disabled={loading}
          className="ml-auto flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-crimson-400 animate-spin" />
        </div>
      )}
      {!loading && error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-16">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <p className="text-white font-semibold">All clear</p>
          <p className="text-sm text-gray-500 mt-1">No remediation tasks{sevFilter ? ` for ${sevFilter} severity` : ''}.</p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((task, i) => (
            <TaskCard
              key={field(task, 'id', 'Id', 'taskId', 'TaskId') || i}
              task={task}
              onAcknowledge={(id) => patchTask(id, 'acknowledge')}
              onResolve={(id) => patchTask(id, 'resolve')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Playbooks tab (existing logic) ── */
function CodePanel({ playbook }) {
  const [activeTab, setActiveTab] = useState(PLAYBOOK_TABS[0])
  const [copied, setCopied] = useState(false)

  const getCode = (tab) => {
    if (!playbook) return ''
    const key = tab.toLowerCase()
    return playbook[tab] ?? playbook[key] ?? playbook[tab.toUpperCase()] ?? ''
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
      <div className="flex items-center justify-between border-b border-white/10 px-3">
        <div className="flex">
          {PLAYBOOK_TABS.map((tab) => {
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
      <div className="p-4 overflow-x-auto max-h-64">
        {code
          ? <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">{code}</pre>
          : <p className="text-xs text-gray-600 italic">No configuration snippet available for {activeTab}.</p>
        }
      </div>
    </div>
  )
}

function PlaybookCard({ item, expanded, onToggle }) {
  const [playbook, setPlaybook] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

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
          {desc && !expanded && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{desc}</p>}
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 pt-3">
          {desc && <p className="text-sm text-gray-400 leading-relaxed mb-4">{desc}</p>}
          {(() => {
            const impact = field(item, 'impact', 'Impact')
            const fix    = field(item, 'fix', 'Fix', 'remediation', 'Remediation', 'recommendation', 'Recommendation')
            const ref    = field(item, 'references', 'References', 'reference', 'Reference')
            return (
              <>
                {impact && <div className="mb-3"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Impact</p><p className="text-sm text-gray-300">{impact}</p></div>}
                {fix    && <div className="mb-3"><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Remediation</p><p className="text-sm text-gray-300">{fix}</p></div>}
                {ref    && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">References</p>
                    {Array.isArray(ref)
                      ? ref.map((r, i) => <a key={i} href={r} target="_blank" rel="noopener noreferrer" className="block text-xs text-crimson-400 hover:underline truncate">{r}</a>)
                      : <p className="text-sm text-gray-300">{ref}</p>}
                  </div>
                )}
              </>
            )
          })()}
          {loading && <div className="flex items-center gap-2 text-gray-400 text-xs py-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading configuration playbook…</div>}
          {error   && <p className="text-xs text-red-400 py-2">{error}</p>}
          {!loading && !error && <CodePanel playbook={playbook} />}
        </div>
      )}
    </div>
  )
}

function PlaybooksTab() {
  const [items, setItems]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [search, setSearch]             = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [expandedId, setExpandedId]     = useState(null)

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
    const title  = field(item, 'title', 'Title', 'name', 'Name', 'checkName', 'CheckName').toLowerCase()
    const desc   = field(item, 'description', 'Description').toLowerCase()
    const sev    = field(item, 'severity', 'Severity').toLowerCase()
    const cat    = field(item, 'category', 'Category').toLowerCase()
    const q      = search.toLowerCase()
    return (!q || title.includes(q) || desc.includes(q) || cat.includes(q))
        && (!severityFilter || sev === severityFilter.toLowerCase())
  })

  const getItemId = (item, idx) =>
    field(item, 'checkName', 'CheckName', 'check_name', 'id', 'Id', 'name', 'Name') || String(idx)

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
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
          {severities.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!loading && !error && (
        <div className="flex flex-wrap gap-3 mb-5">
          {[
            { label: 'Total Playbooks', value: items.length,    icon: BookOpen, color: 'text-blue-400' },
            { label: 'Critical',        value: items.filter(i => field(i,'severity','Severity').toLowerCase() === 'critical').length, icon: Shield, color: 'text-red-400' },
            { label: 'Showing',         value: filtered.length, icon: Zap,      color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-xl px-4 py-2.5">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-lg font-bold text-white">{s.value}</span>
              <span className="text-xs text-gray-400">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-crimson-400 animate-spin" /></div>}
      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-12">
          <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
          <button onClick={fetchData} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Search className="w-8 h-8 text-gray-600" />
          <p className="text-white font-semibold">No playbooks found</p>
          <p className="text-sm text-gray-500">
            {items.length === 0 ? 'No remediation data available from the server.' : 'Try adjusting your search or severity filter.'}
          </p>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const id = getItemId(item, idx)
            return (
              <PlaybookCard
                key={id}
                item={item}
                expanded={expandedId === id}
                onToggle={() => setExpandedId((p) => p === id ? null : id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function RemediationPage() {
  const [activeTab, setActiveTab] = useState('Tasks')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-crimson-500/15 border border-crimson-500/30 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-crimson-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-crimson-400">Remediation</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Fix Vulnerabilities Fast</h1>
            <p className="text-gray-400 max-w-2xl">
              Track open remediation tasks, acknowledge findings, and access configuration playbooks for Nginx, Apache, IIS, and Ansible.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit mb-8">
            {TABS_NAV.map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === t ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === 'Tasks'     && <TasksTab />}
          {activeTab === 'Playbooks' && <PlaybooksTab />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
