import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Loader2, AlertCircle, RefreshCw, Shield,
  TrendingUp, AlertTriangle, Users, Globe,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMsspDashboard } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function healthColor(score) {
  if (score >= 80) return { text: 'text-green-400',  bg: 'bg-green-500'  }
  if (score >= 60) return { text: 'text-amber-400',  bg: 'bg-amber-400'  }
  if (score >= 40) return { text: 'text-orange-400', bg: 'bg-orange-500' }
  return                  { text: 'text-red-400',    bg: 'bg-red-500'    }
}

function StatCard({ label, value, color = 'text-white', icon: Icon, iconColor }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center ${iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <p className={`text-3xl font-extrabold ${color}`}>{value ?? '—'}</p>
    </div>
  )
}

function TenantHealthRow({ tenant }) {
  const name     = field(tenant, 'name', 'Name', 'tenantName', 'TenantName') ?? 'Unknown'
  const health   = Number(field(tenant, 'healthScore', 'HealthScore', 'health') ?? 0)
  const critical = field(tenant, 'criticalCount', 'CriticalCount', 'criticals') ?? 0
  const id       = field(tenant, 'id', 'Id', 'tenantId')
  const col      = healthColor(health)

  return (
    <Link
      to={`/mssp/tenants/${id}`}
      className="flex items-center gap-4 py-2.5 border-b border-white/5 last:border-0 hover:bg-white/3 px-4 -mx-4 transition-colors"
    >
      <div className="w-28 text-xs text-gray-300 font-semibold truncate shrink-0">{name}</div>
      <div className="flex-1 bg-white/8 rounded-full h-2 overflow-hidden">
        <div className={`h-full ${col.bg} rounded-full`} style={{ width: `${Math.min(100, health)}%` }} />
      </div>
      <span className={`text-xs font-bold w-10 text-right shrink-0 ${col.text}`}>{health}%</span>
      {critical > 0 && (
        <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded px-1.5 py-0.5 shrink-0">
          {critical}
        </span>
      )}
    </Link>
  )
}

export default function MsspDashboardPage() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try { setData(await getMsspDashboard()) }
    catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const tenants        = field(data, 'tenants', 'Tenants') ?? []
  const totalTenants   = field(data, 'totalTenants', 'TotalTenants') ?? tenants.length
  const totalAssets    = field(data, 'totalAssets', 'TotalAssets') ?? 0
  const totalCriticals = field(data, 'totalCriticals', 'TotalCriticals', 'criticalCount') ?? 0
  const avgRisk        = field(data, 'avgRiskScore', 'AvgRiskScore')
  const avgCompliance  = field(data, 'avgComplianceScore', 'AvgComplianceScore')
  const recentActivity = field(data, 'recentActivity', 'RecentActivity') ?? []

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4 bg-teal-500/5">
          <div className="max-w-6xl mx-auto flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-teal-500/15 border border-teal-500/30 rounded-lg flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-teal-400">MSSP Portal</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white">Security Overview</h1>
              <p className="text-gray-400 text-sm mt-1">Aggregated posture across all managed tenants.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/mssp/tenants"
                className="flex items-center gap-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 px-4 py-2.5 rounded-xl transition-colors"
              >
                <Users className="w-4 h-4" /> Tenants
              </Link>
              <Link
                to="/mssp/white-label"
                className="flex items-center gap-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 px-4 py-2.5 rounded-xl transition-colors"
              >
                <Globe className="w-4 h-4" /> White Label
              </Link>
              <button
                onClick={load} disabled={loading}
                className="flex items-center gap-1.5 text-sm font-semibold bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-400 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={load} className="ml-auto text-xs hover:text-white transition-colors">Retry</button>
            </div>
          )}

          {loading && !data ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 text-teal-400 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                <StatCard label="Tenants"          value={totalTenants}   color="text-teal-400"   icon={Users}         iconColor="text-teal-400"   />
                <StatCard label="Total Assets"     value={totalAssets}    color="text-violet-400" icon={Shield}        iconColor="text-violet-400" />
                <StatCard label="Critical Findings" value={totalCriticals} color="text-red-400"   icon={AlertTriangle} iconColor="text-red-400"    />
                <StatCard
                  label="Avg Risk Score"
                  value={avgRisk != null ? `${avgRisk}%` : '—'}
                  color={avgRisk != null ? healthColor(100 - avgRisk).text : 'text-gray-500'}
                  icon={TrendingUp} iconColor="text-orange-400"
                />
                <StatCard
                  label="Avg Compliance"
                  value={avgCompliance != null ? `${avgCompliance}%` : '—'}
                  color={avgCompliance != null ? healthColor(avgCompliance).text : 'text-gray-500'}
                  icon={Shield} iconColor="text-green-400"
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/3 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-white">Tenant Health Scores</p>
                    <Link to="/mssp/tenants" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">View all →</Link>
                  </div>
                  {tenants.length === 0 ? (
                    <p className="text-xs text-gray-600 py-8 text-center">No tenants yet.</p>
                  ) : (
                    <div className="px-4 -mx-4">
                      {tenants.slice(0, 12).map((t, i) => (
                        <TenantHealthRow key={field(t,'id','Id') ?? i} tenant={t} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                  <p className="text-sm font-bold text-white mb-4">Recent Activity</p>
                  {recentActivity.length === 0 ? (
                    <p className="text-xs text-gray-600 py-8 text-center">No recent activity.</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.slice(0, 10).map((ev, i) => {
                        const msg      = field(ev, 'message', 'Message', 'description', 'type', 'Type') ?? 'Event'
                        const tenant   = field(ev, 'tenantName', 'TenantName', 'tenant', 'Tenant') ?? ''
                        const ts       = field(ev, 'timestamp', 'Timestamp', 'createdAt', 'CreatedAt')
                        return (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-300 leading-snug">{msg}</p>
                              {tenant && <p className="text-[10px] text-gray-500 mt-0.5">{tenant}</p>}
                            </div>
                            {ts && (
                              <span className="text-[10px] text-gray-600 shrink-0">
                                {new Date(ts).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
