import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles, ChevronDown, ChevronUp, Copy, Share2, Check,
  AlertTriangle, Loader2, FileText, Shield, TrendingUp, Lock,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import EvidencePanel from '../components/EvidencePanel'
import { getLatestScans, generateAiReport, createShareLink } from '../services/api'

const SEV = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const COMPLIANCE_ICON = { GDPR: '🇪🇺', 'PCI-DSS': '💳', SOC2: '🏢', HIPAA: '🏥' }

// ── Typewriter text ───────────────────────────────────────────────────────────
function Typewriter({ text, onDone }) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!text) return
    setDisplayed('')
    let i = 0
    const t = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(t); onDone?.() }
    }, 14)
    return () => clearInterval(t)
  }, [text])
  return <span>{displayed}<span className="animate-pulse">▋</span></span>
}

export default function AiReportPage() {
  const [scans, setScans]           = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [report, setReport]         = useState(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)
  const [annexOpen, setAnnexOpen]   = useState(false)
  const [summaryDone, setSummaryDone] = useState(false)
  const [shareUrl, setShareUrl]     = useState(null)
  const [copied, setCopied]         = useState(false)
  const reportRef = useRef(null)

  useEffect(() => {
    getLatestScans()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.scans ?? data?.results ?? [])
        setScans(list)
        if (list[0]) setSelectedId(list[0].id ?? list[0].Id ?? list[0].ScanId ?? '')
      })
      .catch(() => {})
  }, [])

  const generate = async () => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    setReport(null)
    setSummaryDone(false)
    setShareUrl(null)
    try {
      const r = await generateAiReport(selectedId)
      setReport(r)
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (e) {
      setError(e.message || 'Failed to generate report')
    }
    setLoading(false)
  }

  const share = async () => {
    try {
      const res = await createShareLink(selectedId)
      const url = res?.shareUrl ?? res?.url ?? res?.link ?? ''
      setShareUrl(url)
    } catch {}
  }

  const copyShare = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const score = report?.score ?? report?.Score ?? 0
  const grade = report?.grade ?? report?.Grade ?? '—'
  const summary = report?.executiveSummary ?? report?.ExecutiveSummary ?? ''
  const findings = report?.keyFindings ?? report?.KeyFindings ?? []
  const recs = report?.strategicRecommendations ?? report?.StrategicRecommendations ?? []
  const compliance = report?.complianceImplications ?? report?.ComplianceImplications ?? {}
  const annex = report?.technicalAnnex ?? report?.TechnicalAnnex ?? []

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">AI Intelligence</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-crimson-400" /> AI Narrative Report
            </h1>
            <p className="text-gray-400">Generate an executive security report with business impact analysis from any past scan.</p>
          </div>

          {/* Scan selector */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-2">Select a past scan</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              >
                {scans.length === 0 && <option value="">No scans found</option>}
                {scans.map((s) => {
                  const id   = s.id ?? s.Id ?? s.ScanId ?? s.scanId ?? ''
                  const url  = s.url ?? s.Url ?? s.target ?? s.Target ?? id
                  const date = s.createdAt ?? s.CreatedAt ?? s.date ?? s.Date ?? ''
                  return (
                    <option key={id} value={id}>
                      {url}{date ? ` — ${new Date(date).toLocaleDateString()}` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
            <button
              onClick={generate}
              disabled={loading || !selectedId}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? 'Generating…' : 'Generate AI Report'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Report */}
          {report && (
            <div ref={reportRef} className="space-y-6">

              {/* Score + share */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Security Score</p>
                  <p className="text-5xl font-extrabold text-white">{score}<span className="text-2xl text-gray-500">/100</span></p>
                  <p className="text-crimson-400 font-bold mt-1">Grade {grade}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!shareUrl ? (
                    <button onClick={share} className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-colors">
                      <Share2 className="w-4 h-4" />Share report (48h link)
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                      <span className="text-xs text-gray-400 truncate max-w-[200px]">{shareUrl}</span>
                      <button onClick={copyShare} className="shrink-0 text-xs text-crimson-400 hover:text-crimson-300 font-semibold flex items-center gap-1">
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Executive Summary */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-crimson-400" />Executive Summary
                </h2>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {summaryDone ? summary : <Typewriter text={summary} onDone={() => setSummaryDone(true)} />}
                </p>
              </div>

              {/* Key Findings */}
              {findings.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-crimson-400" />Key Findings
                  </h2>
                  <div className="space-y-4">
                    {findings.map((f, i) => {
                      const title    = f.title ?? f.Title ?? f.name ?? f.Name ?? ''
                      const sev      = f.severity ?? f.Severity ?? 'Medium'
                      const impact   = f.businessImpact ?? f.BusinessImpact ?? f.impact ?? f.Impact ?? ''
                      const evidence = f.evidence ?? f.Evidence ?? null
                      return (
                        <div key={i} className="border-l-2 border-crimson-500/40 pl-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${SEV[sev] || SEV.Medium}`}>{sev}</span>
                            <p className="text-white font-semibold text-sm">{title}</p>
                          </div>
                          {impact && <p className="text-gray-400 text-xs leading-relaxed">{impact}</p>}
                          <EvidencePanel evidence={evidence} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Strategic Recommendations */}
              {recs.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-crimson-400" />Strategic Recommendations
                  </h2>
                  <ol className="space-y-3">
                    {recs.map((rec, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-crimson-500/20 border border-crimson-500/40 text-crimson-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        <span className="text-gray-300 text-sm leading-relaxed">{typeof rec === 'string' ? rec : (rec.text ?? rec.Text ?? rec.recommendation ?? '')}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Compliance */}
              {Object.keys(compliance).length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-crimson-400" />Compliance Implications
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {Object.entries(compliance).map(([framework, text]) => (
                      <div key={framework} className="bg-white/3 border border-white/10 rounded-xl p-4">
                        <p className="text-white font-semibold text-sm mb-1">{COMPLIANCE_ICON[framework] || '📋'} {framework}</p>
                        <p className="text-gray-400 text-xs leading-relaxed">{typeof text === 'string' ? text : (text?.summary ?? text?.text ?? '')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Annex */}
              {annex.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl">
                  <button
                    onClick={() => setAnnexOpen((o) => !o)}
                    className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
                  >
                    <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-crimson-400" />Technical Annex ({annex.length} findings)</span>
                    {annexOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {annexOpen && (
                    <div className="border-t border-white/10 overflow-x-auto">
                      <table className="w-full text-xs min-w-[520px]">
                        <thead>
                          <tr className="text-gray-500 border-b border-white/10">
                            <th className="text-left px-6 py-3">Check</th>
                            <th className="text-left px-4 py-3">Severity</th>
                            <th className="text-left px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {annex.map((row, i) => {
                            const name   = row.checkName ?? row.CheckName ?? row.name ?? row.Name ?? ''
                            const sev    = row.severity  ?? row.Severity  ?? 'Info'
                            const status = row.status    ?? row.Status    ?? row.passed ? 'Pass' : 'Fail'
                            return (
                              <tr key={i} className="border-b border-white/5 last:border-0">
                                <td className="px-6 py-2.5 text-gray-300">{name}</td>
                                <td className="px-4 py-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${SEV[sev] || SEV.Info}`}>{sev}</span></td>
                                <td className="px-4 py-2.5 text-gray-400">{status}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
