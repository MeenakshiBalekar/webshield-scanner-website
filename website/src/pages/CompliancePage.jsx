import React, { useState, useCallback, useEffect } from 'react'
import {
  ShieldCheck, Loader2, AlertCircle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Download, ArrowLeft, RefreshCw,
  AlertTriangle, ExternalLink, Minus, ScanLine, Cpu, Globe, Archive,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getFrameworkControls, assessCompliance, exportComplianceReport,
  deepScanCompliance, getAgents, fetchComplianceEvidence,
} from '../services/api'
import ApiErrorBanner from '../components/ApiErrorBanner'

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
    id: 'iso-27001',
    name: 'ISO 27001',
    version: '2022',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    accent: 'bg-purple-500',
    desc: 'International standard for information security management systems (ISMS).',
  },
  {
    id: 'pci-dss-v4',
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
  const rawEvidence = field(ctrl, 'evidence', 'Evidence') ?? null
  const legacyText = (rawEvidence == null || typeof rawEvidence === 'object')
    ? (field(ctrl, 'detail', 'Detail', 'description', 'Description') ?? '')
    : ''
  const evidenceObj = (rawEvidence && typeof rawEvidence === 'object') ? rawEvidence : null
  const evidenceText = (rawEvidence && typeof rawEvidence === 'string') ? rawEvidence : legacyText
  const remUrl     = field(ctrl, 'remediationUrl', 'RemediationUrl', 'remediation', 'Remediation', 'link', 'Link') ?? ''
  const remText    = field(ctrl, 'remediationText', 'RemediationText') ?? ''
  const hasMore    = !!(evidenceObj || evidenceText || remUrl || remText || rawEvidence != null)

  /* Evidence object sub-fields */
  const evCapturedValue = evidenceObj ? (field(evidenceObj, 'capturedValue', 'CapturedValue') ?? null) : null
  const evCapturedAt    = evidenceObj ? (field(evidenceObj, 'capturedAt', 'CapturedAt') ?? null) : null
  const evSource        = evidenceObj ? (field(evidenceObj, 'source', 'Source') ?? null) : null
  const evExpected      = evidenceObj ? (field(evidenceObj, 'expectedValue', 'ExpectedValue') ?? null) : null

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/3"
      >
        {id && (
          <span className="text-[10px] font-mono text-gray-500 w-16 shrink-0">{id}</span>
        )}
        <span className="flex-1 text-xs text-gray-300 min-w-0 truncate">{name}</span>
        <StatusBadge raw={rawStatus} />
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-3.5 space-y-2" style={{ marginLeft: id ? '76px' : undefined }}>
          {/* Evidence sub-panel */}
          <div className="bg-black/30 rounded-lg px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">📋 Evidence</p>
            {evidenceObj ? (
              <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-1 text-[10px]">
                <span className="text-gray-500 font-semibold">Source</span>
                <span className="text-gray-500 font-semibold">Captured Value</span>
                <span className="text-gray-500 font-semibold">Expected</span>
                <span className="text-gray-500 font-semibold">Timestamp</span>
                <span className="text-gray-300">{evSource ?? '—'}</span>
                <span className="font-mono text-xs text-gray-300 truncate max-w-xs">{evCapturedValue != null ? String(evCapturedValue) : '—'}</span>
                <span className="text-gray-300">{evExpected != null ? String(evExpected) : '—'}</span>
                <span className="text-gray-400">{evCapturedAt ? new Date(evCapturedAt).toLocaleString() : '—'}</span>
              </div>
            ) : evidenceText ? (
              <p className="text-xs text-gray-400 leading-relaxed">{evidenceText}</p>
            ) : (
              <p className="text-xs text-gray-500 italic">No evidence captured for this control.</p>
            )}
          </div>
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
function AssessmentView({ fw, onBack, deepScanAgentId }) {
  const [controls, setControls]             = useState([])
  const [loading, setLoading]               = useState(false)
  const [assessing, setAssessing]           = useState(false)
  const [deepScanning, setDeepSc]           = useState(false)
  const [exporting, setExporting]           = useState(false)
  const [htmlExporting, setHtmlExporting]       = useState(false)
  const [exportingEvidence, setExportingEvidence] = useState(false)
  const [fetchingEvidence, setFetchingEvidence] = useState(false)
  const [evidenceArtifacts, setEvidenceArtifacts] = useState(null)
  const [evidenceOpen, setEvidenceOpen]     = useState(false)
  const [error, setError]                   = useState(null)
  const [assessed, setAssessed]             = useState(false)
  const [scanId, setScanId]                 = useState(null)
  const [targetUrl, setTargetUrl]           = useState('')

  const loadControls = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await getFrameworkControls(fw.id)
      const list = Array.isArray(data) ? data : (data?.controls ?? data?.Controls ?? data?.items ?? data?.Items ?? [])
      setControls(list)
    } catch (e) { setError(e.message || 'Failed to load framework controls') }
    setLoading(false)
  }, [fw.id])

  useEffect(() => { loadControls() }, [loadControls])

  /* Auto-run deep scan when opened via Deep Scan button */
  useEffect(() => {
    if (!deepScanAgentId) return
    const run = async () => {
      setDeepSc(true); setError(null)
      try {
        const data = await deepScanCompliance(fw.id, deepScanAgentId)
        const list = Array.isArray(data) ? data : (data?.controls ?? data?.Controls ?? data?.results ?? data?.Results ?? data?.items ?? data?.Items ?? [])
        if (list.length > 0) { setControls(list); setAssessed(true) }
      } catch (e) { setError(e.message || 'Deep scan failed') }
      setDeepSc(false)
    }
    run()
  }, [fw.id, deepScanAgentId])

  const runAssessment = async () => {
    setAssessing(true); setError(null)
    try {
      const data = await assessCompliance(fw.id, targetUrl.trim() || undefined)
      const list = Array.isArray(data) ? data : (data?.controls ?? data?.Controls ?? data?.results ?? data?.Results ?? data?.items ?? data?.Items ?? [])
      if (list.length > 0) setControls(list)
      const sid = field(data, 'scanId', 'ScanId', 'scan_id', 'id', 'Id')
      if (sid) setScanId(String(sid))
      setAssessed(true)
    } catch (e) { setError(e) }
    setAssessing(false)
  }

  const handleFetchEvidence = async () => {
    setFetchingEvidence(true)
    try {
      const assessId = scanId || fw.id
      const data = await fetchComplianceEvidence(assessId)
      setEvidenceArtifacts(data)
      setEvidenceOpen(true)
    } catch (e) { setError(e.message || 'Evidence fetch failed') }
    setFetchingEvidence(false)
  }

  const handleEvidenceExport = async () => {
    setExportingEvidence(true)
    try {
      const assessId = scanId || fw.id
      const token = localStorage.getItem('ws_token')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'}/api/compliance/assessment/${encodeURIComponent(assessId)}/evidence-export`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${fw.id}-evidence-${new Date().toISOString().split('T')[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) { setError(e.message || 'Evidence export failed') }
    setExportingEvidence(false)
  }

  const handleHtmlReport = async () => {
    setHtmlExporting(true)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'}/api/compliance/report/html?frameworkId=${encodeURIComponent(fw.id)}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      const blob = new Blob([html], { type: 'text/html' })
      const blobUrl = URL.createObjectURL(blob)
      const win = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (!win) throw new Error('Popup blocked — please allow popups for this site')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (e) { setError(e.message || 'HTML export failed') }
    setHtmlExporting(false)
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
          {deepScanning && (
            <span className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Deep Scanning…
            </span>
          )}
          <button onClick={runAssessment} disabled={assessing || loading || deepScanning}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
            {assessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {assessing ? 'Assessing…' : assessed ? 'Re-run' : 'Run Assessment'}
          </button>
          <button onClick={handleExport} disabled={exporting || controls.length === 0}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-40">
            {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export CSV
          </button>
          <button onClick={handleFetchEvidence} disabled={fetchingEvidence || !assessed}
            className="flex items-center gap-1.5 bg-white/5 border border-white/15 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            {fetchingEvidence ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {evidenceArtifacts ? 'Refresh Evidence' : 'Fetch Evidence Artifacts'}
          </button>
          <button onClick={handleHtmlReport} disabled={htmlExporting || !assessed}
            className="flex items-center gap-1.5 bg-white/5 border border-white/15 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            {htmlExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
            {htmlExporting ? 'Building…' : 'Export HTML Report'}
          </button>
          <button onClick={handleEvidenceExport} disabled={exportingEvidence || !assessed}
            className="flex items-center gap-1.5 bg-white/5 border border-white/15 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            {exportingEvidence ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            {exportingEvidence ? 'Packaging…' : 'Download Evidence (.zip)'}
          </button>
        </div>
      </div>

      {/* Target URL */}
      <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
        <Globe className="w-4 h-4 text-gray-500 shrink-0" />
        <input
          type="url"
          value={targetUrl}
          onChange={e => setTargetUrl(e.target.value)}
          placeholder="https://yoursite.com — target URL required to run assessment"
          className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
        />
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

      {error && <ApiErrorBanner error={error} />}

      {/* Evidence artifacts panel */}
      {evidenceArtifacts && (
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <button
            onClick={() => setEvidenceOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
          >
            <Download className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="flex-1 text-sm font-semibold text-white">Evidence Artifacts</span>
            {Array.isArray(evidenceArtifacts)
              ? <span className="text-xs text-gray-500">{evidenceArtifacts.length} control{evidenceArtifacts.length !== 1 ? 's' : ''}</span>
              : null}
            {evidenceOpen
              ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
              : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
          </button>
          {evidenceOpen && (
            <div className="border-t border-white/10 divide-y divide-white/5 max-h-96 overflow-y-auto">
              {Array.isArray(evidenceArtifacts) ? evidenceArtifacts.map((item, i) => {
                const ctrlId   = field(item, 'controlId', 'ControlId', 'id', 'Id') ?? `#${i + 1}`
                const ctrlName = field(item, 'name', 'Name', 'controlName', 'ControlName') ?? ''
                const evidence = field(item, 'evidence', 'Evidence') ?? item
                const evSource = evidence ? field(evidence, 'source', 'Source') : null
                const evValue  = evidence ? field(evidence, 'capturedValue', 'CapturedValue') : null
                const evExpect = evidence ? field(evidence, 'expectedValue', 'ExpectedValue') : null
                const evTs     = evidence ? field(evidence, 'capturedAt', 'CapturedAt') : null
                const sha256   = field(item, 'sha256', 'Sha256', 'SHA256', 'hash', 'Hash')
                return (
                  <div key={i} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-gray-500 shrink-0">{ctrlId}</span>
                      {ctrlName && <span className="text-xs text-white truncate">{ctrlName}</span>}
                    </div>
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-4 gap-y-0.5 text-[10px] pl-2">
                      <span className="text-gray-600">Source</span>
                      <span className="text-gray-600">Captured Value</span>
                      <span className="text-gray-600">Expected</span>
                      <span className="text-gray-600">Captured At</span>
                      <span className="text-gray-300">{evSource ?? '—'}</span>
                      <span className="font-mono text-gray-300 truncate max-w-[180px]">{evValue != null ? String(evValue) : '—'}</span>
                      <span className="text-gray-300">{evExpect != null ? String(evExpect) : '—'}</span>
                      <span className="text-gray-400">{evTs ? new Date(evTs).toLocaleString() : '—'}</span>
                    </div>
                    {sha256 && (
                      <div className="flex items-center gap-2 pl-2">
                        <span className="text-[10px] text-gray-600 shrink-0">SHA-256:</span>
                        <code className="text-[10px] font-mono text-gray-500 truncate">{sha256}</code>
                      </div>
                    )}
                  </div>
                )
              }) : (
                <div className="px-4 py-4">
                  <pre className="text-[10px] font-mono text-gray-400 whitespace-pre-wrap overflow-auto max-h-60">
                    {JSON.stringify(evidenceArtifacts, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
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
function FrameworkSelector({ onSelect, onDeepScan, agents, agentId, onAgentChange }) {
  return (
    <div>
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <p className="text-sm text-gray-400 flex-1">Select a framework to view your current posture and run a fresh assessment.</p>
        {agents.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <Cpu className="w-4 h-4 text-gray-500" />
            <label className="text-xs text-gray-500 whitespace-nowrap">Agent for Deep Scan:</label>
            <select
              value={agentId}
              onChange={e => onAgentChange(e.target.value)}
              className="bg-white/5 border border-white/15 focus:border-sky-500 text-white px-3 py-1.5 rounded-xl text-xs outline-none transition-colors"
            >
              {agents.map((a, i) => {
                const id   = field(a, 'agentId', 'AgentId', 'id', 'Id') ?? i
                const name = field(a, 'name', 'Name', 'hostname', 'Hostname') ?? `Agent ${i + 1}`
                return <option key={id} value={id} className="bg-gray-900">{name}</option>
              })}
            </select>
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FRAMEWORKS.map(fw => (
          <div
            key={fw.id}
            className={`${fw.bg} border ${fw.border} rounded-2xl p-5 hover:scale-[1.02] transition-transform flex flex-col`}
          >
            <button
              onClick={() => onSelect(fw)}
              className="text-left flex-1"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`text-base font-extrabold ${fw.color}`}>
                    {fw.name}
                    {fw.id === 'pci-dss-v4' && (
                      <span className="text-[9px] font-bold text-amber-400 ml-1.5">v4.0</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">{fw.version}</p>
                </div>
                <ShieldCheck className={`w-5 h-5 ${fw.color} opacity-60`} />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{fw.desc}</p>
              <div className={`mt-3 h-0.5 rounded-full ${fw.accent} opacity-30`} />
            </button>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => onSelect(fw)}
                className="flex-1 text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-1.5 transition-colors"
              >
                View Assessment
              </button>
              {agents.length > 0 && (
                <button
                  onClick={() => onDeepScan(fw)}
                  className={`flex items-center gap-1 text-xs font-semibold ${fw.color} bg-white/5 hover:bg-white/10 border ${fw.border} rounded-lg px-2.5 py-1.5 transition-colors`}
                >
                  <ScanLine className="w-3 h-3" /> Deep Scan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function CompliancePage() {
  const [selectedFw, setSelectedFw]       = useState(null)
  const [deepScanAgentId, setDeepAgent]   = useState(null)
  const [agents, setAgents]               = useState([])
  const [selectorAgentId, setSelectorAgt] = useState('')

  useEffect(() => {
    getAgents()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.agents ?? data?.Agents ?? [])
        setAgents(list)
        if (list.length > 0) {
          const firstId = field(list[0], 'agentId', 'AgentId', 'id', 'Id') ?? ''
          setSelectorAgt(firstId)
        }
      })
      .catch(() => {})
  }, [])

  const handleDeepScan = (fw) => {
    setDeepAgent(selectorAgentId || null)
    setSelectedFw(fw)
  }

  const handleBack = () => {
    setSelectedFw(null)
    setDeepAgent(null)
  }

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
            <p className="text-gray-400">Evaluate your security posture against SOC 2, ISO 27001, PCI DSS v4.0, HIPAA, CIS Controls v8, and GDPR.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {!selectedFw
            ? (
              <FrameworkSelector
                onSelect={(fw) => { setDeepAgent(null); setSelectedFw(fw) }}
                onDeepScan={handleDeepScan}
                agents={agents}
                agentId={selectorAgentId}
                onAgentChange={setSelectorAgt}
              />
            )
            : (
              <AssessmentView
                fw={selectedFw}
                onBack={handleBack}
                deepScanAgentId={deepScanAgentId}
              />
            )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
