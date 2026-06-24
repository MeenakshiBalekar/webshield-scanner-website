import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, AlertTriangle, CheckCircle2, XCircle, Loader2, Lock } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getSharedScan } from '../services/api'

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

function ScoreRing({ score }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const pct  = Math.min(100, Math.max(0, score))
  const dash  = (pct / 100) * circ
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#E31837'

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="mx-auto">
      <circle cx="70" cy="70" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
      <circle
        cx="70" cy="70" r={r}
        stroke={color} strokeWidth="10" fill="none"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
      />
      <text x="70" y="64" textAnchor="middle" fill="white" fontSize="28" fontWeight="800">{score}</text>
      <text x="70" y="82" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">/100</text>
    </svg>
  )
}

export default function SharedScanPage() {
  const { token } = useParams()
  const [scan, setScan]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  useEffect(() => {
    getSharedScan(token)
      .then(setScan)
      .catch((e) => setError('This link has expired or is invalid.'))
      .finally(() => setLoading(false))
  }, [token])

  const score   = scan?.score      ?? scan?.Score      ?? 0
  const grade   = scan?.grade      ?? scan?.Grade      ?? '—'
  const url     = scan?.url        ?? scan?.Url        ?? scan?.target ?? ''
  const checks  = scan?.checks     ?? scan?.Checks     ?? scan?.results ?? []
  const scannedAt = scan?.scannedAt ?? scan?.ScannedAt ?? scan?.date ?? ''
  const failed  = checks.filter((c) => {
    const passed = c.passed ?? c.Passed ?? c.status === 'pass' ?? false
    return !passed
  })

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          {loading && (
            <div className="flex flex-col items-center gap-3 py-24 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading shared scan…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center gap-4 py-24 text-center">
              <Lock className="w-12 h-12 text-gray-600" />
              <p className="text-white font-bold text-xl">Link unavailable</p>
              <p className="text-gray-400 text-sm max-w-sm">{error}</p>
              <p className="text-xs text-gray-500">Shared scan links are valid for 48 hours after creation.</p>
              <Link to="/scanner" className="mt-4 inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                <Shield className="w-4 h-4" /> Scan My Site Free
              </Link>
            </div>
          )}

          {scan && (
            <div className="space-y-6">
              {/* Header */}
              <div className="mb-6">
                <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Shared Scan Report</p>
                <h1 className="text-2xl font-extrabold text-white break-all">{url}</h1>
                {scannedAt && (
                  <p className="text-gray-500 text-xs mt-1">Scanned {new Date(scannedAt).toLocaleString()}</p>
                )}
              </div>

              {/* Score */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center">
                <ScoreRing score={score} />
                <p className="text-3xl font-extrabold text-white mt-4">Grade {grade}</p>
                <p className="text-gray-400 text-sm mt-1">
                  {score >= 80 ? 'Good security posture' : score >= 60 ? 'Moderate risk — action recommended' : 'High risk — immediate action required'}
                </p>
              </div>

              {/* Failed checks */}
              {failed.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-crimson-400" />
                    Failed Checks ({failed.length})
                  </h2>
                  <div className="space-y-3">
                    {failed.map((c, i) => {
                      const name = c.name ?? c.Name ?? c.checkName ?? c.CheckName ?? ''
                      const sev  = c.severity ?? c.Severity ?? 'Medium'
                      const desc = c.description ?? c.Description ?? c.recommendation ?? ''
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-white text-sm font-medium">{name}</p>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEV_STYLE[sev] || SEV_STYLE.Medium}`}>{sev}</span>
                            </div>
                            {desc && <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{desc}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Passed checks summary */}
              {checks.length > 0 && checks.length > failed.length && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-sm text-green-400">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {checks.length - failed.length} checks passed
                </div>
              )}

              {/* CTA */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center">
                <Shield className="w-10 h-10 text-crimson-400 mx-auto mb-3" />
                <p className="text-white font-bold text-lg mb-2">Want to scan your own site?</p>
                <p className="text-gray-400 text-sm mb-5">Get a full security report in under 60 seconds — free, no sign-up required.</p>
                <Link
                  to="/scanner"
                  className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
                >
                  <Shield className="w-4 h-4" /> Scan My Site Free
                </Link>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
