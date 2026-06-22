import React, { useState, useEffect, useRef, useCallback } from 'react'
import { GitBranch, AlertCircle, Loader2, RefreshCw, ChevronDown, Zap, Shield, Database, Server, Globe } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const NODE_SEVERITY = {
  critical: { color: '#ef4444', bg: '#ef444422' },
  high:     { color: '#f97316', bg: '#f9731622' },
  medium:   { color: '#eab308', bg: '#eab30822' },
  low:      { color: '#3b82f6', bg: '#3b82f622' },
  info:     { color: '#6b7280', bg: '#6b728022' },
}

const ASSET_ICONS = { domain: Globe, host: Server, database: Database, finding: Zap, default: Shield }

function severityStyle(sev) {
  return NODE_SEVERITY[(sev || '').toLowerCase()] ?? NODE_SEVERITY.info
}

function useForceLayout(nodes, edges, W, H) {
  const [positions, setPositions] = useState({})
  const frameRef = useRef(null)
  const posRef   = useRef({})
  const velRef   = useRef({})

  useEffect(() => {
    if (!nodes.length) { setPositions({}); return }

    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length
      const r = Math.min(W, H) * 0.32
      posRef.current[n.id] = { x: W / 2 + r * Math.cos(angle), y: H / 2 + r * Math.sin(angle) }
      velRef.current[n.id] = { x: 0, y: 0 }
    })

    let tick = 0
    const sim = () => {
      tick++
      const alpha = Math.max(0, 1 - tick / 250)
      if (alpha <= 0) { setPositions({ ...posRef.current }); return }

      const ids = nodes.map(n => n.id)
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = posRef.current[ids[i]], b = posRef.current[ids[j]]
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const f = (140 * 140) / (dist * dist) * alpha
          const fx = (dx / dist) * f, fy = (dy / dist) * f
          velRef.current[ids[i]].x -= fx; velRef.current[ids[i]].y -= fy
          velRef.current[ids[j]].x += fx; velRef.current[ids[j]].y += fy
        }
      }

      edges.forEach(e => {
        const a = posRef.current[e.source], b = posRef.current[e.target]
        if (!a || !b) return
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const f = (dist - 170) * 0.05 * alpha
        const fx = (dx / dist) * f, fy = (dy / dist) * f
        velRef.current[e.source].x += fx; velRef.current[e.source].y += fy
        velRef.current[e.target].x -= fx; velRef.current[e.target].y -= fy
      })

      ids.forEach(id => {
        velRef.current[id].x += (W / 2 - posRef.current[id].x) * 0.004 * alpha
        velRef.current[id].y += (H / 2 - posRef.current[id].y) * 0.004 * alpha
        velRef.current[id].x *= 0.82; velRef.current[id].y *= 0.82
        posRef.current[id].x = Math.max(28, Math.min(W - 28, posRef.current[id].x + velRef.current[id].x))
        posRef.current[id].y = Math.max(28, Math.min(H - 28, posRef.current[id].y + velRef.current[id].y))
      })

      setPositions({ ...posRef.current })
      frameRef.current = requestAnimationFrame(sim)
    }

    frameRef.current = requestAnimationFrame(sim)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [nodes, edges, W, H])

  return positions
}

function PathGraph({ nodes, edges, onNodeClick, selected }) {
  const W = 880, H = 520
  const positions = useForceLayout(nodes, edges, W, H)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl bg-[#07070f] border border-white/10" style={{ minHeight: 340 }}>
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill="#ffffff30" />
        </marker>
      </defs>
      {edges.map((e, i) => {
        const a = positions[e.source], b = positions[e.target]
        if (!a || !b) return null
        const label = field(e, 'label', 'Label', 'step', 'Step', 'technique', 'Technique')
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="#ffffff20" strokeWidth={1.5} markerEnd="url(#arrow)" />
            {label && (
              <text x={mx} y={my - 6} textAnchor="middle" fontSize={8} fill="#6b7280">{label}</text>
            )}
          </g>
        )
      })}
      {nodes.map(n => {
        const p = positions[n.id]
        if (!p) return null
        const sev   = field(n, 'severity', 'Severity') ?? 'info'
        const style = severityStyle(sev)
        const isSelected = selected === n.id
        const label = field(n, 'label', 'Label', 'name', 'Name', 'title', 'Title') ?? n.id
        return (
          <g key={n.id} transform={`translate(${p.x},${p.y})`} className="cursor-pointer" onClick={() => onNodeClick(n)}>
            <circle r={isSelected ? 20 : 16} fill={style.bg} stroke={style.color} strokeWidth={isSelected ? 2.5 : 1.5} />
            <Zap />
            <text textAnchor="middle" dominantBaseline="central" fontSize={9} fill={style.color} fontWeight="bold">
              {sev.charAt(0).toUpperCase()}
            </text>
            <text textAnchor="middle" y={28} fontSize={8} fill="#9ca3af">
              {String(label).substring(0, 22)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function NodeDetail({ node, onClose }) {
  if (!node) return null
  const label = field(node, 'label', 'Label', 'name', 'Name', 'title', 'Title') ?? node.id
  const sev   = field(node, 'severity', 'Severity') ?? 'info'
  const style = severityStyle(sev)
  const desc  = field(node, 'description', 'Description', 'detail', 'Detail')
  const cvss  = field(node, 'cvss', 'Cvss', 'cvssScore', 'CvssScore')
  const cve   = field(node, 'cve', 'Cve', 'cveId', 'CveId')
  const remediation = field(node, 'remediation', 'Remediation', 'fix', 'Fix')

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
          style={{ color: style.color, borderColor: style.color + '50', background: style.bg }}>
          {sev}
        </span>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
      </div>
      <p className="text-white font-semibold text-sm">{label}</p>
      {desc && <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>}
      <div className="space-y-1">
        {cvss != null && <div className="flex justify-between text-xs"><span className="text-gray-500">CVSS</span><span className="text-white">{cvss}</span></div>}
        {cve  && <div className="flex justify-between text-xs"><span className="text-gray-500">CVE</span><span className="text-white font-mono">{cve}</span></div>}
      </div>
      {remediation && (
        <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2.5">
          <div className="text-xs font-bold text-emerald-400 mb-1">Remediation</div>
          <p className="text-xs text-gray-300 leading-relaxed">{remediation}</p>
        </div>
      )}
    </div>
  )
}

function PathSummary({ path }) {
  const id    = field(path, 'id', 'Id') ?? ''
  const name  = field(path, 'name', 'Name', 'title', 'Title') ?? `Path ${id}`
  const risk  = field(path, 'riskScore', 'RiskScore', 'risk', 'Risk')
  const steps = field(path, 'stepCount', 'StepCount', 'steps', 'Steps')
  const nodes = field(path, 'nodes', 'Nodes')
  const nodeCount = Array.isArray(nodes) ? nodes.length : (steps ?? '?')
  return { id, name, risk, nodeCount }
}

export default function AttackPathPage() {
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [paths, setPaths]         = useState([])
  const [selectedPath, setSelectedPath] = useState(null)
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] })
  const [graphLoading, setGraphLoading] = useState(false)
  const [selectedNode, setSelectedNode] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  const token = () => localStorage.getItem('ws_token')
  const authH = () => token() ? { Authorization: `Bearer ${token()}` } : {}

  const loadPaths = useCallback(() => {
    setLoading(true); setError(null)
    fetch(`${BASE}/api/attack-paths`, { headers: authH() })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        const list = Array.isArray(data) ? data : (field(data, 'paths', 'Paths', 'attackPaths', 'AttackPaths', 'items', 'Items') ?? [])
        setPaths(list)
        if (list.length > 0) loadPathDetail(field(list[0], 'id', 'Id') ?? '', list[0])
      })
      .catch(() => { setLoading(false) })
  }, [])

  const loadPathDetail = (id, rawPath) => {
    setGraphLoading(true); setSelectedPath(id)
    fetch(`${BASE}/api/attack-paths/${encodeURIComponent(id)}`, { headers: authH() })
      .then(async r => {
        if (!r.ok) { if (rawPath) buildGraphFromPath(rawPath); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        const nodes = (field(data, 'nodes', 'Nodes') ?? []).map(n => ({
          id:    field(n, 'id', 'Id') ?? '',
          ...n,
        }))
        const edges = (field(data, 'edges', 'Edges', 'links', 'Links', 'steps', 'Steps') ?? []).map(e => ({
          source: field(e, 'source', 'Source', 'from', 'From') ?? '',
          target: field(e, 'target', 'Target', 'to', 'To') ?? '',
          ...e,
        }))
        if (nodes.length) { setGraphData({ nodes, edges }); setLoading(false); setGraphLoading(false) }
        else if (rawPath) buildGraphFromPath(rawPath)
        else { setGraphLoading(false); setLoading(false) }
      })
      .catch(() => { if (rawPath) buildGraphFromPath(rawPath) })
  }

  const buildGraphFromPath = (path) => {
    const steps = field(path, 'steps', 'Steps', 'nodes', 'Nodes') ?? []
    if (Array.isArray(steps) && steps.length > 0) {
      const nodes = steps.map((s, i) => ({ id: String(i), ...s }))
      const edges = nodes.slice(0, -1).map((_, i) => ({ source: String(i), target: String(i + 1) }))
      setGraphData({ nodes, edges })
    }
    setLoading(false); setGraphLoading(false)
  }

  useEffect(() => { loadPaths() }, [loadPaths])

  const handleNodeClick = (n) => { setSelectedNodeId(n.id); setSelectedNode(n) }

  // Demo data if API is empty
  const demoNodes = [
    { id: '0', label: 'Public Web App',    severity: 'medium', description: 'Entry point via exposed web interface' },
    { id: '1', label: 'SQL Injection',     severity: 'critical', description: 'Unsanitized input in login form', cve: 'CVE-2023-1234', cvss: 9.8, remediation: 'Parameterize all SQL queries' },
    { id: '2', label: 'Database Access',   severity: 'high', description: 'Attacker gains read/write to DB' },
    { id: '3', label: 'Credential Dump',   severity: 'critical', description: 'Admin credentials extracted' },
    { id: '4', label: 'Lateral Movement',  severity: 'high', description: 'Pivot to internal network via admin creds' },
    { id: '5', label: 'Cloud Console',     severity: 'critical', description: 'Full cloud account compromise' },
  ]
  const demoEdges = [
    { source: '0', target: '1', label: 'exploit' },
    { source: '1', target: '2', label: 'access' },
    { source: '2', target: '3', label: 'dump' },
    { source: '3', target: '4', label: 'pivot' },
    { source: '4', target: '5', label: 'escalate' },
  ]

  const displayNodes = graphData.nodes.length > 0 ? graphData.nodes : demoNodes
  const displayEdges = graphData.edges.length > 0 ? graphData.edges : demoEdges

  const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  const criticalNodes = displayNodes.filter(n => (field(n, 'severity', 'Severity') ?? '').toLowerCase() === 'critical').length

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-red-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">Threat Modeling</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Attack Path Analysis</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Visualize chained exploit steps from initial entry to full compromise.
                </p>
              </div>
              <button onClick={loadPaths} disabled={loading}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <PageGuide id="attack-paths" text="Visualizes how an attacker could chain your vulnerabilities to move from initial access to full system compromise. Click any node in the graph to see the exploit technique, MITRE ATT&CK mapping, and what the attacker gains at that step. Run an analysis from a scan result first — go to Scan History, open a scan, and click 'Analyze Attack Paths.'" />

          {/* Severity legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {Object.entries(NODE_SEVERITY).map(([sev, s]) => (
              <div key={sev} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-400 capitalize">{sev}</span>
              </div>
            ))}
            {criticalNodes > 0 && (
              <span className="ml-auto text-xs text-red-400 font-semibold">{criticalNodes} critical node{criticalNodes !== 1 ? 's' : ''} in path</span>
            )}
          </div>

          {/* Path selector (if multiple) */}
          {paths.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {paths.map(p => {
                const s = PathSummary({ path: p })
                return (
                  <button key={s.id} onClick={() => loadPathDetail(s.id, p)}
                    className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-colors ${
                      selectedPath === s.id
                        ? 'bg-red-500/15 border-red-500/40 text-red-300'
                        : 'bg-white/3 border-white/10 text-gray-400 hover:border-white/20'
                    }`}>
                    {s.name}
                    {s.risk != null && <span className="ml-1.5 text-gray-600">·{s.risk}</span>}
                  </button>
                )
              })}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-crimson-400 animate-spin" /></div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div className="relative">
                {graphLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-2xl z-10">
                    <Loader2 className="w-7 h-7 text-crimson-400 animate-spin" />
                  </div>
                )}
                <PathGraph nodes={displayNodes} edges={displayEdges}
                  onNodeClick={handleNodeClick} selected={selectedNodeId} />
              </div>

              <div className="space-y-3">
                {selectedNode ? (
                  <NodeDetail node={selectedNode} onClose={() => { setSelectedNode(null); setSelectedNodeId(null) }} />
                ) : (
                  <div className="bg-white/3 border border-white/10 rounded-2xl p-5 text-center">
                    <GitBranch className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Click a node to inspect the exploit step</p>
                  </div>
                )}
                <div className="bg-white/3 border border-white/10 rounded-2xl p-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Path Stats</div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Steps</span><span className="text-white font-semibold">{displayNodes.length}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-400">Edges</span><span className="text-white font-semibold">{displayEdges.length}</span></div>
                    {['critical','high','medium','low'].map(sev => {
                      const count = displayNodes.filter(n => (field(n,'severity','Severity') ?? 'info').toLowerCase() === sev).length
                      if (!count) return null
                      return (
                        <div key={sev} className="flex justify-between text-xs">
                          <span style={{ color: NODE_SEVERITY[sev].color }} className="capitalize">{sev}</span>
                          <span className="text-gray-400">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
