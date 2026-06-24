import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Building2, Loader2, AlertCircle, RefreshCw, Shield,
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Globe,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMsspTenant } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV_BADGE = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
}

function healthColor(s) {
  if (s >= 80) return { text: 'text-green-400',  ring: '#22c55e' }
  if (s >= 60) return { text: 'text-amber-400',  ring: '#f59e0b' }
  if (s >= 40) return { text: 'text-orange-400', ring: '#f97316' }
  return              { text: 'text-red-400',    ring: '#ef4444' }
}

function ScoreRing({ score, label, color }) {
  const r = 44, circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, score)) / 100) * circ
  return (
    <div className="relative w-24 h-24 shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-white">{score}%</span>
        <span className="text-[9px] text-gray-500 mt-0.5">{label}</span>
      </div>
    </div>
  )
}

function FindingRow({ f }) {
  const [open, setOpen] = useState(false)
  const name = field(f, 'checkName', 'CheckName', 'name', 'Name', 'title', 'Title') ?? 'Finding'
  const sev  = field(f, 'severity', 'Severity') ?? 'Medium'
  const desc = field(f, 'description', 'Description', 'technicalDetails', 'TechnicalDetails')
  const fix  = field(f, 'recommendation', 'Recommendation', 'fixSteps', 'FixSteps', 'advice', 'Advice')
  const cls  = SEV_BADGE[sev] ?? SEV_BADGE.Medium

  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${cls}`}>{sev}</span>
        <span className="flex-1 text-xs text-gray-200 truncate">{name}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
      </button>
      {open && (desc || fix) && (
        <div className="px-4 pb-3 space-y-2 pl-12">
          {desc && <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>}
          {fix && (
            <div className="bg-green-950/40 border border-green-800/40 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-green-400 mb-1">Remediation</p>
              <p className="text-xs text-gray-300 leading-relaxed">{Array.isArray(fix) ? fix.join(' ') : fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function MsspTenantDetailPage() {
  const { id }            = useParams()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tab, setTab]     = useState('overview')

  const load = async () => {
    setLoading(true); setError(null)
    try { setData(await getMsspTenant(id)) }
    catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { if (id) load() }, [id])

  const name       = field(data, 'name', 'Name') ?? 'Tenant'
  const domain     = field(data, 'domain', 'Domain', 'customDomain') ?? ''
  const plan       = field(data, 'plan', 'Plan') ?? '—'
  const health     = Number(field(data, 'healthScore', 'HealthScore') ?? 0)
  const riskScore  = Number(field(data, 'riskScore', 'RiskScore') ?? 0)
  const compliance = field(data, 'compliance', 'Compliance') ?? {}
  const findings   = field(data, 'findings', 'Findings') ?? []
  const assets     = field(data, 'assetCount', 'AssetCount') ?? 0
  const users      = field(data, 'userCount', 'UserCount') ?? 0
  const lastScan   = field(data, 'lastScanAt', 'LastScanAt', 'lastScan', 'LastScan')
  const hc         = healthColor(health)

  const TABS = [
    { id: 'overview',    label: 'Overview'    },
    { id: 'findings',    label: `Findings${findings.length ? ` (${findings.length})` : ''}` },
    { id: 'compliance',  label: 'Compliance'  },
  ]

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-8 px-4 bg-teal-500/5">
          <div className="max-w-4xl mx-auto">
            <Link to="/mssp/tenants" className="text-xs text-teal-400 hover:text-teal-300 transition-colors mb-3 inline-flex items-center gap-1">
              ← All Tenants
            </Link>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-teal-500/15 border border-teal-500/30 rounded-xl flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-teal-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-white">{name}</h1>
                  <span className="text-[10px] font-semibold text-gray-500 bg-white/5 border border-white/10 rounded px-2 py-0.5">{plan}</span>
                </div>
                {domain && <p className="text-xs text-gray-500 font-mono mt-0.5">{domain}</p>}
              </div>
              <button onClick={load} disabled={loading}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/15 text-gray-400 px-3 py-2 rounded-xl transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 px-4">
          <div className="max-w-4xl mx-auto flex">
            {TABS.map(({ id: tid, label }) => (
              <button key={tid} onClick={() => setTab(tid)}
                className={`px-5 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === tid ? 'border-teal-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={load} className="ml-auto text-xs hover:text-white">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-teal-400 animate-spin" /></div>
          ) : (
            <>
              {tab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
                      <ScoreRing score={health} label="Health" color={hc.ring} />
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Overall Health</p>
                        <p className={`text-2xl font-extrabold ${hc.text}`}>{health}%</p>
                      </div>
                    </div>
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assets & Users</p>
                      <div className="flex gap-6">
                        <div>
                          <p className="text-2xl font-extrabold text-violet-400">{assets}</p>
                          <p className="text-[10px] text-gray-600">Assets</p>
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold text-blue-400">{users}</p>
                          <p className="text-[10px] text-gray-600">Users</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk Score</p>
                      <p className={`text-2xl font-extrabold ${healthColor(100 - riskScore).text}`}>{riskScore}/100</p>
                      {lastScan && (
                        <p className="text-[10px] text-gray-600">
                          Last scan: {new Date(lastScan).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {findings.length > 0 && (
                    <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                      <p className="text-sm font-bold text-white mb-3">Top Critical Findings</p>
                      <div className="space-y-2">
                        {findings
                          .filter(f => (field(f,'severity','Severity') ?? '') === 'Critical')
                          .slice(0, 5)
                          .map((f, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                              <span className="text-xs text-gray-300">
                                {field(f,'checkName','CheckName','name','Name','title','Title') ?? 'Finding'}
                              </span>
                            </div>
                          ))
                        }
                        {findings.filter(f => (field(f,'severity','Severity') ?? '') === 'Critical').length === 0 && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                            <span className="text-xs text-gray-400">No critical findings</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'findings' && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  {findings.length === 0 ? (
                    <div className="text-center py-16">
                      <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                      <p className="text-white font-semibold">No findings</p>
                    </div>
                  ) : (
                    findings.map((f, i) => <FindingRow key={i} f={f} />)
                  )}
                </div>
              )}

              {tab === 'compliance' && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(compliance).length === 0 ? (
                    <p className="col-span-3 text-xs text-gray-600 py-12 text-center">No compliance data available. Ask this tenant to run a compliance assessment.</p>
                  ) : (
                    Object.entries(compliance).map(([fw, score]) => {
                      const s = Number(score)
                      const col = healthColor(s)
                      return (
                        <div key={fw} className="bg-white/3 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                          <ScoreRing score={s} label={fw.toUpperCase()} color={col.ring} />
                          <div>
                            <p className="text-xs font-bold text-white uppercase">{fw}</p>
                            <p className={`text-xl font-extrabold mt-0.5 ${col.text}`}>{s}%</p>
                          </div>
                        </div>
                      )
                    })
                  )}
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
