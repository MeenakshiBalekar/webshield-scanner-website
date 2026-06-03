import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, Loader2, AlertCircle, RefreshCw,
  CheckCircle, Eye, BookOpen, ExternalLink, XCircle, Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API     = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

const SEV_STYLES = {
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  high:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  medium:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
}
const sevStyle = (s) => SEV_STYLES[(s ?? '').toLowerCase()] ?? 'bg-gray-500/15 text-gray-400 border-gray-500/30'

function field(obj, ...keys) {
  for (const k of keys) if (obj?.[k] != null) return obj[k]
  return ''
}

/* ── Summary strip ── */
function SummaryStrip({ summary }) {
  const open     = summary?.openCount     ?? summary?.OpenCount     ?? summary?.open     ?? 0
  const critical = summary?.criticalCount ?? summary?.CriticalCount ?? summary?.critical ?? 0
  const resolved = summary?.resolvedCount ?? summary?.ResolvedCount ?? summary?.resolved ?? 0

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {[
        { label: 'Open',     value: open,     color: 'text-yellow-400', border: 'border-yellow-500/20' },
        { label: 'Critical', value: critical,  color: 'text-red-400',    border: 'border-red-500/20' },
        { label: 'Resolved', value: resolved,  color: 'text-green-400',  border: 'border-green-500/20' },
      ].map(({ label, value, color, border }) => (
        <div key={label} className={`bg-white/3 border ${border} rounded-2xl p-4 text-center`}>
          <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Task card ── */
function TaskCard({ task, onAction }) {
  const [actioning, setActioning] = useState(null)
  const [localStatus, setLocalStatus] = useState(null)

  const id          = field(task, 'id', 'Id', 'taskId', 'TaskId')
  const checkName   = field(task, 'checkName', 'CheckName', 'name', 'Name')
  const severity    = field(task, 'severity', 'Severity')
  const status      = localStatus ?? field(task, 'status', 'Status') ?? 'open'
  const desc        = field(task, 'description', 'Description', 'details', 'Details')
  const targetUrl   = field(task, 'targetUrl', 'TargetUrl', 'url', 'Url')
  const playbookUrl = field(task, 'playbookUrl', 'PlaybookUrl', 'playbook_url')
  const createdAt   = field(task, 'createdAt', 'CreatedAt', 'created', 'Created')

  const statusLow = status.toLowerCase()
  const isResolved = statusLow === 'resolved' || statusLow === 'done'
  const isAcked    = statusLow === 'acknowledged' || statusLow === 'ack'

  const act = async (type) => {
    setActioning(type)
    try {
      await onAction(id, type)
      setLocalStatus(type === 'acknowledge' ? 'Acknowledged' : 'Resolved')
    } catch (err) {
      alert(err.message ?? `Failed to ${type}`)
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
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sevStyle(severity)}`}>
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
          <button onClick={() => act('acknowledge')} disabled={!!actioning}
            className="flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {actioning === 'acknowledge' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
            Acknowledge
          </button>
        )}
        {!isResolved && (
          <button onClick={() => act('resolve')} disabled={!!actioning}
            className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/25 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {actioning === 'resolve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
            Resolve
          </button>
        )}
        {isResolved && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle className="w-3.5 h-3.5" /> Resolved
          </span>
        )}
        {playbookUrl && (
          <a href={playbookUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-crimson-400 hover:text-crimson-300 text-xs font-semibold ml-auto transition-colors">
            <BookOpen className="w-3 h-3" /> View Playbook <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function RemediationTasksPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const [summary, setSummary]   = useState(null)
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [sevFilter, setSevFilter] = useState('')

  const token = localStorage.getItem('ws_token')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sumRes, tasksRes] = await Promise.all([
        fetch(`${BACKEND}/api/remediationtasks/summary`, { headers: authHeaders() }),
        fetch(`${BACKEND}/api/remediationtasks`,         { headers: authHeaders() }),
      ])
      if (tasksRes.status === 401) { navigate('/login?redirect=/remediation-tasks'); return }
      if (sumRes.ok) setSummary(await sumRes.json())
      if (!tasksRes.ok) throw new Error(`Server error ${tasksRes.status}`)
      const data = await tasksRes.json()
      setTasks(Array.isArray(data) ? data : data?.tasks ?? data?.Tasks ?? data?.items ?? [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    if (!token) { navigate('/login?redirect=/remediation-tasks'); return }
    fetchAll()
  }, [])

  const handleAction = async (id, action) => {
    const res = await fetch(`${BACKEND}/api/remediationtasks/${id}/${action}`, {
      method: 'PATCH',
      headers: authHeaders(),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.message ?? d.error ?? `Failed to ${action}`)
    }
  }

  const SEVERITIES = ['Critical', 'High', 'Medium', 'Low']
  const filtered = tasks.filter((t) =>
    !sevFilter || (field(t, 'severity', 'Severity') ?? '').toLowerCase() === sevFilter.toLowerCase()
  )

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9 rounded-lg" />
          <span className="text-white font-bold text-xl tracking-tight">
            Udy<span className="text-crimson-500">◎</span><span className="text-gray-400 font-normal">360</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/remediation" className="text-gray-400 hover:text-white text-sm transition-colors">Playbooks</Link>
          <button onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Remediation Tasks</h1>
            <p className="text-sm text-gray-400 mt-0.5">Track, acknowledge, and resolve open security findings</p>
          </div>
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {summary && <SummaryStrip summary={summary} />}

        {/* Severity filter pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button onClick={() => setSevFilter('')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${!sevFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}>
            All
          </button>
          {SEVERITIES.map((s) => (
            <button key={s} onClick={() => setSevFilter(s === sevFilter ? '' : s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${sevFilter === s ? 'bg-crimson-500 text-white' : 'bg-white/5 text-gray-400 border border-white/10 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {loading && <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-crimson-400 animate-spin" /></div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-white font-semibold">All clear</p>
            <p className="text-sm text-gray-500 mt-1">No remediation tasks{sevFilter ? ` for ${sevFilter}` : ''}.</p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((task, i) => (
              <TaskCard
                key={field(task, 'id', 'Id', 'taskId') || i}
                task={task}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
