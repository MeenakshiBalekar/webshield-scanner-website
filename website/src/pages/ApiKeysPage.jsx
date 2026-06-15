import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Key, Plus, Loader2, AlertCircle, Copy, Check, RotateCcw,
  Trash2, Eye, EyeOff, ShieldCheck, RefreshCw,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getApiKeys, createApiKey, revokeApiKey, rotateApiKey } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const ALL_SCOPES = [
  { id: 'read:scans',    label: 'Read Scans',     desc: 'View scan results and history' },
  { id: 'write:scans',   label: 'Trigger Scans',  desc: 'Start new scans' },
  { id: 'read:assets',   label: 'Read Assets',    desc: 'View asset inventory' },
  { id: 'write:assets',  label: 'Manage Assets',  desc: 'Create and update assets' },
  { id: 'read:reports',  label: 'Export Reports', desc: 'Download PDF and CSV exports' },
  { id: 'admin',         label: 'Admin',          desc: 'Full access — use with care' },
]

function useCopy(text, delay = 2000) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), delay)
    })
  }
  return [copied, copy]
}

/* ── New key banner — shown once after creation ── */
function NewKeyBanner({ apiKey, onDismiss }) {
  const [show, setShow] = useState(false)
  const [copied, copy]  = useCopy(apiKey)
  return (
    <div className="bg-green-500/10 border border-green-500/40 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
          <p className="text-sm font-bold text-green-300">API key created — copy it now</p>
        </div>
        <button onClick={onDismiss} className="text-gray-500 hover:text-white text-xs transition-colors">
          Dismiss
        </button>
      </div>
      <p className="text-xs text-gray-400">This is the only time you will see this key. Store it somewhere safe.</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-green-300 break-all">
          {show ? apiKey : '•'.repeat(Math.min(apiKey.length, 40))}
        </code>
        <button
          onClick={() => setShow(v => !v)}
          className="text-gray-500 hover:text-white transition-colors shrink-0"
          title={show ? 'Hide' : 'Show'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={copy}
          className="flex items-center gap-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/40 text-green-400 text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

/* ── Key row ── */
function KeyRow({ apiKey, orgId, onRevoked, onRotated }) {
  const [revoking, setRevoking]   = useState(false)
  const [rotating, setRotating]   = useState(false)
  const [rotatedKey, setRotatedKey] = useState(null)
  const [, copy]                  = useCopy(rotatedKey ?? '')

  const id        = field(apiKey, 'id', 'Id', 'keyId', 'KeyId')
  const name      = field(apiKey, 'name', 'Name') ?? 'Unnamed Key'
  const scopes    = field(apiKey, 'scopes', 'Scopes') ?? []
  const scopeList = Array.isArray(scopes) ? scopes : [scopes]
  const createdAt = field(apiKey, 'createdAt', 'CreatedAt', 'created')
  const lastUsed  = field(apiKey, 'lastUsed', 'LastUsed', 'lastUsedAt', 'LastUsedAt')
  const prefix    = field(apiKey, 'prefix', 'Prefix', 'keyPrefix', 'KeyPrefix') ?? ''
  const revoked   = field(apiKey, 'revoked', 'Revoked', 'isRevoked', 'IsRevoked')

  const handleRevoke = async () => {
    if (!confirm(`Revoke key "${name}"? This cannot be undone.`)) return
    setRevoking(true)
    try { await revokeApiKey(orgId, id); onRevoked(id) }
    catch (e) { alert(e.message || 'Failed to revoke key') }
    finally { setRevoking(false) }
  }

  const handleRotate = async () => {
    if (!confirm(`Rotate "${name}"? The old key will stop working immediately.`)) return
    setRotating(true)
    try {
      const res = await rotateApiKey(orgId, id)
      const newKey = field(res, 'key', 'Key', 'apiKey', 'ApiKey', 'value', 'Value')
      if (newKey) setRotatedKey(newKey)
      onRotated(id, res)
    } catch (e) { alert(e.message || 'Failed to rotate key') }
    finally { setRotating(false) }
  }

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${revoked ? 'border-white/5 opacity-50' : 'border-white/10'}`}>
      {rotatedKey && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-yellow-400 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5" /> Key rotated — copy the new value now
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono text-yellow-300 bg-black/30 rounded px-2 py-1 break-all">{rotatedKey}</code>
            <button
              onClick={() => { navigator.clipboard.writeText(rotatedKey); setRotatedKey(null) }}
              className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" /> Copy & dismiss
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-white">{name}</p>
            {revoked && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded uppercase">Revoked</span>}
          </div>
          {prefix && <p className="text-[10px] text-gray-500 font-mono">{prefix}•••</p>}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {scopeList.map(s => (
              <span key={s} className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded">{s}</span>
            ))}
          </div>
        </div>
        {!revoked && (
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRotate}
              disabled={rotating}
              className="flex items-center gap-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/25 text-yellow-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {rotating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
              Rotate
            </button>
            <button
              onClick={handleRevoke}
              disabled={revoking}
              className="flex items-center gap-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              Revoke
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 text-[10px] text-gray-600">
        <span>Created {fmtDate(createdAt)}</span>
        <span>Last used {fmtDate(lastUsed)}</span>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function ApiKeysPage() {
  const { id: paramId }       = useParams()
  const [searchParams]        = useSearchParams()
  const orgId                 = paramId || searchParams.get('orgId') || ''

  const [keys, setKeys]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState(['read:scans'])
  const [newApiKey, setNewApiKey] = useState(null)

  const load = () => {
    if (!orgId) { setLoading(false); return }
    setLoading(true); setError(null)
    getApiKeys(orgId)
      .then(data => setKeys(Array.isArray(data) ? data : (data?.keys ?? data?.apiKeys ?? data?.items ?? [])))
      .catch(e => setError(e.message || 'Failed to load API keys'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [orgId])

  const toggleScope = (s) => setSelectedScopes(prev =>
    prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
  )

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newName.trim() || selectedScopes.length === 0) return
    setCreating(true)
    try {
      const res = await createApiKey(orgId, { name: newName.trim(), scopes: selectedScopes })
      const rawKey = field(res, 'key', 'Key', 'apiKey', 'ApiKey', 'value', 'Value')
      const keyObj = field(res, 'apiKey', 'ApiKey') ?? res
      setKeys(k => [typeof keyObj === 'object' ? keyObj : { id: Date.now(), name: newName, scopes: selectedScopes }, ...k])
      if (rawKey) setNewApiKey(rawKey)
      setNewName(''); setSelectedScopes(['read:scans']); setShowForm(false)
    } catch (e) { alert(e.message || 'Failed to create key') }
    finally { setCreating(false) }
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-500/15 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                <Key className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">API Keys</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">API Keys</h1>
                <p className="text-gray-400">Manage programmatic access tokens for this organization.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                <button onClick={load} disabled={loading} className="text-gray-500 hover:text-white transition-colors">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setShowForm(v => !v)}
                  className="flex items-center gap-1.5 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
                >
                  <Plus className="w-4 h-4" /> New Key
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

          {newApiKey && (
            <NewKeyBanner apiKey={newApiKey} onDismiss={() => setNewApiKey(null)} />
          )}

          {showForm && (
            <form onSubmit={handleCreate} className="bg-white/3 border border-crimson-500/30 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-crimson-400" /> Create API Key
              </p>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Key name *</label>
                <input
                  required value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="CI Pipeline Key"
                  className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-2">Scopes *</label>
                <div className="space-y-2">
                  {ALL_SCOPES.map(s => (
                    <label key={s.id} className="flex items-start gap-3 cursor-pointer group">
                      <div className="mt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(s.id)}
                          onChange={() => toggleScope(s.id)}
                          className="w-3.5 h-3.5 accent-crimson-500 rounded"
                        />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">
                          <span className="font-mono text-indigo-400 mr-1.5">{s.id}</span>
                          {s.label}
                        </p>
                        <p className="text-[10px] text-gray-600">{s.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={creating || !newName.trim() || selectedScopes.length === 0}
                  className="flex items-center gap-1.5 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                  {creating ? 'Creating…' : 'Create Key'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-xl transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading API keys…
            </div>
          )}

          {!loading && !error && keys.length === 0 && (
            <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl">
              <Key className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-semibold">No API keys yet</p>
              <p className="text-sm text-gray-500 mt-1">Create a key to access the API programmatically.</p>
            </div>
          )}

          {!loading && keys.length > 0 && (
            <div className="space-y-3">
              {keys.map((k, i) => (
                <KeyRow
                  key={field(k, 'id', 'Id', 'keyId') ?? i}
                  apiKey={k}
                  orgId={orgId}
                  onRevoked={(id) => setKeys(ks => ks.map(x => field(x, 'id', 'Id', 'keyId') === id ? { ...x, revoked: true, Revoked: true } : x))}
                  onRotated={(id, updated) => setKeys(ks => ks.map(x => field(x, 'id', 'Id', 'keyId') === id ? { ...x, ...updated } : x))}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
