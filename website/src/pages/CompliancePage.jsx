import React, { useState, useCallback } from 'react'
import {
  ShieldCheck, Loader2, AlertCircle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Download, ArrowLeft, RefreshCw,
  AlertTriangle, ExternalLink, Minus,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getFrameworkControls, assessCompliance, exportComplianceReport,
} from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

/* ── Framework definitions ── */
const FRAMEWORKS = [
  {
    id: 'soc2',
    name: 'SOC 2',
    version: 'Type II',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    accent: 'bg-blue-500',
    desc: 'Security, availability, processing integrity, confidentiality & privacy trust service criteria.',
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    version: '2022',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    accent: 'bg-purple-500',
    desc: 'International standard for information security management systems (ISMS).',
  },
  {
    id: 'pci-dss',
    name: 'PCI DSS',
    version: 'v4.0',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    accent: 'bg-emerald-500',
    desc: 'Payment Card Industry Data Security Standard for cardholder data environments.',
  },
  {
    id: 'hipaa',
    name: 'HIPAA',
    version: '2023',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    accent: 'bg-rose-500',
    desc: 'Health Insurance Portability and Accountability Act security and privacy rules.',
  },
  {
    id: 'cis-v8',
    name: 'CIS Controls',
    version: 'v8',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    accent: 'bg-orange-500',
    desc: 'Center for Internet Security Controls v8 — 18 safeguard groups for cyber defence.',
  },
  {
    id: 'gdpr',
    name: 'GDPR',
    version: '2018',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
    accent: 'bg-indigo-500',
    desc: 'EU General Data Protection Regulation — lawful processing of personal data.',
  },
]

/* ── Status helpers ── */
const STATUS_CFG = {
  Pass:    { cls: 'bg-green-500/15 text-green-400 border-green-500/30',  icon: CheckCircle2, label: 'Pass'    },
  Fail:    { cls: 'bg-red-500/15 text-red-400 border-red-500/30',        icon: XCircle,      label: 'Fail'    },
  Partial: { cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  icon: AlertTriangle,label: 'Partial' },
  'N/A':   { cls: 'bg-gray-500/15 text-gray-400 border-gray-500/30',     icon: Minus,        label: 'N/A'     },
}

function normStatus(raw) {
  if (!raw) return 'N/A'
  const s = String(raw).toLowerCase()
  if (s === 'pass' || s === 'passed' || s === 'compliant') return 'Pass'
  if (s === 'fail' || s === 'failed' || s === 'non-compliant') return 'Fail'
  if (s === 'partial' || s === 'partial compliance') return 'Partial'
  return 'N/A'
}

function StatusBadge({ raw }) {
  const key = normStatus(raw)
  const cfg = STATUS_CFG[key] ?? STATUS_CFG['N/A']
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${cfg.cls}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

/* ── Score ring ── */
function ScoreRing({ score, fw }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, score)) / 100) * circ
  const strokeColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  return (
    <div className="relative w-36 h-36 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={strokeColor} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-white">{score}%</span>
        <span className={`text-[10px] font-bold ${fw.color} mt-0.5`}>{fw.name}</span>
      </div>
    </div>
  )
}

/* ── Control row ── */
function ControlRow({ ctrl }) {
  const [open, setOpen] = useState(false)
  const id         = field(ctrl, 'controlId', 'ControlId', 'id', 'Id', 'number', 'Number') ?? ''
  const name       = field(ctrl, 'name', 'Name', 'title', 'Title', 'controlName', 'ControlName') ?? '—'
  const rawStatus  = field(ctrl, 'status', 'Status', 'result', 'Result') ?? null
  const evidence   = field(ctrl, 'evidence', 'Evidence', 'detail', 'Detail', 'description', 'Description') ?? ''
  const remUrl     = field(ctrl, 'remediationUrl', 'RemediationUrl', 'remediation', 'Remediation', 'link', 'Link') ?? ''
  const remText    = field(ctrl, 'remediationText', 'RemediationText') ?? ''
  const hasMore    = !!(evidence || remUrl || remText)

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => hasMore && setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hasMore ? 'hover:bg-white/3' : ''}`}
      >
        {id && (
          <span className="text-[10px] font-mono text-gray-500 w-16 shrink-0">{id}</span>
        )}
        <span className="flex-1 text-xs text-gray-300 min-w-0 truncate">{name}</span>
        <StatusBadge raw={rawStatus} />
        {hasMore && (open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" />)}
      </button>

      {open && hasMore && (
        <div className="px-4 pb-3.5 space-y-2" style={{ marginLeft: id ? '76px' : undefined }}>
          {evidence && (
            <p className="text-xs text-gray-400 leading-relaxed">{evidence}</p>
          )}
          {(remUrl || remText) && (
            <div className="flex items-center gap-2">
              {remText && <span className="text-xs text-blue-300">{remText}</span>}
              {remUrl && (
                <a href={remUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <ExternalLink className="w-3 h-3" /> Remediation guide
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Assessment view ── */
function AssessmentView({ fw, onBack }) {
  const [controls, setControls]   = useState([])
  const [loading, setLoading]     = useState(false)
  const [assessing, setAssessing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError]         = useState(null)
  const [assessed, setAssessed]   = useState(false)

  const loadControls = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await getFrameworkControls(fw.id)
      const list = Array.isArray(data) ? data : (data?.controls ?? data?.Controls ?? data?.items ?? data?.Items ?? [])
      setControls(list)
    } catch (e) { setError(e.message || 'Failed to load framework controls') }
    setLoading(false)
  }, [fw.id])

  React.useEffect(() => { loadControls() }, [loadControls])

  const runAssessment = async () => {
    setAssessing(true); setError(null)
    try {
      const data = await assessCompliance(fw.id)
      const list = Array.isArray(data) ? data : (data?.controls ?? data?.Controls ?? data?.results ?? data?.Results ?? data?.items ?? data?.Items ?? [])
      if (list.length > 0) setControls(list)
      setAssessed(true)
    } catch (e) { setError(e.message || 'Assessment failed') }
    setAssessing(false)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportComplianceReport(fw.id)
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url
      a.download = `${fw.id}-compliance-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { alert(e.message || 'Export failed') }
    setExporting(false)
  }

  /* Group controls by section/category */
  const grouped = {}
  controls.forEach(c => {
    const sec = field(c, 'section', 'Section', 'category', 'Category', 'domain', 'Domain', 'group', 'Group') ?? 'General'
    if (!grouped[sec]) grouped[sec] = []
    grouped[sec].push(c)
  })
  const sections = Object.entries(grouped)

  /* Score from controls */
  const withStatus = controls.filter(c => field(c, 'status', 'Status', 'result', 'Result'))
  const passCount  = withStatus.filter(c => normStatus(field(c, 'status', 'Status', 'result', 'Result')) === 'Pass').length
  const score      = withStatus.length > 0 ? Math.round((passCount / withStatus.length) * 100) : null

  /* Per-status counts */
  const counts = { Pass: 0, Fail: 0, Partial: 0, 'N/A': 0 }
  controls.forEach(c => { const s = normStatus(field(c,'status','Status','result','Result')); counts[s] = (counts[s] ?? 0) + 1 })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Frameworks
        </button>
        <div className="flex items-center gap-2">
          <button onClick={runAssessment} disabled={assessing || loading}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            {assessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {assessing ? 'Assessing…' : assessed ? 'Re-run' : 'Run Assessment'}
          </button>
          <button onClick={handleExport} disabled={exporting || controls.length === 0}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </button>
        </div>
      </div>

      {/* Score header */}
      <div className={`${fw.bg} border ${fw.border} rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6`}>
        {score !== null
          ? <ScoreRing score={score} fw={fw} />
          : (
            <div className="w-36 h-36 rounded-full border-4 border-white/10 flex flex-col items-center justify-center shrink-0">
              <span className={`text-3xl font-extrabold ${fw.color}`}>—</span>
              <span className="text-[10px] text-gray-500 mt-0.5">run assessment</span>
            </div>
          )}
        <div className="flex-1">
          <h2 className={`text-xl font-extrabold ${fw.color} mb-0.5`}>{fw.name} <span className="text-gray-500 font-normal text-sm">{fw.version}</span></h2>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">{fw.desc}</p>
          <div className="flex flex-wrap gap-4">
            {Object.entries(counts).filter(([, n]) => n > 0).map(([s, n]) => {
              const cfg = STATUS_CFG[s] ?? STATUS_CFG['N/A']
              return (
                <div key={s}>
                  <p className={`text-xl font-extrabold ${cfg.cls.match(/text-\S+/)?.[0] ?? 'text-gray-400'}`}>{n}</p>
                  <p className="text-[10px] text-gray-500">{s}</p>
                </div>
              )
            })}
            <div>
              <p className="text-xl font-extrabold text-white">{controls.length}</p>
              <p className="text-[10px] text-gray-500">Total Controls</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-16 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading controls…
        </div>
      )}

      {!loading && controls.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500 text-sm">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Click "Run Assessment" to evaluate your posture against {fw.name}.
        </div>
      )}

      {/* Controls grouped by section */}
      {!loading && sections.length > 0 && sections.map(([section, ctrlList]) => (
        <div key={section} className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white">{section}</h3>
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span className="text-green-400">{ctrlList.filter(c => normStatus(field(c,'status','Status','result','Result')) === 'Pass').length} pass</span>
              <span>·</span>
              <span className="text-red-400">{ctrlList.filter(c => normStatus(field(c,'status','Status','result','Result')) === 'Fail').length} fail</span>
              <span>·</span>
              <span>{ctrlList.length} total</span>
            </div>
          </div>
          {ctrlList.map((ctrl, i) => (
            <ControlRow key={i} ctrl={ctrl} />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   Framework Selector
───────────────────────────────────────── */
function FrameworkSelector({ onSelect }) {
  return (
    <div>
      <p className="text-sm text-gray-400 mb-6">Select a framework to view your current posture and run a fresh assessment.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FRAMEWORKS.map(fw => (
          <button
            key={fw.id}
            onClick={() => onSelect(fw)}
            className={`text-left ${fw.bg} border ${fw.border} rounded-2xl p-5 hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className={`text-base font-extrabold ${fw.color}`}>{fw.name}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">{fw.version}</p>
              </div>
              <ShieldCheck className={`w-5 h-5 ${fw.color} opacity-60`} />
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{fw.desc}</p>
            <div className={`mt-3 h-0.5 rounded-full ${fw.accent} opacity-30`} />
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function CompliancePage() {
  const [selectedFw, setSelectedFw] = useState(null)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-sky-500/15 border border-sky-500/30 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Compliance</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Compliance</h1>
            <p className="text-gray-400">Evaluate your security posture against SOC 2, ISO 27001, PCI DSS, HIPAA, CIS Controls, and GDPR.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {!selectedFw
            ? <FrameworkSelector onSelect={setSelectedFw} />
            : <AssessmentView fw={selectedFw} onBack={() => setSelectedFw(null)} />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
