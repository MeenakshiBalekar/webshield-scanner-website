import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, Loader2, AlertCircle, RefreshCw,
  Zap, Play, CheckCircle, XCircle, Clock,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const API     = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/* ── Toggle switch ── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 ${
        checked ? 'bg-crimson-500' : 'bg-white/15'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const s = (status ?? '').toLowerCase()
  if (s === 'completed' || s === 'done' || s === 'success')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400"><CheckCircle className="w-3 h-3" />Completed</span>
  if (s === 'failed' || s === 'error')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400"><XCircle className="w-3 h-3" />Failed</span>
  if (s === 'running' || s === 'in_progress' || s === 'scanning')
    return <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400"><Loader2 className="w-3 h-3 animate-spin" />Running</span>
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500"><Clock className="w-3 h-3" />{status || '—'}</span>
}

/* ── Single asset row ── */
function AssetRow({ asset, onToggleEnabled, onScanNow }) {
  const [toggling, setToggling]   = useState(false)
  const [scanning, setScanning]   = useState(false)
  const [localEnabled, setLocalEnabled] = useState(null)

  const id         = asset.id         ?? asset.Id         ?? asset.assetId  ?? asset.AssetId  ?? ''
  const url        = asset.url        ?? asset.Url        ?? asset.targetUrl ?? asset.TargetUrl ?? '—'
  const status     = asset.status     ?? asset.Status     ?? ''
  const lastScan   = asset.lastScan   ?? asset.LastScan   ?? asset.lastScannedAt ?? asset.LastScannedAt ?? null
  const schedule   = asset.schedule   ?? asset.Schedule   ?? asset.interval ?? asset.Interval ?? null
  const enabled    = localEnabled !== null ? localEnabled
                   : !!(asset.enabled ?? asset.Enabled ?? asset.isEnabled ?? asset.IsEnabled ?? false)

  const handleToggle = async (val) => {
    setLocalEnabled(val)
    setToggling(true)
    try { await onToggleEnabled(id, val) }
    catch { setLocalEnabled(!val) }  // revert on error
    setToggling(false)
  }

  const handleScanNow = async () => {
    setScanning(true)
    try { await onScanNow(id) }
    finally { setScanning(false) }
  }

  return (
    <tr className="border-b border-white/5 hover:bg-white/3 transition-colors">
      {/* URL */}
      <td className="px-4 py-3.5">
        <p className="text-sm font-medium text-white truncate max-w-xs">{url}</p>
        {id && <p className="text-[11px] text-gray-600 font-mono mt-0.5">#{String(id).slice(0, 8)}</p>}
      </td>

      {/* Last scan */}
      <td className="px-4 py-3.5 hidden sm:table-cell">
        {lastScan
          ? <span className="text-xs text-gray-400">{new Date(lastScan).toLocaleString()}</span>
          : <span className="text-xs text-gray-600">Never</span>
        }
      </td>

      {/* Status */}
      <td className="px-4 py-3.5 hidden md:table-cell">
        <StatusBadge status={status} />
      </td>

      {/* Schedule */}
      <td className="px-4 py-3.5 hidden lg:table-cell">
        {schedule
          ? <span className="text-xs text-gray-400">{schedule}</span>
          : <span className="text-xs text-gray-600">—</span>
        }
      </td>

      {/* Enable toggle */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Toggle checked={enabled} onChange={handleToggle} disabled={toggling} />
          <span className="text-xs text-gray-500">{enabled ? 'On' : 'Off'}</span>
        </div>
      </td>

      {/* Scan Now */}
      <td className="px-4 py-3.5 text-right">
        <button
          onClick={handleScanNow}
          disabled={scanning}
          className="flex items-center gap-1.5 bg-crimson-500/10 hover:bg-crimson-500/20 border border-crimson-500/25 text-crimson-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ml-auto"
        >
          {scanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {scanning ? 'Scanning…' : 'Scan Now'}
        </button>
      </td>
    </tr>
  )
}

/* ── Main page ── */
export default function AutoScanPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const [assets, setAssets]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [allToggling, setAllToggling] = useState(false)

  const token = localStorage.getItem('ws_token')

  const fetchAssets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/api/autoscan`, { headers: authHeaders() })
      if (res.status === 401) { navigate('/login?redirect=/autoscan'); return }
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setAssets(Array.isArray(data) ? data : (data.assets ?? data.Assets ?? data.items ?? data.Items ?? data.scans ?? []))
    } catch {
      // suppress load error — show empty state
    }
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    if (!token) { navigate('/login?redirect=/autoscan'); return }
    fetchAssets()
  }, [])

  /* Per-asset toggle — PATCH /api/autoscan/{id} */
  const handleToggleEnabled = async (id, enabled) => {
    const res = await fetch(`${BACKEND}/api/autoscan/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ enabled }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.message ?? d.error ?? 'Toggle failed')
    }
  }

  /* Global enable/disable all — PATCH /api/autoscan/all */
  const handleToggleAll = async (enabled) => {
    setAllToggling(true)
    try {
      const res = await fetch(`${BACKEND}/api/autoscan/all`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ enabled }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message ?? d.error ?? 'Failed')
      }
      await fetchAssets()
    } catch {
      setError('Toggle failed — please try again')
    }
    setAllToggling(false)
  }

  /* Scan Now — POST /api/autoscan/{id}/scan */
  const handleScanNow = async (id) => {
    const res = await fetch(`${BACKEND}/api/autoscan/${id}/scan`, {
      method: 'POST',
      headers: authHeaders(),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      throw new Error(d.message ?? d.error ?? 'Scan failed')
    }
    // Refresh after a short delay so the new status shows
    setTimeout(fetchAssets, 1500)
  }

  const allEnabled = assets.length > 0 && assets.every((a) =>
    !!(a.enabled ?? a.Enabled ?? a.isEnabled ?? a.IsEnabled ?? false)
  )
  const anyEnabled = assets.some((a) =>
    !!(a.enabled ?? a.Enabled ?? a.isEnabled ?? a.IsEnabled ?? false)
  )

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-10">
        {/* Page title + global toggle */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-crimson-500/15 border border-crimson-500/25 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-crimson-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Auto Scan</h1>
              <p className="text-sm text-gray-400">Automated scheduled scans across your assets</p>
            </div>
          </div>

          {/* Global Enable/Disable All */}
          {!loading && assets.length > 0 && (
            <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-2.5">
              <span className="text-sm text-gray-300 font-medium whitespace-nowrap">
                {allEnabled ? 'All Enabled' : anyEnabled ? 'Partially Enabled' : 'All Disabled'}
              </span>
              {allToggling
                ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                : <Toggle checked={allEnabled} onChange={handleToggleAll} disabled={allToggling} />
              }
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Table */}
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white">
              Assets
              {!loading && <span className="text-gray-500 font-normal ml-2">({assets.length})</span>}
            </p>
            <button
              onClick={fetchAssets}
              disabled={loading}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-14">
              <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
            </div>
          )}

          {!loading && !error && assets.length === 0 && (
            <p className="text-gray-500 text-sm py-14 text-center">
              No assets configured for auto scan yet.
            </p>
          )}

          {!loading && assets.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/8">
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset / URL</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Last Scan</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Schedule</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Enabled</th>
                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset, i) => (
                    <AssetRow
                      key={asset.id ?? asset.Id ?? asset.assetId ?? i}
                      asset={asset}
                      onToggleEnabled={handleToggleEnabled}
                      onScanNow={handleScanNow}
                    />
                  ))}
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
