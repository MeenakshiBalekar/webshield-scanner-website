import React, { useState, useEffect } from 'react'
import {
  Eye, Loader2, AlertTriangle, CheckCircle2, ShieldAlert,
  Info, ChevronDown, ChevronUp,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { scanShadowAi, getShadowAiTools } from '../services/api'

const RISK_STYLE = {
  Critical: { badge: 'bg-red-500/15 text-red-400 border-red-500/30',    bar: 'bg-red-500' },
  High:     { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', bar: 'bg-orange-500' },
  Medium:   { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  bar: 'bg-amber-500' },
  Low:      { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',    bar: 'bg-blue-500' },
  None:     { badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30',    bar: 'bg-gray-500' },
}

const DATA_RISK_LABEL = {
  High:   'text-red-400',
  Medium: 'text-amber-400',
  Low:    'text-green-400',
}

function ToolCard({ tool }) {
  const [open, setOpen] = useState(false)

  const name      = tool.name      ?? tool.Name      ?? tool.tool      ?? ''
  const detected  = tool.detected  ?? tool.Detected  ?? false
  const riskLevel = tool.riskLevel ?? tool.RiskLevel ?? tool.risk      ?? 'Low'
  const dataRisk  = tool.dataRisk  ?? tool.DataRisk  ?? ''
  const purpose   = tool.purpose   ?? tool.Purpose   ?? ''
  const gaps      = tool.governanceGaps ?? tool.GovernanceGaps ?? tool.gaps ?? []
  const recs      = tool.recommendations ?? tool.Recommendations ?? []

  if (!detected) {
    return (
      <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-3 opacity-60">
        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        <p className="text-gray-400 text-sm flex-1">{name}</p>
        <span className="text-xs text-gray-600">Not detected</span>
      </div>
    )
  }

  const rs = RISK_STYLE[riskLevel] || RISK_STYLE.Medium

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <AlertTriangle className="w-4 h-4 text-crimson-400 shrink-0" />
        <p className="text-white text-sm font-medium flex-1">{name}</p>
        {dataRisk && <span className={`text-xs font-semibold ${DATA_RISK_LABEL[dataRisk] || 'text-gray-400'}`}>{dataRisk} data risk</span>}
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${rs.badge} ml-1`}>{riskLevel}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-3">
          {purpose && <p className="text-gray-400 text-xs leading-relaxed">{purpose}</p>}
          {gaps.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-amber-400 mb-1.5">Governance Gaps</p>
              <ul className="space-y-1">
                {gaps.map((g, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {typeof g === 'string' ? g : (g.gap ?? g.text ?? '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {recs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-crimson-400 mb-1.5">Recommendations</p>
              <ul className="space-y-1">
                {recs.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                    <span className="text-crimson-400 mt-0.5">→</span>
                    {typeof r === 'string' ? r : (r.recommendation ?? r.text ?? '')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ShadowAiPage() {
  const [url, setUrl]         = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [tools, setTools]     = useState([])

  useEffect(() => {
    getShadowAiTools().then((data) => {
      const list = Array.isArray(data) ? data : (data?.tools ?? data?.items ?? [])
      setTools(list)
    }).catch(() => {})
  }, [])

  const scan = async () => {
    const target = url.trim()
    if (!target) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const r = await scanShadowAi(target)
      setResult(r)
    } catch (e) {
      setError('Scan failed — the service is temporarily unavailable')
    }
    setLoading(false)
  }

  const riskLevel  = result?.riskLevel  ?? result?.RiskLevel  ?? 'None'
  const detectedTools = result?.detectedTools ?? result?.DetectedTools ?? result?.tools ?? []
  const allTools   = result?.allTools   ?? result?.AllTools   ?? detectedTools
  const gaps       = result?.governanceGaps ?? result?.GovernanceGaps ?? []
  const recs       = result?.recommendations ?? result?.Recommendations ?? []
  const summary    = result?.summary    ?? result?.Summary    ?? ''

  const rs = RISK_STYLE[riskLevel] || RISK_STYLE.None
  const detectedCount = detectedTools.length

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {/* Header */}
          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">AI Governance</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Eye className="w-8 h-8 text-crimson-400" /> Shadow AI Scanner
            </h1>
            <p className="text-gray-400">Detect unauthorised AI tools embedded in any website — OpenAI, Copilot, Claude widgets, and 10 more.</p>
          </div>

          {/* Input */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-6">
            <label className="block text-xs text-gray-400 mb-2">Website URL</label>
            <div className="flex gap-3">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && scan()}
                placeholder="https://example.com"
                className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              />
              <button
                onClick={scan}
                disabled={loading || !url.trim()}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                {loading ? 'Scanning…' : 'Scan'}
              </button>
            </div>

            {/* Tool catalogue */}
            {tools.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-500 mb-2">Detects {tools.length} AI tools including:</p>
                <div className="flex flex-wrap gap-1.5">
                  {tools.slice(0, 13).map((t, i) => (
                    <span key={i} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                      {typeof t === 'string' ? t : (t.name ?? t.Name ?? '')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Risk summary */}
              <div className={`flex items-center justify-between rounded-2xl px-6 py-4 border ${rs.badge}`}>
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6" />
                  <div>
                    <p className="font-bold text-sm">Overall Risk: {riskLevel}</p>
                    {detectedCount > 0
                      ? <p className="text-xs opacity-80">{detectedCount} AI tool{detectedCount !== 1 ? 's' : ''} detected</p>
                      : <p className="text-xs opacity-80">No AI tools detected</p>
                    }
                  </div>
                </div>
                {detectedCount === 0 && <CheckCircle2 className="w-6 h-6 text-green-400" />}
              </div>

              {summary && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5 flex gap-3">
                  <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
                </div>
              )}

              {/* Detected tools */}
              {allTools.length > 0 && (
                <div>
                  <h2 className="text-sm font-bold text-white mb-3">AI Tool Analysis</h2>
                  <div className="space-y-2">
                    {allTools.map((tool, i) => (
                      <ToolCard key={i} tool={tool} />
                    ))}
                  </div>
                </div>
              )}

              {/* Top-level gaps */}
              {gaps.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />Governance Gaps
                  </h2>
                  <ul className="space-y-2">
                    {gaps.map((g, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                        {typeof g === 'string' ? g : (g.gap ?? g.text ?? '')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top-level recs */}
              {recs.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                  <h2 className="text-sm font-bold text-white mb-3">Recommendations</h2>
                  <ol className="space-y-2">
                    {recs.map((r, i) => (
                      <li key={i} className="flex gap-3 items-start text-sm text-gray-400">
                        <span className="shrink-0 w-5 h-5 rounded-full bg-crimson-500/20 border border-crimson-500/40 text-crimson-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                        {typeof r === 'string' ? r : (r.recommendation ?? r.text ?? '')}
                      </li>
                    ))}
                  </ol>
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
