import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus, Trash2, Edit2, ScanLine, RefreshCw, X, Loader2,
  Server, Globe, ShieldAlert, AlertTriangle, CheckCircle2,
  Database, Lock, Tag,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getAllAssets, createAsset, updateAsset, deleteAsset,
  scanAsset, scanAllAssets, getRiskScores,
} from '../services/api'

/* ── helpers ── */
const CRIT_STYLES = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',    bar: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', bar: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', bar: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',   bar: 'bg-blue-400'   },
}
const riskBar = (score) => {
  if (score >= 75) return 'bg-red-500'
  if (score >= 50) return 'bg-orange-500'
  if (score >= 25) return 'bg-yellow-400'
  return 'bg-blue-400'
}
const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const BLANK_FORM = { name: '', url: '', criticality: 'Medium', owner: '', tags: '', pii: false, regulated: false }

/* ── Asset modal (add / edit) ── */
function AssetModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? BLANK_FORM)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)

  const set = (k) => (e) =>
    setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true); setErr(null)
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [] }
      await onSave(payload)
      onClose()
    } catch (ex) { setErr(ex.message) }
    setSaving(false)
  }

  const inputCls = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg bg-[#0d1f3c] border border-white/10 rounded-2xl shadow-2xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-white mb-5">{initial ? 'Edit Asset' : 'Register Asset'}</h2>
        {err && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Name *</label>
              <input required value={form.name} onChange={set('name')} placeholder="Production API" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">URL *</label>
              <input required value={form.url} onChange={set('url')} placeholder="https://api.example.com" className={inputCls} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Criticality</label>
              <select value={form.criticality} onChange={set('criticality')}
                className={inputCls + ' appearance-none'} style={{ colorScheme: 'dark' }}>
                {['Critical','High','Medium','Low'].map(c => (
                  <option key={c} value={c} className="bg-[#0d1f3c]">{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Owner</label>
              <input value={form.owner} onChange={set('owner')} placeholder="team@company.com" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Tags (comma-separated)</label>
            <input value={form.tags} onChange={set('tags')} placeholder="production, customer-facing, api" className={inputCls} />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
              <input type="checkbox" checked={form.pii} onChange={set('pii')} className="accent-crimson-500" />
              Handles PII
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
              <input type="checkbox" checked={form.regulated} onChange={set('regulated')} className="accent-crimson-500" />
              Regulated (PCI/HIPAA)
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {initial ? 'Save Changes' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Confirm delete ── */
function DeleteConfirm({ name, onConfirm, onClose }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm bg-[#0d1f3c] border border-white/10 rounded-2xl shadow-2xl p-6 text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Delete asset?</p>
        <p className="text-gray-400 text-sm mb-5">"{name}" and all its scan history will be permanently removed.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={async () => { setDeleting(true); await onConfirm(); }}
            disabled={deleting}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function AssetsPage() {
  const [assets, setAssets]       = useState([])
  const [scores, setScores]       = useState({})   // assetId → score obj
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [scanning, setScanning]   = useState({})   // assetId → bool
  const [scanAllBusy, setScanAll] = useState(false)
  const [modal, setModal]         = useState(null)  // null | 'add' | asset-obj
  const [toDelete, setToDelete]   = useState(null)  // asset obj

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [assetData, scoreData] = await Promise.allSettled([getAllAssets(), getRiskScores()])
      const arr = assetData.status === 'fulfilled'
        ? (Array.isArray(assetData.value) ? assetData.value : assetData.value?.assets ?? assetData.value?.Assets ?? [])
        : []
      setAssets(arr)

      if (scoreData.status === 'fulfilled') {
        const raw = Array.isArray(scoreData.value) ? scoreData.value : scoreData.value?.scores ?? scoreData.value?.Scores ?? []
        const map = {}
        raw.forEach(s => { const id = field(s, 'assetId', 'AssetId', 'id', 'Id'); if (id) map[id] = s })
        setScores(map)
      }
    } catch (ex) { setError(ex.message) }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleScan = async (asset) => {
    const id = field(asset, 'id', 'Id')
    setScanning(s => ({ ...s, [id]: true }))
    try { await scanAsset(id); await load() } catch {}
    setScanning(s => ({ ...s, [id]: false }))
  }

  const handleScanAll = async () => {
    setScanAll(true)
    try { await scanAllAssets(); await load() } catch {}
    setScanAll(false)
  }

  const handleSave = async (payload) => {
    if (modal === 'add') {
      await createAsset(payload)
    } else {
      await updateAsset(field(modal, 'id', 'Id'), payload)
    }
    await load()
  }

  const handleDelete = async () => {
    await deleteAsset(field(toDelete, 'id', 'Id'))
    setToDelete(null)
    await load()
  }

  /* stats */
  const criticalCount = assets.filter(a => (field(a,'criticality','Criticality') ?? '').toLowerCase() === 'critical').length
  const highCount     = assets.filter(a => (field(a,'criticality','Criticality') ?? '').toLowerCase() === 'high').length
  const scoreVals     = Object.values(scores).map(s => field(s,'score','Score') ?? 0)
  const avgScore      = scoreVals.length ? Math.round(scoreVals.reduce((a,b)=>a+b,0)/scoreVals.length) : 0

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      {modal && (
        <AssetModal
          initial={modal === 'add' ? null : {
            name:       field(modal,'name','Name') ?? '',
            url:        field(modal,'url','Url','URL') ?? '',
            criticality:field(modal,'criticality','Criticality') ?? 'Medium',
            owner:      field(modal,'owner','Owner') ?? '',
            tags:       (field(modal,'tags','Tags') ?? []).join(', '),
            pii:        field(modal,'pii','Pii','PII') ?? false,
            regulated:  field(modal,'regulated','Regulated') ?? false,
          }}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
      {toDelete && (
        <DeleteConfirm
          name={field(toDelete,'name','Name') ?? ''}
          onConfirm={handleDelete}
          onClose={() => setToDelete(null)}
        />
      )}

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 px-4 py-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-crimson-400 mb-2 block">Fleet Management</span>
              <h1 className="text-3xl font-extrabold text-white">Assets</h1>
              <p className="text-gray-400 text-sm mt-1">Register and monitor your web applications and APIs.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleScanAll} disabled={scanAllBusy || loading}
                className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-gray-300 hover:text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                {scanAllBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Scan All
              </button>
              <button onClick={() => setModal('add')}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Asset
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Assets',    value: assets.length,  icon: Server,      color: 'text-blue-400'   },
              { label: 'Critical',        value: criticalCount,  icon: ShieldAlert, color: 'text-red-400'    },
              { label: 'High Risk',       value: highCount,      icon: AlertTriangle,color:'text-orange-400' },
              { label: 'Avg Risk Score',  value: avgScore,       icon: Database,    color: 'text-purple-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white/3 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs text-gray-500">{label}</span>
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <span>{error}</span>
              <button onClick={load} className="text-xs underline">Retry</button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-crimson-400 animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-20">
              <Server className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-semibold">No assets registered yet</p>
              <p className="text-gray-500 text-sm mt-1 mb-6">Add your first web application or API to start scanning.</p>
              <button onClick={() => setModal('add')}
                className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" /> Add Asset
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/3">
                    {['Asset','Criticality','Risk Score','Flags','Last Scanned','Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, i) => {
                    const id          = field(asset,'id','Id') ?? i
                    const name        = field(asset,'name','Name') ?? 'Unknown'
                    const url         = field(asset,'url','Url','URL') ?? ''
                    const crit        = field(asset,'criticality','Criticality') ?? 'Low'
                    const critNorm    = crit.charAt(0).toUpperCase() + crit.slice(1).toLowerCase()
                    const owner       = field(asset,'owner','Owner') ?? ''
                    const pii         = field(asset,'pii','Pii','PII') ?? false
                    const regulated   = field(asset,'regulated','Regulated') ?? false
                    const lastScanned = field(asset,'lastScanned','LastScanned','lastScan','LastScan')
                    const tags        = field(asset,'tags','Tags') ?? []
                    const scoreObj    = scores[id]
                    const score       = scoreObj ? Math.round(field(scoreObj,'score','Score') ?? 0) : null
                    const cs          = CRIT_STYLES[critNorm] ?? CRIT_STYLES.Low
                    const isScanning  = scanning[id]

                    return (
                      <tr key={id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        {/* Asset */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-crimson-500/10 border border-crimson-500/20 rounded-lg flex items-center justify-center shrink-0">
                              <Globe className="w-4 h-4 text-crimson-400" />
                            </div>
                            <div>
                              <p className="text-white font-semibold">{name}</p>
                              <p className="text-gray-500 text-xs truncate max-w-[180px]">{url}</p>
                              {owner && <p className="text-gray-600 text-xs">{owner}</p>}
                            </div>
                          </div>
                        </td>
                        {/* Criticality */}
                        <td className="px-4 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${cs.badge}`}>
                            {critNorm}
                          </span>
                        </td>
                        {/* Risk Score */}
                        <td className="px-4 py-4">
                          {score !== null ? (
                            <div className="min-w-[100px]">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-white font-bold text-sm">{score}</span>
                                <span className="text-gray-500 text-xs">/100</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${riskBar(score)}`} style={{ width: `${Math.min(score,100)}%` }} />
                              </div>
                            </div>
                          ) : <span className="text-gray-600 text-xs">—</span>}
                        </td>
                        {/* Flags */}
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {pii && (
                              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> PII
                              </span>
                            )}
                            {regulated && (
                              <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldAlert className="w-2.5 h-2.5" /> Regulated
                              </span>
                            )}
                            {tags.slice(0,2).map(t => (
                              <span key={t} className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Tag className="w-2.5 h-2.5" />{t}
                              </span>
                            ))}
                          </div>
                        </td>
                        {/* Last Scanned */}
                        <td className="px-4 py-4">
                          <span className="text-gray-400 text-xs">{fmtDate(lastScanned)}</span>
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleScan(asset)} disabled={isScanning}
                              title="Scan now"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-crimson-500/10 hover:bg-crimson-500/20 text-crimson-400 transition-colors disabled:opacity-40">
                              {isScanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => setModal(asset)} title="Edit"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setToDelete(asset)} title="Delete"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
