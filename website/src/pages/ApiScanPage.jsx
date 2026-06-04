import React, { useState } from 'react'
import {
  Code2, Loader2, AlertTriangle, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Globe, Lock,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { startApiScan } from '../services/api'

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const METHOD_STYLE = {
  GET:    'bg-green-500/15 text-green-400 border-green-500/30',
  POST:   'bg-blue-500/15 text-blue-400 border-blue-500/30',
  PUT:    'bg-amber-500/15 text-amber-400 border-amber-500/30',
  PATCH:  'bg-amber-500/15 text-amber-400 border-amber-500/30',
  DELETE: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function EndpointCard({ endpoint }) {
  const [open, setOpen] = useState(false)

  const path    = endpoint.path     ?? endpoint.Path     ?? endpoint.url      ?? ''
  const method  = (endpoint.method  ?? endpoint.Method   ?? 'GET').toUpperCase()
  const issues  = endpoint.issues   ?? endpoint.Issues   ?? endpoint.findings ?? []
  const auth    = endpoint.requiresAuth ?? endpoint.RequiresAuth ?? null
  const exposed = endpoint.exposedData  ?? endpoint.ExposedData  ?? []

  const ms = METHOD_STYLE[method] || METHOD_STYLE.GET

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-white/3 transition-colors">
        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${ms}`}>{method}</span>
        <p className="text-gray-300 text-sm font-mono flex-1 truncate">{path}</p>
        {auth === false && (
          <span className="shrink-0 flex items-center gap-1 text-xs text-amber-400">
            <Globe className="w-3 h-3" />Unauthenticated
          </span>
        )}
        {auth === true && (
          <span className="shrink-0 flex items-center gap-1 text-xs text-gray-500">
            <Lock className="w-3 h-3" />Auth required
          </span>
        )}
        {issues.length > 0 && (
          <span className="shrink-0 text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded">
            {issues.length} issue{issues.length !== 1 ? 's' : ''}
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 space-y-3">
          {issues.length === 0 && exposed.length === 0 && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-green-400" />No issues found</p>
          )}
          {issues.map((iss, i) => {
            const name   = iss.name      ?? iss.Name      ?? iss.check      ?? (typeof iss === 'string' ? iss : '')
            const sev    = iss.severity  ?? iss.Severity  ?? 'Medium'
            const detail = iss.description ?? iss.Description ?? iss.detail ?? ''
            return (
              <div key={i} className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-xs font-semibold">{name}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV_STYLE[sev] || SEV_STYLE.Medium}`}>{sev}</span>
                  </div>
                  {detail && <p className="text-gray-500 text-xs mt-0.5">{detail}</p>}
                </div>
              </div>
            )
          })}
          {exposed.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-1.5">Exposed Data</p>
              <div className="flex flex-wrap gap-1.5">
                {exposed.map((d, i) => (
                  <span key={i} className="text-xs bg-amber-500/10 border border-amber-500/25 text-amber-300 px-2 py-0.5 rounded-full">
                    {typeof d === 'string' ? d : (d.field ?? d.type ?? '')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ApiScanPage() {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const scan = async () => {
    const target = url.trim()
    if (!target) return
    setLoading(true); setError(null); setResult(null)
    try {
      const r = await startApiScan(target)
      setResult(r)
    } catch (e) { setError(e.message || 'API scan failed') }
    setLoading(false)
  }

  const endpoints = result?.endpoints ?? result?.Endpoints ?? result?.apis ?? []
  const score     = result?.score     ?? result?.Score     ?? null
  const totalIssues = endpoints.reduce((n, e) => n + (e.issues ?? e.Issues ?? []).length, 0)
  const summary   = result?.summary   ?? result?.Summary   ?? ''

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Scanners</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Code2 className="w-8 h-8 text-crimson-400" /> API Security Scanner
            </h1>
            <p className="text-gray-400">Discover API endpoints and test for authorization bypasses, data exposure, and injection flaws.</p>
          </div>

          <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-6">
            <label className="block text-xs text-gray-400 mb-2">Target URL or OpenAPI spec URL</label>
            <div className="flex gap-3">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && scan()}
                placeholder="https://api.example.com or https://example.com/openapi.json"
                className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              />
              <button
                onClick={scan}
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                {loading ? 'Scanning…' : 'Scan API'}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">Supports REST APIs, OpenAPI/Swagger specs, and GraphQL introspection endpoints.</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Summary bar */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5 flex flex-wrap gap-6">
                {score !== null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">API Security Score</p>
                    <p className="text-3xl font-extrabold text-white">{score}<span className="text-lg text-gray-500">/100</span></p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Endpoints Discovered</p>
                  <p className="text-3xl font-extrabold text-white">{endpoints.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Issues Found</p>
                  <p className={`text-3xl font-extrabold ${totalIssues > 0 ? 'text-red-400' : 'text-green-400'}`}>{totalIssues}</p>
                </div>
              </div>

              {summary && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-sm text-gray-300 leading-relaxed">
                  {summary}
                </div>
              )}

              {endpoints.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-white mb-3">Discovered Endpoints ({endpoints.length})</h2>
                  <div className="space-y-2">
                    {endpoints.map((ep, i) => (
                      <EndpointCard key={ep.path ?? ep.Path ?? i} endpoint={ep} />
                    ))}
                  </div>
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
