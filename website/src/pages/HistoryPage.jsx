import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Plus, AlertCircle, ChevronRight, Clock } from 'lucide-react'
import { getScans } from '../services/api'

function GradeBadge({ grade }) {
  const color =
    grade === 'A' ? 'text-green-400 bg-green-500/10 border-green-500/20' :
    grade === 'B' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' :
    grade === 'C' ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' :
    grade === 'D' ? 'text-orange-400 bg-orange-500/10 border-orange-500/20' :
                    'text-red-400 bg-red-500/10 border-red-500/20'
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-extrabold ${color}`}>
      {grade ?? '?'}
    </span>
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
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Udyo<span className="text-crimson-500">360</span>
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
              <Plus className="w-4 h-4" /> Start a Scan
            </Link>
          </div>
        )}

        {scans && scans.length > 0 && (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[40px_1fr_130px_120px_80px_40px] gap-4 px-4 py-3 bg-white/3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Grade</span>
              <span>Target URL</span>
              <span>Date</span>
              <span>Score</span>
              <span>Failed</span>
              <span />
            </div>

            {scans.map((scan, i) => (
              <div
                key={scan.id ?? i}
                className="grid sm:grid-cols-[40px_1fr_130px_120px_80px_40px] gap-4 items-center px-4 py-3.5 border-b border-white/5 last:border-b-0"
              >
                <GradeBadge grade={scan.securityGrade} />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{scan.targetUrl}</p>
                  <div className="sm:hidden flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(scan.scanDate)}
                    <span className="text-red-400 font-semibold">{scan.failedChecks} failed</span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  {formatDate(scan.scanDate)}
                </div>
                <div className="hidden sm:block text-sm font-semibold text-white">
                  {scan.securityScore}<span className="text-gray-500 font-normal text-xs">/100</span>
                </div>
                <div className="hidden sm:block text-sm text-red-400 font-semibold">
                  {scan.failedChecks}
                  <span className="text-gray-500 font-normal text-xs">/{scan.totalChecks}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-600 justify-self-end" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
