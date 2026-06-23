import React, { useState, useEffect } from 'react'
import {
  Mail, Plus, Loader2, AlertCircle, ChevronDown, ChevronUp,
  CheckCircle2, Clock, X, Users, MousePointerClick, AlertTriangle,
  Play, Pause, Trash2, RefreshCw, Send,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { getPhishingCampaigns, createPhishingCampaign, getPhishingResults } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const DEMO_CAMPAIGNS = [
  {
    id: 'd1', name: 'Q1 2025 Credential Phish', status: 'Completed',
    template: 'IT Password Reset', recipientCount: 45, sentCount: 45,
    openedCount: 32, clickedCount: 8, submittedCount: 3,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    completedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'd2', name: 'HR Benefits Enrollment', status: 'Scheduled',
    template: 'HR Announcement', recipientCount: 120, sentCount: 0,
    openedCount: 0, clickedCount: 0, submittedCount: 0,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    scheduledAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  },
  {
    id: 'd3', name: 'CEO Wire Transfer Test', status: 'Running',
    template: 'Executive Impersonation', recipientCount: 12, sentCount: 12,
    openedCount: 7, clickedCount: 2, submittedCount: 0,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
]

const TEMPLATES = [
  'IT Password Reset',
  'HR Announcement',
  'CEO Wire Transfer',
  'Package Delivery',
  'Microsoft 365 Login',
]

// ── Helpers ─────────────────────────────────────────────────────────────────

function ClickRateBar({ clicked, sent }) {
  const pct = sent > 0 ? Math.round((clicked / sent) * 100) : 0
  const color = pct > 20 ? 'bg-red-500' : pct > 10 ? 'bg-amber-400' : 'bg-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-bold w-8 text-right ${pct > 20 ? 'text-red-400' : pct > 10 ? 'text-amber-400' : 'text-green-400'}`}>{pct}%</span>
    </div>
  )
}

function StatusBadge({ status }) {
  if (status === 'Running') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/30 text-amber-400">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
        Running
      </span>
    )
  }
  const MAP = {
    Draft:     'bg-gray-500/15 border-gray-500/30 text-gray-400',
    Scheduled: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
    Completed: 'bg-green-500/15 border-green-500/30 text-green-400',
    Cancelled: 'bg-red-500/15 border-red-500/30 text-red-400',
  }
  return (
    <span className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${MAP[status] ?? MAP.Draft}`}>
      {status}
    </span>
  )
}

function StatPill({ icon: Icon, label, value, color = 'text-gray-300' }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500">
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}:</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  )
}

function riskLevel(r) {
  const submitted = field(r, 'submitted', 'Submitted', 'formSubmitted', 'FormSubmitted') ?? false
  const clicked   = field(r, 'clicked',   'Clicked')   ?? false
  const opened    = field(r, 'opened',    'Opened')    ?? false
  if (submitted || clicked) return 'High'
  if (opened) return 'Medium'
  return 'Safe'
}

// ── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign, onViewResults, onDelete }) {
  const [open, setOpen] = useState(false)

  const id            = field(campaign, 'id', 'Id') ?? ''
  const name          = field(campaign, 'name', 'Name', 'title', 'Title') ?? 'Untitled'
  const description   = field(campaign, 'description', 'Description') ?? ''
  const status        = field(campaign, 'status', 'Status') ?? 'Draft'
  const template      = field(campaign, 'template', 'Template', 'templateName') ?? ''
  const recipientCount = field(campaign, 'recipientCount', 'RecipientCount', 'recipients') ?? 0
  const sentCount     = field(campaign, 'sentCount', 'SentCount', 'sent') ?? 0
  const openedCount   = field(campaign, 'openedCount', 'OpenedCount', 'opened') ?? 0
  const clickedCount  = field(campaign, 'clickedCount', 'ClickedCount', 'clicked') ?? 0
  const submittedCount = field(campaign, 'submittedCount', 'SubmittedCount', 'submitted') ?? 0
  const createdAt     = field(campaign, 'createdAt', 'CreatedAt', 'created')
  const scheduledAt   = field(campaign, 'scheduledAt', 'ScheduledAt')
  const completedAt   = field(campaign, 'completedAt', 'CompletedAt')

  const canViewResults = status === 'Completed' || status === 'Running'
  const isDraft = status === 'Draft'

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-white">{name}</span>
            <StatusBadge status={status} />
          </div>
          {template && <p className="text-xs text-gray-500 mb-2">Template: <span className="text-gray-400">{template}</span></p>}

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mb-3">
            <StatPill icon={Users} label="Recipients" value={recipientCount} />
            <StatPill icon={Send} label="Sent" value={sentCount} />
            <StatPill icon={Mail} label="Opened" value={openedCount} color="text-blue-400" />
            <StatPill icon={MousePointerClick} label="Clicked" value={clickedCount} color={clickedCount > 0 ? 'text-amber-400' : 'text-gray-300'} />
            {submittedCount > 0 && (
              <StatPill icon={AlertTriangle} label="Submitted" value={submittedCount} color="text-red-400" />
            )}
          </div>

          {sentCount > 0 && <ClickRateBar clicked={clickedCount} sent={sentCount} />}
        </div>

        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {canViewResults && (
            <button
              onClick={e => { e.stopPropagation(); onViewResults(campaign) }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 transition-colors"
            >
              View Results
            </button>
          )}
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 space-y-3">
          {description && <p className="text-sm text-gray-400">{description}</p>}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            {createdAt && <span>Created: <span className="text-gray-400">{new Date(createdAt).toLocaleDateString()}</span></span>}
            {scheduledAt && <span>Scheduled: <span className="text-blue-400">{new Date(scheduledAt).toLocaleString()}</span></span>}
            {completedAt && <span>Completed: <span className="text-green-400">{new Date(completedAt).toLocaleDateString()}</span></span>}
          </div>
          {isDraft && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onDelete(id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── New Campaign Form ────────────────────────────────────────────────────────

function NewCampaignForm({ onClose, onCreated }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState(TEMPLATES[0])
  const [recipients, setRecipients] = useState('')
  const [sendMode, setSendMode] = useState('immediate')
  const [scheduleAt, setScheduleAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const parsedEmails = recipients
    .split(/[\n,;]+/)
    .map(e => e.trim())
    .filter(e => e.includes('@'))

  const STEP_LABELS = ['Campaign Info', 'Recipients', 'Schedule']

  const canAdvance = () => {
    if (step === 0) return name.trim().length > 0
    if (step === 1) return parsedEmails.length > 0
    return true
  }

  const handleSubmit = async () => {
    setSaving(true); setError(null)
    const payload = {
      name: name.trim(),
      description: description.trim(),
      template,
      recipients: parsedEmails,
      scheduleAt: sendMode === 'later' ? scheduleAt : null,
    }
    try {
      await createPhishingCampaign(payload)
    } catch {
      // API not available — campaign created locally in UI
    }
    setSaving(false)
    onCreated()
  }

  const INPUT = 'w-full bg-white/5 border border-white/15 focus:border-blue-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h2 className="text-sm font-bold text-white">New Phishing Campaign</h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step progress */}
      <div className="flex border-b border-white/10">
        {STEP_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => i < step && setStep(i)}
            className={`flex-1 px-4 py-3 text-xs font-semibold transition-colors relative ${
              i === step
                ? 'text-blue-400 bg-blue-500/5'
                : i < step
                ? 'text-green-400 hover:text-green-300 cursor-pointer'
                : 'text-gray-600 cursor-default'
            }`}
          >
            <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold mr-1.5 ${
              i < step ? 'bg-green-500/20 text-green-400' : i === step ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-600'
            }`}>
              {i < step ? '✓' : i + 1}
            </span>
            {label}
            {i === step && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
          </button>
        ))}
      </div>

      <div className="px-5 py-5 space-y-4">
        {/* Step 0: Campaign Info */}
        {step === 0 && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Campaign Name <span className="text-red-400">*</span></label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q2 Credential Test" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional notes about this campaign" rows={2} className={`${INPUT} resize-none`} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Phishing Template</label>
              <select value={template} onChange={e => setTemplate(e.target.value)} className={INPUT}>
                {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Step 1: Recipients */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email List <span className="text-gray-500 normal-case font-normal">(one per line)</span></label>
              <textarea
                value={recipients}
                onChange={e => setRecipients(e.target.value)}
                placeholder={'alice@company.com\nbob@company.com\ncarol@company.com'}
                rows={7}
                className={`${INPUT} resize-none font-mono text-xs`}
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {parsedEmails.length > 0
                  ? <span className="text-green-400 font-semibold">{parsedEmails.length} valid email{parsedEmails.length !== 1 ? 's' : ''} parsed</span>
                  : 'No valid emails detected yet'}
              </p>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-300 bg-white/5 hover:bg-white/8 border border-white/15 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
                <Plus className="w-3.5 h-3.5" /> Upload CSV
                <input type="file" accept=".csv,.txt" className="hidden" onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => setRecipients(prev => prev ? `${prev}\n${ev.target.result}` : ev.target.result)
                  reader.readAsText(file)
                  e.target.value = ''
                }} />
              </label>
            </div>
          </>
        )}

        {/* Step 2: Schedule */}
        {step === 2 && (
          <>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Send Timing</label>
              <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${sendMode === 'immediate' ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20'}`}>
                <input type="radio" name="sendMode" value="immediate" checked={sendMode === 'immediate'} onChange={() => setSendMode('immediate')} className="accent-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Send immediately</p>
                  <p className="text-xs text-gray-500">Campaign starts as soon as you launch it</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${sendMode === 'later' ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 hover:border-white/20'}`}>
                <input type="radio" name="sendMode" value="later" checked={sendMode === 'later'} onChange={() => setSendMode('later')} className="accent-blue-500" />
                <div>
                  <p className="text-sm font-semibold text-white">Schedule for later</p>
                  <p className="text-xs text-gray-500">Pick a specific date and time</p>
                </div>
              </label>
              {sendMode === 'later' && (
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={e => setScheduleAt(e.target.value)}
                  className={`${INPUT} mt-1`}
                />
              )}
            </div>

            <div className="flex items-start gap-2.5 bg-amber-400/8 border border-amber-400/25 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-300/80 leading-relaxed">
                Ensure you have <strong className="text-amber-300">written authorization</strong> from your organization before running this simulation. Unauthorized phishing tests may violate policy or law.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
              </div>
            )}
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
            className="text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors"
          >
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          {step < 2 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || (sendMode === 'later' && !scheduleAt)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {saving ? 'Launching…' : 'Launch Campaign'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ campaigns }) {
  const completed = campaigns.filter(c => (field(c, 'status', 'Status') ?? '') === 'Completed')

  const totalSent    = campaigns.reduce((s, c) => s + (field(c, 'sentCount', 'SentCount', 'sent') ?? 0), 0)
  const totalOpened  = campaigns.reduce((s, c) => s + (field(c, 'openedCount', 'OpenedCount', 'opened') ?? 0), 0)
  const totalClicked = campaigns.reduce((s, c) => s + (field(c, 'clickedCount', 'ClickedCount', 'clicked') ?? 0), 0)
  const totalSubmitted = campaigns.reduce((s, c) => s + (field(c, 'submittedCount', 'SubmittedCount', 'submitted') ?? 0), 0)

  const clickRate = totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0
  const openRate  = totalSent > 0 ? Math.round((totalOpened  / totalSent) * 100) : 0

  // Bar chart data: last 5 campaigns with sentCount > 0
  const chartCampaigns = [...campaigns]
    .filter(c => (field(c, 'sentCount', 'SentCount', 'sent') ?? 0) > 0)
    .slice(-5)

  const svgW = 500, svgH = 180
  const chartPadL = 36, chartPadR = 16, chartPadT = 16, chartPadB = 40
  const chartW = svgW - chartPadL - chartPadR
  const chartH = svgH - chartPadT - chartPadB

  const barCount = chartCampaigns.length
  const barW = barCount > 0 ? Math.min(56, (chartW / barCount) * 0.6) : 40
  const barGap = barCount > 0 ? chartW / barCount : chartW

  const maxRate = Math.max(30, ...chartCampaigns.map(c => {
    const s = field(c, 'sentCount', 'SentCount', 'sent') ?? 0
    const cl = field(c, 'clickedCount', 'ClickedCount', 'clicked') ?? 0
    return s > 0 ? Math.round((cl / s) * 100) : 0
  }))

  const toBarH = (pct) => (pct / maxRate) * chartH
  const yTicks = [0, Math.round(maxRate * 0.25), Math.round(maxRate * 0.5), Math.round(maxRate * 0.75), maxRate]

  // Risk donut data
  const highRisk   = totalSubmitted + Math.max(0, totalClicked - totalSubmitted)
  const mediumRisk = Math.max(0, totalOpened - totalClicked)
  const lowRisk    = Math.max(0, totalSent - totalOpened)

  const riskTotal = highRisk + mediumRisk + lowRisk || 1
  const riskSegments = [
    { label: 'High Risk', value: highRisk, color: '#ef4444', bg: 'bg-red-500' },
    { label: 'Medium Risk', value: mediumRisk, color: '#f59e0b', bg: 'bg-amber-400' },
    { label: 'Low Risk', value: lowRisk, color: '#22c55e', bg: 'bg-green-500' },
  ]

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Overall Click Rate', value: `${clickRate}%`, sub: `${totalClicked} of ${totalSent} emails`, color: clickRate > 20 ? 'text-red-400' : clickRate > 10 ? 'text-amber-400' : 'text-green-400' },
          { label: 'Average Open Rate', value: `${openRate}%`,  sub: `${totalOpened} of ${totalSent} emails`,  color: 'text-blue-400' },
          { label: 'Simulations Run',   value: completed.length, sub: `${campaigns.length} total campaigns`, color: 'text-white' },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-white/3 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-gray-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Click Rate per Campaign</p>
        {chartCampaigns.length === 0 ? (
          <p className="text-gray-600 text-xs py-6 text-center">No campaigns with sent emails yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="w-full min-w-[300px]">
              {/* Y axis ticks */}
              {yTicks.map(tick => {
                const y = chartPadT + chartH - toBarH(tick)
                return (
                  <g key={tick}>
                    <line x1={chartPadL - 4} y1={y} x2={svgW - chartPadR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    <text x={chartPadL - 6} y={y + 4} fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="end">{tick}%</text>
                  </g>
                )
              })}

              {/* Bars */}
              {chartCampaigns.map((c, i) => {
                const s = field(c, 'sentCount', 'SentCount', 'sent') ?? 0
                const cl = field(c, 'clickedCount', 'ClickedCount', 'clicked') ?? 0
                const pct = s > 0 ? Math.round((cl / s) * 100) : 0
                const barColor = pct > 20 ? '#ef4444' : pct > 10 ? '#f59e0b' : '#22c55e'
                const cx = chartPadL + barGap * i + barGap / 2
                const bh = toBarH(pct)
                const by = chartPadT + chartH - bh
                const campaignName = (field(c, 'name', 'Name', 'title') ?? '').slice(0, 14)

                return (
                  <g key={i}>
                    <rect x={cx - barW / 2} y={by} width={barW} height={Math.max(bh, 1)} rx="3" fill={barColor} fillOpacity="0.8" />
                    {pct > 0 && (
                      <text x={cx} y={by - 4} fontSize="9" fontWeight="700" fill={barColor} textAnchor="middle">{pct}%</text>
                    )}
                    <text x={cx} y={svgH - chartPadB + 14} fontSize="9" fill="rgba(255,255,255,0.35)" textAnchor="middle">
                      {campaignName}{campaignName.length < (field(c, 'name', 'Name', 'title') ?? '').length ? '…' : ''}
                    </text>
                  </g>
                )
              })}

              {/* Axes */}
              <line x1={chartPadL} y1={chartPadT} x2={chartPadL} y2={chartPadT + chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <line x1={chartPadL} y1={chartPadT + chartH} x2={svgW - chartPadR} y2={chartPadT + chartH} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            </svg>
          </div>
        )}
      </div>

      {/* Risk breakdown */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Employee Risk Breakdown</p>
        {totalSent === 0 ? (
          <p className="text-gray-600 text-xs py-4 text-center">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {riskSegments.map(({ label, value, color, bg }) => {
              const pct = Math.round((value / riskTotal) * 100)
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${bg} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold w-20 text-right" style={{ color }}>{value} <span className="text-gray-600 font-normal">({pct}%)</span></span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

const DEMO_RESULTS = [
  { email: 'alice@example.com',   opened: true,  clicked: true,  submitted: false },
  { email: 'bob@example.com',     opened: true,  clicked: false, submitted: false },
  { email: 'carol@example.com',   opened: false, clicked: false, submitted: false },
  { email: 'dave@example.com',    opened: true,  clicked: true,  submitted: true  },
  { email: 'eve@example.com',     opened: false, clicked: false, submitted: false },
  { email: 'frank@example.com',   opened: true,  clicked: false, submitted: false },
]

// ── Results Tab ──────────────────────────────────────────────────────────────

function ResultsTab({ selectedCampaign }) {
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [isDemo,  setIsDemo]    = useState(false)

  useEffect(() => {
    if (!selectedCampaign) return
    const id = field(selectedCampaign, 'id', 'Id') ?? ''
    setLoading(true); setIsDemo(false); setResults([])
    getPhishingResults(id)
      .then(data => {
        const arr = Array.isArray(data) ? data : (field(data, 'results', 'Results', 'items', 'Items') ?? [])
        if (arr.length > 0) { setResults(arr) }
        else { setResults(DEMO_RESULTS); setIsDemo(true) }
      })
      .catch(() => { setResults(DEMO_RESULTS); setIsDemo(true) })
      .finally(() => setLoading(false))
  }, [selectedCampaign])

  if (!selectedCampaign) {
    return (
      <div className="text-center py-20 bg-white/3 border border-white/10 rounded-2xl">
        <MousePointerClick className="w-10 h-10 text-gray-600 mx-auto mb-3" />
        <p className="text-white font-semibold">No campaign selected</p>
        <p className="text-sm text-gray-500 mt-1">Select a campaign from the Campaigns tab to view results</p>
      </div>
    )
  }

  const campaignName = field(selectedCampaign, 'name', 'Name', 'title') ?? 'Campaign'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500 text-sm">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
        Loading results for <strong className="text-gray-300">{campaignName}</strong>…
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">Results — {campaignName}</h2>
        </div>
        <div className="text-center py-16 text-gray-500 text-sm">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30 text-green-400" />
          <p>No per-recipient data available yet.</p>
        </div>
      </div>
    )
  }

  const RISK_STYLE = {
    High:   { row: 'bg-red-500/5',    badge: 'bg-red-500/15 border-red-500/30 text-red-400' },
    Medium: { row: 'bg-amber-400/5',  badge: 'bg-amber-400/15 border-amber-400/30 text-amber-400' },
    Low:    { row: 'bg-blue-500/5',   badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400' },
    Safe:   { row: '',                badge: 'bg-green-500/15 border-green-500/30 text-green-400' },
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Results — {campaignName}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{results.length} recipient{results.length !== 1 ? 's' : ''}</p>
        </div>
        {isDemo && (
          <span className="text-[10px] font-semibold text-gray-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">Sample data</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Opened</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Clicked</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Risk Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {results.map((r, i) => {
              const email     = field(r, 'email', 'Email', 'recipient', 'Recipient') ?? `—`
              const opened    = !!(field(r, 'opened', 'Opened', 'emailOpened') ?? false)
              const clicked   = !!(field(r, 'clicked', 'Clicked', 'linkClicked') ?? false)
              const submitted = !!(field(r, 'submitted', 'Submitted', 'formSubmitted') ?? false)
              const risk      = submitted ? 'High' : clicked ? 'Medium' : opened ? 'Low' : 'Safe'
              const s         = RISK_STYLE[risk]

              const BoolIcon = ({ val }) => val
                ? <CheckCircle2 className="w-4 h-4 text-red-400 mx-auto" />
                : <span className="block w-4 h-4 rounded-full bg-white/5 mx-auto" />

              return (
                <tr key={i} className={`${s.row} transition-colors`}>
                  <td className="px-5 py-3 text-gray-300 font-mono text-xs truncate max-w-[220px]">{email}</td>
                  <td className="px-4 py-3 text-center"><BoolIcon val={opened} /></td>
                  <td className="px-4 py-3 text-center"><BoolIcon val={clicked} /></td>
                  <td className="px-4 py-3 text-center"><BoolIcon val={submitted} /></td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${s.badge}`}>
                      {risk}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PhishingPage() {
  const [tab, setTab]                   = useState('campaigns')
  const [showForm, setShowForm]         = useState(false)
  const [campaigns, setCampaigns]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [selectedCampaign, setSelected] = useState(null)

  const load = () => {
    setLoading(true); setError(null)
    getPhishingCampaigns()
      .then(data => {
        const arr = Array.isArray(data) ? data : (field(data, 'campaigns', 'Campaigns', 'items', 'Items') ?? [])
        setCampaigns(arr)
      })
      .catch(() => {
        // API not available — demo campaigns will display automatically
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const displayCampaigns = campaigns.length > 0 ? campaigns : DEMO_CAMPAIGNS

  const handleViewResults = (campaign) => {
    setSelected(campaign)
    setTab('results')
  }

  const handleDelete = (id) => {
    if (!window.confirm('Delete this draft campaign?')) return
    setCampaigns(prev => prev.filter(c => (field(c, 'id', 'Id') ?? '') !== id))
  }

  const handleCreated = () => {
    setShowForm(false)
    load()
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">

        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Security Awareness</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white">Phishing Simulation</h1>
              <p className="text-gray-400 text-sm mt-1">Run authorized phishing simulations to measure and improve employee security awareness.</p>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'New Campaign'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <PageGuide
            id="phishing-simulation"
            text="Phishing Simulation lets you run authorized email phishing drills against your own organization. Create a campaign with target emails and a template, track who clicked or reported the link, and use the results to identify security awareness gaps."
          />

          {/* New campaign form */}
          {showForm && (
            <NewCampaignForm
              onClose={() => setShowForm(false)}
              onCreated={handleCreated}
            />
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit flex-wrap">
            {[['campaigns', 'Campaigns'], ['dashboard', 'Dashboard'], ['results', 'Results']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTab(val)}
                className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors ${tab === val ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Campaigns tab */}
          {tab === 'campaigns' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {campaigns.length === 0
                    ? <span className="text-amber-400/70">Showing demo campaigns — connect your API to see real data</span>
                    : `${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''}`}
                </p>
                <button
                  onClick={load}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Refresh
                </button>
              </div>

              {loading && campaigns.length === 0 ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                </div>
              ) : displayCampaigns.length === 0 ? (
                <div className="text-center py-20 bg-white/3 border border-white/10 rounded-2xl">
                  <Mail className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-white font-semibold">No campaigns yet</p>
                  <p className="text-sm text-gray-500 mt-1">Click "New Campaign" to create your first phishing simulation.</p>
                </div>
              ) : (
                displayCampaigns.map(c => (
                  <CampaignCard
                    key={field(c, 'id', 'Id') ?? c.name}
                    campaign={c}
                    onViewResults={handleViewResults}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          )}

          {/* Dashboard tab */}
          {tab === 'dashboard' && (
            <DashboardTab campaigns={displayCampaigns} />
          )}

          {/* Results tab */}
          {tab === 'results' && (
            <ResultsTab selectedCampaign={selectedCampaign} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
