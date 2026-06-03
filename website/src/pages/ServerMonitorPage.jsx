import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, Loader2, AlertCircle, RefreshCw,
  Server, Plus, X, Copy, Check, ChevronDown, ChevronUp,
  Cpu, HardDrive, Wifi, Activity, Key, Terminal,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API     = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function field(obj, ...keys) {
  for (const k of keys) if (obj?.[k] != null) return obj[k]
  return ''
}

/* ── Copy button ── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) }}
      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/* ── Registration result card ── */
function RegistrationCard({ result, onClose }) {
  const agentKey   = field(result, 'agentKey', 'AgentKey', 'agent_key', 'key', 'Key', 'token', 'Token')
  const instructions = field(result, 'setupInstructions', 'SetupInstructions', 'instructions', 'Instructions', 'setup', 'Setup')
  const serverName = field(result, 'name', 'Name', 'hostname', 'Hostname')

  return (
    <div className="bg-green-500/8 border border-green-500/25 rounded-2xl p-5 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-sm font-semibold text-white">
            Server registered{serverName ? `: ${serverName}` : ''}
          </p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {agentKey && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5" /> Agent Key — save this, it won't be shown again
          </p>
          <div className="flex items-center gap-2 bg-[#0d1117] border border-white/10 rounded-xl px-3 py-2.5">
            <code className="flex-1 text-xs text-green-400 font-mono break-all">{agentKey}</code>
            <CopyBtn text={agentKey} />
          </div>
        </div>
      )}

      {agentKey && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" /> Run the Agent
          </p>
          <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <span className="text-xs text-gray-500">Shell</span>
              <CopyBtn text={`udyo360-agent --mode monitor --key ${agentKey}`} />
            </div>
            <pre className="px-3 py-3 text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{`udyo360-agent --mode monitor --key ${agentKey}`}</pre>
          </div>
          {instructions && (
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">{instructions}</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Metric bar ── */
function MetricBar({ label, value, unit = '%', icon: Icon, color = 'bg-crimson-500' }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400">{label}</span>
        </div>
        <span className="text-xs font-semibold text-white">{value != null ? `${value}${unit}` : '—'}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

/* ── Metrics panel ── */
function MetricsPanel({ serverId }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/api/servermonitor/${serverId}/metrics`, { headers: authHeaders() })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setMetrics(await res.json())
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [serverId])

  useEffect(() => { fetch_() }, [fetch_])

  if (loading) return <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
  if (error)   return <p className="text-xs text-red-400 py-3 px-1">{error}</p>
  if (!metrics) return null

  const cpu     = metrics.cpu     ?? metrics.Cpu     ?? metrics.cpuUsage    ?? metrics.CpuUsage    ?? null
  const mem     = metrics.memory  ?? metrics.Memory  ?? metrics.memoryUsage ?? metrics.MemoryUsage ?? null
  const disk    = metrics.disk    ?? metrics.Disk    ?? metrics.diskUsage   ?? metrics.DiskUsage   ?? null
  const network = metrics.network ?? metrics.Network ?? metrics.networkMbps ?? metrics.NetworkMbps ?? null
  const uptime  = metrics.uptime  ?? metrics.Uptime  ?? null
  const extra   = metrics.checks  ?? metrics.Checks  ?? metrics.findings    ?? metrics.Findings    ?? []

  return (
    <div className="px-4 pb-4 pt-3 border-t border-white/8 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Live Metrics</p>
        <button onClick={fetch_} className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition-colors">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cpu     != null && <MetricBar label="CPU"     value={cpu}     icon={Cpu}       color="bg-blue-500" />}
        {mem     != null && <MetricBar label="Memory"  value={mem}     icon={Activity}  color="bg-purple-500" />}
        {disk    != null && <MetricBar label="Disk"    value={disk}    icon={HardDrive} color="bg-orange-500" />}
        {network != null && <MetricBar label="Network" value={network} icon={Wifi}      unit=" Mbps" color="bg-teal-500" />}
      </div>

      {uptime && (
        <p className="text-xs text-gray-500">Uptime: <span className="text-gray-300">{uptime}</span></p>
      )}

      {extra.length > 0 && (
        <div className="space-y-1 pt-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checks</p>
          {extra.map((c, i) => {
            const name   = field(c, 'name', 'Name', 'check', 'Check')
            const status = field(c, 'status', 'Status', 'result', 'Result')
            const ok     = (status ?? '').toLowerCase() === 'pass' || (status ?? '').toLowerCase() === 'ok'
            return (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{name}</span>
                <span className={ok ? 'text-green-400' : 'text-red-400'}>{status}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Server row ── */
function ServerRow({ server }) {
  const [expanded, setExpanded] = useState(false)

  const id       = field(server, 'id', 'Id', 'serverId', 'ServerId')
  const name     = field(server, 'name', 'Name', 'hostname', 'Hostname') || 'Unnamed Server'
  const ip       = field(server, 'ip', 'Ip', 'ipAddress', 'IpAddress', 'host', 'Host')
  const os       = field(server, 'os', 'Os', 'platform', 'Platform')
  const status   = field(server, 'status', 'Status') || 'unknown'
  const lastSeen = field(server, 'lastSeen', 'LastSeen', 'lastPing', 'LastPing')

  const isOnline = status.toLowerCase() === 'online' || status.toLowerCase() === 'active'

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${expanded ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-white/3 transition-colors">
        <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-400' : 'bg-gray-600'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-gray-500 mt-0.5">{[ip, os].filter(Boolean).join(' · ') || 'No details'}</p>
        </div>
        {lastSeen && (
          <p className="text-xs text-gray-600 shrink-0 hidden sm:block">
            {new Date(lastSeen).toLocaleString()}
          </p>
        )}
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${isOnline ? 'text-green-400 bg-green-400/10' : 'text-gray-500 bg-white/5'}`}>
          {status}
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>

      {expanded && <MetricsPanel serverId={id} />}
    </div>
  )
}

/* ── Register modal ── */
function RegisterModal({ onClose, onRegistered }) {
  const [name, setName]       = useState('')
  const [ip, setIp]           = useState('')
  const [os, setOs]           = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const body = { name: name.trim() }
      if (ip.trim()) body.ip = ip.trim()
      if (os.trim()) body.os = os.trim()
      const res = await fetch(`${BACKEND}/api/servermonitor`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.message ?? d.error ?? `Server error ${res.status}`)
      }
      const data = await res.json()
      onRegistered(data)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#0f1117] border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Register Server</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-3 py-2.5 text-xs mb-4">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Server Name <span className="text-red-400">*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="prod-web-01"
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">IP Address <span className="text-gray-600">(optional)</span></label>
            <input value={ip} onChange={(e) => setIp(e.target.value)} placeholder="192.168.1.1"
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">OS / Platform <span className="text-gray-600">(optional)</span></label>
            <input value={os} onChange={(e) => setOs(e.target.value)} placeholder="Ubuntu 22.04"
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Registering…</> : 'Register Server'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function ServerMonitorPage() {
  const { logout } = useAuth()
  const navigate   = useNavigate()

  const [servers, setServers]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showModal, setShowModal]     = useState(false)
  const [regResult, setRegResult]     = useState(null)

  const token = localStorage.getItem('ws_token')

  const fetchServers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BACKEND}/api/servermonitor`, { headers: authHeaders() })
      if (res.status === 401) { navigate('/login?redirect=/servermonitor'); return }
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setServers(Array.isArray(data) ? data : data?.servers ?? data?.Servers ?? data?.items ?? [])
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }, [navigate])

  useEffect(() => {
    if (!token) { navigate('/login?redirect=/servermonitor'); return }
    fetchServers()
  }, [])

  const handleRegistered = (result) => {
    setShowModal(false)
    setRegResult(result)
    fetchServers()
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Udyo<span className="text-crimson-500">360</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/agent" className="text-gray-400 hover:text-white text-sm transition-colors">Udyo360 Agent</Link>
          <button onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/25 rounded-xl flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Server Monitor</h1>
              <p className="text-sm text-gray-400 mt-0.5">Register servers and view live metrics</p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors shrink-0">
            <Plus className="w-4 h-4" /> Register Server
          </button>
        </div>

        {/* Registration result */}
        {regResult && <RegistrationCard result={regResult} onClose={() => setRegResult(null)} />}

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white">
              Registered Servers
              {!loading && <span className="text-gray-500 font-normal ml-2">({servers.length})</span>}
            </p>
            <button onClick={fetchServers} disabled={loading}
              className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-gray-600 animate-spin" /></div>}

          {!loading && !error && servers.length === 0 && (
            <div className="text-center py-12">
              <Server className="w-8 h-8 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No servers registered yet.</p>
              <button onClick={() => setShowModal(true)}
                className="mt-3 text-crimson-400 hover:text-crimson-300 text-sm font-medium transition-colors">
                Register your first server →
              </button>
            </div>
          )}

          {!loading && servers.length > 0 && (
            <div className="p-3 space-y-2">
              {servers.map((s, i) => (
                <ServerRow key={field(s, 'id', 'Id', 'serverId') || i} server={s} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showModal && <RegisterModal onClose={() => setShowModal(false)} onRegistered={handleRegistered} />}
    </div>
  )
}
