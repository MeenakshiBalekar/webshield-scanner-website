import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Loader2, AlertCircle, RefreshCw, Plus, Search, X,
  Users, Shield, AlertTriangle, ChevronRight,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMsspTenants, createMsspTenant } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function healthColor(score) {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-amber-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function UsageBar({ used, max, color = 'bg-teal-500' }) {
  if (!max) return <span className="text-[10px] text-gray-600">—</span>
  const pct = Math.min(100, Math.round((used / max) * 100))
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-400' : color
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-400">{used}/{max}</span>
    </div>
  )
}

function TenantRow({ tenant }) {
  const id       = field(tenant, 'id', 'Id', 'tenantId')
  const name     = field(tenant, 'name', 'Name') ?? 'Unnamed'
  const domain   = field(tenant, 'domain', 'Domain', 'customDomain') ?? ''
  const health   = Number(field(tenant, 'healthScore', 'HealthScore') ?? 0)
  const scansUsed = field(tenant, 'scansUsed', 'ScansUsed') ?? 0
  const scansMax  = field(tenant, 'scansLimit', 'ScansLimit', 'scansPerMonth') ?? 0
  const assets   = field(tenant, 'assetCount', 'AssetCount', 'assets') ?? 0
  const users    = field(tenant, 'userCount', 'UserCount', 'users') ?? 0
  const critical = field(tenant, 'criticalCount', 'CriticalCount') ?? 0
  const plan     = field(tenant, 'plan', 'Plan') ?? '—'

  return (
    <Link
      to={`/mssp/tenants/${id}`}
      className="flex items-center gap-4 px-5 py-4 border-b border-white/5 last:border-0 hover:bg-teal-500/5 transition-colors group"
    >
      <div className="w-9 h-9 bg-teal-500/15 border border-teal-500/30 rounded-xl flex items-center justify-center shrink-0">
        <Building2 className="w-4 h-4 text-teal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{name}</span>
          <span className="text-[10px] font-semibold text-gray-600 bg-white/5 border border-white/10 rounded px-1.5 py-0.5">{plan}</span>
        </div>
        {domain && <p className="text-xs text-gray-500 font-mono mt-0.5">{domain}</p>}
      </div>

      <div className="hidden sm:flex items-center gap-6 shrink-0 text-xs">
        <div className="text-center">
          <p className={`text-base font-extrabold ${healthColor(health)}`}>{health}%</p>
          <p className="text-[10px] text-gray-600">Health</p>
        </div>
        <div className="text-center">
          <p className="text-base font-extrabold text-violet-400">{assets}</p>
          <p className="text-[10px] text-gray-600">Assets</p>
        </div>
        <div className="text-center">
          <p className={`text-base font-extrabold ${critical > 0 ? 'text-red-400' : 'text-gray-500'}`}>{critical}</p>
          <p className="text-[10px] text-gray-600">Critical</p>
        </div>
        <div className="text-center">
          <p className="text-base font-extrabold text-blue-400">{users}</p>
          <p className="text-[10px] text-gray-600">Users</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-600 mb-1">Scans</p>
          <UsageBar used={scansUsed} max={scansMax} />
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-teal-400 transition-colors shrink-0" />
    </Link>
  )
}

export default function MsspTenantsPage() {
  const [tenants, setTenants]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]   = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await getMsspTenants()
      setTenants(Array.isArray(data) ? data : (data?.tenants ?? data?.items ?? []))
    } catch { }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true); setCreateErr(null)
    try {
      const created = await createMsspTenant({ name: newName.trim(), domain: newDomain.trim() || undefined })
      setTenants(ts => [created, ...ts])
      setNewName(''); setNewDomain(''); setShowCreate(false)
    } catch (e) { setCreateErr('Action failed — please try again') }
    finally { setCreating(false) }
  }

  const filtered = tenants.filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    const name = (field(t,'name','Name') ?? '').toLowerCase()
    const domain = (field(t,'domain','Domain') ?? '').toLowerCase()
    return name.includes(q) || domain.includes(q)
  })

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4 bg-teal-500/5">
          <div className="max-w-5xl mx-auto flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link to="/mssp/dashboard" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">← Dashboard</Link>
              </div>
              <h1 className="text-3xl font-extrabold text-white">Managed Tenants</h1>
              <p className="text-gray-400 text-sm mt-1">{tenants.length} tenant{tenants.length !== 1 ? 's' : ''} under management.</p>
            </div>
            <button
              onClick={() => setShowCreate(v => !v)}
              className="flex items-center gap-1.5 text-sm font-semibold bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Tenant
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
          {showCreate && (
            <form onSubmit={handleCreate} className="bg-white/3 border border-teal-500/30 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400" /> New Tenant
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Tenant Name *</label>
                  <input
                    required value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-white/5 border border-white/15 focus:border-teal-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">Custom Domain <span className="text-gray-600">(optional)</span></label>
                  <input
                    value={newDomain} onChange={e => setNewDomain(e.target.value)}
                    placeholder="security.acme.com"
                    className="w-full bg-white/5 border border-white/15 focus:border-teal-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono"
                  />
                </div>
              </div>
              {createErr && <p className="text-xs text-red-400">{createErr}</p>}
              <div className="flex gap-2">
                <button type="submit" disabled={creating || !newName.trim()}
                  className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search tenants…"
              className="w-full bg-white/5 border border-white/10 focus:border-teal-500/50 text-white placeholder-gray-600 pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={load} className="ml-auto text-xs hover:text-white">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-teal-400 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl">
              <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-semibold">{search ? 'No tenants match your search' : 'No tenants yet'}</p>
            </div>
          ) : (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              {filtered.map((t, i) => (
                <TenantRow key={field(t,'id','Id') ?? i} tenant={t} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
