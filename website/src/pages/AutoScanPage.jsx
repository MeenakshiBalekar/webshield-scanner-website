import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, Plus, Loader2, AlertCircle,
  CheckCircle, XCircle, Clock, RefreshCw, Zap,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function StatusBadge({ status }) {
  const s = (status ?? '').toLowerCase()
  if (s === 'completed' || s === 'done' || s === 'success')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"><CheckCircle className="w-3 h-3" />{status}</span>
  if (s === 'failed' || s === 'error')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3" />{status}</span>
  if (s === 'running' || s === 'in_progress' || s === 'scanning')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full"><Loader2 className="w-3 h-3 animate-spin" />{status}</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 bg-white/5 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" />{status || 'Pending'}</span>
}

function ScanRow({ scan }) {
  const url      = scan.url        ?? scan.Url        ?? scan.targetUrl ?? scan.TargetUrl ?? '—'
  const status   = scan.status     ?? scan.Status     ?? 'pending'
  const created  = scan.createdAt  ?? scan.CreatedAt  ?? scan.created   ?? null
  const id       = scan.id         ?? scan.Id         ?? scan.scanId    ?? ''

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{url}</p>
        {id && <p className="text-xs text-gray-600 mt-0.5 font-mono">#{String(id).slice(0, 8)}</p>}
      </div>
      <StatusBadge status={status} />
      {created && (
        <p className="text-xs text-gray-500 shrink-0 hidden sm:block">
          {new Date(created).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

export default function AutoScanPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const [scans, setScans]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [newUrl, setNewUrl]     = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState(null)

  const token = localStorage.getItem('ws_token')

  useEffect(() => {
    if (!token) { navigate('/login?redirect=/autoscan'); return }
    fetchScans()
  }, [])

  const fetchScans = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/api/autoscan`, { headers: authHeaders() })
      if (res.status === 401) { navigate('/login?redirect=/autoscan'); return }
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setScans(Array.isArray(data) ? data : (data.scans ?? data.Scans ?? data.items ?? data.Items ?? []))
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    setCreating(true)
    setCreateErr(null)
    try {
      const res = await fetch(`${BACKEND}/api/autoscan`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ url: newUrl.trim() }),
      })
      if (res.status === 401) { navigate('/login?redirect=/autoscan'); return }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message ?? d.error ?? `Server error ${res.status}`)
      }
      setNewUrl('')
      await fetchScans()
    } catch (err) {
      setCreateErr(err.message)
    }
    setCreating(false)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/agent" className="text-gray-400 hover:text-white text-sm transition-colors">
            WebShield Agent
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        {/* Page title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-crimson-500/15 border border-crimson-500/25 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-crimson-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Auto Scan</h1>
            <p className="text-sm text-gray-400">Automated security scans — runs on your behalf and stores results</p>
          </div>
        </div>

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex gap-3 mb-8">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://your-app.com"
            required
            className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {creating ? 'Creating…' : 'New Scan'}
          </button>
        </form>

        {createErr && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{createErr}</span>
          </div>
        )}

        {/* Scans list */}
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Your Scans</p>
            <button
              onClick={fetchScans}
              disabled={loading}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center gap-2 text-red-400 text-sm px-4 py-10 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && scans.length === 0 && (
            <p className="text-gray-500 text-sm py-12 text-center">
              No scans yet. Enter a URL above to create your first auto scan.
            </p>
          )}

          {!loading && !error && scans.map((scan, i) => (
            <ScanRow key={scan.id ?? scan.Id ?? i} scan={scan} />
          ))}
        </div>
      </main>
    </div>
  )
}
