import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Plus, AlertCircle, BarChart3, Clock, Server, ArrowRight, Calendar } from 'lucide-react'
import { getTotalScans, getLatestScans, getAssets } from '../services/api'

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}

function GradeBadge({ grade }) {
  const colors = { A: 'text-green-400 bg-green-500/10 border-green-500/20', B: 'text-blue-400 bg-blue-500/10 border-blue-500/20', C: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', D: 'text-orange-400 bg-orange-500/10 border-orange-500/20' }
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-extrabold ${colors[grade] || 'text-red-400 bg-red-500/10 border-red-500/20'}`}>
      {grade ?? '?'}
    </span>
  )
}

export default function DashboardPage() {
  const [totalScans, setTotalScans] = useState(null)
  const [latestScans, setLatestScans] = useState(null)
  const [assets, setAssets] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getTotalScans(), getLatestScans(), getAssets()])
      .then(([total, latest, assetList]) => {
        setTotalScans(total)
        setLatestScans(latest)
        setAssets(assetList)
      })
      .catch((e) => setError(e.message))
  }, [])

  const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString() : '—'

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/schedule" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <Calendar className="w-4 h-4" /> Schedules
          </Link>
          <Link to="/scanner" className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Scan
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-8">Dashboard</h1>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <StatCard label="Total Scans" value={totalScans} icon={BarChart3} color="bg-crimson-500" />
          <StatCard label="Assets Tracked" value={assets?.length ?? '—'} icon={Server} color="bg-blue-600" />
          <StatCard label="Recent Scans" value={latestScans?.length ?? '—'} icon={Clock} color="bg-purple-600" />
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent scans */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Recent Scans</h2>
              <Link to="/scanner/history" className="text-xs text-crimson-400 hover:text-crimson-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              {!latestScans && !error && (
                <div className="flex justify-center py-10"><span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
              )}
              {latestScans?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-10">No scans yet.</p>
              )}
              {latestScans?.map((s, i) => (
                <div key={s.id ?? i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
                  <GradeBadge grade={s.securityGrade} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{s.targetUrl}</p>
                    <p className="text-xs text-gray-500">{formatDate(s.scanDate)}</p>
                  </div>
                  <span className="text-xs text-red-400 font-semibold shrink-0">{s.failedChecks} failed</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Assets</h2>
              <Link to="/scanner" className="text-xs text-crimson-400 hover:text-crimson-300 flex items-center gap-1">
                Scan new <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              {!assets && !error && (
                <div className="flex justify-center py-10"><span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
              )}
              {assets?.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-10">No assets tracked yet.</p>
              )}
              {assets?.map((a, i) => (
                <div key={a.id ?? i} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
                  <GradeBadge grade={a.securityGrade} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{a.url || a.name}</p>
                    <p className="text-xs text-gray-500">Score: {a.securityScore}/100 · Last scanned {formatDate(a.lastScannedAt)}</p>
                  </div>
                  <Link to={`/scanner?type=vuln`} className="text-xs text-crimson-400 hover:text-crimson-300">
                    Rescan
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick launch scanners */}
        <div className="mt-10">
          <h2 className="text-lg font-bold text-white mb-4">Launch a Scanner</h2>
          <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { type: 'vuln',  label: 'Web Vuln',    color: 'border-blue-500/30 hover:border-blue-500/60' },
              { type: 'xss',   label: 'XSS',         color: 'border-orange-500/30 hover:border-orange-500/60' },
              { type: 'sqli',  label: 'SQLi',         color: 'border-red-500/30 hover:border-red-500/60' },
              { type: 'owasp', label: 'OWASP',        color: 'border-purple-500/30 hover:border-purple-500/60' },
              { type: 'api',   label: 'API Security', color: 'border-teal-500/30 hover:border-teal-500/60' },
            ].map(({ type, label, color }) => (
              <Link
                key={type}
                to={`/scanner?type=${type}`}
                className={`flex items-center justify-center gap-2 bg-white/3 border ${color} rounded-xl py-3 text-sm font-semibold text-white transition-colors`}
              >
                <Plus className="w-4 h-4" /> {label}
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
