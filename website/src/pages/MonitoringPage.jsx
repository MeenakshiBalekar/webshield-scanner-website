import React, { useState, useEffect } from 'react'
import {
  Activity, Loader2, AlertTriangle, TrendingDown, TrendingUp,
  Minus, Search, ChevronDown, ChevronUp,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMonitoringTimeline, getMonitoringRegressions } from '../services/api'

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

function ScoreChart({ points }) {
  if (!points || points.length < 2) return <p className="text-gray-600 text-xs py-4 text-center">Not enough data for chart</p>
  const scores = points.map((p) => p.score ?? p.Score ?? 0)
  const dates  = points.map((p) => p.date ?? p.Date ?? p.scannedAt ?? p.ScannedAt ?? '')
  const min = Math.min(...scores)
  const max = Math.max(...scores)
  const range = max - min || 10
  const w = 560; const h = 120; const pad = 8
  const toX = (i) => pad + (i / (scores.length - 1)) * (w - 2 * pad)
  const toY = (v) => h - pad - ((v - min) / range) * (h - 2 * pad)
  const pts = scores.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
  const fillPts = `${toX(0)},${h} ${pts} ${toX(scores.length - 1)},${h}`
  const last   = scores[scores.length - 1]
  const color  = last >= 80 ? '#22c55e' : last >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="overflow-x-auto">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full min-w-[300px]">
        <defs>
          <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <polygon points={fillPts} fill="url(#scoreGrad)" />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {scores.map((v, i) => (
          <circle key={i} cx={toX(i)} cy={toY(v)} r="3" fill={color} />
        ))}
      </svg>
      {dates.length > 1 && (
        <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
          <span>{dates[0] ? new Date(dates[0]).toLocaleDateString() : ''}</span>
          <span>{dates[dates.length - 1] ? new Date(dates[dates.length - 1]).toLocaleDateString() : ''}</span>
        </div>
      )}
    </div>
  )
}

function RegressionCard({ reg }) {
  const [open, setOpen] = useState(false)
  const url      = reg.url      ?? reg.Url      ?? reg.target ?? ''
  const drop     = reg.scoreDrop ?? reg.ScoreDrop ?? reg.drop ?? 0
  const newScore = reg.newScore ?? reg.NewScore ?? reg.score ?? null
  const oldScore = reg.oldScore ?? reg.OldScore ?? null
  const checks   = reg.newFailures ?? reg.NewFailures ?? reg.failures ?? []
  const detectedAt = reg.detectedAt ?? reg.DetectedAt ?? ''

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors">
        <TrendingDown className="w-5 h-5 text-red-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{url}</p>
          {detectedAt && <p className="text-xs text-gray-500">{new Date(detectedAt).toLocaleString()}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {oldScore !== null && newScore !== null && (
            <span className="text-xs text-gray-400">{oldScore} → <span className="text-white font-bold">{newScore}</span></span>
          )}
          <span className="text-sm font-extrabold text-red-400">-{drop}</span>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </button>
      {open && checks.length > 0 && (
        <div className="border-t border-white/10 px-5 py-3">
          <p className="text-xs font-semibold text-red-400 mb-2">New Failures</p>
          <ul className="space-y-1">
            {checks.map((c, i) => {
              const name = typeof c === 'string' ? c : (c.name ?? c.Name ?? c.checkName ?? '')
              const sev  = typeof c === 'object' ? (c.severity ?? c.Severity ?? '') : ''
              return (
                <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="text-red-400">•</span>
                  <span className="flex-1">{name}</span>
                  {sev && <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${SEV_STYLE[sev] || ''}`}>{sev}</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function MonitoringPage() {
  const [tab, setTab]           = useState('timeline')
  const [url, setUrl]           = useState('')
  const [timeline, setTimeline] = useState(null)
  const [regressions, setRegressions] = useState([])
  const [loading, setLoading]   = useState(false)
  const [regLoading, setRegLoading] = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    getMonitoringRegressions()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.regressions ?? data?.items ?? [])
        setRegressions(list)
      })
      .catch(() => {})
      .finally(() => setRegLoading(false))
  }, [])

  const fetchTimeline = async () => {
    const target = url.trim()
    if (!target) return
    setLoading(true); setError(null); setTimeline(null)
    try {
      const data = await getMonitoringTimeline(target)
      setTimeline(data)
    } catch (e) { setError(e.message || 'No timeline data found') }
    setLoading(false)
  }

  const points  = timeline?.points ?? timeline?.Points ?? timeline?.history ?? timeline?.History ?? []
  const current = timeline?.currentScore ?? timeline?.CurrentScore ?? timeline?.score ?? null
  const trendDelta = points.length > 1
    ? (points[points.length - 1]?.score ?? 0) - (points[0]?.score ?? 0)
    : null

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Security Intelligence</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Activity className="w-8 h-8 text-crimson-400" /> Monitoring
            </h1>
            <p className="text-gray-400">Track security score over time and catch regressions early.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
            {[['timeline', 'Score Timeline'], ['regressions', 'Regressions']].map(([val, label]) => (
              <button key={val} onClick={() => setTab(val)}
                className={`text-sm font-semibold px-5 py-2 rounded-lg transition-colors ${tab === val ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {label}
                {val === 'regressions' && regressions.length > 0 && (
                  <span className="ml-1.5 text-xs bg-red-500/30 text-red-300 px-1.5 py-0.5 rounded-full">{regressions.length}</span>
                )}
              </button>
            ))}
          </div>

          {tab === 'timeline' && (
            <div className="space-y-5">
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                <div className="flex gap-3">
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchTimeline()}
                    placeholder="https://example.com"
                    className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                  />
                  <button onClick={fetchTimeline} disabled={loading || !url.trim()}
                    className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {loading ? 'Loading…' : 'View Timeline'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}

              {timeline && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    {current !== null && (
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Current Score</p>
                        <p className="text-4xl font-extrabold text-white">{current}<span className="text-xl text-gray-500">/100</span></p>
                      </div>
                    )}
                    {trendDelta !== null && (
                      <div className="flex items-center gap-1.5">
                        {trendDelta > 0
                          ? <TrendingUp className="w-5 h-5 text-green-400" />
                          : trendDelta < 0
                          ? <TrendingDown className="w-5 h-5 text-red-400" />
                          : <Minus className="w-5 h-5 text-gray-400" />}
                        <span className={`text-sm font-bold ${trendDelta > 0 ? 'text-green-400' : trendDelta < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                          {trendDelta > 0 ? '+' : ''}{trendDelta} since first scan
                        </span>
                      </div>
                    )}
                  </div>
                  <ScoreChart points={points} />
                </div>
              )}

              {!timeline && !loading && !error && (
                <div className="text-center py-12 text-gray-600 text-sm">Enter a URL above to view its score timeline.</div>
              )}
            </div>
          )}

          {tab === 'regressions' && (
            <div className="space-y-3">
              {regLoading ? (
                <div className="flex items-center gap-2 text-gray-400 py-12 justify-center text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />Loading regressions…
                </div>
              ) : regressions.length === 0 ? (
                <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl text-gray-500">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-semibold text-white">No regressions detected</p>
                  <p className="text-sm mt-1">All monitored assets are trending stable or improving.</p>
                </div>
              ) : regressions.map((r, i) => (
                <RegressionCard key={r.url ?? r.Url ?? i} reg={r} />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
