import React, { useState } from 'react'
import {
  Container, ScanLine, Loader2, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, Link2, FileText, Trash2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { startContainerScan } from '../services/api'

const SEVERITY_STYLES = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         dot: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       dot: 'bg-blue-400'   },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       dot: 'bg-gray-400'   },
}
const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }
const sevStyle = (s) => SEVERITY_STYLES[s] || SEVERITY_STYLES.Info

function FindingRow({ finding }) {
  const [open, setOpen] = useState(false)
  const checkName   = field(finding, 'checkName', 'CheckName', 'name', 'Name', 'type', 'Type')
  const severity    = field(finding, 'severity', 'Severity')
  const details     = field(finding, 'technicalDetails', 'TechnicalDetails', 'description', 'Description', 'details', 'Details')
  const rec         = field(finding, 'recommendation', 'Recommendation', 'fix', 'Fix')
  const compliance  = field(finding, 'complianceReference', 'ComplianceReference', 'compliance', 'Compliance')
  const cveId       = field(finding, 'cveId', 'CveId')
  const cvssScore   = field(finding, 'cvssScore', 'CvssScore')
  const line        = field(finding, 'line', 'Line', 'lineNumber', 'LineNumber')
  const style       = sevStyle(severity)

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{checkName}</p>
          {line && <p className="text-[10px] text-gray-500 font-mono">Line {line}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {cveId && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30">
              {cveId}
            </span>
          )}
          {cvssScore && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">
              CVSS {cvssScore}
            </span>
          )}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
            {severity || 'Info'}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          {details && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Details</p>
              <p className="text-sm text-gray-300">{details}</p>
            </div>
          )}
          {rec && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Recommendation</p>
              <p className="text-sm text-gray-300">{rec}</p>
            </div>
          )}
          {compliance && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Compliance Reference</p>
              <p className="text-xs text-gray-400 font-mono">{compliance}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const EXAMPLE_DOCKERFILE = `FROM ubuntu:latest

ENV DB_PASSWORD=supersecret123
ENV API_KEY=abc123xyz

RUN apt-get update && curl -sSL https://install.example.com | bash

USER root

COPY . /app
WORKDIR /app

RUN npm install
`

export default function ContainerScanPage() {
  const [mode, setMode]       = useState('paste')
  const [content, setContent] = useState('')
  const [url, setUrl]         = useState('')
  const [scanning, setScanning] = useState(false)
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState(null)
  const [sevFilter, setSevFilter] = useState('')
  const [showPassed, setShowPassed] = useState(false)

  const handleScan = async (e) => {
    e.preventDefault()
    const payload = mode === 'paste'
      ? { content: content.trim() }
      : { url: url.trim() }
    if (mode === 'paste' && !content.trim()) { setError('Paste a Dockerfile first.'); return }
    if (mode === 'url'   && !url.trim())     { setError('Enter a Dockerfile URL first.'); return }
    setScanning(true); setError(null); setResults(null)
    try {
      const data = await startContainerScan(payload)
      setResults(data)
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const handleClear = () => { setContent(''); setUrl(''); setResults(null); setError(null); setSevFilter('') }

  const summary    = results?.summary ?? results?.Summary ?? {}
  const allFindings = results?.findings ?? results?.Findings ?? []
  const failed     = allFindings.filter(f => (field(f, 'severity', 'Severity') || 'Info') !== 'Pass' && field(f, 'status', 'Status') !== 'pass')
  const passed     = allFindings.filter(f => field(f, 'status', 'Status') === 'pass' || field(f, 'passed', 'Passed') === true)
  const issueFindings = failed.length > 0 ? failed : allFindings.filter(f => {
    const sev = field(f, 'severity', 'Severity')
    return sev && sev !== 'Pass'
  })
  const passedFindings = allFindings.filter(f => {
    const sev = field(f, 'severity', 'Severity')
    return !sev || sev === 'Pass' || field(f, 'status', 'Status') === 'pass'
  })
  const displayFindings = issueFindings.length > 0 ? issueFindings : allFindings

  const severities = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const counts = severities.reduce((acc, s) => {
    acc[s] = displayFindings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === s).length
    return acc
  }, {})
  const filtered = sevFilter
    ? displayFindings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === sevFilter)
    : displayFindings

  const summaryTotal    = summary.total    ?? summary.Total    ?? allFindings.length
  const summaryCritical = summary.critical ?? summary.Critical ?? counts.Critical
  const summaryHigh     = summary.high     ?? summary.High     ?? counts.High
  const summaryMedium   = summary.medium   ?? summary.Medium   ?? counts.Medium
  const summaryLow      = summary.low      ?? summary.Low      ?? counts.Low

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <Container className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Dockerfile Security Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Scan Dockerfiles for Security Issues</h1>
            <p className="text-gray-400 leading-relaxed">
              Detect secrets in ENV vars, unpinned base images, root user containers, curl-pipe-bash patterns,
              and other Dockerfile misconfigurations before they reach production.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 self-start w-fit">
              <button
                type="button"
                onClick={() => { setMode('paste'); setError(null) }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'paste' ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Paste Content
              </button>
              <button
                type="button"
                onClick={() => { setMode('url'); setError(null) }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  mode === 'url' ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" /> URL
              </button>
            </div>

            {mode === 'paste' ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-gray-400">Dockerfile Content</label>
                  {!content && (
                    <button
                      type="button"
                      onClick={() => setContent(EXAMPLE_DOCKERFILE)}
                      className="text-[10px] text-crimson-400 hover:text-crimson-300 transition-colors"
                    >
                      Load example
                    </button>
                  )}
                </div>
                <textarea
                  rows={14}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={`FROM node:latest\n\nENV SECRET_KEY=abc123\n\nUSER root\n\nRUN curl -sSL https://install.example.com | bash\n...`}
                  className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm outline-none transition-colors resize-y font-mono leading-relaxed"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Dockerfile URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://raw.githubusercontent.com/org/repo/main/Dockerfile"
                  className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
                />
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={scanning}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                {scanning ? 'Scanning…' : 'Scan Dockerfile'}
              </button>
              {(content || url) && !scanning && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </form>

          {results && (
            <div className="space-y-5">
              {/* Summary chips */}
              <div className="flex flex-wrap gap-3">
                <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[72px]">
                  <div className="text-xl font-extrabold text-white">{summaryTotal}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Total</div>
                </div>
                {[
                  { label: 'Critical', val: summaryCritical, cls: 'text-red-400' },
                  { label: 'High',     val: summaryHigh,     cls: 'text-orange-400' },
                  { label: 'Medium',   val: summaryMedium,   cls: 'text-yellow-400' },
                  { label: 'Low',      val: summaryLow,      cls: 'text-blue-400' },
                ].map(({ label, val, cls }) => val > 0 && (
                  <div key={label} className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[72px]">
                    <div className={`text-xl font-extrabold ${cls}`}>{val}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {/* Severity filter pills */}
              {displayFindings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSevFilter('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                      !sevFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'
                    }`}
                  >
                    All ({displayFindings.length})
                  </button>
                  {severities.filter(s => counts[s] > 0).map(s => {
                    const style = sevStyle(s)
                    return (
                      <button
                        key={s}
                        onClick={() => setSevFilter(sevFilter === s ? '' : s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                          sevFilter === s
                            ? `${style.badge} border-current`
                            : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'
                        }`}
                      >
                        {s} ({counts[s]})
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Findings */}
              {filtered.length === 0 && displayFindings.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                  <p className="text-white font-semibold">No issues found</p>
                  <p className="text-sm text-gray-500">Your Dockerfile looks clean.</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">No findings match this filter.</div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((f, i) => <FindingRow key={i} finding={f} />)}
                </div>
              )}

              {/* Passed checks (collapsed) */}
              {passedFindings.length > 0 && (
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowPassed(p => !p)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/3 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="flex-1 text-left">{passedFindings.length} check{passedFindings.length !== 1 ? 's' : ''} passed</span>
                    {showPassed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showPassed && (
                    <div className="border-t border-white/10 px-4 py-3 space-y-2">
                      {passedFindings.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          {field(f, 'checkName', 'CheckName', 'name', 'Name', 'type', 'Type')}
                        </div>
                      ))}
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
