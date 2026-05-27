import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Plus, AlertCircle, ChevronRight, Clock, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { getScans } from '../services/api'

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  if (s === 'completed') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Completed
    </span>
  )
  if (s === 'failed') return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Failed
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
      <Loader2 className="w-3 h-3 animate-spin" /> Running
    </span>
  )
}

function SeverityDots({ summary }) {
  if (!summary) return <span className="text-gray-600 text-xs">—</span>
  const items = [
    { key: 'critical', color: 'text-red-400',    bg: 'bg-red-500' },
    { key: 'high',     color: 'text-orange-400', bg: 'bg-orange-500' },
    { key: 'medium',   color: 'text-yellow-400', bg: 'bg-yellow-500' },
    { key: 'low',      color: 'text-blue-400',   bg: 'bg-blue-500' },
  ]
  return (
    <div className="flex items-center gap-2">
      {items.map(({ key, color, bg }) =>
        summary[key] > 0 ? (
          <span key={key} className={`flex items-center gap-1 text-xs font-semibold ${color}`}>
            <span className={`w-2 h-2 rounded-full ${bg} inline-block`} />
            {summary[key]}
          </span>
        ) : null
      )}
      {!items.some(({ key }) => summary[key] > 0) && (
        <span className="text-green-400 text-xs font-semibold">Clean</span>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const [scans, setScans] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getScans()
      .then(setScans)
      .catch((err) => setError(err.message))
  }, [])

  const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleString()
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <Link
          to="/scanner"
          className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Scan
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Scan History</h1>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!scans && !error && (
          <div className="flex items-center justify-center py-24">
            <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {scans && scans.length === 0 && (
          <div className="text-center py-24">
            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No scans yet</h2>
            <p className="text-gray-400 mb-6">Start your first scan to see results here.</p>
            <Link
              to="/scanner"
              className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start a Scan
            </Link>
          </div>
        )}

        {scans && scans.length > 0 && (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_140px_150px_40px] gap-4 px-4 py-3 bg-white/3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Target URL</span>
              <span>Date</span>
              <span>Findings</span>
              <span />
            </div>

            {scans.map((scan, i) => {
              const id = scan.id ?? scan.scanId ?? scan.Id
              return (
                <Link
                  key={id ?? i}
                  to={`/scanner/results/${id}`}
                  className="grid sm:grid-cols-[1fr_140px_150px_40px] gap-4 items-center px-4 py-3.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{scan.url || id}</p>
                    <div className="sm:hidden flex items-center gap-3 mt-1">
                      <StatusBadge status={scan.status} />
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{formatDate(scan.startedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {formatDate(scan.startedAt)}
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <StatusBadge status={scan.status} />
                    {scan.status?.toLowerCase() === 'completed' && <SeverityDots summary={scan.summary} />}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors justify-self-end" />
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
