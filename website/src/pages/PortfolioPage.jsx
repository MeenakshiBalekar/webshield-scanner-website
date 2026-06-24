import React, { useState, useEffect } from 'react'
import {
  Layers, Loader2, ArrowUpRight, ExternalLink,
  ShieldAlert, CheckCircle2, Search,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAllAssets, getRiskScores } from '../services/api'

const TIER_STYLE = {
  Critical: { badge: 'bg-red-500/15 text-red-400 border-red-500/30',    bar: 'bg-red-500',    dot: 'bg-red-500' },
  High:     { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', bar: 'bg-orange-500', dot: 'bg-orange-500' },
  Medium:   { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  bar: 'bg-amber-500',  dot: 'bg-amber-500' },
  Low:      { badge: 'bg-green-500/15 text-green-400 border-green-500/30',   bar: 'bg-green-500',  dot: 'bg-green-500' },
  Unknown:  { badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30',     bar: 'bg-gray-500',   dot: 'bg-gray-500' },
}

function Sparkline({ scores }) {
  if (!scores || scores.length < 2) return null
  const vals = scores.map((s) => (typeof s === 'number' ? s : (s.score ?? s.Score ?? 0)))
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const w = 80
  const h = 28
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`)
  const trend = vals[vals.length - 1] - vals[0]
  const color = trend >= 0 ? '#22c55e' : '#ef4444'
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

function AssetRow({ asset, scoreMap }) {
  const id      = asset.id       ?? asset.Id       ?? asset.AssetId    ?? ''
  const url     = asset.url      ?? asset.Url      ?? asset.target     ?? asset.Target ?? ''
  const name    = asset.name     ?? asset.Name     ?? url
  const riskData = scoreMap[id] || {}
  const score   = riskData.score    ?? riskData.Score    ?? asset.score ?? asset.Score ?? null
  const tier    = riskData.riskLevel ?? riskData.RiskLevel ?? asset.riskLevel ?? asset.RiskLevel ?? 'Unknown'
  const history = riskData.history   ?? riskData.History  ?? riskData.scores ?? riskData.Scores ?? []
  const lastScan = asset.lastScannedAt ?? asset.LastScannedAt ?? asset.updatedAt ?? ''
  const ts = TIER_STYLE[tier] || TIER_STYLE.Unknown

  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${ts.dot}`} />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate max-w-[200px]">{name}</p>
            {name !== url && <p className="text-gray-500 text-xs truncate max-w-[200px]">{url}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${ts.badge}`}>{tier}</span>
      </td>
      <td className="px-4 py-4">
        {score !== null
          ? <span className="text-white font-bold text-sm">{score}<span className="text-gray-500 font-normal text-xs">/100</span></span>
          : <span className="text-gray-600 text-xs">—</span>
        }
      </td>
      <td className="px-4 py-4">
        <Sparkline scores={history} />
      </td>
      <td className="px-4 py-4 text-gray-500 text-xs">
        {lastScan ? new Date(lastScan).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-4">
        <Link to={`/assets`} className="text-crimson-400 hover:text-crimson-300 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </td>
    </tr>
  )
}

export default function PortfolioPage() {
  const [assets, setAssets]   = useState([])
  const [scoreMap, setScoreMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [tierFilter, setTierFilter] = useState('All')

  useEffect(() => {
    Promise.all([getAllAssets(), getRiskScores()])
      .then(([assetData, scoreData]) => {
        const list = Array.isArray(assetData) ? assetData : (assetData?.assets ?? assetData?.items ?? [])
        setAssets(list)

        const map = {}
        const scores = Array.isArray(scoreData) ? scoreData : (scoreData?.scores ?? scoreData?.items ?? [])
        scores.forEach((s) => {
          const sid = s.assetId ?? s.AssetId ?? s.id ?? s.Id ?? ''
          if (sid) map[sid] = s
        })
        setScoreMap(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = assets.filter((a) => {
    const url  = (a.url ?? a.Url ?? a.target ?? '').toLowerCase()
    const name = (a.name ?? a.Name ?? '').toLowerCase()
    const q    = search.toLowerCase()
    if (q && !url.includes(q) && !name.includes(q)) return false
    if (tierFilter !== 'All') {
      const id = a.id ?? a.Id ?? ''
      const tier = scoreMap[id]?.riskLevel ?? scoreMap[id]?.RiskLevel ?? a.riskLevel ?? 'Unknown'
      if (tier !== tierFilter) return false
    }
    return true
  })

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  assets.forEach((a) => {
    const id = a.id ?? a.Id ?? ''
    const t  = scoreMap[id]?.riskLevel ?? scoreMap[id]?.RiskLevel ?? a.riskLevel ?? ''
    if (counts[t] !== undefined) counts[t]++
  })

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Assets</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Layers className="w-8 h-8 text-crimson-400" /> Asset Portfolio
            </h1>
            <p className="text-gray-400">All registered assets with risk tier and security score trend.</p>
          </div>

          {/* Risk tier summary */}
          {assets.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-6">
              {['Critical', 'High', 'Medium', 'Low'].map((t) => (
                <div key={t} className={`rounded-2xl p-4 border text-center cursor-pointer transition-colors ${tierFilter === t ? TIER_STYLE[t].badge : 'bg-white/3 border-white/10'}`}
                  onClick={() => setTierFilter(tierFilter === t ? 'All' : t)}>
                  <p className="text-2xl font-extrabold text-white">{counts[t]}</p>
                  <p className="text-xs font-bold mt-0.5 text-gray-400">{t}</p>
                </div>
              ))}
            </div>
          )}

          {/* Search + filter */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assets…"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              />
            </div>
            {tierFilter !== 'All' && (
              <button onClick={() => setTierFilter('All')} className="text-xs text-gray-400 hover:text-white border border-white/15 px-3 py-2 rounded-xl transition-colors">
                Clear filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />Loading portfolio…
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl text-gray-500">
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-white">No assets registered</p>
              <p className="text-sm mt-1 mb-4">Add assets in the Assets page to track them here.</p>
              <Link to="/assets" className="inline-flex items-center gap-1.5 text-sm text-crimson-400 hover:text-crimson-300 font-semibold">
                Go to Assets <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left px-6 py-3">Asset</th>
                    <th className="text-left px-4 py-3">Risk Tier</th>
                    <th className="text-left px-4 py-3">Score</th>
                    <th className="text-left px-4 py-3">Trend</th>
                    <th className="text-left px-4 py-3">Last Scan</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a, i) => (
                    <AssetRow key={a.id ?? a.Id ?? i} asset={a} scoreMap={scoreMap} />
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-gray-600 text-sm">No assets match the current filter.</div>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
