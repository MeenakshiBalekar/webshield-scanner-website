import React, { useState, useEffect } from 'react'
import { Users, AlertCircle, Loader2, RefreshCw, ShieldAlert, ShieldCheck, Clock, Crown, AlertTriangle, Filter } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function relDate(val) {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d)) return '—'
  const days = Math.floor((Date.now() - d) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function MfaBadge({ enabled }) {
  if (enabled == null) return <span className="text-gray-600 text-xs">—</span>
  return enabled
    ? <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"><ShieldCheck className="w-3 h-3" />MFA On</span>
    : <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400"><ShieldAlert className="w-3 h-3" />No MFA</span>
}

function RiskRow({ user }) {
  const email       = field(user, 'email', 'Email', 'username', 'Username', 'name', 'Name') ?? '(unknown)'
  const mfa         = field(user, 'mfaEnabled', 'MfaEnabled', 'mfa', 'Mfa', 'hasMfa', 'HasMfa')
  const isAdmin     = field(user, 'isAdmin', 'IsAdmin', 'admin', 'Admin')
  const lastLogin   = field(user, 'lastLogin', 'LastLogin', 'lastLoginAt', 'LastLoginAt')
  const excessPerms = field(user, 'excessivePermissions', 'ExcessivePermissions', 'hasExcessPerms', 'HasExcessPerms')
  const riskScore   = field(user, 'riskScore', 'RiskScore', 'risk', 'Risk')
  const permissions = field(user, 'permissions', 'Permissions') ?? []
  const [expanded, setExpanded] = useState(false)

  const flags = []
  if (mfa === false) flags.push({ label: 'No MFA', color: 'text-red-400' })
  if (excessPerms)   flags.push({ label: 'Excess perms', color: 'text-orange-400' })
  if (isAdmin)       flags.push({ label: 'Admin', color: 'text-amber-400' })
  const daysSinceLogin = lastLogin ? Math.floor((Date.now() - new Date(lastLogin)) / 86400000) : null
  if (daysSinceLogin != null && daysSinceLogin > 90) flags.push({ label: `Inactive ${daysSinceLogin}d`, color: 'text-gray-400' })

  return (
    <>
      <tr
        className={`border-b border-white/5 hover:bg-white/3 transition-colors cursor-pointer ${expanded ? 'bg-white/3' : ''}`}
        onClick={() => permissions.length > 0 && setExpanded(e => !e)}
      >
        <td className="px-6 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
              {email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm text-white">{email}</p>
              {flags.length > 0 && (
                <div className="flex gap-1.5 mt-0.5">
                  {flags.map((f, i) => (
                    <span key={i} className={`text-xs ${f.color}`}>{f.label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5"><MfaBadge enabled={mfa} /></td>
        <td className="px-4 py-3.5">
          {isAdmin
            ? <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400"><Crown className="w-3 h-3" />Admin</span>
            : <span className="text-xs text-gray-500">User</span>}
        </td>
        <td className="px-4 py-3.5">
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3 text-gray-600" />{relDate(lastLogin)}
          </span>
        </td>
        <td className="px-4 py-3.5">
          {excessPerms
            ? <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-400"><AlertTriangle className="w-3 h-3" />Yes</span>
            : <span className="text-xs text-gray-500">—</span>}
        </td>
        <td className="px-4 py-3.5 text-right">
          {riskScore != null
            ? <span className={`text-sm font-bold ${riskScore >= 7 ? 'text-red-400' : riskScore >= 4 ? 'text-orange-400' : 'text-emerald-400'}`}>{riskScore}</span>
            : <span className="text-gray-600 text-xs">—</span>}
        </td>
      </tr>
      {expanded && permissions.length > 0 && (
        <tr className="bg-white/2">
          <td colSpan={6} className="px-8 py-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Permissions</div>
            <div className="flex flex-wrap gap-2">
              {permissions.map((p, i) => (
                <span key={i} className="bg-white/5 border border-white/10 text-gray-300 text-xs px-2.5 py-1 rounded-lg font-mono">{typeof p === 'string' ? p : (p.name ?? p.Name ?? JSON.stringify(p))}</span>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function SummaryCard({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-xl p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-3xl font-extrabold ${color}`}>{value ?? '—'}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}

const DEMO_USERS = [
  { email: 'admin@example.com',   mfaEnabled: false, isAdmin: true,  excessivePermissions: true,  riskScore: 9.2, lastLogin: new Date(Date.now() - 120 * 86400000).toISOString(), permissions: ['GlobalAdmin', 'BillingAdmin', 'UserAdmin'] },
  { email: 'devops@example.com',  mfaEnabled: true,  isAdmin: false, excessivePermissions: true,  riskScore: 6.1, lastLogin: new Date(Date.now() - 2 * 86400000).toISOString(), permissions: ['ProdDeploy', 'SecretsRead', 'DBAdmin'] },
  { email: 'alice@example.com',   mfaEnabled: false, isAdmin: false, excessivePermissions: false, riskScore: 5.0, lastLogin: new Date(Date.now() - 1 * 86400000).toISOString(), permissions: [] },
  { email: 'bob@example.com',     mfaEnabled: true,  isAdmin: false, excessivePermissions: false, riskScore: 1.2, lastLogin: new Date(Date.now() - 3 * 86400000).toISOString(), permissions: [] },
  { email: 'svc-deploy@example.com', mfaEnabled: false, isAdmin: true, excessivePermissions: true, riskScore: 8.7, lastLogin: new Date(Date.now() - 95 * 86400000).toISOString(), permissions: ['GlobalAdmin', 'NetworkWrite', 'StorageAdmin'] },
  { email: 'carol@example.com',   mfaEnabled: true,  isAdmin: false, excessivePermissions: false, riskScore: 0.5, lastLogin: new Date(Date.now() - 1 * 86400000).toISOString(), permissions: [] },
]
const DEMO_RISKS = { avgRisk: 5.1, noMfa: 3, excessPerms: 3, staleAccounts: 1 }

export default function IdentityExposurePage() {
  const [loading, setLoading]   = useState(true)
  const [isDemo, setIsDemo]     = useState(false)
  const [risks, setRisks]       = useState(null)
  const [users, setUsers]       = useState([])
  const [filterMfa, setFilterMfa] = useState(false)
  const [filterAdmin, setFilterAdmin] = useState(false)
  const [filterExcess, setFilterExcess] = useState(false)

  const token = () => localStorage.getItem('ws_token')
  const authH = () => token() ? { Authorization: `Bearer ${token()}` } : {}

  const load = () => {
    setLoading(true); setIsDemo(false)
    const risksReq = fetch(`${BASE}/api/identity/risks`, { headers: authH() })
      .then(r => r.ok ? r.json() : null).catch(() => null)
    const usersReq = fetch(`${BASE}/api/identity/users`, { headers: authH() })
      .then(r => r.ok ? r.json() : null).catch(() => null)

    Promise.all([risksReq, usersReq]).then(([rData, uData]) => {
      const list = uData
        ? (Array.isArray(uData) ? uData : (field(uData, 'users', 'Users', 'items', 'Items') ?? []))
        : []
      if (!rData && list.length === 0) {
        setRisks(DEMO_RISKS); setUsers(DEMO_USERS); setIsDemo(true)
      } else {
        setRisks(rData); setUsers(list)
      }
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    if (filterMfa   && field(u, 'mfaEnabled', 'MfaEnabled', 'mfa', 'Mfa') !== false) return false
    if (filterAdmin && !field(u, 'isAdmin', 'IsAdmin', 'admin', 'Admin')) return false
    if (filterExcess && !field(u, 'excessivePermissions', 'ExcessivePermissions', 'hasExcessPerms', 'HasExcessPerms')) return false
    return true
  })

  const noMfaCount    = users.filter(u => field(u, 'mfaEnabled', 'MfaEnabled', 'mfa', 'Mfa') === false).length
  const adminCount    = users.filter(u => field(u, 'isAdmin', 'IsAdmin', 'admin', 'Admin')).length
  const excessCount   = users.filter(u => field(u, 'excessivePermissions', 'ExcessivePermissions', 'hasExcessPerms', 'HasExcessPerms')).length
  const avgRisk       = field(risks, 'avgRisk', 'AvgRisk', 'averageRisk', 'AverageRisk')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-rose-500/15 border border-rose-500/30 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-rose-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-rose-400">Access Risk</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Identity Exposure</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Users with weak MFA posture, admin privileges, or excessive permissions.
                </p>
              </div>
              <button onClick={load} disabled={loading}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <PageGuide id="identity-exposure" text="Analyzes user accounts, permissions, and authentication posture across your environment. Connects to Microsoft Entra ID or Okta to identify privileged accounts without MFA, stale accounts, excessive permissions, and risky sign-in patterns. Paste your API credentials and click Analyze to get a risk report." />

          {isDemo && !loading && (
            <div className="text-xs text-gray-500 bg-white/3 border border-white/10 rounded-xl px-4 py-2.5">
              Sample identity data — connect your Entra ID / Okta integration for live posture analysis.
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-crimson-400 animate-spin" /></div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Total users"  value={users.length} />
                <SummaryCard label="No MFA"       value={noMfaCount}   color={noMfaCount > 0 ? 'text-red-400' : 'text-emerald-400'} sub="Need protection" />
                <SummaryCard label="Admins"       value={adminCount}   color="text-amber-400" />
                <SummaryCard label="Excess perms" value={excessCount}  color={excessCount > 0 ? 'text-orange-400' : 'text-emerald-400'} />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />
                {[
                  { label: 'No MFA',       active: filterMfa,   toggle: () => setFilterMfa(v => !v)   },
                  { label: 'Admins only',  active: filterAdmin, toggle: () => setFilterAdmin(v => !v)  },
                  { label: 'Excess perms', active: filterExcess,toggle: () => setFilterExcess(v => !v) },
                ].map(f => (
                  <button key={f.label} onClick={f.toggle}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      f.active ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' : 'bg-white/3 border-white/10 text-gray-400 hover:border-white/20'
                    }`}>
                    {f.label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-gray-500">{filtered.length} of {users.length} users</span>
              </div>

              {/* Table */}
              <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3 text-left">User</th>
                        <th className="px-4 py-3 text-left">MFA</th>
                        <th className="px-4 py-3 text-left">Role</th>
                        <th className="px-4 py-3 text-left">Last Login</th>
                        <th className="px-4 py-3 text-left">Excess Perms</th>
                        <th className="px-4 py-3 text-right">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-gray-500 text-sm">
                            {users.length === 0 ? 'No identity data available' : 'No users match the current filters'}
                          </td>
                        </tr>
                      ) : filtered.map((u, i) => <RiskRow key={i} user={u} />)}
                    </tbody>
                  </table>
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
