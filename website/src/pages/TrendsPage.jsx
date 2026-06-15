import React, { useState, useEffect } from 'react'
import {
  TrendingUp, Loader2, AlertCircle, TrendingDown,
  Minus, Activity,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getDashboardTrends, getRiskScores } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

/* ── Band chart: avg line + min/max shaded area ── */
function BandChart({ data }) {
  if (!data?.length) return (
    <div className="flex items-center justify-center h-48 text-sm text-gray-600">No trend data available</div>
  )

  const W = 600, H = 160
  const pad = { t: 16, r: 16, b: 32, l: 40 }
  const cw  = W - pad.l - pad.r
  const ch  = H - pad.t - pad.b
  const n   = data.length

  const avgs = data.map(d => field(d, 'avg', 'Avg', 'avgScore', 'AvgScore', 'score') ?? 0)
  const mins = data.map(d => field(d, 'min', 'Min', 'minScore', 'MinScore') ?? avgs[0])
  const maxs = data.map(d => field(d, 'max', 'Max', 'maxScore', 'MaxScore') ?? avgs[0])
  const labels = data.map(d => field(d, 'label', 'Label', 'week', 'Week') ?? '')

  const allVals = [...avgs, ...mins, ...maxs]
  const minV = Math.max(0, Math.min(...allVals) - 5)
  const maxV = Math.min(100, Math.max(...allVals) + 5)

  const xOf = (i) => pad.l + (n === 1 ? cw / 2 : (i / (n - 1)) * cw)
  const yOf = (v) => pad.t + ch - ((v - minV) / (maxV - minV || 1)) * ch

  const avgPath  = avgs.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(v)}`).join(' ')
  const bandPath = [
    ...maxs.map((v, i) => `${i === 0 ? 'M' : 'L'}${xOf(i)},${yOf(v)}`),
    ...[...mins].reverse().map((v, i) => `L${xOf(n - 1 - i)},${yOf(v)}`),
    'Z',
  ].join(' ')

  const gridVals = [0, 25, 50, 75, 100].filter(v => v >= minV - 5 && v <= maxV + 5)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <defs>
        <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E31837" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#E31837" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {gridVals.map(v => (
        <g key={v}>
          <line x1={pad.l} y1={yOf(v)} x2={W - pad.r} y2={yOf(v)} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={pad.l - 6} y={yOf(v) + 4} textAnchor="end" fill="rgba(255,255,255,0.28)" fontSize="10">{v}</text>
        </g>
      ))}
      <path d={bandPath} fill="url(#bandFill)" stroke="none" />
      <path d={avgPath} fill="none" stroke="#E31837" strokeWidth="2.5" strokeLinejoin="round" />
      {avgs.map((v, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(v)} r="3.5" fill="#E31837" />
      ))}
      {labels.map((lbl, i) => (
        <text key={i} x={xOf(i)} y={H - 8} textAnchor="middle" fill="rgba(255,255,255,0.28)" fontSize="9">{lbl}</text>
      ))}
      {/* Legend */}
      <rect x={pad.l} y={pad.t - 2} width="10" height="6" fill="url(#bandFill)" rx="2" />
      <text x={pad.l + 14} y={pad.t + 4} fill="rgba(255,255,255,0.3)" fontSize="9">Min/Max range</text>
      <line x1={pad.l + 90} y1={pad.t + 1} x2={pad.l + 100} y2={pad.t + 1} stroke="#E31837" strokeWidth="2" />
      <text x={pad.l + 104} y={pad.t + 4} fill="rgba(255,255,255,0.3)" fontSize="9">Avg score</text>
    </svg>
  )
}

/* ── Asset comparison table ── */
function DeltaBadge({ delta }) {
  if (delta == null) return <span className="text-gray-600">—</span>
  const n = Number(delta)
  if (n > 0) return (
    <span className="flex items-center gap-0.5 text-green-400 font-bold text-xs">
      <TrendingUp className="w-3 h-3" />+{n.toFixed(1)}
    </span>
  )
  if (n < 0) return (
    <span className="flex items-center gap-0.5 text-red-400 font-bold text-xs">
      <TrendingDown className="w-3 h-3" />{n.toFixed(1)}
    </span>
  )
  return <span className="flex items-center gap-0.5 text-gray-500 text-xs"><Minus className="w-3 h-3" />0</span>
}

function ScoreDot({ score }) {
  const n = Number(score ?? 0)
  const color = n >= 80 ? 'bg-green-500' : n >= 60 ? 'bg-yellow-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
      <span className="text-sm font-bold text-white">{n}</span>
    </div>
  )
}

export default function TrendsPage() {
  const [trendsData, setTrendsData] = useState(null)
  const [scoresData, setScoresData] = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

  useEffect(() => {
    Promise.all([
      getDashboardTrends().catch(() => null),
      getRiskScores().catch(() => null),
    ]).then(([trends, scores]) => {
      setTrendsData(trends)
      setScoresData(scores)
    }).catch(e => setError(e.message || 'Failed to load trends')).finally(() => setLoading(false))
  }, [])

  const weekly  = field(trendsData, 'weeklyTrend', 'WeeklyTrend', 'trend', 'Trend') ?? []
  const assets  = (() => {
    const fromTrends = field(trendsData, 'assetComparison', 'AssetComparison')
    if (fromTrends) return Array.isArray(fromTrends) ? fromTrends : []
    const fromScores = Array.isArray(scoresData) ? scoresData : (field(scoresData, 'scores', 'Scores', 'assets', 'Assets') ?? [])
    return fromScores
  })()

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Trend Analysis</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Security Score Trends</h1>
            <p className="text-gray-400">Weekly score progression and asset-by-asset comparison.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-16 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading trends…
            </div>
          ) : (
            <>
              {/* Band chart */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <h2 className="text-sm font-bold text-white">Weekly Score — Avg / Min / Max</h2>
                </div>
                <BandChart data={weekly} />
              </div>

              {/* Asset comparison table */}
              {assets.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10">
                    <h2 className="text-sm font-bold text-white">Asset Score Comparison</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Latest scan score vs. previous scan</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    <div className="grid grid-cols-12 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                      <span className="col-span-6">Asset</span>
                      <span className="col-span-3 text-center">Score</span>
                      <span className="col-span-3 text-right">Change</span>
                    </div>
                    {assets.map((a, i) => {
                      const name  = field(a, 'name', 'Name', 'assetName', 'AssetName', 'url', 'Url', 'domain', 'Domain') ?? `Asset ${i + 1}`
                      const score = field(a, 'latestScore', 'LatestScore', 'score', 'Score', 'securityScore') ?? 0
                      const delta = field(a, 'delta', 'Delta', 'change', 'Change', 'scoreDelta', 'ScoreDelta')
                      return (
                        <div key={i} className="grid grid-cols-12 px-5 py-3 hover:bg-white/3 transition-colors items-center">
                          <div className="col-span-6 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{name}</p>
                          </div>
                          <div className="col-span-3 flex justify-center">
                            <ScoreDot score={score} />
                          </div>
                          <div className="col-span-3 flex justify-end">
                            <DeltaBadge delta={delta} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {!loading && weekly.length === 0 && assets.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-16 text-center bg-white/3 border border-white/10 rounded-2xl">
                  <Activity className="w-10 h-10 text-gray-600" />
                  <p className="text-white font-semibold">No trend data yet</p>
                  <p className="text-sm text-gray-500">Run scans on your assets to start tracking score changes over time.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
