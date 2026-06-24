import React, { useState } from 'react'
import { Radar, Loader2, AlertTriangle, CheckCircle2, XCircle, Plus } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { discoverSubdomains, createAsset, saveDiscoveredAssets } from '../services/api'

const VIA_STYLE = {
  'Cert Transparency': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'DNS Probe':         'bg-purple-500/15 text-purple-400 border-purple-500/30',
}

function StatusBadge({ status }) {
  const live = status?.toLowerCase() === 'live'
  return (
    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded border ${live ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>
      {live ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {live ? 'Live' : 'Offline'}
    </span>
  )
}

function DiscoverRow({ row, onAdd, isSelected, onToggle }) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded]   = useState(false)
  const [err, setErr]       = useState(null)

  const subdomain = row.subdomain ?? row.Subdomain ?? row.host ?? row.Host ?? ''
  const ip        = row.ip        ?? row.Ip        ?? row.ipAddress ?? row.IpAddress ?? ''
  const status    = row.status    ?? row.Status    ?? 'Offline'
  const via       = row.discoveredVia ?? row.DiscoveredVia ?? row.source ?? ''
  const isLive    = status.toLowerCase() === 'live'

  const add = async () => {
    setAdding(true); setErr(null)
    try {
      await onAdd(subdomain)
      setAdded(true)
    } catch { setErr('Failed — please try again') }
    setAdding(false)
  }

  return (
    <tr className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
      <td className="px-4 py-3">
        {isLive && (
          <input type="checkbox" checked={isSelected} onChange={onToggle} className="accent-crimson-500 cursor-pointer w-3.5 h-3.5" />
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-200 font-mono">{subdomain}</td>
      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{ip || '—'}</td>
      <td className="px-4 py-3"><StatusBadge status={status} /></td>
      <td className="px-4 py-3">
        {via && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${VIA_STYLE[via] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>{via}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {added ? (
          <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
            <CheckCircle2 className="w-3 h-3" />Added
          </span>
        ) : (
          <button
            onClick={add}
            disabled={adding}
            className="flex items-center gap-1 text-xs font-semibold text-crimson-400 hover:text-crimson-300 border border-crimson-500/30 hover:bg-crimson-500/10 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Add as Asset
          </button>
        )}
        {err && <p className="text-red-400 text-[10px] mt-0.5">{err}</p>}
      </td>
    </tr>
  )
}

export default function DiscoverPage() {
  const [domain, setDomain]     = useState('')
  const [input, setInput]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [ran, setRan]           = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving]     = useState(false)
  const [bulkSaved, setBulkSaved] = useState(false)

  const discover = async () => {
    const d = input.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '')
    if (!d) return
    setLoading(true); setError(null); setResults([]); setRan(false); setSelected(new Set()); setBulkSaved(false)
    try {
      const data = await discoverSubdomains(d)
      const list = Array.isArray(data) ? data : (data?.subdomains ?? data?.results ?? data?.items ?? [])
      setResults(list)
      setDomain(d)
      setRan(true)
    } catch { setError('Discovery failed — please try again') }
    setLoading(false)
  }

  const handleAdd = async (subdomain) => {
    await createAsset({ name: subdomain, url: `https://${subdomain}` })
  }

  const liveRows = results.filter((r) => (r.status ?? r.Status ?? '').toLowerCase() === 'live')
  const allLiveSelected = liveRows.length > 0 && liveRows.every(r => selected.has(r.subdomain ?? r.Subdomain ?? r.host ?? ''))

  const toggleSelectAll = (e) => {
    const keys = liveRows.map(r => r.subdomain ?? r.Subdomain ?? r.host ?? r.Host ?? '').filter(Boolean)
    setSelected(e.target.checked ? new Set(keys) : new Set())
  }

  const handleBulkSave = async () => {
    setSaving(true)
    try {
      await saveDiscoveredAssets({
        subdomains: Array.from(selected).map(s => ({ subdomain: s, url: `https://${s}` })),
      })
      setBulkSaved(true)
      setSelected(new Set())
    } catch { setError('Failed to save assets — please try again') }
    setSaving(false)
  }

  const live    = liveRows.length
  const offline = results.length - live

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Attack Surface</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Radar className="w-8 h-8 text-crimson-400" /> Attack Surface Discovery
            </h1>
            <p className="text-gray-400">Find subdomains and shadow assets you don't know about — via certificate transparency logs and DNS probing.</p>
          </div>

          <div className="bg-white/3 border border-white/10 rounded-2xl p-6 mb-6">
            <label className="block text-xs text-gray-400 mb-2">Domain (no https://, just the domain)</label>
            <div className="flex gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && discover()}
                placeholder="example.com"
                className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
              />
              <button
                onClick={discover}
                disabled={loading || !input.trim()}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
                {loading ? 'Discovering…' : 'Discover'}
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-crimson-400" />
              <p className="text-sm">Querying certificate transparency logs…</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {ran && !loading && (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <p className="text-white font-semibold text-sm">
                  Found <span className="text-crimson-400 font-bold">{results.length}</span> subdomains for <span className="font-mono text-gray-300">{domain}</span>
                </p>
                {results.length > 0 && (
                  <div className="flex gap-3 text-xs">
                    <span className="text-green-400 font-semibold">{live} live</span>
                    <span className="text-gray-500">{offline} offline</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-3">
                  {bulkSaved && (
                    <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Asset Inventory
                    </span>
                  )}
                  {selected.size > 0 && (
                    <button
                      onClick={handleBulkSave}
                      disabled={saving}
                      className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors"
                    >
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      {saving ? 'Saving…' : `Save ${selected.size} to Asset Inventory`}
                    </button>
                  )}
                </div>
              </div>

              {results.length === 0 ? (
                <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl text-gray-500">
                  <Radar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No subdomains found for <span className="font-mono text-gray-400">{domain}</span>.</p>
                </div>
              ) : (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-x-auto">
                  <table className="w-full text-xs min-w-[640px]">
                    <thead>
                      <tr className="text-gray-500 border-b border-white/10">
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={allLiveSelected}
                            onChange={toggleSelectAll}
                            className="accent-crimson-500 cursor-pointer w-3.5 h-3.5"
                            title="Select all live"
                          />
                        </th>
                        <th className="text-left px-4 py-3">Subdomain</th>
                        <th className="text-left px-4 py-3">IP Address</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Discovered Via</th>
                        <th className="text-left px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => {
                        const key = row.subdomain ?? row.Subdomain ?? row.host ?? row.Host ?? String(i)
                        return (
                          <DiscoverRow
                            key={key}
                            row={row}
                            onAdd={handleAdd}
                            isSelected={selected.has(key)}
                            onToggle={() => {
                              setSelected(prev => {
                                const next = new Set(prev)
                                next.has(key) ? next.delete(key) : next.add(key)
                                return next
                              })
                            }}
                          />
                        )
                      })}
                    </tbody>
                  </table>
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
