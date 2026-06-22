import React, { useState, useRef } from 'react'
import { Shield, Upload, ScanLine, Loader2, AlertCircle, ChevronDown, ChevronUp, FileJson } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { runApiSecurityScan } from '../services/api'
import ApiErrorBanner from '../components/ApiErrorBanner'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         dot: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       dot: 'bg-blue-400'   },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       dot: 'bg-gray-400'   },
}
function sevStyle(s) { return SEV[(s ?? '').charAt(0).toUpperCase() + (s ?? '').slice(1)] || SEV.Info }

const METHOD_COLOR = {
  GET:    'bg-blue-500/15 border-blue-500/30 text-blue-300',
  POST:   'bg-green-500/15 border-green-500/30 text-green-300',
  PUT:    'bg-yellow-500/15 border-yellow-500/30 text-yellow-300',
  PATCH:  'bg-amber-500/15 border-amber-500/30 text-amber-300',
  DELETE: 'bg-red-500/15 border-red-500/30 text-red-300',
}
function methodStyle(m) { return METHOD_COLOR[(m ?? '').toUpperCase()] ?? 'bg-gray-500/15 border-gray-500/30 text-gray-300' }

const STATUS_STYLE = {
  vulnerable: 'text-red-400 bg-red-500/10 border-red-500/30',
  warning:    'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  ok:         'text-green-400 bg-green-500/10 border-green-500/30',
}
function statusStyle(s) { return STATUS_STYLE[(s ?? '').toLowerCase()] ?? STATUS_STYLE.ok }
function statusLabel(s) {
  const l = (s ?? '').toLowerCase()
  if (l === 'vulnerable') return 'Vulnerable'
  if (l === 'warning')    return 'Warning'
  return 'OK'
}

/* ── Endpoint card ── */
function EndpointCard({ ep }) {
  const [open, setOpen] = useState(false)
  const method   = field(ep, 'method', 'Method') ?? 'GET'
  const path     = field(ep, 'path', 'Path', 'endpoint', 'Endpoint') ?? '/'
  const status   = field(ep, 'status', 'Status') ?? 'ok'
  const findings = field(ep, 'findings', 'Findings') ?? []

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-white/20' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
      >
        {/* Method badge */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono shrink-0 ${methodStyle(method)}`}>
          {method.toUpperCase()}
        </span>
        {/* Path */}
        <span className="flex-1 text-sm font-mono text-white truncate">{path}</span>
        {/* Findings count */}
        {findings.length > 0 && (
          <span className="text-[10px] text-gray-500 shrink-0">
            {findings.length} finding{findings.length !== 1 ? 's' : ''}
          </span>
        )}
        {/* Status */}
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${statusStyle(status)}`}>
          {statusLabel(status)}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
      </button>

      {open && findings.length > 0 && (
        <div className="border-t border-white/8 divide-y divide-white/5">
          {findings.map((f, i) => {
            const type  = field(f, 'type', 'Type', 'name', 'Name', 'checkName', 'CheckName') ?? 'Issue'
            const sev   = field(f, 'severity', 'Severity') ?? 'Medium'
            const desc  = field(f, 'description', 'Description', 'detail', 'Detail')
            const fix   = field(f, 'fix', 'Fix', 'recommendation', 'Recommendation', 'remediation', 'Remediation')
            const s     = sevStyle(sev)
            return (
              <div key={i} className="px-4 py-3 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                  <span className="text-sm font-medium text-white">{type}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.badge}`}>
                    {sev}
                  </span>
                </div>
                {desc && <p className="text-xs text-gray-400 leading-relaxed pl-3.5">{desc}</p>}
                {fix && (
                  <div className="ml-3.5 bg-green-950/30 border border-green-800/30 rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold text-green-400 mb-0.5">Fix</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{fix}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {open && findings.length === 0 && (
        <div className="border-t border-white/8 px-4 py-3 text-xs text-gray-600 text-center">
          No security findings for this endpoint.
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function ApiSecurityPage() {
  const [spec, setSpec]       = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [fileName, setFileName] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [results, setResults] = useState(null)
  const fileRef = useRef(null)

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    const reader = new FileReader()
    reader.onload = (ev) => setSpec(ev.target.result ?? '')
    reader.readAsText(f)
  }

  const handleScan = async () => {
    if (!spec.trim()) return
    setLoading(true); setError(null); setResults(null)
    try {
      let parsed
      try { parsed = JSON.parse(spec) } catch { parsed = spec }
      const data = await runApiSecurityScan({ spec: parsed, baseUrl: baseUrl.trim() || undefined })
      setResults(data)
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }

  const endpoints = results
    ? (field(results, 'endpoints', 'Endpoints') ?? [])
    : []
  const summary = field(results, 'summary', 'Summary') ?? {}
  const total       = field(summary, 'total', 'Total') ?? endpoints.length
  const vulnerable  = field(summary, 'vulnerable', 'Vulnerable') ?? endpoints.filter(e => (field(e,'status','Status') ?? '').toLowerCase() === 'vulnerable').length
  const warnings    = field(summary, 'warnings', 'Warnings') ?? endpoints.filter(e => (field(e,'status','Status') ?? '').toLowerCase() === 'warning').length
  const passed      = field(summary, 'passed', 'Passed') ?? (total - vulnerable - warnings)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4 bg-blue-500/3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">API Security</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">API Security Scanner</h1>
            <p className="text-gray-400 text-sm mt-1">
              Upload an OpenAPI or Postman collection to scan for misconfigurations, auth gaps, and injection risks.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Input card */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
            {/* File upload strip */}
            <div className="flex items-center gap-3">
              <input ref={fileRef} type="file" accept=".json,.yaml,.yml" className="hidden" onChange={handleFile} />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-xs font-semibold bg-white/5 hover:bg-white/8 border border-white/15 text-gray-300 px-4 py-2 rounded-xl transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload spec
              </button>
              {fileName && (
                <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-1.5">
                  <FileJson className="w-3.5 h-3.5" /> {fileName}
                </div>
              )}
              <span className="text-xs text-gray-600">or paste below</span>
            </div>

            {/* Paste area */}
            <textarea
              value={spec}
              onChange={e => setSpec(e.target.value)}
              placeholder='Paste OpenAPI / Postman JSON here…\n\n{"openapi":"3.0.0","paths":{...}}'
              rows={10}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-gray-300 placeholder:text-gray-600 resize-none outline-none focus:border-white/20 transition-colors"
            />

            {/* Base URL */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Base URL (optional)</label>
              <input
                type="text"
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://api.example.com"
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-white/20 transition-colors"
              />
            </div>

            <button
              onClick={handleScan}
              disabled={!spec.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {loading ? 'Scanning…' : 'Scan API Spec'}
            </button>
          </div>

          {error && <ApiErrorBanner error={error} />}

          {results && (
            <div className="space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Endpoints',   val: total,      cls: 'text-white'        },
                  { label: 'Vulnerable',  val: vulnerable, cls: 'text-red-400'      },
                  { label: 'Warnings',    val: warnings,   cls: 'text-yellow-400'   },
                  { label: 'Passed',      val: passed,     cls: 'text-green-400'    },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="bg-white/3 border border-white/10 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-extrabold ${cls}`}>{val}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Endpoint list */}
              {endpoints.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Endpoints</p>
                  {endpoints.map((ep, i) => (
                    <EndpointCard key={i} ep={ep} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-sm text-gray-500">No endpoint data returned.</div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
