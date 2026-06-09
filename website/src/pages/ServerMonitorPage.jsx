import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Server, Plus, Trash2, Copy, Check, ChevronDown, ChevronUp,
  AlertCircle, Wifi, WifiOff, Terminal, Upload, FileJson, X, Loader2,
} from 'lucide-react'
import Navbar from '../components/Navbar'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try { const b = await res.json(); msg = b.error || b.message || b.title || msg } catch {}
    throw new Error(msg)
  }
  return res.json()
}

// ── helpers ─────────────────────────────────────────────────────────────────

function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button onClick={copy} className={`flex items-center gap-1 text-xs font-semibold transition-colors ${className}`}>
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function ProgressBar({ label, value }) {
  const v = typeof value === 'number' ? Math.min(Math.max(value, 0), 100) : 0
  const color = v >= 90 ? 'bg-red-500' : v >= 70 ? 'bg-orange-400' : v >= 50 ? 'bg-yellow-400' : 'bg-emerald-500'
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-white">{v.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

function SeverityBadge({ severity }) {
  const s = (severity ?? '').toLowerCase()
  const color =
    s.startsWith('critical') ? 'bg-red-500/20 text-red-400 border-red-500/30' :
    s.startsWith('high')     ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
    s.startsWith('medium')   ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
    s.startsWith('low')      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                               'bg-white/10 text-gray-400 border-white/20'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold capitalize ${color}`}>
      {severity || 'info'}
    </span>
  )
}

function SetupCommands({ agentKey }) {
  const cmd1 = `wget https://github.com/udyo360/agent/releases/latest/udyo360-agent-linux-x64`
  const cmd2 = `UDYO360_AGENT_KEY=${agentKey} udyo360-agent --mode monitor`
  const cmd3 = `udyo360-agent --mode monitor --key ${agentKey} --api ${BASE}`
  return (
    <div className="space-y-2 text-xs font-mono">
      <p className="text-gray-500"># Download the agent</p>
      <div className="flex items-start justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
        <code className="text-emerald-400 break-all">{cmd1}</code>
        <CopyButton text={cmd1} className="text-gray-400 hover:text-white shrink-0 ml-2" />
      </div>
      <p className="text-gray-500 pt-1"># Start server monitoring</p>
      <div className="flex items-start justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
        <code className="text-emerald-400 break-all">{cmd2}</code>
        <CopyButton text={cmd2} className="text-gray-400 hover:text-white shrink-0 ml-2" />
      </div>
      <p className="text-gray-500 pt-1"># Or with explicit flags</p>
      <div className="flex items-start justify-between gap-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2">
        <code className="text-emerald-400 break-all">{cmd3}</code>
        <CopyButton text={cmd3} className="text-gray-400 hover:text-white shrink-0 ml-2" />
      </div>
    </div>
  )
}

// ── MetricsPanel ─────────────────────────────────────────────────────────────

function MetricsPanel({ serverId }) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)

  useEffect(() => {
    apiFetch(`/api/servermonitor/${serverId}/metrics?hours=24`)
      .then(setMetrics)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false))
  }, [serverId])

  if (loading) return <div className="flex justify-center py-4"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
  if (err) return <p className="text-red-400 text-xs py-2">{err}</p>

  const rows = Array.isArray(metrics) ? metrics : (metrics?.metrics ?? metrics?.items ?? [])
  if (!rows || rows.length === 0) return <p className="text-gray-500 text-xs py-2">No metric history available.</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-gray-500 border-b border-white/10">
            <th className="text-left py-1.5 pr-4 font-semibold">Time</th>
            <th className="text-right py-1.5 pr-4 font-semibold">CPU%</th>
            <th className="text-right py-1.5 pr-4 font-semibold">Memory%</th>
            <th className="text-right py-1.5 font-semibold">Disk%</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 24).map((m, i) => {
            const ts = m.timestamp ?? m.Timestamp ?? m.createdAt ?? m.CreatedAt
            return (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="py-1.5 pr-4 text-gray-400">{ts ? new Date(ts).toLocaleTimeString() : '—'}</td>
                <td className="py-1.5 pr-4 text-right text-white">{(m.cpuPercent ?? m.CpuPercent ?? 0).toFixed(1)}</td>
                <td className="py-1.5 pr-4 text-right text-white">{(m.memoryPercent ?? m.MemoryPercent ?? 0).toFixed(1)}</td>
                <td className="py-1.5 text-right text-white">{(m.diskPercent ?? m.DiskPercent ?? 0).toFixed(1)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── ServerCard ───────────────────────────────────────────────────────────────

function ServerCard({ server, onDelete }) {
  const [setupOpen, setSetupOpen]     = useState(false)
  const [metricsOpen, setMetricsOpen] = useState(false)
  const [deleting, setDeleting]       = useState(false)

  const id       = server.id         ?? server.Id
  const name     = server.name       ?? server.Name       ?? 'Unnamed Server'
  const hostname = server.hostname   ?? server.Hostname   ?? server.hostIp ?? server.HostIp ?? ''
  const online   = server.isOnline   ?? server.IsOnline   ?? false
  const lastSeen = server.lastSeenAt ?? server.LastSeenAt
  const agentKey = server.agentKey   ?? server.AgentKey   ?? ''
  const m        = server.latestMetric ?? server.LatestMetric ?? {}
  const cpu      = m.cpuPercent    ?? m.CpuPercent    ?? 0
  const memory   = m.memoryPercent ?? m.MemoryPercent ?? 0
  const disk     = m.diskPercent   ?? m.DiskPercent   ?? 0

  const handleDelete = async () => {
    if (!window.confirm(`Remove "${name}"?`)) return
    setDeleting(true)
    try {
      await apiFetch(`/api/servermonitor/${id}`, { method: 'DELETE' })
      onDelete(id)
    } catch (e) {
      alert(e.message)
      setDeleting(false)
    }
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${online ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]' : 'bg-red-500'}`} />
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{name}</p>
            {hostname && <p className="text-xs text-gray-500 truncate">{hostname}</p>}
          </div>
          {online
            ? <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold shrink-0"><Wifi className="w-3.5 h-3.5" />Online</span>
            : <span className="flex items-center gap-1 text-xs text-red-400 font-semibold shrink-0"><WifiOff className="w-3.5 h-3.5" />Offline</span>
          }
        </div>
        <button onClick={handleDelete} disabled={deleting} className="text-gray-600 hover:text-red-400 transition-colors shrink-0" aria-label="Delete">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>

      <p className="text-xs text-gray-500">Last seen: {lastSeen ? new Date(lastSeen).toLocaleString() : 'Never'}</p>

      {/* Metrics bars */}
      <div className="space-y-2">
        <ProgressBar label="CPU" value={cpu} />
        <ProgressBar label="Memory" value={memory} />
        <ProgressBar label="Disk" value={disk} />
      </div>

      {/* Agent key */}
      {agentKey && (
        <div className="flex items-center justify-between gap-2 bg-black/30 border border-white/10 rounded-xl px-3 py-2">
          <div className="min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Agent Key</p>
            <code className="text-xs text-emerald-400 font-mono truncate block">{agentKey}</code>
          </div>
          <CopyButton text={agentKey} className="text-gray-400 hover:text-white shrink-0" />
        </div>
      )}

      {/* Setup instructions */}
      <button onClick={() => setSetupOpen((v) => !v)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors font-semibold">
        <Terminal className="w-3.5 h-3.5" />
        Setup Instructions
        {setupOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {setupOpen && <SetupCommands agentKey={agentKey} />}

      {/* Metrics history */}
      <button onClick={() => setMetricsOpen((v) => !v)} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors font-semibold">
        View Metrics History (24h)
        {metricsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>
      {metricsOpen && <MetricsPanel serverId={id} />}
    </div>
  )
}

// ── RegisterModal ─────────────────────────────────────────────────────────────

function RegisterModal({ onClose, onRegistered }) {
  const [form, setForm] = useState({ name: '', hostname: '', cpuThreshold: 90, memoryThreshold: 85, diskThreshold: 90 })
  const [loading, setLoading] = useState(false)
  const [err, setErr]         = useState(null)
  const [result, setResult]   = useState(null)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const res = await apiFetch('/api/servermonitor', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          hostname: form.hostname.trim() || undefined,
          alertThresholds: {
            cpuPercent:    Number(form.cpuThreshold),
            memoryPercent: Number(form.memoryThreshold),
            diskPercent:   Number(form.diskThreshold),
          },
        }),
      })
      setResult(res)
      onRegistered(res)
    } catch (e) {
      setErr(e.message)
    }
    setLoading(false)
  }

  const agentKey = result?.agentKey ?? result?.AgentKey ?? ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-navy-900 border border-white/15 rounded-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Register Server</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Server Name <span className="text-crimson-500">*</span></label>
              <input required value={form.name} onChange={set('name')} placeholder="prod-web-01"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Hostname / IP <span className="text-gray-600">(optional)</span></label>
              <input value={form.hostname} onChange={set('hostname')} placeholder="192.168.1.10 or server.example.com"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'cpuThreshold',    label: 'CPU Alert %' },
                { key: 'memoryThreshold', label: 'Memory Alert %' },
                { key: 'diskThreshold',   label: 'Disk Alert %' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                  <input type="number" min="1" max="100" value={form[key]} onChange={set(key)}
                    className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                </div>
              ))}
            </div>
            {err && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/15 text-gray-400 hover:text-white text-sm font-semibold transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Register
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold">
              <Check className="w-5 h-5" /> Server registered successfully
            </div>
            <div className="bg-black/40 border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-400">Your Agent Key — copy it now:</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-emerald-400 font-mono text-sm break-all">{agentKey}</code>
                <CopyButton text={agentKey} className="text-gray-400 hover:text-white shrink-0" />
              </div>
            </div>
            <p className="text-xs text-gray-400">Setup commands:</p>
            <SetupCommands agentKey={agentKey} />
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold transition-colors">Done</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab 1: Live Server Monitors ───────────────────────────────────────────────

function LiveMonitors() {
  const [servers, setServers]     = useState(null)
  const [err, setErr]             = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    apiFetch('/api/servermonitor')
      .then((d) => setServers(Array.isArray(d) ? d : (d.servers ?? d.items ?? [])))
      .catch((e) => setErr(e.message))
  }, [])

  const handleRegistered = (s) => setServers((prev) => [s, ...(prev ?? [])])
  const handleDelete     = (id) => setServers((prev) => prev.filter((s) => (s.id ?? s.Id) !== id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{servers ? `${servers.length} server${servers.length !== 1 ? 's' : ''} registered` : ''}</p>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Register Server
        </button>
      </div>

      {err && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
          <AlertCircle className="w-4 h-4" /> {err}
        </div>
      )}

      {!servers && !err && <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}

      {servers?.length === 0 && !err && (
        <div className="text-center py-20">
          <Server className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No servers registered</h3>
          <p className="text-gray-400 mb-6 text-sm">Install the agent on any Linux server to start live monitoring.</p>
          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
            <Plus className="w-4 h-4" /> Register Your First Server
          </button>
        </div>
      )}

      {servers && servers.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {servers.map((s, i) => <ServerCard key={s.id ?? s.Id ?? i} server={s} onDelete={handleDelete} />)}
        </div>
      )}

      {showModal && <RegisterModal onClose={() => setShowModal(false)} onRegistered={handleRegistered} />}
    </div>
  )
}

// ── AgentScanRow ──────────────────────────────────────────────────────────────

function AgentScanRow({ scan, onDelete }) {
  const [open, setOpen]         = useState(false)
  const [detail, setDetail]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState(null)
  const [deleting, setDeleting] = useState(false)

  const id       = scan.id       ?? scan.Id
  const hostname = scan.hostname ?? scan.Hostname ?? scan.host ?? scan.Host ?? '—'
  const scanDate = scan.scanDate ?? scan.ScanDate ?? scan.createdAt ?? scan.CreatedAt
  const counts   = scan.findings ?? scan.Findings ?? scan.severityCounts ?? scan.SeverityCounts ?? {}

  const handleToggle = useCallback(async () => {
    if (!open && !detail) {
      setLoading(true); setErr(null)
      try { setDetail(await apiFetch(`/api/agentscan/${id}`)) }
      catch (e) { setErr(e.message) }
      setLoading(false)
    }
    setOpen((v) => !v)
  }, [open, detail, id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this scan report?')) return
    setDeleting(true)
    try { await apiFetch(`/api/agentscan/${id}`, { method: 'DELETE' }); onDelete(id) }
    catch (e) { alert(e.message); setDeleting(false) }
  }

  const findings = detail ? (detail.findings ?? detail.Findings ?? detail.results ?? detail.Results ?? []) : []
  const sevCount = (sev) => {
    const k = sev.toLowerCase()
    return counts[k] ?? counts[k[0].toUpperCase() + k.slice(1)] ?? 0
  }

  return (
    <div className="border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4 px-4 py-3.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium">{hostname}</p>
          <p className="text-xs text-gray-500 mt-0.5">{scanDate ? new Date(scanDate).toLocaleString() : '—'}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs flex-wrap">
          {['critical', 'high', 'medium', 'low'].map((sev) => {
            const n = sevCount(sev)
            return n > 0 ? <SeverityBadge key={sev} severity={`${sev} (${n})`} /> : null
          })}
        </div>
        <button onClick={handleDelete} disabled={deleting} className="text-gray-600 hover:text-red-400 transition-colors">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
        <button onClick={handleToggle} className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4">
          <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3">
            {loading && <div className="flex justify-center py-4"><span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}
            {err && <p className="text-red-400 text-sm py-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</p>}
            {!loading && !err && findings.length === 0 && <p className="text-gray-500 text-sm py-3 text-center">No findings.</p>}
            {!loading && !err && findings.map((f, i) => {
              const title = f.title ?? f.Title ?? f.name ?? f.Name ?? '—'
              const cat   = f.category ?? f.Category ?? ''
              const sev   = f.severity ?? f.Severity ?? ''
              const desc  = f.description ?? f.Description ?? ''
              const fix   = f.remediation ?? f.Remediation ?? ''
              return (
                <div key={i} className="py-2.5 border-b border-white/5 last:border-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={sev} />
                    {cat && <span className="text-xs text-gray-500 uppercase tracking-wider">{cat}</span>}
                    <span className="text-sm text-white font-medium">{title}</span>
                  </div>
                  {desc && <p className="text-xs text-gray-400">{desc}</p>}
                  {fix && <p className="text-xs text-emerald-400">Fix: {fix}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── UploadPanel ───────────────────────────────────────────────────────────────

function UploadPanel({ onUploaded }) {
  const [dragging, setDragging] = useState(false)
  const [text, setText]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState(null)
  const [ok, setOk]             = useState(false)
  const fileRef = useRef()

  const upload = async (payload) => {
    setLoading(true); setErr(null); setOk(false)
    try {
      const res = await apiFetch('/api/agentscan/upload', { method: 'POST', body: JSON.stringify(payload) })
      setOk(true); setText('')
      onUploaded(res)
      setTimeout(() => setOk(false), 3000)
    } catch (e) {
      setErr(e.message)
    }
    setLoading(false)
  }

  const handleFile = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try { upload(JSON.parse(e.target.result)) }
      catch { setErr('Invalid JSON file.') }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 cursor-pointer transition-colors ${
          dragging ? 'border-crimson-500 bg-crimson-500/5' : 'border-white/15 hover:border-white/30'
        }`}
      >
        <FileJson className="w-8 h-8 text-gray-500" />
        <p className="text-sm text-gray-400">Drag & drop a <span className="text-white font-semibold">.json</span> agent report, or click to browse</p>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-2">Or paste JSON directly:</p>
        <textarea
          value={text} onChange={(e) => setText(e.target.value)} rows={5}
          placeholder='{"hostname":"...","findings":[...]}'
          className="w-full bg-white/5 border border-white/10 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-xs font-mono outline-none transition-colors resize-y"
        />
        <button
          onClick={() => { try { upload(JSON.parse(text)) } catch { setErr('Invalid JSON.') } }}
          disabled={!text.trim() || loading}
          className="mt-2 flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          <Upload className="w-4 h-4" /> Upload Report
        </button>
      </div>

      {err && <p className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{err}</p>}
      {ok && <p className="text-emerald-400 text-sm flex items-center gap-2"><Check className="w-4 h-4" />Report uploaded successfully.</p>}
    </div>
  )
}

// ── Tab 2: Agent Scan Reports ─────────────────────────────────────────────────

function AgentScanReports() {
  const [scans, setScans]           = useState(null)
  const [err, setErr]               = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    apiFetch('/api/agentscan')
      .then((d) => setScans(Array.isArray(d) ? d : (d.scans ?? d.items ?? [])))
      .catch((e) => setErr(e.message))
  }, [])

  const handleUploaded = (report) => { setScans((prev) => [report, ...(prev ?? [])]); setShowUpload(false) }
  const handleDelete   = (id) => setScans((prev) => prev.filter((s) => (s.id ?? s.Id) !== id))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{scans ? `${scans.length} report${scans.length !== 1 ? 's' : ''}` : ''}</p>
        <button onClick={() => setShowUpload((v) => !v)} className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Upload className="w-4 h-4" /> Upload Report
        </button>
      </div>

      {showUpload && (
        <div className="mb-6 p-5 bg-white/3 border border-white/10 rounded-2xl">
          <UploadPanel onUploaded={handleUploaded} />
        </div>
      )}

      {/* Agent setup commands */}
      <div className="mb-6 bg-black/30 border border-white/10 rounded-2xl p-4 space-y-2 text-xs font-mono">
        <p className="text-gray-500"># Local scan — results stay offline</p>
        <div className="flex items-center justify-between gap-2">
          <code className="text-emerald-400">udyo360-agent</code>
          <CopyButton text="udyo360-agent" className="text-gray-400 hover:text-white" />
        </div>
        <p className="text-gray-500 pt-1"># Local scan + push to dashboard</p>
        <div className="flex items-center justify-between gap-2">
          <code className="text-emerald-400">udyo360-agent --key &lt;agentKey&gt;</code>
          <CopyButton text="udyo360-agent --key <agentKey>" className="text-gray-400 hover:text-white" />
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
          <AlertCircle className="w-4 h-4" /> {err}
        </div>
      )}

      {!scans && !err && <div className="flex justify-center py-20"><span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}

      {scans?.length === 0 && !err && (
        <div className="text-center py-20">
          <FileJson className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No scan reports yet</h3>
          <p className="text-gray-400 text-sm">Run the agent locally and upload the JSON report above.</p>
        </div>
      )}

      {scans && scans.length > 0 && (
        <div className="border border-white/10 rounded-2xl overflow-hidden">
          {scans.map((s, i) => <AgentScanRow key={s.id ?? s.Id ?? i} scan={s} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function ServerMonitorPage() {
  const [tab, setTab] = useState('monitors')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-crimson-500/15 border border-crimson-500/30 rounded-lg flex items-center justify-center">
              <Server className="w-4 h-4 text-crimson-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-crimson-400">Agent-Based Scanner</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Server Monitor & Agent Scans</h1>
          <p className="text-gray-400 text-sm mt-1.5">
            Deploy the lightweight Udyo360 agent on any Linux server for live metrics monitoring and local security scanning.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex rounded-xl overflow-hidden border border-white/10 w-fit mb-8">
          <button
            onClick={() => setTab('monitors')}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${tab === 'monitors' ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Wifi className="w-4 h-4" /> Live Server Monitors
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors flex items-center gap-2 ${tab === 'reports' ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <FileJson className="w-4 h-4" /> Agent Scan Reports
          </button>
        </div>

        {tab === 'monitors' && <LiveMonitors />}
        {tab === 'reports'  && <AgentScanReports />}
      </main>
    </div>
  )
}
