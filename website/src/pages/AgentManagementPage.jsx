import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Cpu, Loader2, AlertCircle, X, RefreshCw, Copy, Check,
  CheckCircle2, XCircle, AlertTriangle, Monitor, Terminal,
  Server, Trash2, Eye, Activity, Wifi, Package, ChevronDown,
  ChevronUp, Shield, Download,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getAgents, getAgentDetail, decommissionAgent,
  generateAgentToken, getAgentInstallScript,
} from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const BASE_URL = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

/* ── Status helpers ── */
function agentStatus(agent) {
  const override = (field(agent, 'status', 'Status') ?? '').toLowerCase()
  if (override === 'online')  return 'online'
  if (override === 'offline') return 'offline'
  if (override === 'stale')   return 'stale'
  const lastSeen = field(agent, 'lastSeen', 'LastSeen', 'lastHeartbeat', 'LastHeartbeat', 'updatedAt', 'UpdatedAt')
  if (!lastSeen) return 'offline'
  const diffMs = Date.now() - new Date(lastSeen).getTime()
  if (diffMs < 5 * 60 * 1000)  return 'online'
  if (diffMs < 60 * 60 * 1000) return 'stale'
  return 'offline'
}

const STATUS_CFG = {
  online:  { dot: 'bg-green-400',  text: 'text-green-400',  label: 'Online'  },
  stale:   { dot: 'bg-amber-400',  text: 'text-amber-400',  label: 'Stale'   },
  offline: { dot: 'bg-red-500',    text: 'text-red-400',    label: 'Offline' },
}

function StatusBadge({ agent }) {
  const s = agentStatus(agent)
  const cfg = STATUS_CFG[s] ?? STATUS_CFG.offline
  return (
    <span className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${s === 'online' ? 'animate-pulse' : ''}`} />
      {cfg.label}
    </span>
  )
}

/* ── Copy button ── */
function CopyButton({ text, small }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-1 transition-colors shrink-0 ${small ? 'text-[10px]' : 'text-xs'} ${copied ? 'text-green-400' : 'text-gray-500 hover:text-white'}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function fmtDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1)  return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24)   return `${diffH}h ago`
  return d.toLocaleDateString()
}

/* ─────────────────────────────────────────
   Agent Detail Drawer
───────────────────────────────────────── */
function DetailSection({ title, icon: Icon, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  )
}

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

function AgentDetailDrawer({ agentId, onClose }) {
  const [detail, setDetail]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const drawerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(null); setDetail(null)
    getAgentDetail(agentId)
      .then(d => { if (!cancelled) setDetail(d) })
      .catch(e => { if (!cancelled) setError(e.message || 'Failed to load agent detail') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [agentId])

  useEffect(() => {
    const handler = (e) => { if (drawerRef.current && !drawerRef.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const sysInfo   = field(detail, 'systemInfo', 'SystemInfo', 'system', 'System') ?? detail
  const hostname  = field(sysInfo, 'hostname', 'Hostname', 'name', 'Name') ?? '—'
  const os        = field(sysInfo, 'os', 'Os', 'osName', 'OsName', 'platform', 'Platform') ?? '—'
  const cpu       = field(sysInfo, 'cpuModel', 'CpuModel', 'cpu', 'Cpu') ?? '—'
  const cpuCores  = field(sysInfo, 'cpuCores', 'CpuCores', 'cores', 'Cores')
  const ramGb     = field(sysInfo, 'ramGb', 'RamGb', 'totalRamGb', 'TotalRamGb', 'ram', 'Ram')
  const uptime    = field(sysInfo, 'uptimeHours', 'UptimeHours', 'uptime', 'Uptime')
  const agentVer  = field(detail, 'agentVersion', 'AgentVersion', 'version', 'Version')

  const software  = field(detail, 'software', 'Software', 'installedSoftware', 'InstalledSoftware') ?? []
  const ports     = field(detail, 'openPorts', 'OpenPorts', 'ports', 'Ports') ?? []
  const services  = field(detail, 'services', 'Services', 'runningServices', 'RunningServices') ?? []
  const patchGaps = field(detail, 'patchGaps', 'PatchGaps', 'vulnerabilities', 'Vulnerabilities') ?? []

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
      <div ref={drawerRef}
        className="w-full max-w-xl bg-navy-900 border-l border-white/10 flex flex-col h-full overflow-hidden animate-slide-in-right">
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Agent Detail</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 text-gray-400 py-16 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading agent data…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* System Info */}
              <DetailSection title="System Info" icon={Monitor}>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                  {[
                    ['Hostname',     hostname],
                    ['OS',           os],
                    ['CPU',          cpuCores ? `${cpu} (${cpuCores} cores)` : cpu],
                    ['RAM',          ramGb ? `${ramGb} GB` : '—'],
                    ['Uptime',       uptime ? `${uptime}h` : '—'],
                    ['Agent Version', agentVer ?? '—'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p className="text-gray-500 mb-0.5">{k}</p>
                      <p className="text-white font-mono truncate">{v}</p>
                    </div>
                  ))}
                </div>
              </DetailSection>

              {/* Patch Gaps */}
              {patchGaps.length > 0 && (
                <DetailSection title={`Patch Gaps (${patchGaps.length})`} icon={Shield}>
                  <div className="space-y-2">
                    {patchGaps.map((pg, i) => {
                      const name    = field(pg, 'package', 'Package', 'name', 'Name') ?? '—'
                      const current = field(pg, 'installedVersion', 'InstalledVersion', 'current', 'Current') ?? '?'
                      const latest  = field(pg, 'latestVersion', 'LatestVersion', 'fixed', 'Fixed', 'latest', 'Latest') ?? '?'
                      const sev     = field(pg, 'severity', 'Severity') ?? 'Medium'
                      const cveCount= field(pg, 'cveCount', 'CveCount', 'cves', 'Cves')
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs flex-wrap">
                          <span className="font-mono text-white flex-1 min-w-0 truncate">{name}</span>
                          <span className="text-gray-500 font-mono">{current} → <span className="text-green-400">{latest}</span></span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${SEV_STYLE[sev] || SEV_STYLE.Medium}`}>{sev}</span>
                          {cveCount != null && <span className="text-[10px] text-gray-500">{cveCount} CVE{cveCount !== 1 ? 's' : ''}</span>}
                        </div>
                      )
                    })}
                  </div>
                </DetailSection>
              )}

              {/* Open Ports */}
              {ports.length > 0 && (
                <DetailSection title={`Open Ports (${ports.length})`} icon={Wifi}>
                  <div className="space-y-1.5">
                    {ports.map((p, i) => {
                      const port    = field(p, 'port', 'Port') ?? p
                      const proto   = field(p, 'protocol', 'Protocol') ?? 'TCP'
                      const process = field(p, 'process', 'Process', 'service', 'Service') ?? ''
                      return (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className="font-mono font-bold text-emerald-400 w-12 shrink-0">{port}</span>
                          <span className="text-gray-500 w-10 shrink-0">{proto}</span>
                          <span className="text-gray-400 truncate">{process}</span>
                        </div>
                      )
                    })}
                  </div>
                </DetailSection>
              )}

              {/* Running Services */}
              {services.length > 0 && (
                <DetailSection title={`Running Services (${services.length})`} icon={Activity}>
                  <div className="space-y-1.5">
                    {services.map((s, i) => {
                      const name   = field(s, 'name', 'Name') ?? (typeof s === 'string' ? s : '—')
                      const status = (field(s, 'status', 'Status') ?? 'running').toLowerCase()
                      return (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === 'running' ? 'bg-green-400' : 'bg-gray-500'}`} />
                          <span className="text-gray-300 flex-1 font-mono truncate">{name}</span>
                          <span className="text-gray-500 capitalize">{status}</span>
                        </div>
                      )
                    })}
                  </div>
                </DetailSection>
              )}

              {/* Installed Software */}
              {software.length > 0 && (
                <DetailSection title={`Installed Software (${software.length})`} icon={Package}>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {software.map((sw, i) => {
                      const name = field(sw, 'name', 'Name') ?? (typeof sw === 'string' ? sw : '—')
                      const ver  = field(sw, 'version', 'Version') ?? ''
                      return (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300 truncate">{name}</span>
                          {ver && <span className="text-gray-500 font-mono ml-3 shrink-0">{ver}</span>}
                        </div>
                      )
                    })}
                  </div>
                </DetailSection>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Agents List
───────────────────────────────────────── */
function AgentsList({ agents, loading, error, onView, onDecommission, onRefresh }) {
  const [decommissioning, setDecommissioning] = useState(null)

  const handleDecommission = async (id) => {
    if (!window.confirm('Decommission this agent? It will stop reporting.')) return
    setDecommissioning(id)
    try { await onDecommission(id) }
    finally { setDecommissioning(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center gap-2 text-gray-400 py-20 text-sm">
      <Loader2 className="w-4 h-4 animate-spin" /> Loading agents…
    </div>
  )

  if (error) return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />{error}
    </div>
  )

  if (agents.length === 0) return (
    <div className="text-center py-20">
      <Cpu className="w-10 h-10 text-gray-700 mx-auto mb-3" />
      <p className="text-gray-500 text-sm mb-1">No agents registered yet</p>
      <p className="text-gray-600 text-xs">Use the Install tab to deploy your first agent.</p>
    </div>
  )

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        <span className="col-span-3">Name / ID</span>
        <span className="col-span-2">Platform</span>
        <span className="col-span-2">Status</span>
        <span className="col-span-2">Last Seen</span>
        <span className="col-span-2">IP Address</span>
        <span className="col-span-1 text-right">Actions</span>
      </div>

      <div className="divide-y divide-white/5">
        {agents.map((agent, i) => {
          const id       = field(agent, 'agentId', 'AgentId', 'id', 'Id') ?? i
          const name     = field(agent, 'name', 'Name', 'hostname', 'Hostname', 'agentName', 'AgentName') ?? `Agent-${i + 1}`
          const platform = field(agent, 'platform', 'Platform', 'os', 'Os', 'osType', 'OsType') ?? '—'
          const ip       = field(agent, 'ipAddress', 'IpAddress', 'ip', 'Ip') ?? '—'
          const lastSeen = field(agent, 'lastSeen', 'LastSeen', 'lastHeartbeat', 'LastHeartbeat')

          return (
            <div key={id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/3 transition-colors">
              <div className="col-span-3 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{name}</p>
                <p className="text-[10px] text-gray-600 font-mono mt-0.5 truncate">{String(id).slice(0, 12)}</p>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-400">{platform}</span>
              </div>
              <div className="col-span-2">
                <StatusBadge agent={agent} />
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500 font-mono">{fmtDate(lastSeen)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-xs text-gray-500 font-mono">{ip}</span>
              </div>
              <div className="col-span-1 flex items-center justify-end gap-2">
                <button onClick={() => onView(id)} title="View detail"
                  className="text-gray-500 hover:text-emerald-400 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => handleDecommission(id)} disabled={decommissioning === id}
                  title="Decommission" className="text-gray-500 hover:text-red-400 transition-colors disabled:opacity-40">
                  {decommissioning === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Install Tab
───────────────────────────────────────── */
const PLATFORMS = [
  { id: 'windows', label: 'Windows', icon: Monitor },
  { id: 'linux',   label: 'Linux',   icon: Terminal },
  { id: 'macos',   label: 'macOS',   icon: Server },
]

const PREREQS = {
  windows: ['PowerShell 5.1+ (included in Windows 10/Server 2016+)', 'Run as Administrator', 'Outbound HTTPS on port 443'],
  linux:   ['curl installed (`apt install curl` / `yum install curl`)', 'sudo / root access', 'Outbound HTTPS on port 443'],
  macos:   ['macOS 12 Monterey or later', 'curl (pre-installed)', 'Admin user account'],
}

function installCmd(platform, token) {
  const t = token || '<INSTALL_TOKEN>'
  if (platform === 'windows')
    return `powershell -ExecutionPolicy Bypass -Command "iex (Invoke-WebRequest '${BASE_URL}/api/agent/install/windows?token=${t}' -UseBasicParsing).Content"`
  if (platform === 'linux')
    return `curl -fsSL '${BASE_URL}/api/agent/install/linux?token=${t}' | sudo bash`
  return `curl -fsSL '${BASE_URL}/api/agent/install/macos?token=${t}' | bash`
}

function InstallTab() {
  const [platform, setPlatform] = useState('linux')
  const [token, setToken]       = useState(null)
  const [generating, setGen]    = useState(false)
  const [genError, setGenError] = useState(null)
  const [script, setScript]     = useState(null)
  const [loadingScript, setLS]  = useState(false)

  const generateToken = async () => {
    setGen(true); setGenError(null); setToken(null)
    try { const d = await generateAgentToken(); setToken(field(d, 'token', 'Token', 'installToken', 'InstallToken') ?? d) }
    catch (e) { setGenError(e.message || 'Token generation failed') }
    setGen(false)
  }

  const fetchScript = async () => {
    setLS(true); setScript(null)
    try { const d = await getAgentInstallScript(platform); setScript(typeof d === 'string' ? d : JSON.stringify(d)) }
    catch {}
    setLS(false)
  }

  const cmd = installCmd(platform, token)
  const prereqs = PREREQS[platform] ?? []

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Step 1 — Token */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Step 1 — Generate Install Token</h2>
        <p className="text-xs text-gray-500 mb-4">Each token authorises a single agent registration and expires after 24 hours.</p>

        {!token && (
          <button onClick={generateToken} disabled={generating}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/30 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {generating ? 'Generating…' : 'Generate Token'}
          </button>
        )}

        {genError && <p className="text-xs text-red-400 mt-2">{genError}</p>}

        {token && (
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-3">
              <code className="text-xs text-emerald-300 font-mono break-all flex-1 mr-3">{token}</code>
              <CopyButton text={token} />
            </div>
            <p className="text-[10px] text-amber-400">Token expires in 24 hours. Keep it secret — it registers a new agent.</p>
            <button onClick={generateToken} className="text-[10px] text-gray-500 hover:text-white transition-colors">
              Regenerate token
            </button>
          </div>
        )}
      </div>

      {/* Step 2 — Platform + command */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Step 2 — Run Install Command</h2>
        <p className="text-xs text-gray-500 mb-4">Select your target platform, then run the one-liner as a privileged user.</p>

        {/* Platform switcher */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-5 w-fit">
          {PLATFORMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => { setPlatform(id); setScript(null) }}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${platform === id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* One-liner */}
        <div className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 mb-3">
          <div className="flex items-start justify-between gap-3">
            <code className="text-xs text-gray-200 font-mono break-all flex-1">{cmd}</code>
            <CopyButton text={cmd} />
          </div>
        </div>

        {/* Download script link */}
        <div className="flex items-center gap-3">
          <button onClick={fetchScript} disabled={loadingScript}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
            {loadingScript ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Preview install script
          </button>
        </div>

        {script && (
          <div className="mt-3 bg-black/40 border border-white/10 rounded-xl p-3 max-h-48 overflow-y-auto">
            <pre className="text-[10px] text-gray-400 font-mono whitespace-pre-wrap">{script}</pre>
          </div>
        )}
      </div>

      {/* Prerequisites */}
      <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
        <h2 className="text-sm font-bold text-white mb-3">Prerequisites</h2>
        <ul className="space-y-1.5">
          {prereqs.map((req, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              {req}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function AgentManagementPage() {
  const [tab, setTab]           = useState('agents')
  const [agents, setAgents]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [selectedId, setSelectedId] = useState(null)

  const loadAgents = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await getAgents()
      setAgents(Array.isArray(data) ? data : (data?.agents ?? data?.Agents ?? data?.items ?? data?.Items ?? []))
    } catch (e) { setError(e.message || 'Failed to load agents') }
    setLoading(false)
  }, [])

  useEffect(() => { loadAgents() }, [loadAgents])

  const handleDecommission = async (id) => {
    await decommissionAgent(id)
    setAgents(prev => prev.filter(a => (field(a, 'agentId', 'AgentId', 'id', 'Id')) !== id))
  }

  const online = agents.filter(a => agentStatus(a) === 'online').length
  const stale  = agents.filter(a => agentStatus(a) === 'stale').length

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Agent Management</span>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Endpoint Agents</h1>
                <p className="text-gray-400">Manage registered agents, view live system reports, and deploy new agents across your fleet.</p>
                {agents.length > 0 && (
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-green-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{online} online
                    </span>
                    {stale > 0 && <span className="text-xs text-amber-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />{stale} stale
                    </span>}
                    <span className="text-xs text-gray-500">{agents.length} total</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={loadAgents} disabled={loading}
                  className="text-gray-500 hover:text-white transition-colors" title="Refresh">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button onClick={() => setTab('install')}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                  <Download className="w-3.5 h-3.5" /> Install Agent
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Tab bar */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-6 w-fit">
            {[['agents', 'Agents', Cpu], ['install', 'Install', Terminal]].map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${tab === id ? 'bg-emerald-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {tab === 'agents' && (
            <AgentsList
              agents={agents}
              loading={loading}
              error={error}
              onView={setSelectedId}
              onDecommission={handleDecommission}
              onRefresh={loadAgents}
            />
          )}

          {tab === 'install' && <InstallTab />}
        </div>
      </main>

      <Footer />

      {selectedId && (
        <AgentDetailDrawer agentId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
