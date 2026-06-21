import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, ScanLine, Loader2, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  LayoutDashboard, FileText, Download, Mail, Send, ArrowRight,
  TrendingUp, TrendingDown, Clock, Wifi, Cpu, Globe, Lock,
  PlusCircle, MinusCircle, Zap, Sparkles, AlertTriangle, ExternalLink,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'
import { getRemediation, downloadReportPdf, emailReport, createSchedule, startAuthenticatedScan, startCrawlScan } from '../services/api'
import ApiErrorBanner from '../components/ApiErrorBanner'
import EvidencePanel from '../components/EvidencePanel'
import Navbar from '../components/Navbar'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

/* ── Trend sparkline ── */
function Sparkline({ points }) {
  if (!points || points.length < 2) return null
  const vals = points.map((p) => Number(p.score ?? p.Score ?? p.value ?? p.Value ?? p) || 0)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const W = 80, H = 28, pad = 2
  const xs = vals.map((_, i) => pad + (i / (vals.length - 1)) * (W - pad * 2))
  const ys = vals.map((v) => H - pad - ((v - min) / range) * (H - pad * 2))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')
  const last = vals[vals.length - 1]
  const prev = vals[vals.length - 2]
  const up = last >= prev
  return (
    <svg width={W} height={H} className="inline-block align-middle ml-1">
      <polyline points={xs.map((x, i) => `${x.toFixed(1)},${ys[i].toFixed(1)}`).join(' ')}
        fill="none" stroke={up ? '#4ade80' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length - 1].toFixed(1)} cy={ys[ys.length - 1].toFixed(1)} r="2.5"
        fill={up ? '#4ade80' : '#f87171'} />
    </svg>
  )
}

/* ── Infrastructure card ── */
function InfrastructureCard({ profile }) {
  if (!profile) return null
  const waf         = profile.waf         ?? profile.Waf         ?? profile.WAF
  const cdn         = profile.cdn         ?? profile.Cdn         ?? profile.CDN
  const runtime     = profile.runtime     ?? profile.Runtime     ?? null
  const httpVersion = profile.httpVersion ?? profile.HttpVersion ?? profile.http ?? null
  const compression = profile.compression ?? profile.Compression ?? null
  const tlsVersion  = profile.tlsVersion  ?? profile.TlsVersion  ?? null

  const boolLabel = (v) => {
    if (v === null || v === undefined) return null
    if (typeof v === 'boolean') return v ? '✓' : '✗'
    return String(v)
  }
  const boolColor = (v) => {
    if (typeof v === 'boolean') return v ? 'text-green-400' : 'text-red-400'
    return 'text-gray-300'
  }

  const items = [
    { icon: Lock,  label: 'WAF',         value: boolLabel(waf),         color: boolColor(waf) },
    { icon: Globe, label: 'CDN',         value: boolLabel(cdn),         color: boolColor(cdn) },
    { icon: Cpu,   label: 'Runtime',     value: runtime,                color: 'text-gray-300' },
    { icon: Wifi,  label: 'HTTP',        value: httpVersion,            color: 'text-gray-300' },
    { icon: Zap,   label: 'Compression', value: boolLabel(compression), color: boolColor(compression) },
    { icon: Lock,  label: 'TLS',         value: tlsVersion,             color: 'text-gray-300' },
  ].filter((i) => i.value !== null && i.value !== undefined && i.value !== '')

  if (!items.length) return null

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl px-4 py-3 mb-4">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Infrastructure Profile</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {items.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5 text-gray-600 shrink-0" />
            <span className="text-xs text-gray-500">{label}:</span>
            <span className={`text-xs font-semibold ${color}`}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Change alerts ── */
function ChangeAlerts({ result }) {
  const resolved = result?.resolvedSince   ?? result?.ResolvedSince   ??
                   result?.resolvedCount   ?? result?.ResolvedCount   ?? null
  const added    = result?.newIssueCount   ?? result?.NewIssueCount   ??
                   result?.newIssues       ?? result?.NewIssues       ?? null
  const changes  = result?.changesFromLastScan ?? result?.ChangesFromLastScan ?? null

  // Parse from changesFromLastScan object if top-level fields absent
  const resolvedFinal = resolved ?? changes?.resolved ?? changes?.Resolved ?? null
  const addedFinal    = added    ?? changes?.added    ?? changes?.Added    ?? null

  if (resolvedFinal === null && addedFinal === null) return null

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {addedFinal > 0 && (
        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-3 py-2 text-xs font-semibold">
          <PlusCircle className="w-3.5 h-3.5 shrink-0" />
          {addedFinal} new issue{addedFinal !== 1 ? 's' : ''} detected
        </div>
      )}
      {resolvedFinal > 0 && (
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-3 py-2 text-xs font-semibold">
          <MinusCircle className="w-3.5 h-3.5 shrink-0" />
          {resolvedFinal} issue{resolvedFinal !== 1 ? 's' : ''} resolved since last scan
        </div>
      )}
      {addedFinal === 0 && resolvedFinal === 0 && (
        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl px-3 py-2 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5 shrink-0" /> No changes since last scan
        </div>
      )}
    </div>
  )
}

const PRODUCTS = {
  web: {
    title: 'Web Vulnerability Scanner',
    subtitle: 'Detect misconfigured security headers, exposed endpoints, and common web vulnerabilities.',
    endpoint: '/scan/headers',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  api: {
    title: 'API Security',
    subtitle: 'Test API endpoints for authentication flaws, improper access controls, and data exposure risks.',
    endpoint: '/products/api-security',
    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
  owasp: {
    title: 'OWASP Scanner',
    subtitle: 'Validate your application against the OWASP Top 10 — the most critical web security risks.',
    endpoint: '/products/owasp-scan',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  xss: {
    title: 'XSS Detector',
    subtitle: 'Identify Cross-Site Scripting vulnerabilities and content injection risks across your pages.',
    endpoint: '/products/xss-scan',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  sqli: {
    title: 'SQLi Tester',
    subtitle: 'Detect SQL injection vulnerabilities and assess your database exposure risk.',
    endpoint: '/products/sqli-scan',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
}

const SEV_THEME = {
  Critical: { bg: 'bg-red-900/30',    border: 'border-red-500/50',    badge: 'bg-red-600',    text: 'text-red-400'    },
  High:     { bg: 'bg-orange-900/25', border: 'border-orange-500/50', badge: 'bg-orange-500', text: 'text-orange-400' },
  Medium:   { bg: 'bg-yellow-900/20', border: 'border-yellow-500/50', badge: 'bg-yellow-500', text: 'text-yellow-400' },
  Low:      { bg: 'bg-blue-900/20',   border: 'border-blue-600/50',   badge: 'bg-blue-600',   text: 'text-blue-400'   },
}
function sevTheme(s) {
  return SEV_THEME[(s ?? '').charAt(0).toUpperCase() + (s ?? '').slice(1).toLowerCase()] ?? SEV_THEME.Low
}

const PRIORITY_STYLE = {
  1: 'bg-red-500/20 text-red-300 border-red-500/40',
  2: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  3: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
}

function FindingGroupCard({ group }) {
  const [expanded, setExpanded] = useState(false)
  const title        = group.title          ?? group.Title          ?? 'Finding Group'
  const severity     = group.severity       ?? group.Severity       ?? 'Medium'
  const priority     = group.priority       ?? group.Priority       ?? null
  const findingCount = group.findingCount   ?? group.FindingCount   ?? 0
  const attackPath   = group.attackPath     ?? group.AttackPath     ?? []
  const narrative    = group.attackNarrative ?? group.AttackNarrative ?? null
  const c = sevTheme(severity)
  const pStyle = PRIORITY_STYLE[priority] ?? 'bg-white/10 text-gray-400 border-white/15'

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} p-5 space-y-4`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            {priority != null && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pStyle}`}>P{priority}</span>
            )}
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${c.badge}`}>{severity}</span>
            {findingCount > 0 && (
              <span className="text-[10px] text-gray-400 border border-white/10 bg-white/5 px-2 py-0.5 rounded">
                {findingCount} finding{findingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <h3 className={`text-sm font-bold text-white leading-snug`}>{title}</h3>
        </div>
      </div>

      {/* Attack path timeline */}
      {attackPath.length > 0 && (
        <div className="space-y-0 pl-0.5">
          {attackPath.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0 mt-0.5">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                  i === 0
                    ? 'border-gray-400 bg-gray-600'
                    : i === attackPath.length - 1
                      ? 'border-current bg-current ' + c.text
                      : 'border-gray-500 bg-gray-700'
                }`} />
                {i < attackPath.length - 1 && <div className="w-px h-4 bg-white/10 my-0.5" />}
              </div>
              <p className={`text-xs leading-relaxed pb-1 ${i === attackPath.length - 1 ? 'font-semibold ' + c.text : 'text-gray-300'}`}>
                {step}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Attack narrative */}
      {narrative && (
        <div className="border-t border-white/10 pt-3">
          <p className={`text-xs text-gray-300 leading-relaxed ${!expanded ? 'line-clamp-2' : ''}`}>
            {narrative}
          </p>
          {narrative.length > 100 && (
            <button onClick={() => setExpanded((v) => !v)}
              className={`mt-1.5 text-[10px] font-semibold ${c.text} hover:opacity-80 transition-opacity`}>
              {expanded ? 'Show less ↑' : 'Read attack story →'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ConfidenceChip({ score }) {
  if (score == null) return null
  const pct = Math.round(score)
  const style = pct >= 80
    ? 'bg-green-500/10 text-green-400 border-green-500/25'
    : pct >= 50
      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25'
      : 'bg-gray-500/10 text-gray-400 border-gray-500/25'
  return (
    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${style}`}>
      {pct}% confident
    </span>
  )
}

function SlaBadge({ severity, slaDueDate, slaStatus, slaDaysLeft }) {
  const sev = (severity ?? '').toLowerCase()
  if (sev !== 'critical' && sev !== 'high') return null

  let daysLeft = slaDaysLeft ?? null
  if (daysLeft == null && slaDueDate) {
    daysLeft = Math.ceil((new Date(slaDueDate) - Date.now()) / 86400000)
  }

  const overdue = slaStatus?.toLowerCase() === 'overdue' || (daysLeft != null && daysLeft < 0)
  const dueSoon = !overdue && daysLeft != null && daysLeft <= 3

  if (daysLeft == null && !slaStatus) return null

  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-red-600/20 text-red-300 border-red-500/50 shrink-0 whitespace-nowrap animate-pulse">
        <AlertTriangle className="w-2.5 h-2.5" /> OVERDUE
      </span>
    )
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap ${
      dueSoon
        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
        : 'bg-sky-500/10 text-sky-400 border-sky-500/30'
    }`}>
      <Clock className="w-2.5 h-2.5" />
      {daysLeft != null ? `Due in ${daysLeft}d` : 'SLA Active'}
    </span>
  )
}

const FINDING_STATUSES = [
  { value: 'Confirmed',     label: 'Confirmed Issue',      style: 'text-red-400' },
  { value: 'FalsePositive', label: 'Mark False Positive',  style: 'text-gray-400' },
  { value: 'AcceptedRisk',  label: 'Accept Risk',          style: 'text-yellow-400' },
  { value: 'Fixed',         label: 'Mark Fixed',           style: 'text-green-400' },
]

function FindingStatusDropdown({ findingId, currentStatus }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState(currentStatus ?? null)
  const [saving, setSaving] = useState(false)

  if (!findingId) return null

  const current = FINDING_STATUSES.find(s => s.value === status)

  const handleSelect = async (e, value) => {
    e.stopPropagation()
    setOpen(false)
    if (value === status) return
    setSaving(true)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/findings/${findingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status: value }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setStatus(value)
    } catch {
      // silently ignore — status is optimistic
    }
    setSaving(false)
  }

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v) }}
        disabled={saving}
        className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-white/15 bg-white/5 text-gray-400 hover:text-white hover:border-white/30 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {saving
          ? <><span className="w-3 h-3 border border-gray-400/30 border-t-gray-400 rounded-full animate-spin" /> Saving…</>
          : <>{current ? <span className={current.style}>{current.label}</span> : 'Set Status'} <ChevronDown className="w-3 h-3" /></>
        }
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-1 z-20 bg-[#0d1f3c] border border-white/15 rounded-xl shadow-2xl overflow-hidden min-w-[170px]">
          {FINDING_STATUSES.map(({ value, label, style }) => (
            <button
              key={value}
              onClick={e => handleSelect(e, value)}
              className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/8 transition-colors ${style} ${status === value ? 'bg-white/5 font-bold' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AiFixButton({ findingId, checkName, severity, technicalDetails }) {
  const [state, setState] = useState('idle') // idle | loading | open
  const [guidance, setGuidance] = useState(null)
  const [error, setError] = useState(null)

  const handleClick = async (e) => {
    e.stopPropagation()
    if (state === 'open') { setState('idle'); return }
    setState('loading')
    setError(null)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/remediation/ai-guidance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ findingId, checkName, severity, technicalDetails }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setGuidance(data)
      setState('open')
    } catch (err) {
      setError(err.message || 'AI guidance unavailable')
      setState('idle')
    }
  }

  const steps = guidance?.steps ?? guidance?.Steps ?? guidance?.remediationSteps ?? []
  const explanation = guidance?.explanation ?? guidance?.Explanation ?? null
  const estimatedTime = guidance?.estimatedTime ?? guidance?.EstimatedTime ?? null
  const difficulty = guidance?.difficulty ?? guidance?.Difficulty ?? null

  const DIFF_STYLE = { Easy: 'text-green-400', Medium: 'text-yellow-400', Hard: 'text-red-400' }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-violet-500/30 bg-violet-500/8 text-violet-400 hover:bg-violet-500/15 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {state === 'loading'
          ? <><span className="w-3 h-3 border border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> Thinking…</>
          : <><Sparkles className="w-3 h-3" /> Get AI Fix</>}
      </button>

      {error && (
        <span className="text-[10px] text-red-400">{error}</span>
      )}

      {state === 'open' && guidance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={() => setState('idle')}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative bg-[#0a0f1e] border border-violet-500/30 rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <h3 className="text-white font-bold text-base">AI Remediation Guidance</h3>
                </div>
                <p className="text-xs text-gray-400 truncate max-w-xs">{checkName}</p>
              </div>
              <button
                onClick={() => setState('idle')}
                className="text-gray-500 hover:text-white transition-colors ml-4 shrink-0"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {(estimatedTime || difficulty) && (
              <div className="flex items-center gap-3 mb-4 text-xs">
                {estimatedTime && (
                  <span className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3.5 h-3.5" /> ~{estimatedTime}
                  </span>
                )}
                {difficulty && (
                  <span className={`font-semibold ${DIFF_STYLE[difficulty] ?? 'text-gray-400'}`}>
                    {difficulty} difficulty
                  </span>
                )}
              </div>
            )}

            {explanation && (
              <p className="text-sm text-gray-300 leading-relaxed mb-4 bg-white/3 rounded-xl px-4 py-3 border border-white/10">
                {explanation}
              </p>
            )}

            {steps.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider mb-3">Step-by-step fix</p>
                <ol className="space-y-3">
                  {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <p className="text-sm text-gray-200 leading-relaxed">{typeof step === 'string' ? step : step.description ?? JSON.stringify(step)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {steps.length === 0 && !explanation && (
              <p className="text-sm text-gray-500 text-center py-4">No guidance returned.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

const LIFECYCLE_STAGES = [
  { id: 'Detected',      label: 'Detected',       color: 'text-gray-400',   dot: 'bg-gray-500' },
  { id: 'Assigned',      label: 'Assigned',        color: 'text-blue-400',   dot: 'bg-blue-500' },
  { id: 'InProgress',    label: 'In Progress',     color: 'text-amber-400',  dot: 'bg-amber-500' },
  { id: 'VerifiedFixed', label: 'Verified Fixed',  color: 'text-green-400',  dot: 'bg-green-500' },
]

function LifecycleTracker({ findingId, initialStage, initialAssigneeId, initialAssigneeName }) {
  const [stage, setStage]             = useState(initialStage ?? 'Detected')
  const [assigneeId, setAssigneeId]   = useState(initialAssigneeId ?? '')
  const [assigneeName, setAssigneeName] = useState(initialAssigneeName ?? '')
  const [members, setMembers]         = useState(null)
  const [saving, setSaving]           = useState(false)
  const [showAssign, setShowAssign]   = useState(false)

  if (!findingId) return null

  const currentIdx = LIFECYCLE_STAGES.findIndex(s => s.id === stage)

  const fetchMembers = async () => {
    if (members) return
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/org/members`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      })
      if (res.ok) setMembers(await res.json())
    } catch {}
  }

  const advance = async (targetStage) => {
    if (targetStage === 'Assigned') {
      await fetchMembers()
      setShowAssign(true)
      return
    }
    await patchLifecycle(targetStage, null)
  }

  const patchLifecycle = async (targetStage, memberId) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/findings/${findingId}/lifecycle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ stage: targetStage, ...(memberId ? { assigneeId: memberId } : {}) }),
      })
      if (!res.ok) throw new Error()
      setStage(targetStage)
      setShowAssign(false)
    } catch {}
    setSaving(false)
  }

  const handleAssign = async (member) => {
    const id   = member.id ?? member.Id
    const name = member.name ?? member.Name ?? member.email ?? member.Email ?? id
    setAssigneeId(id)
    setAssigneeName(name)
    await patchLifecycle('Assigned', id)
  }

  return (
    <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3" onClick={e => e.stopPropagation()}>
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">Finding Lifecycle</p>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {LIFECYCLE_STAGES.map((s, i) => {
          const done    = i < currentIdx
          const active  = i === currentIdx
          const next    = i === currentIdx + 1
          const future  = i > currentIdx
          return (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1">
                <button
                  disabled={saving || (!next && !active)}
                  onClick={() => next && advance(s.id)}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                    done    ? 'bg-green-500 border-green-500 text-white' :
                    active  ? `${s.dot} border-current ${s.color} text-white` :
                    next    ? 'border-white/30 bg-white/5 hover:border-white/60 cursor-pointer' :
                              'border-white/10 bg-transparent cursor-default'
                  }`}
                  title={next ? `Advance to "${s.label}"` : s.label}
                >
                  {done
                    ? <CheckCircle className="w-3.5 h-3.5" />
                    : <span className="text-[9px] font-bold">{i + 1}</span>}
                </button>
                <span className={`text-[9px] font-semibold text-center leading-tight max-w-[56px] ${active ? s.color : future ? 'text-gray-600' : 'text-gray-400'}`}>
                  {s.label}
                  {active && s.id === 'Assigned' && assigneeName && (
                    <span className="block text-[8px] text-blue-300">{assigneeName}</span>
                  )}
                </span>
              </div>
              {i < LIFECYCLE_STAGES.length - 1 && (
                <div className={`flex-1 h-px mx-1 mb-5 ${i < currentIdx ? 'bg-green-500/50' : 'bg-white/10'}`} />
              )}
            </React.Fragment>
          )
        })}
      </div>

      {/* Assignee picker — shown when advancing to Assigned */}
      {showAssign && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] text-gray-400 mb-2">Assign to team member:</p>
          {!members && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-3 h-3 border border-white/20 border-t-white rounded-full animate-spin" /> Loading members…
            </span>
          )}
          {members?.length === 0 && <p className="text-xs text-gray-500">No team members found.</p>}
          {members?.map((m, i) => {
            const id   = m.id   ?? m.Id
            const name = m.name ?? m.Name ?? m.email ?? m.Email ?? id
            const email = m.email ?? m.Email ?? ''
            return (
              <button
                key={i}
                onClick={() => handleAssign(m)}
                disabled={saving}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/8 text-left transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-blue-400">
                    {(name[0] ?? '?').toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-white font-medium truncate">{name}</p>
                  {email && name !== email && <p className="text-[10px] text-gray-500 truncate">{email}</p>}
                </div>
              </button>
            )
          })}
          <button
            onClick={() => setShowAssign(false)}
            className="mt-2 text-[10px] text-gray-500 hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {saving && (
        <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">
          <span className="w-2.5 h-2.5 border border-white/20 border-t-white rounded-full animate-spin" /> Saving…
        </p>
      )}
    </div>
  )
}

function RiskGauge({ score }) {
  if (score == null) return null

  // Normalize to 0–100
  const s = score <= 10 ? score * 10 : Math.min(100, Math.max(0, score))

  const urgency = s >= 67
    ? { label: 'Fix This Quarter', color: '#22c55e', track: '#166534' }
    : s >= 34
      ? { label: 'Fix This Week',  color: '#f97316', track: '#7c2d12' }
      : { label: 'Fix Today',      color: '#ef4444', track: '#7f1d1d' }

  // SVG semicircle: radius 72, cx=100, cy=95, sweeps 180°
  const R = 72
  const CX = 100, CY = 95
  const startX = CX - R, startY = CY
  const endX   = CX + R, endY   = CY

  // Arc from left to right (bottom semicircle excluded)
  const trackPath = `M ${startX} ${startY} A ${R} ${R} 0 0 1 ${endX} ${endY}`

  const pct = s / 100
  // Full arc circumference of semicircle ≈ π * R
  const arcLen = Math.PI * R
  const dashArray = `${pct * arcLen} ${arcLen}`

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      <svg viewBox="0 0 200 100" className="w-40 overflow-visible" style={{ height: 90 }}>
        {/* Track */}
        <path d={trackPath} fill="none" stroke={urgency.track} strokeWidth="12" strokeLinecap="round" />
        {/* Value arc */}
        <path
          d={trackPath}
          fill="none"
          stroke={urgency.color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset="0"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        {/* Center score */}
        <text x={CX} y={CY - 8} textAnchor="middle" fill="white" fontSize="24" fontWeight="800">{s}</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize="10">/100</text>
      </svg>
      <span className="text-xs font-bold" style={{ color: urgency.color }}>{urgency.label}</span>
    </div>
  )
}

function JiraTicketButton({ findingId, checkName, severity, recommendation }) {
  const [state, setState] = useState('idle') // idle | loading | success | error
  const [ticketUrl, setTicketUrl] = useState(null)
  const [errMsg, setErrMsg] = useState(null)

  const handleCreate = async (e) => {
    e.stopPropagation()
    setState('loading')
    setErrMsg(null)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/integrations/jira/ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ findingId, checkName, severity, recommendation }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTicketUrl(data?.url ?? data?.Url ?? data?.ticketUrl ?? data?.TicketUrl ?? null)
      setState('success')
      setTimeout(() => setState('idle'), 5000)
    } catch (err) {
      setErrMsg(err.message || 'Failed to create ticket')
      setState('error')
      setTimeout(() => setState('idle'), 4000)
    }
  }

  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 text-xs text-green-400">
        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
        Jira ticket created
        {ticketUrl && (
          <a href={ticketUrl} target="_blank" rel="noopener noreferrer"
            className="underline text-green-300 hover:text-green-200 ml-1" onClick={(e) => e.stopPropagation()}>
            View ticket
          </a>
        )}
      </div>
    )
  }
  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-400">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        {errMsg}
      </div>
    )
  }

  return (
    <button
      onClick={handleCreate}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-blue-500/30 bg-blue-500/8 text-blue-400 hover:bg-blue-500/15 disabled:opacity-50 transition-colors whitespace-nowrap"
    >
      {state === 'loading'
        ? <><span className="w-3 h-3 border border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> Creating…</>
        : <><span className="font-bold text-blue-300">J</span> Create Jira Ticket</>}
    </button>
  )
}

/* ── Exploit Proof Viewer ── */
function HighlightedResponse({ response, pattern }) {
  const parts = response.split(pattern)
  if (parts.length === 1) {
    return <span className="text-gray-300 whitespace-pre-wrap">{response}</span>
  }
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          <span className="text-gray-300">{part}</span>
          {i < parts.length - 1 && (
            <mark className="bg-green-500/30 text-green-300 rounded px-0.5 not-italic">{pattern}</mark>
          )}
        </React.Fragment>
      ))}
    </span>
  )
}

function ProofPanel({ proof }) {
  if (!proof) return null
  const payload   = proof.payloadSent    ?? proof.PayloadSent   ?? proof.payload   ?? proof.Payload   ?? null
  const response  = proof.rawResponse   ?? proof.RawResponse  ?? proof.response  ?? proof.Response  ?? null
  const matched   = proof.matchedPattern ?? proof.MatchedPattern ?? proof.matched   ?? proof.Matched   ?? null
  const matchedIn = proof.matchedIn      ?? proof.MatchedIn     ?? null
  const context   = proof.context        ?? proof.Context       ?? null

  if (!payload && !response) return null

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">🎯 Exploit Proof</p>
      <div className={`grid gap-3 ${response ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
        {payload && (
          <div>
            <p className="text-[10px] font-semibold text-crimson-400 uppercase tracking-wider mb-1.5">→ Payload Sent</p>
            <code className="block bg-crimson-500/8 border border-crimson-500/25 rounded-lg px-3 py-2.5 text-xs font-mono text-crimson-300 break-all whitespace-pre-wrap">
              {payload}
            </code>
          </div>
        )}
        {response && (
          <div>
            <p className="text-[10px] font-semibold text-green-400 uppercase tracking-wider mb-1.5">
              ← Raw Response {matchedIn && <span className="text-gray-500 normal-case font-normal">({matchedIn})</span>}
            </p>
            <div className="bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-xs font-mono overflow-auto max-h-40">
              {matched
                ? <HighlightedResponse response={response} pattern={matched} />
                : <span className="text-gray-300 whitespace-pre-wrap">{response}</span>
              }
            </div>
          </div>
        )}
      </div>
      {(matched || context) && (
        <div className="bg-green-500/8 border border-green-500/25 rounded-lg px-3 py-2 flex items-start gap-2">
          <span className="text-green-400 shrink-0 mt-0.5">✓</span>
          <div>
            {matched && (
              <p className="text-[10px] text-green-400">
                Matched: <code className="font-mono">{matched}</code>
              </p>
            )}
            {context && <p className="text-xs text-gray-400 mt-0.5">{context}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── AI Narrative Engine ── */
const VERDICT_STYLE = {
  'Confirmed Exploitable': 'text-red-400 bg-red-500/10 border-red-500/30',
  'Likely Exploitable':    'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'Theoretical':           'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
}

function AiNarrativePanel({ scanId, scanUrl }) {
  const [state, setState] = useState('idle')
  const [data, setData]   = useState(null)
  const [err, setErr]     = useState(null)

  const generate = async () => {
    setState('loading'); setErr(null)
    try {
      const id = scanId || encodeURIComponent(scanUrl)
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/ai-narrative/generate/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url: scanUrl }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setData(await res.json())
      setState('done')
    } catch (e) { setErr(e.message); setState('error') }
  }

  const attackStory    = data?.attackStory           ?? data?.AttackStory          ?? null
  const businessImpact = data?.businessImpact        ?? data?.BusinessImpact        ?? []
  const verdict        = data?.exploitabilityVerdict ?? data?.ExploitabilityVerdict ?? null
  const verdictReason  = data?.verdictReasoning      ?? data?.VerdictReasoning      ?? null
  const fixCode        = data?.fixCode               ?? data?.FixCode               ?? null
  const fixLang        = data?.fixCodeLanguage       ?? data?.FixCodeLanguage       ?? 'code'

  const impactList = Array.isArray(businessImpact) ? businessImpact : (businessImpact ? [String(businessImpact)] : [])
  const vStyle = VERDICT_STYLE[verdict] ?? VERDICT_STYLE['Theoretical']

  if (state === 'idle' || state === 'error') {
    return (
      <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-6 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-violet-400 mx-auto" />
        <p className="text-white font-semibold">AI Narrative Analysis</p>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Get an AI-generated attack story, business impact summary, exploitability verdict, and patched code example for this scan.
        </p>
        <button onClick={generate}
          className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
          <Sparkles className="w-4 h-4" /> Generate AI Analysis
        </button>
        {err && <p className="text-xs text-red-400">{err}</p>}
      </div>
    )
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
        <p className="text-sm text-gray-400">Generating AI analysis — this may take 5–10 seconds…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {verdict && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${vStyle}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="text-sm font-bold">{verdict}</span>
            {verdictReason && <p className="text-xs mt-0.5 opacity-80">{verdictReason}</p>}
          </div>
        </div>
      )}

      {attackStory && (
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">📖 Attack Story</p>
          <div className="space-y-3">
            {attackStory.split('\n\n').filter(Boolean).map((para, i) => (
              <p key={i} className="text-sm text-gray-300 leading-relaxed">{para}</p>
            ))}
          </div>
        </div>
      )}

      {impactList.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-3">🏢 Business Impact</p>
          <ul className="space-y-2">
            {impactList.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fixCode && (
        <div className="bg-green-950/40 border border-green-800/40 rounded-2xl overflow-hidden">
          <div className="px-4 py-2 border-b border-green-800/40 flex items-center justify-between">
            <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider">🛠 Patched Code Example</p>
            <span className="text-[10px] font-mono text-green-600">{fixLang}</span>
          </div>
          <pre className="px-4 py-3 text-xs text-green-200 font-mono overflow-x-auto whitespace-pre">{fixCode}</pre>
        </div>
      )}

      <button onClick={generate}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-colors">
        <Sparkles className="w-3 h-3" /> Regenerate
      </button>
    </div>
  )
}

/* ── Adaptive Fuzzer ── */
const ANOMALY_STYLE = {
  'Timing Anomaly':      'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'Length Differential': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'Error Entropy':       'text-red-400 bg-red-500/10 border-red-500/30',
}

function FuzzResultRow({ item }) {
  const [open, setOpen] = useState(false)
  const payload     = item.payload             ?? item.Payload             ?? item.payloadSent ?? item.PayloadSent ?? '—'
  const baseMs      = item.baselineDurationMs  ?? item.BaselineDurationMs  ?? null
  const baseLen     = item.baselineBodyLen     ?? item.BaselineBodyLen     ?? null
  const anomMs      = item.anomalousDurationMs ?? item.AnomalousDurationMs ?? null
  const anomLen     = item.anomalousBodyLen    ?? item.AnomalousBodyLen    ?? null
  const anomalyType = item.anomalyType         ?? item.AnomalyType         ?? 'Anomaly'
  const aStyle      = ANOMALY_STYLE[anomalyType] ?? 'text-gray-400 bg-white/5 border-white/10'
  const ratio       = baseMs && anomMs ? Math.round((anomMs / baseMs) * 10) / 10 : null

  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${aStyle}`}>{anomalyType}</span>
        <code className="flex-1 text-xs font-mono text-gray-300 truncate">{payload}</code>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-3 pl-6 space-y-2 border-t border-white/5 pt-2">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-blue-400 mb-1">Baseline</p>
              <p className="text-gray-300">{baseMs != null ? `${baseMs}ms` : '—'} · {baseLen != null ? `${baseLen} bytes` : '—'}</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-red-400 mb-1">Anomalous</p>
              <p className="text-gray-300">{anomMs != null ? `${anomMs}ms` : '—'} · {anomLen != null ? `${anomLen} bytes` : '—'}</p>
            </div>
          </div>
          {baseMs != null && anomMs != null && (
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${Math.round((baseMs / Math.max(baseMs, anomMs)) * 100)}%` }} />
              </div>
              <span className="text-blue-400">{baseMs}ms</span>
              <span>→</span>
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-red-500/70 rounded-full" style={{ width: `${Math.round((anomMs / Math.max(baseMs, anomMs)) * 100)}%` }} />
              </div>
              <span className="text-red-400">{anomMs}ms</span>
              {ratio != null && <span className="text-gray-600">({ratio}× slower)</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function FuzzPanel({ scanUrl }) {
  const [state, setState]   = useState('idle')
  const [fuzzData, setFuzzData] = useState(null)
  const [err, setErr]       = useState(null)

  const runScan = async () => {
    setState('loading'); setErr(null)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/fuzz/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url: scanUrl }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setFuzzData(await res.json())
      setState('done')
    } catch (e) { setErr(e.message); setState('error') }
  }

  const _rawFuzz = fuzzData?.fuzzResults ?? fuzzData?.FuzzResults ?? fuzzData?.results ?? fuzzData?.Results
    ?? (Array.isArray(fuzzData) ? fuzzData : null)
  const results = Array.isArray(_rawFuzz) ? _rawFuzz : []

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="w-7 h-7 text-orange-400 animate-spin" />
        <p className="text-sm text-gray-400">Running adaptive fuzzer…</p>
      </div>
    )
  }

  if (state !== 'done') {
    return (
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6 text-center space-y-4">
        <Zap className="w-8 h-8 text-orange-400 mx-auto" />
        <p className="text-white font-semibold">Adaptive Fuzzer</p>
        <p className="text-xs text-gray-400 max-w-xs mx-auto">
          Send adaptive payloads and detect anomalies in response timing, body length, and error entropy.
        </p>
        <button onClick={runScan}
          className="inline-flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
          <Zap className="w-4 h-4" /> Run Fuzz Scan
        </button>
        {err && <p className="text-xs text-red-400">{err}</p>}
      </div>
    )
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-400" />
          <p className="text-sm font-semibold text-white">Fuzz Results</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{results.length} anomal{results.length !== 1 ? 'ies' : 'y'} detected</span>
          <button onClick={runScan} className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold transition-colors">Re-run</button>
        </div>
      </div>
      {results.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-white font-semibold">No anomalies detected</p>
          <p className="text-xs text-gray-500 mt-1">All fuzz payloads returned baseline-consistent responses.</p>
        </div>
      ) : (
        results.map((item, i) => <FuzzResultRow key={i} item={item} />)
      )}
    </div>
  )
}

function FindingCard({ item }) {
  const [open, setOpen] = useState(false)

  const passed          = item.passed === true || (item.status?.toLowerCase() === 'passed') || (item.status?.toLowerCase() === 'pass')
  const checkName       = item.checkName       || item.name           || item.header         || 'Unknown check'
  const severity        = item.severity        || item.Severity       || ''
  const findingType     = item.findingType     || item.FindingType    || null
  const remediationId   = item.remediationId   || item.RemediationId  || ''
  const findingId       = item.findingId       || item.FindingId      || item.id             || item.Id || null
  const evidence        = item.evidence        || item.Evidence       || null
  const technicalDetails = item.technicalDetails || item.TechnicalDetails || item.details     || null
  const whyItMatters    = item.whyItMatters     || item.WhyItMatters  || item.impact          || item.riskDescription || null
  const whatCanGoWrong  = item.whatCanGoWrong   || item.WhatCanGoWrong || item.consequence    || item.ifNotFixed      || null
  const businessImpact  = item.businessImpact   || item.BusinessImpact || null
  const attackScenario  = item.attackScenario   || item.AttackScenario || null
  const fixSteps        = item.fixSteps         || item.FixSteps      || item.recommendation  || item.remediation     || null
  const riskScore       = item.riskScore        || item.RiskScore     || null
  const evidenceDetail  = item.evidenceDetail   || item.EvidenceDetail || null
  const isKev           = item.isKev            ?? item.IsKev         ?? false
  const epssScore       = item.epssScore        ?? item.EpssScore     ?? null
  const kevDueDate      = item.kevDueDate       ?? item.KevDueDate    ?? null
  const confidenceScore = item.confidenceScore ?? item.ConfidenceScore ?? null
  const slaDueDate      = item.slaDueDate      ?? item.SlaDueDate      ?? null
  const slaStatus       = item.slaStatus       ?? item.SlaStatus       ?? null
  const slaDaysLeft     = item.slaDaysLeft     ?? item.SlaDaysLeft     ?? null
  const findingStatus   = item.findingStatus   ?? item.FindingStatus   ?? null
  const lifecycleStage    = item.lifecycleStage    ?? item.LifecycleStage    ?? null
  const lifecycleAssigneeId   = item.assigneeId    ?? item.AssigneeId        ?? null
  const lifecycleAssigneeName = item.assigneeName  ?? item.AssigneeName      ?? null
  const exploitProof          = item.exploitProof  ?? item.ExploitProof  ?? item.proof ?? item.Proof ?? null

  const c = sevTheme(severity)
  const hasDetail = technicalDetails || whyItMatters || whatCanGoWrong || businessImpact || attackScenario || fixSteps || evidenceDetail || isKev || !!findingId || !!exploitProof

  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} mb-2 overflow-hidden transition-all`}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="shrink-0">
          {passed
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <XCircle className="w-4 h-4 text-red-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-white">{checkName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {isKev && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-red-600/25 text-red-300 border-red-500/60 shrink-0 whitespace-nowrap animate-pulse">
              ⚠ ACTIVELY EXPLOITED
            </span>
          )}
          {findingType === 'Confirmed' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-red-500/15 text-red-400 border-red-500/30 shrink-0">
              Confirmed Issue
            </span>
          )}
          {findingType === 'Potential' && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-orange-500/15 text-orange-400 border-orange-500/30 shrink-0">
              Attack Surface
            </span>
          )}
          {severity && (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${c.badge}`}>
              {severity}
            </span>
          )}
          {epssScore != null && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 whitespace-nowrap ${
              epssScore >= 0.5 ? 'bg-red-500/15 text-red-400 border-red-500/30'
              : epssScore >= 0.1 ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
              : 'bg-gray-500/15 text-gray-400 border-gray-500/30'
            }`}>
              EPSS {(epssScore * 100).toFixed(1)}%
            </span>
          )}
          {riskScore != null && (
            <span className={`text-xs font-bold ${c.text}`}>{riskScore}/10</span>
          )}
          <ConfidenceChip score={confidenceScore} />
          <SlaBadge severity={severity} slaDueDate={slaDueDate} slaStatus={slaStatus} slaDaysLeft={slaDaysLeft} />
          {!passed && remediationId && (
            <Link
              to={`/remediation?check=${encodeURIComponent(remediationId)}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-[10px] font-semibold text-crimson-400 hover:text-crimson-300 border border-crimson-500/30 bg-crimson-500/8 hover:bg-crimson-500/15 px-2 py-1 rounded-lg transition-colors whitespace-nowrap"
            >
              View Fix <ArrowRight className="w-3 h-3" />
            </Link>
          )}
          {hasDetail && (
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
          )}
        </div>
      </button>

      {/* Expanded detail panel */}
      {open && hasDetail && (
        <div className="px-4 pb-4 pt-3 border-t border-white/10 space-y-3">

          <LifecycleTracker
            findingId={findingId}
            initialStage={lifecycleStage}
            initialAssigneeId={lifecycleAssigneeId}
            initialAssigneeName={lifecycleAssigneeName}
          />

          {isKev && (
            <div className="bg-red-950/60 border border-red-700/50 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-1">🚨 CISA Known Exploited Vulnerability (KEV)</p>
              <p className="text-xs text-gray-300 leading-relaxed">
                This vulnerability is actively exploited in the wild and listed on the CISA KEV catalog.
              </p>
              {kevDueDate && (
                <p className="text-xs text-red-300 font-bold mt-1.5">
                  Patch due: {new Date(kevDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          )}

          {technicalDetails && (
            <div className="bg-black/30 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">🔍 What Was Found</p>
              <p className={`text-xs font-mono leading-relaxed ${c.text}`}>{technicalDetails}</p>
            </div>
          )}

          {whyItMatters && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">
                ⚠️ Why This Is {severity || 'a'} Severity
              </p>
              <p className="text-sm text-gray-200 leading-relaxed">{whyItMatters}</p>
            </div>
          )}

          {whatCanGoWrong && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">💥 What Happens If Not Fixed</p>
              <p className="text-sm text-gray-200 leading-relaxed">{whatCanGoWrong}</p>
            </div>
          )}

          {businessImpact && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">🏢 Business Impact</p>
              <p className="text-sm text-gray-200 leading-relaxed">{businessImpact}</p>
            </div>
          )}

          {attackScenario && (
            <div className="bg-red-950/40 border border-red-800/40 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide mb-2">🎯 Real Attack Scenario</p>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{attackScenario}</p>
            </div>
          )}

          {fixSteps && (
            <div className="bg-green-950/40 border border-green-800/40 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-wide mb-2">🛠 How To Fix — Step By Step</p>
              {Array.isArray(fixSteps) ? (
                <ol className="space-y-1.5 list-none">
                  {fixSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{fixSteps}</p>
              )}
            </div>
          )}

          {exploitProof && <ProofPanel proof={exploitProof} />}

          {riskScore != null && <RiskGauge score={riskScore} />}

          {!passed && evidence && <EvidencePanel evidence={evidence} />}
          {!passed && evidenceDetail && <EvidenceDetailBlock evidenceDetail={evidenceDetail} />}

          {!passed && (
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
              <FindingStatusDropdown findingId={findingId} currentStatus={findingStatus} />
              <AiFixButton findingId={findingId} checkName={checkName} severity={severity} technicalDetails={technicalDetails} />
              <JiraTicketButton
                findingId={findingId}
                checkName={checkName}
                severity={severity}
                recommendation={Array.isArray(fixSteps) ? fixSteps.join(' ') : (fixSteps ?? '')}
              />
            </div>
          )}

        </div>
      )}
    </div>
  )
}

function EvidenceDetailBlock({ evidenceDetail }) {
  const req  = evidenceDetail?.request  ?? evidenceDetail?.Request  ?? null
  const resp = evidenceDetail?.response ?? evidenceDetail?.Response ?? null
  const note = evidenceDetail?.note     ?? evidenceDetail?.Note     ?? evidenceDetail?.description ?? null
  return (
    <div className="mt-2 border border-white/10 rounded-lg overflow-hidden text-xs">
      <div className="px-3 py-1.5 bg-white/5 border-b border-white/10">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HTTP Evidence</span>
      </div>
      {note && <p className="px-3 py-2 text-gray-400 leading-relaxed">{note}</p>}
      {req && (
        <div className="px-3 py-2.5 border-b border-white/10">
          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1.5">Request</p>
          <div className="font-mono space-y-0.5">
            <p className="text-white font-bold">{req.method ?? req.Method ?? 'GET'} {req.url ?? req.Url ?? req.path ?? req.Path ?? ''} HTTP/1.1</p>
            {Object.entries(req.headers ?? req.Headers ?? {}).slice(0, 8).map(([k, v]) => (
              <p key={k} className="text-gray-500"><span className="text-gray-400">{k}:</span> {String(v)}</p>
            ))}
            {(req.body ?? req.Body) && (
              <pre className="mt-2 text-gray-300 bg-black/30 rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap break-all">{req.body ?? req.Body}</pre>
            )}
          </div>
        </div>
      )}
      {resp && (
        <div className="px-3 py-2.5">
          <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1.5">Response</p>
          <div className="font-mono space-y-0.5">
            <p className={`font-bold ${Number(resp.status ?? resp.Status ?? 200) < 400 ? 'text-green-400' : 'text-red-400'}`}>
              HTTP/1.1 {resp.status ?? resp.Status ?? ''} {resp.statusText ?? resp.StatusText ?? ''}
            </p>
            {Object.entries(resp.headers ?? resp.Headers ?? {}).slice(0, 8).map(([k, v]) => (
              <p key={k} className="text-gray-500"><span className="text-gray-400">{k}:</span> {String(v)}</p>
            ))}
            {(resp.body ?? resp.Body) && (
              <pre className="mt-2 text-gray-300 bg-black/30 rounded px-2 py-1.5 overflow-x-auto whitespace-pre-wrap break-all">{resp.body ?? resp.Body}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Attack Path panel ── */
function AttackPathCard({ path }) {
  const [expanded, setExpanded] = useState(false)
  const title    = path.title    ?? path.Title    ?? 'Attack Chain'
  const score    = path.combinedRiskScore ?? path.CombinedRiskScore ?? null
  const severity = path.severity ?? path.Severity ?? 'High'
  const steps    = path.steps    ?? path.Steps    ?? []
  const narrative = path.attackNarrative ?? path.AttackNarrative ?? null
  const c = sevTheme(severity)

  return (
    <div className={`rounded-2xl border ${c.border} ${c.bg} overflow-hidden`}>
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${c.badge}`}>{severity}</span>
            {score != null && <span className={`text-xs font-bold ${c.text}`}>Risk {score}/10</span>}
          </div>
          <h3 className="text-sm font-bold text-white leading-snug">{title}</h3>
          {steps.length > 0 && (
            <p className="text-[10px] text-gray-500 mt-1 truncate">
              {steps.map(s => s.vulnerability ?? s.Vulnerability ?? String(s)).join(' → ')}
            </p>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-white/10 pt-4 space-y-4">
          {/* Steps timeline */}
          {steps.length > 0 && (
            <div className="space-y-0">
              {steps.map((step, i) => {
                const vuln = step.vulnerability ?? step.Vulnerability ?? String(step)
                const desc = step.description  ?? step.Description  ?? null
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0 mt-0.5">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 ${
                        i === 0
                          ? 'border-gray-400 bg-gray-600'
                          : i === steps.length - 1
                            ? `${c.text} border-current`
                            : 'border-gray-500 bg-gray-700'
                      }`} />
                      {i < steps.length - 1 && <div className="w-px h-4 bg-white/10 my-0.5" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold ${i === steps.length - 1 ? c.text : 'text-white'}`}>{vuln}</p>
                        {i < steps.length - 1 && <ArrowRight className={`w-3 h-3 shrink-0 ${c.text} opacity-40`} />}
                      </div>
                      {desc && <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">{desc}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {narrative && (
            <div className="bg-black/20 rounded-lg px-4 py-3 border border-white/8">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Attack Story</p>
              <p className="text-xs text-gray-300 leading-relaxed">{narrative}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AttackPathSection({ attackPaths }) {
  if (!attackPaths?.length) return null
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold text-white">⛓ Attack Paths</h2>
        <span className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
          {attackPaths.length} chain{attackPaths.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="space-y-3">
        {attackPaths.map((path, i) => <AttackPathCard key={i} path={path} />)}
      </div>
    </div>
  )
}

function RemediationPlanPanel({ scanUrl, result }) {
  const [planData, setPlanData] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [planError, setPlanError] = useState(null)

  const handleGetPlan = async () => {
    setPlanLoading(true)
    setPlanError(null)
    try {
      const res = await fetch(`${BACKEND}/api/scan/remediation-plan`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ url: scanUrl }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setPlanData(json)
      setPlanOpen(true)
    } catch (err) {
      setPlanError(err.message || 'Failed to fetch remediation plan')
    }
    setPlanLoading(false)
  }

  const getEffortLabel = (finding) => {
    if (finding.effort) return finding.effort
    const score = finding.priorityScore ?? 0
    if (score >= 8) return 'Fix Now'
    if (score >= 5) return 'Fix Soon'
    return 'Fix Later'
  }

  const effortStyle = (label) => {
    if (label === 'Fix Now')  return 'bg-red-600/20 text-red-300 border-red-500/40'
    if (label === 'Fix Soon') return 'bg-orange-500/20 text-orange-300 border-orange-500/40'
    return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
  }

  const rawFindings = Array.isArray(planData)
    ? planData
    : (planData?.findings ?? planData?.items ?? planData?.plan ?? [])

  const findings = [...(Array.isArray(rawFindings) ? rawFindings : [])]
    .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))

  return (
    <div className="mt-4">
      <button
        onClick={handleGetPlan}
        disabled={planLoading}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/15 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        {planLoading
          ? <><span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Generating Plan…</>
          : <>📋 Get Remediation Plan</>}
      </button>

      {planError && (
        <div className="flex items-start gap-2 mt-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-3 py-2.5 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{planError}</span>
        </div>
      )}

      {planData && planOpen && (
        <div className="mt-3 bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white">Remediation Plan</p>
            <button
              onClick={() => setPlanOpen(false)}
              className="text-gray-500 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Findings list */}
          <div className="divide-y divide-white/5">
            {findings.length === 0 && (
              <p className="text-gray-500 text-sm py-8 text-center">No findings to remediate.</p>
            )}
            {findings.map((finding, i) => {
              const effortLabel = getEffortLabel(finding)
              const c = sevTheme(finding.severity ?? '')
              return (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {/* Effort badge */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${effortStyle(effortLabel)}`}>
                      {effortLabel}
                    </span>
                    {/* Severity badge */}
                    {finding.severity && (
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${c.badge}`}>
                        {finding.severity}
                      </span>
                    )}
                    {/* Check name */}
                    <span className="text-sm font-semibold text-white flex-1 min-w-0 truncate">
                      {finding.checkName ?? 'Unknown'}
                    </span>
                    {/* Priority score */}
                    <span className={`text-xs font-bold shrink-0 ${c.text}`}>
                      {finding.priorityScore ?? '—'}/10
                    </span>
                  </div>
                  {finding.recommendation && (
                    <p className="text-xs text-gray-400 leading-relaxed mt-1">{finding.recommendation}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ReportPanel({ scanUrl, scanResult }) {
  const [reportEmail, setReportEmail] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [htmlExporting, setHtmlExporting] = useState(false)
  const [pentestDownloading, setPentestDownloading] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState(null)

  const handlePentestReport = async () => {
    setPentestDownloading(true); setError(null)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/reports/pentest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url: scanUrl }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `pentest-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objUrl)
    } catch (err) { setError(err.message) }
    setPentestDownloading(false)
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const blob = await downloadReportPdf({ url: scanUrl })
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `udyo360-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objUrl)
    } catch (err) {
      setError(err.message)
    }
    setDownloading(false)
  }

  const handleHtmlReport = async () => {
    setHtmlExporting(true); setError(null)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/reports/html?url=${encodeURIComponent(scanUrl)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const blobUrl = URL.createObjectURL(blob)
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (!win) throw new Error('Popup blocked — please allow popups for this site')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (err) { setError(err.message) }
    setHtmlExporting(false)
  }

  const handleSendEmail = async () => {
    if (!reportEmail.trim()) return
    setSending(true)
    setError(null)
    setEmailSent(false)
    try {
      await emailReport({ url: scanUrl, email: reportEmail.trim() })
      setEmailSent(true)
    } catch (err) {
      setError(err.message)
    }
    setSending(false)
  }

  return (
    <div className="mt-6 bg-white/3 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-crimson-400" />
        <h2 className="text-sm font-semibold text-white">Scan Report</h2>
      </div>
      <p className="text-xs text-gray-400 mb-5">
        Download a full PDF report with vulnerability explanations, risk impact analysis, and remediation steps.
        Optionally send it straight to an inbox.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="email"
          value={reportEmail}
          onChange={(e) => setReportEmail(e.target.value)}
          placeholder="Recipient email (optional)"
          className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
        />
        <button
          onClick={handleSendEmail}
          disabled={sending || !reportEmail.trim()}
          className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 disabled:opacity-40 border border-white/15 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : 'Send to Email'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Generating PDF…' : 'Download PDF Report'}
        </button>
        <button
          onClick={handleHtmlReport}
          disabled={htmlExporting}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {htmlExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          {htmlExporting ? 'Building report…' : 'Export HTML Report'}
        </button>
        <button
          onClick={handlePentestReport}
          disabled={pentestDownloading}
          className="flex items-center gap-2 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 disabled:opacity-50 text-violet-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {pentestDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {pentestDownloading ? 'Generating…' : 'Download Pentest Report'}
        </button>
      </div>

      {emailSent && (
        <div className="flex items-center gap-2 mt-3 text-green-400 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Report sent to <span className="font-semibold">{reportEmail}</span>
        </div>
      )}
      {error && <ApiErrorBanner error={error} className="mt-3" />}
    </div>
  )
}

/* ── Score breakdown panel ── */
function ScoreBreakdownPanel({ bkd }) {
  const [open, setOpen] = useState(false)

  if (!bkd) return null

  const criticalPenalty = bkd.criticalPenalty ?? bkd.CriticalPenalty ?? 0
  const highPenalty     = bkd.highPenalty     ?? bkd.HighPenalty     ?? 0
  const mediumPenalty   = bkd.mediumPenalty   ?? bkd.MediumPenalty   ?? 0
  const lowPenalty      = bkd.lowPenalty      ?? bkd.LowPenalty      ?? 0

  if (!criticalPenalty && !highPenalty && !mediumPenalty && !lowPenalty) return null

  const criticalCount = bkd.criticalCount ?? bkd.CriticalCount ?? 0
  const highCount     = bkd.highCount     ?? bkd.HighCount     ?? 0
  const mediumCount   = bkd.mediumCount   ?? bkd.MediumCount   ?? 0
  const lowCount      = bkd.lowCount      ?? bkd.LowCount      ?? 0
  const totalPenalty  = bkd.totalPenalty  ?? bkd.TotalPenalty  ?? (criticalPenalty + highPenalty + mediumPenalty + lowPenalty)

  const rows = [
    { label: 'Critical', count: criticalCount, penaltyEach: criticalCount > 0 ? Math.round(criticalPenalty / criticalCount) : 0, total: criticalPenalty, theme: SEV_THEME.Critical },
    { label: 'High',     count: highCount,     penaltyEach: highCount     > 0 ? Math.round(highPenalty     / highCount)     : 0, total: highPenalty,     theme: SEV_THEME.High     },
    { label: 'Medium',   count: mediumCount,   penaltyEach: mediumCount   > 0 ? Math.round(mediumPenalty   / mediumCount)   : 0, total: mediumPenalty,   theme: SEV_THEME.Medium   },
    { label: 'Low',      count: lowCount,      penaltyEach: lowCount      > 0 ? Math.round(lowPenalty      / lowCount)      : 0, total: lowPenalty,      theme: SEV_THEME.Low      },
  ].filter((r) => r.count > 0)

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl mb-4 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <span className="text-xs font-semibold text-gray-400">Score breakdown</span>
        <span className="text-gray-500 text-xs">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 pb-4 pt-3">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="text-left pb-2">Severity</th>
                <th className="text-center pb-2">Count</th>
                <th className="text-center pb-2">Penalty / finding</th>
                <th className="text-right pb-2">Total deduction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map(({ label, count, penaltyEach, total, theme }) => (
                <tr key={label}>
                  <td className="py-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${theme.badge}`}>
                      {label}
                    </span>
                  </td>
                  <td className="py-2 text-center text-gray-300 font-semibold">{count}</td>
                  <td className="py-2 text-center text-gray-400">{penaltyEach > 0 ? `-${penaltyEach}` : '—'}</td>
                  <td className={`py-2 text-right font-bold ${theme.text}`}>-{total}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/15">
                <td colSpan={3} className="pt-2.5 text-xs font-semibold text-gray-400">Total Penalty</td>
                <td className="pt-2.5 text-right text-sm font-extrabold text-white">-{totalPenalty}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

export default function ProductPage() {
  const { type } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const product = PRODUCTS[type]

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [trend, setTrend] = useState([])
  const [scheduling, setScheduling] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [scanMode, setScanMode] = useState('standard')
  const [authType, setAuthType] = useState('none')
  const [authForm, setAuthForm] = useState({ loginUrl: '', usernameField: 'email', passwordField: 'password', username: '', password: '', bearerToken: '', cookieName: '', cookieValue: '' })
  const setAuth = (k) => (e) => setAuthForm((f) => ({ ...f, [k]: e.target.value }))
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [crawlerEnabled, setCrawlerEnabled] = useState(false)
  const [crawlDepth, setCrawlDepth] = useState('2')
  const [maxPages, setMaxPages] = useState('25')
  const [resultsView, setResultsView] = useState('groups')

  if (!product) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Unknown product</p>
          <Link to="/dashboard" className="text-crimson-400 hover:text-crimson-300 text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    setTrend([])
    setScheduled(false)
    setResultsView('groups')
    try {
      let data
      const base = { url: url.trim(), mode: scanMode }
      if (type === 'web' && crawlerEnabled) {
        const authConfig = authType !== 'none' ? { authType, ...authForm } : undefined
        data = await startCrawlScan({ url: url.trim(), depth: Number(crawlDepth), maxPages: Number(maxPages), ...(authConfig ? { authConfig } : {}) })
      } else if (type === 'web' && authType === 'formlogin') {
        data = await startAuthenticatedScan({
          url: url.trim(),
          loginUrl: authForm.loginUrl.trim() || undefined,
          username: authForm.username,
          password: authForm.password,
        })
      } else if (type === 'web' && authType === 'bearer') {
        const res = await axios.post(`${API}/api${product.endpoint}`, { ...base, authType: 'bearer', bearerToken: authForm.bearerToken })
        data = res.data
      } else if (type === 'web' && authType === 'basic') {
        const res = await axios.post(`${API}/api${product.endpoint}`, { ...base, authType: 'basic', username: authForm.username, password: authForm.password })
        data = res.data
      } else if (type === 'web' && authType === 'cookie') {
        const res = await axios.post(`${API}/api${product.endpoint}`, { ...base, authType: 'cookie', cookieName: authForm.cookieName, cookieValue: authForm.cookieValue })
        data = res.data
      } else {
        const res = await axios.post(`${API}/api${product.endpoint}`, base)
        data = res.data
      }
      setResult(data)
      fetch(`${BACKEND}/api/scan/trend?url=${encodeURIComponent(url.trim())}`, { headers: authHeaders() })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setTrend(Array.isArray(d) ? d : d?.scores ?? d?.trend ?? d?.data ?? []) })
        .catch(() => {})
    } catch (err) {
      const body = err.response?.data
      const msg  = body?.error || body?.message || err.message || 'Scan failed. Check the URL and try again.'
      const rich = new Error(msg)
      if (body?.howToFix)       rich.howToFix       = body.howToFix
      if (body?.azureErrorCode) rich.azureErrorCode  = body.azureErrorCode
      if (body?.details)        rich.details         = body.details
      setError(rich)
    }
    setLoading(false)
  }

  const handleSchedule = async () => {
    setScheduling(true)
    try {
      await createSchedule({ targetUrl: url.trim(), intervalHours: 24, enabled: true })
      setScheduled(true)
    } catch { /* silently ignore — non-critical */ }
    setScheduling(false)
  }

  const _rawResults = result?.results ?? result?.checks ?? result?.findings
  const results = Array.isArray(_rawResults) ? _rawResults : []
  // Use API's pre-computed fields; fall back to case-insensitive filter
  const passed = result?.passedChecks ?? result?.PassedChecks
    ?? results.filter((r) => (r.passed === true) || (r.status?.toLowerCase() === 'passed') || (r.status?.toLowerCase() === 'pass')).length
  const failed = result?.failedChecks ?? result?.FailedChecks
    ?? results.filter((r) => (r.passed === false) || ((r.status?.toLowerCase() === 'failed') || (r.status?.toLowerCase() === 'fail'))).length
  const total  = result?.totalChecks  ?? result?.TotalChecks  ?? results.length

  const hosting    = result?.hostingPlatform   ?? result?.HostingPlatform   ?? null
  const confidence = result?.hostingConfidence ?? result?.HostingConfidence ?? null
  const edge       = result?.edgePlatform      ?? result?.EdgePlatform      ?? null
  const serverHdr  = result?.rawServerHeader   ?? result?.RawServerHeader   ?? null

  const infraProfile = result?.infrastructureProfile ?? result?.InfrastructureProfile ?? null
  const wafDetected  = result?.wafDetected ?? result?.WafDetected ?? null
  const wafVendor    = result?.wafVendor   ?? result?.WafVendor   ?? null

  const scoreDelta = result?.scoreDelta ?? result?.ScoreDelta
    ?? (result?.previousScore != null && result?.securityScore != null
        ? result.securityScore - result.previousScore : null)
  const deltaUp = scoreDelta != null && scoreDelta >= 0

  const topIssues      = result?.topIssues      ?? result?.TopIssues      ?? null
  const findingGroups  = result?.findingGroups  ?? result?.FindingGroups  ?? null
  const confirmedCount = result?.confirmedCount  ?? result?.ConfirmedCount
    ?? result?.summary?.confirmedCount ?? result?.Summary?.ConfirmedCount ?? null
  const potentialCount = result?.potentialCount  ?? result?.PotentialCount
    ?? result?.summary?.potentialCount ?? result?.Summary?.PotentialCount ?? null
  const scoreReason    = result?.scoreBreakdown?.reason   ?? result?.ScoreBreakdown?.Reason
    ?? result?.scoreBreakdown?.Reason  ?? result?.ScoreBreakdown?.reason  ?? null
  const bkd = result?.scoreBreakdown ?? result?.ScoreBreakdown ?? null
  const urgentGroups   = (findingGroups ?? []).filter((g) => {
    const s = (g.severity ?? g.Severity ?? '').toLowerCase()
    return s === 'critical' || s === 'high'
  }).length
  const displayResults = resultsView === 'top' && topIssues ? topIssues : results
  const attackPaths    = result?.attackPaths   ?? result?.AttackPaths   ?? null
  const hasGroups      = findingGroups && findingGroups.length > 0

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-24 pb-12">
        {/* Page title */}
        <div className="mb-8">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${product.badge}`}>
            Security Tool
          </span>
          <h1 className="text-3xl font-extrabold text-white mb-2">{product.title}</h1>
          <p className="text-gray-400">{product.subtitle}</p>
        </div>

        {/* Scan form */}
        <form onSubmit={handleScan} className="space-y-4 mb-8">
          {/* Scan Mode */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {[
              { value: 'discovery', label: 'Discovery', desc: 'Fast · low-noise' },
              { value: 'standard',  label: 'Standard',  desc: 'Balanced depth' },
              { value: 'deep',      label: 'Deep',       desc: 'Thorough · slow' },
            ].map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => setScanMode(value)}
                className={`flex-1 flex flex-col items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  scanMode === value ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {label}
                <span className={`text-[10px] font-normal mt-0.5 ${scanMode === value ? 'text-crimson-200' : 'text-gray-600'}`}>{desc}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-app.com"
              required
              className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-sm outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors shrink-0"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
                : <><ScanLine className="w-4 h-4" /> {authType !== 'none' ? 'Run Authenticated Scan' : 'Run Scan'}</>}
            </button>
          </div>

          {/* Authentication section — web scanner */}
          {type === 'web' && (
            <div>
              <button
                type="button"
                onClick={() => setAuthType(at => at === 'formlogin' ? 'none' : 'formlogin')}
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                <Lock className={`w-3.5 h-3.5 transition-transform ${authType === 'formlogin' ? 'text-crimson-400' : ''}`} />
                Authentication
                {authType === 'formlogin' && (
                  <span className="ml-1 text-[10px] bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 px-1.5 py-0.5 rounded font-bold">Active</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${authType === 'formlogin' ? 'rotate-180' : ''}`} />
              </button>

              {authType === 'formlogin' && (
                <div className="mt-3 bg-white/3 border border-crimson-500/20 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-2 text-[10px] text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
                    <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                    Credentials are sent directly to your target site only. WebShield never stores or logs them.
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Login URL <span className="text-gray-600 normal-case font-normal">(leave blank to auto-detect)</span>
                    </label>
                    <input value={authForm.loginUrl} onChange={setAuth('loginUrl')}
                      placeholder={`${url || 'https://example.com'}/login`}
                      className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Username field <span className="text-gray-600 normal-case font-normal">(HTML name)</span>
                      </label>
                      <input value={authForm.usernameField} onChange={setAuth('usernameField')} placeholder="email"
                        className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                        Password field <span className="text-gray-600 normal-case font-normal">(HTML name)</span>
                      </label>
                      <input value={authForm.passwordField} onChange={setAuth('passwordField')} placeholder="password"
                        className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Your username</label>
                      <input value={authForm.username} onChange={setAuth('username')} placeholder="user@example.com" autoComplete="off"
                        className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Your password</label>
                      <input type="password" value={authForm.password} onChange={setAuth('password')} placeholder="••••••••" autoComplete="new-password"
                        className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Advanced Options — web scanner only */}
          {type === 'web' && (
            <div>
              <button
                type="button"
                onClick={() => setAdvancedOpen((v) => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                Advanced Options
                {(authType !== 'none' || crawlerEnabled) && (
                  <span className="ml-1 text-[10px] bg-crimson-500/20 text-crimson-400 border border-crimson-500/30 px-1.5 py-0.5 rounded font-bold">Active</span>
                )}
              </button>

              {advancedOpen && (
                <div className="mt-3 bg-white/3 border border-white/15 rounded-2xl p-5 space-y-5">

                  {/* Authenticated Scan section */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> Authenticated Scan
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <label className="text-xs text-gray-400">Auth type:</label>
                      <select
                        value={authType}
                        onChange={(e) => setAuthType(e.target.value)}
                        className="bg-white/5 border border-white/15 focus:border-crimson-500 text-white text-xs px-3 py-1.5 rounded-lg outline-none transition-colors"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="none"      className="bg-[#0d1f3c]">None</option>
                        <option value="basic"     className="bg-[#0d1f3c]">Basic Auth</option>
                        <option value="bearer"    className="bg-[#0d1f3c]">Bearer Token</option>
                        <option value="cookie"    className="bg-[#0d1f3c]">Cookie</option>
                        <option value="formlogin" className="bg-[#0d1f3c]">Form Login</option>
                      </select>
                    </div>

                    {authType !== 'none' && (
                      <div className="space-y-3">
                        {authType === 'bearer' && (
                          <div>
                            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Bearer Token</label>
                            <input value={authForm.bearerToken} onChange={setAuth('bearerToken')} placeholder="eyJhbGciOiJIUzI1NiJ9…"
                              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono" />
                          </div>
                        )}
                        {authType === 'basic' && (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Username</label>
                              <input value={authForm.username} onChange={setAuth('username')} placeholder="admin" autoComplete="off"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
                              <input type="password" value={authForm.password} onChange={setAuth('password')} placeholder="••••••••" autoComplete="new-password"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                            </div>
                          </div>
                        )}
                        {authType === 'cookie' && (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Cookie Name</label>
                              <input value={authForm.cookieName} onChange={setAuth('cookieName')} placeholder="session"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Cookie Value</label>
                              <input value={authForm.cookieValue} onChange={setAuth('cookieValue')} placeholder="abc123…"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono" />
                            </div>
                          </div>
                        )}
                        {authType === 'formlogin' && (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Login URL <span className="text-gray-600 normal-case font-normal">(leave blank to auto-detect)</span></label>
                              <input value={authForm.loginUrl} onChange={setAuth('loginUrl')} placeholder={`${url || 'https://example.com'}/login`}
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Username field <span className="text-gray-600 normal-case font-normal">(HTML name attr)</span></label>
                              <input value={authForm.usernameField} onChange={setAuth('usernameField')} placeholder="email"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Password field <span className="text-gray-600 normal-case font-normal">(HTML name attr)</span></label>
                              <input value={authForm.passwordField} onChange={setAuth('passwordField')} placeholder="password"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Your username</label>
                              <input value={authForm.username} onChange={setAuth('username')} placeholder="user@example.com" autoComplete="off"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Your password</label>
                              <input type="password" value={authForm.password} onChange={setAuth('password')} placeholder="••••••••" autoComplete="new-password"
                                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                            </div>
                          </div>
                        )}
                        {(authType === 'basic' || authType === 'formlogin') && (
                          <p className="text-[10px] text-gray-600 flex items-start gap-1.5 pt-1">
                            <span className="text-amber-500 shrink-0">⚠</span>
                            Credentials are sent directly to your target site only. WebShield never stores or logs them.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Crawl Settings section */}
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Crawl Settings
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setCrawlerEnabled((v) => !v)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                          crawlerEnabled ? 'bg-crimson-500' : 'bg-white/15'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${crawlerEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                      <span className="text-xs text-gray-300">Enable Crawler</span>
                      {crawlerEnabled && (
                        <span className="text-[10px] text-crimson-400 font-semibold">— will crawl site pages before scanning</span>
                      )}
                    </div>

                    {crawlerEnabled && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Crawl Depth</label>
                          <select
                            value={crawlDepth}
                            onChange={(e) => setCrawlDepth(e.target.value)}
                            className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white text-sm px-3 py-2 rounded-xl outline-none transition-colors"
                            style={{ colorScheme: 'dark' }}
                          >
                            <option value="1" className="bg-[#0d1f3c]">1 — Shallow</option>
                            <option value="2" className="bg-[#0d1f3c]">2 — Standard</option>
                            <option value="3" className="bg-[#0d1f3c]">3 — Deep</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Max Pages</label>
                          <select
                            value={maxPages}
                            onChange={(e) => setMaxPages(e.target.value)}
                            className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white text-sm px-3 py-2 rounded-xl outline-none transition-colors"
                            style={{ colorScheme: 'dark' }}
                          >
                            <option value="10"  className="bg-[#0d1f3c]">10 pages</option>
                            <option value="25"  className="bg-[#0d1f3c]">25 pages</option>
                            <option value="50"  className="bg-[#0d1f3c]">50 pages</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          )}
        </form>

        {/* Scan error */}
        {error && <ApiErrorBanner error={error} className="mb-6" />}

        {/* Results */}
        {result && (
          <>
            {/* Infrastructure card — first thing above results */}
            <InfrastructureCard profile={infraProfile} />

            {/* Hosting / edge / WAF banner */}
            {(hosting || edge || serverHdr || wafDetected != null || wafVendor) && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 bg-white/3 border border-white/10 rounded-2xl px-4 py-3 mb-4 text-sm">
                {hosting && (
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <span className="text-gray-500">🖥 Hosting:</span>
                    <span className="font-semibold text-white">{hosting}</span>
                    {confidence != null && <span className="text-xs text-gray-500">({confidence}% confidence)</span>}
                  </span>
                )}
                {edge && (
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <span className="text-gray-500">🛡 Edge:</span>
                    <span className="font-semibold text-white">{edge}</span>
                  </span>
                )}
                {(wafDetected != null || wafVendor) && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-gray-500">🔰 WAF:</span>
                    {wafVendor
                      ? <span className="font-semibold text-green-400">{wafVendor}</span>
                      : wafDetected
                        ? <span className="font-semibold text-green-400">Detected</span>
                        : <span className="font-semibold text-red-400">Not detected</span>}
                  </span>
                )}
                {serverHdr && (
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <span className="text-gray-500">Server:</span>
                    <code className="text-xs font-mono text-gray-400 bg-white/5 px-1.5 py-0.5 rounded">{serverHdr}</code>
                  </span>
                )}
              </div>
            )}

            {/* Authenticated scan login status banner */}
            {authType === 'formlogin' && result.loginSucceeded !== undefined && (
              <div className={`flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-4 text-sm font-semibold border ${
                result.loginSucceeded
                  ? 'bg-green-500/10 border-green-500/25 text-green-400'
                  : 'bg-red-500/10 border-red-500/25 text-red-400'
              }`}>
                {result.loginSucceeded
                  ? <><CheckCircle className="w-4 h-4 shrink-0" /> Login successful — {result.cookiesCaptured ?? (result.cookies?.length ?? '')} session {result.cookiesCaptured !== 1 ? 'cookies' : 'cookie'} captured</>
                  : <><XCircle className="w-4 h-4 shrink-0" /> Login failed — could not authenticate. Verify credentials and login URL.</>}
              </div>
            )}

            {/* Change alerts */}
            <ChangeAlerts result={result} />

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {/* Grade */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold text-white">{result.securityGrade ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">Grade</p>
              </div>

              {/* Score + delta + sparkline */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <p className="text-2xl font-extrabold text-white">
                    {result.securityScore != null ? `${result.securityScore}/100` : '—'}
                  </p>
                  {scoreDelta !== null && (
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${deltaUp ? 'text-green-400' : 'text-red-400'}`}>
                      {deltaUp
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {deltaUp ? '+' : ''}{scoreDelta}
                    </span>
                  )}
                </div>
                {trend.length >= 2 && <Sparkline points={trend} />}
                <p className="text-xs text-gray-400 mt-1">Score</p>
                {scoreReason && (
                  <p className="text-[10px] text-gray-500 mt-1 leading-snug" title={scoreReason}>{scoreReason}</p>
                )}
              </div>

              {/* Passed */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold text-green-400">{passed ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">Passed</p>
              </div>

              {/* Failed */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-2xl font-extrabold text-red-400">{failed ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">Failed</p>
              </div>
            </div>

            {/* Confirmed / Potential / Groups summary bar */}
            {(confirmedCount != null || potentialCount != null || urgentGroups > 0) && (
              <div className="flex flex-wrap gap-2 mb-4">
                {confirmedCount != null && (
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-3 py-2 text-xs font-semibold">
                    🔴 {confirmedCount} Confirmed Issue{confirmedCount !== 1 ? 's' : ''}
                  </div>
                )}
                {potentialCount != null && (
                  <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl px-3 py-2 text-xs font-semibold">
                    🟠 {potentialCount} Potential Risk{potentialCount !== 1 ? 's' : ''}
                  </div>
                )}
                {urgentGroups > 0 && (
                  <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl px-3 py-2 text-xs font-semibold">
                    📊 {urgentGroups} group{urgentGroups !== 1 ? 's' : ''} need immediate attention
                  </div>
                )}
              </div>
            )}

            {/* Score breakdown panel */}
            <ScoreBreakdownPanel bkd={bkd} />

            {/* Attack Path section */}
            <AttackPathSection attackPaths={attackPaths} />

            {/* Schedule scan button */}
            <div className="flex items-center justify-end mb-4">
              <button
                onClick={handleSchedule}
                disabled={scheduling || scheduled}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                  scheduled
                    ? 'bg-green-500/10 border-green-500/25 text-green-400 cursor-default'
                    : 'bg-white/5 border-white/15 text-gray-400 hover:text-white hover:border-white/30'
                } disabled:opacity-60`}
              >
                {scheduling
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scheduling…</>
                  : scheduled
                    ? <><CheckCircle className="w-3.5 h-3.5" /> Scanning every 24h</>
                    : <><Clock className="w-3.5 h-3.5" /> Scan every 24h</>}
              </button>
            </div>

            {/* Results — tabbed: Intelligence View | All Checks */}
            <div className="mb-2">
              {/* Tab bar */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-4 w-fit">
                {hasGroups && (
                  <button
                    onClick={() => setResultsView('groups')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      resultsView === 'groups' ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>⚡</span> Intelligence View
                  </button>
                )}
                {topIssues && (
                  <button
                    onClick={() => setResultsView('top')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      resultsView === 'top' ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Top Issues
                  </button>
                )}
                <button
                  onClick={() => setResultsView('all')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    resultsView === 'all' ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  View All Checks {results.length > 0 && <span className="opacity-60">({results.length})</span>}
                </button>
                <button
                  onClick={() => setResultsView('ai')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    resultsView === 'ai' ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" /> AI Analysis
                </button>
                <button
                  onClick={() => setResultsView('fuzz')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    resultsView === 'fuzz' ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-3 h-3" /> Fuzz Results
                </button>
              </div>

              {/* Intelligence View — finding groups */}
              {resultsView === 'groups' && hasGroups && (
                <div className="space-y-3">
                  {findingGroups.map((g, i) => <FindingGroupCard key={i} group={g} />)}
                </div>
              )}

              {/* Top Issues view */}
              {resultsView === 'top' && topIssues && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Top Issues</p>
                    <p className="text-xs text-gray-500">{topIssues.length} priority checks</p>
                  </div>
                  {topIssues.map((item, i) => <FindingCard key={i} item={item} />)}
                </div>
              )}

              {/* All Checks flat list */}
              {resultsView === 'all' && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">All Checks</p>
                    <p className="text-xs text-gray-500">{results.length} checks · click a row to see details</p>
                  </div>
                  {results.length === 0 && (
                    <p className="text-gray-500 text-sm py-10 text-center">No results returned.</p>
                  )}
                  {results.map((item, i) => <FindingCard key={i} item={item} />)}
                </div>
              )}

              {/* Fallback when no groups and no topIssues */}
              {!hasGroups && !topIssues && resultsView === 'groups' && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">Scan Results</p>
                    <p className="text-xs text-gray-500">{results.length} checks · click a row to see details</p>
                  </div>
                  {results.length === 0 && (
                    <p className="text-gray-500 text-sm py-10 text-center">No results returned.</p>
                  )}
                  {results.map((item, i) => <FindingCard key={i} item={item} />)}
                </div>
              )}

              {resultsView === 'ai' && (
                <AiNarrativePanel
                  scanId={result?.id ?? result?.Id ?? result?.scanId ?? result?.ScanId ?? null}
                  scanUrl={url}
                />
              )}

              {resultsView === 'fuzz' && <FuzzPanel scanUrl={url} />}
            </div>

            {/* Authenticated pages scanned */}
            {authType === 'formlogin' && (result.authenticatedPages ?? result.AuthenticatedPages)?.length > 0 && (
              <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-2">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-green-400" />
                  <p className="text-sm font-semibold text-white">Pages Scanned Behind Login</p>
                  <span className="ml-auto text-xs text-gray-500">{(result.authenticatedPages ?? result.AuthenticatedPages).length} pages</span>
                </div>
                <div className="px-4 py-3 space-y-1.5">
                  {(result.authenticatedPages ?? result.AuthenticatedPages).map((page, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-green-500/15 border border-green-500/30 text-green-400 px-1.5 py-0.5 rounded shrink-0">Authenticated</span>
                      <span className="text-xs font-mono text-gray-300 truncate">{page}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Authenticated-only findings */}
            {authType === 'formlogin' && (result.authenticatedFindings ?? result.AuthenticatedFindings)?.length > 0 && (
              <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-2">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-crimson-400" />
                  <p className="text-sm font-semibold text-white">Authenticated Findings</p>
                  <span className="ml-auto text-xs text-gray-500">issues found behind login</span>
                </div>
                <div className="px-2 py-2">
                  {(result.authenticatedFindings ?? result.AuthenticatedFindings).map((item, i) => (
                    <FindingCard key={i} item={{
                      checkName: item.checkName ?? item.CheckName ?? item.name ?? item.Name ?? 'Finding',
                      severity:  item.severity  ?? item.Severity  ?? 'Medium',
                      passed:    false,
                      technicalDetails: item.description ?? item.Description ?? item.detail ?? null,
                      evidence:  item.evidence  ?? item.Evidence  ?? null,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Crawled pages */}
            {(result.crawledPages ?? result.CrawledPages)?.length > 0 && (
              <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-2">
                <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-sm font-semibold text-white">Crawled Pages</p>
                  <span className="ml-auto text-xs text-gray-500">{(result.crawledPages ?? result.CrawledPages).length} pages discovered</span>
                </div>
                <div className="px-4 py-3 space-y-1 max-h-48 overflow-y-auto">
                  {(result.crawledPages ?? result.CrawledPages).map((page, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-xs font-mono text-gray-300 truncate">{page}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remediation plan panel */}
            <RemediationPlanPanel scanUrl={url} result={result} />

            {/* Report panel */}
            <ReportPanel scanUrl={url} scanResult={result} />
          </>
        )}
      </main>
    </div>
  )
}
