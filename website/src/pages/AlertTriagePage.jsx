import React, { useState, useEffect } from 'react'
import {
  Bell, CheckCircle2, XCircle, Eye, Loader2, AlertTriangle,
  Copy, Check, ChevronDown, ChevronUp, Brain,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAiTriage, acknowledgeAlert, resolveAlert, dismissAlert } from '../services/api'

const PRIORITY_STYLE = {
  P1: 'bg-red-500/15 text-red-400 border-red-500/30',
  P2: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  P3: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  P4: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

const SEV_STYLE = {
  Critical: 'text-red-400',
  High: 'text-orange-400',
  Medium: 'text-amber-400',
  Low: 'text-blue-400',
  Info: 'text-gray-400',
}

function AlertCard({ alert, onAction }) {
  const [expanded, setExpanded] = useState(false)
  const [acting, setActing]   = useState(null)
  const [copied, setCopied]   = useState(false)

  const id        = alert.id        ?? alert.Id        ?? alert.AlertId    ?? ''
  const title     = alert.title     ?? alert.Title     ?? alert.name       ?? alert.Name ?? ''
  const priority  = alert.priority  ?? alert.Priority  ?? 'P3'
  const severity  = alert.severity  ?? alert.Severity  ?? 'Medium'
  const daysOpen  = alert.daysOpen  ?? alert.DaysOpen  ?? alert.age        ?? 0
  const reasoning = alert.aiReasoning ?? alert.AiReasoning ?? alert.reasoning ?? alert.Reasoning ?? ''
  const template  = alert.responseTemplate ?? alert.ResponseTemplate ?? alert.template ?? alert.Template ?? ''
  const status    = alert.status    ?? alert.Status    ?? 'open'
  const check     = alert.checkName ?? alert.CheckName ?? alert.check      ?? ''
  const url       = alert.url       ?? alert.Url       ?? alert.target     ?? ''

  const act = async (fn, label) => {
    setActing(label)
    try { await fn(id); onAction(id, label) } catch {}
    setActing(null)
  }

  const copyTemplate = () => {
    if (!template) return
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`bg-white/3 border rounded-2xl overflow-hidden transition-colors ${status !== 'open' ? 'opacity-50' : 'border-white/10 hover:border-white/20'}`}>
      <div className="px-6 py-4 flex items-start gap-4">
        <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border mt-0.5 ${PRIORITY_STYLE[priority] || PRIORITY_STYLE.P3}`}>{priority}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold text-sm">{title || check}</p>
            <span className={`text-xs font-medium ${SEV_STYLE[severity] || SEV_STYLE.Medium}`}>{severity}</span>
            {daysOpen > 0 && <span className="text-xs text-gray-500">{daysOpen}d open</span>}
          </div>
          {url && <p className="text-xs text-gray-500 mt-0.5 truncate">{url}</p>}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-6 py-4 space-y-4">
          {reasoning && (
            <div className="bg-white/3 rounded-xl p-4">
              <p className="text-xs font-semibold text-crimson-400 mb-2 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" /> AI Reasoning
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">{reasoning}</p>
            </div>
          )}

          {template && (
            <div className="bg-white/3 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400">Draft Response Template</p>
                <button
                  onClick={copyTemplate}
                  className="flex items-center gap-1 text-xs text-crimson-400 hover:text-crimson-300 font-semibold"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-400 text-xs leading-relaxed font-mono whitespace-pre-wrap">{template}</p>
            </div>
          )}

          {status === 'open' && (
            <div className="flex gap-2 flex-wrap">
              <button
                disabled={!!acting}
                onClick={() => act(acknowledgeAlert, 'acknowledge')}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
              >
                {acting === 'acknowledge' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Eye className="w-3 h-3" />}
                Acknowledge
              </button>
              <button
                disabled={!!acting}
                onClick={() => act(resolveAlert, 'resolve')}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
              >
                {acting === 'resolve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Resolve
              </button>
              <button
                disabled={!!acting}
                onClick={() => act(dismissAlert, 'dismiss')}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                {acting === 'dismiss' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                Dismiss
              </button>
            </div>
          )}
          {status !== 'open' && (
            <p className="text-xs text-gray-500 capitalize">{status}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function AlertTriagePage() {
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filter, setFilter]   = useState('open')

  useEffect(() => {
    getAiTriage()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.alerts ?? data?.items ?? data?.triage ?? [])
        setAlerts(list)
      })
      .catch((e) => setError(e.message || 'Failed to load triage data'))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = (id, action) => {
    setAlerts((prev) =>
      prev.map((a) => {
        const aId = a.id ?? a.Id ?? a.AlertId ?? ''
        if (aId !== id) return a
        const newStatus = action === 'resolve' ? 'resolved' : action === 'dismiss' ? 'dismissed' : 'acknowledged'
        return { ...a, status: newStatus, Status: newStatus }
      })
    )
  }

  const visible = alerts.filter((a) => {
    const s = (a.status ?? a.Status ?? 'open').toLowerCase()
    if (filter === 'open') return s === 'open'
    if (filter === 'all') return true
    return s === filter
  })

  const counts = { P1: 0, P2: 0, P3: 0, P4: 0 }
  alerts.filter((a) => (a.status ?? a.Status ?? 'open') === 'open').forEach((a) => {
    const p = a.priority ?? a.Priority ?? 'P3'
    if (counts[p] !== undefined) counts[p]++
  })

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">AI Intelligence</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Bell className="w-8 h-8 text-crimson-400" /> Alert Triage Co-pilot
            </h1>
            <p className="text-gray-400">AI-ranked remediation tasks — P1 needs action today, P4 can wait.</p>
          </div>

          {/* Priority summary */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {['P1', 'P2', 'P3', 'P4'].map((p) => (
              <div key={p} className={`rounded-2xl p-4 border text-center ${PRIORITY_STYLE[p]}`}>
                <p className="text-2xl font-extrabold">{counts[p]}</p>
                <p className="text-xs font-bold mt-0.5">{p}</p>
              </div>
            ))}
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[['open', 'Open'], ['acknowledged', 'Acknowledged'], ['resolved', 'Resolved'], ['all', 'All']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-colors ${filter === val ? 'bg-crimson-500 border-crimson-500 text-white' : 'border-white/15 text-gray-400 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-12 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading triage data…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {!loading && !error && visible.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500/50" />
              <p className="font-semibold text-white">All clear!</p>
              <p className="text-sm mt-1">No {filter === 'all' ? '' : filter} alerts at the moment.</p>
            </div>
          )}

          <div className="space-y-3">
            {visible.map((alert, i) => (
              <AlertCard
                key={alert.id ?? alert.Id ?? alert.AlertId ?? i}
                alert={alert}
                onAction={handleAction}
              />
            ))}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
