import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Network, Loader2, AlertCircle, RefreshCw, Globe, Server, Cloud, Database, HardDrive, Monitor, Box, Briefcase } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const NODE_TYPES = {
  Domain:       { color: '#6366f1', icon: '🌐', label: 'Domain' },
  Subdomain:    { color: '#8b5cf6', icon: '🌍', label: 'Subdomain' },
  IP:           { color: '#0ea5e9', icon: '🖧',  label: 'IP' },
  CloudAccount: { color: '#f97316', icon: '☁️', label: 'Cloud Account' },
  Storage:      { color: '#eab308', icon: '🗄️', label: 'Storage' },
  VM:           { color: '#10b981', icon: '💻', label: 'VM' },
  Database:     { color: '#ef4444', icon: '🛢️', label: 'Database' },
  SaaS:         { color: '#ec4899', icon: '📦', label: 'SaaS' },
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(NODE_TYPES).map(([type, meta]) => (
        <div key={type} className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: meta.color }} />
          <span className="text-xs text-gray-400">{meta.label}</span>
        </div>
      ))}
    </div>
  )
}

function nodeColor(type) {
  return NODE_TYPES[type]?.color ?? '#6b7280'
}

// Simple force-directed layout using d3-style simulation via requestAnimationFrame
function useForceLayout(nodes, edges, width, height) {
  const [positions, setPositions] = useState({})
  const frameRef = useRef(null)
  const posRef   = useRef({})
  const velRef   = useRef({})

  useEffect(() => {
    if (!nodes.length) return

    // Initialize positions in a circle
    const cx = width / 2, cy = height / 2
    nodes.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / nodes.length
      const r = Math.min(width, height) * 0.35
      posRef.current[n.id] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
      velRef.current[n.id] = { x: 0, y: 0 }
    })

    const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))
    let tick = 0

    const simulate = () => {
      tick++
      const alpha = Math.max(0, 1 - tick / 200)
      if (alpha <= 0) { setPositions({ ...posRef.current }); return }

      // Repulsion between all node pairs
      const ids = nodes.map(n => n.id)
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const a = posRef.current[ids[i]], b = posRef.current[ids[j]]
          const dx = b.x - a.x, dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = (120 * 120) / (dist * dist) * alpha
          const fx = (dx / dist) * force, fy = (dy / dist) * force
          velRef.current[ids[i]].x -= fx; velRef.current[ids[i]].y -= fy
          velRef.current[ids[j]].x += fx; velRef.current[ids[j]].y += fy
        }
      }

      // Attraction along edges
      edges.forEach(e => {
        const a = posRef.current[e.source], b = posRef.current[e.target]
        if (!a || !b) return
        const dx = b.x - a.x, dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const targetDist = 160
        const force = (dist - targetDist) * 0.04 * alpha
        const fx = (dx / dist) * force, fy = (dy / dist) * force
        velRef.current[e.source].x += fx; velRef.current[e.source].y += fy
        velRef.current[e.target].x -= fx; velRef.current[e.target].y -= fy
      })

      // Gravity toward center
      ids.forEach(id => {
        const p = posRef.current[id]
        velRef.current[id].x += (cx - p.x) * 0.005 * alpha
        velRef.current[id].y += (cy - p.y) * 0.005 * alpha
      })

      // Damping + integrate
      ids.forEach(id => {
        velRef.current[id].x *= 0.85
        velRef.current[id].y *= 0.85
        posRef.current[id].x = Math.max(30, Math.min(width - 30, posRef.current[id].x + velRef.current[id].x))
        posRef.current[id].y = Math.max(30, Math.min(height - 30, posRef.current[id].y + velRef.current[id].y))
      })

      setPositions({ ...posRef.current })
      frameRef.current = requestAnimationFrame(simulate)
    }

    frameRef.current = requestAnimationFrame(simulate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [nodes, edges, width, height])

  return positions
}

function GraphCanvas({ nodes, edges, onNodeClick, selected }) {
  const W = 900, H = 540
  const positions = useForceLayout(nodes, edges, W, H)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full rounded-2xl bg-[#0a0a12] border border-white/10"
      style={{ minHeight: 360 }}
    >
      {/* Edges */}
      {edges.map((e, i) => {
        const a = positions[e.source], b = positions[e.target]
        if (!a || !b) return null
        return (
          <line key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="#ffffff18" strokeWidth={1.5}
          />
        )
      })}
      {/* Nodes */}
      {nodes.map(n => {
        const p = positions[n.id]
        if (!p) return null
        const color = nodeColor(n.type)
        const isSelected = selected === n.id
        return (
          <g key={n.id} transform={`translate(${p.x},${p.y})`}
            className="cursor-pointer"
            onClick={() => onNodeClick(n)}
          >
            <circle r={isSelected ? 18 : 14}
              fill={color + '33'}
              stroke={color}
              strokeWidth={isSelected ? 2.5 : 1.5}
            />
            <text textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#fff">
              {NODE_TYPES[n.type]?.icon ?? '●'}
            </text>
            <text textAnchor="middle" y={24} fontSize={9} fill="#9ca3af">
              {(n.label ?? n.name ?? n.id ?? '').substring(0, 20)}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function NodeDetail({ node, onClose }) {
  if (!node) return null
  const meta = NODE_TYPES[node.type] ?? {}
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: nodeColor(node.type) }} />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{meta.label ?? node.type}</span>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xs">✕</button>
      </div>
      <p className="text-white font-semibold text-sm mb-3">{node.label ?? node.name ?? node.id}</p>
      <div className="space-y-1.5">
        {Object.entries(node).filter(([k]) => !['id','label','name','type','x','y'].includes(k)).map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 text-xs">
            <span className="text-gray-500 capitalize">{k}</span>
            <span className="text-gray-300 text-right break-all">{String(v)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AssetGraphPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [nodes, setNodes]     = useState([])
  const [edges, setEdges]     = useState([])
  const [selected, setSelected] = useState(null)
  const [selectedNode, setSelectedNode] = useState(null)

  const load = useCallback(() => {
    setLoading(true); setError(null)
    const token = localStorage.getItem('ws_token')
    fetch(`${BASE}/api/asset-graph`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        const rawNodes = field(data, 'nodes', 'Nodes') ?? []
        const rawEdges = field(data, 'edges', 'Edges', 'links', 'Links') ?? []
        setNodes(rawNodes.map(n => ({
          id:    field(n, 'id', 'Id') ?? '',
          type:  field(n, 'type', 'Type', 'nodeType', 'NodeType') ?? 'Domain',
          label: field(n, 'label', 'Label', 'name', 'Name') ?? '',
          ...n,
        })))
        setEdges(rawEdges.map(e => ({
          source: field(e, 'source', 'Source', 'from', 'From') ?? '',
          target: field(e, 'target', 'Target', 'to', 'To') ?? '',
          ...e,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleNodeClick = (n) => {
    setSelected(n.id)
    setSelectedNode(n)
  }

  // Demo fallback if API returns empty
  const displayNodes = nodes.length > 0 ? nodes : [
    { id: '1', type: 'Domain',       label: 'example.com' },
    { id: '2', type: 'Subdomain',    label: 'app.example.com' },
    { id: '3', type: 'Subdomain',    label: 'api.example.com' },
    { id: '4', type: 'IP',           label: '192.168.1.1' },
    { id: '5', type: 'CloudAccount', label: 'AWS Production' },
    { id: '6', type: 'Storage',      label: 's3://my-bucket' },
    { id: '7', type: 'VM',           label: 'prod-server-01' },
    { id: '8', type: 'Database',     label: 'postgres-main' },
    { id: '9', type: 'SaaS',         label: 'GitHub' },
  ]
  const displayEdges = edges.length > 0 ? edges : [
    { source: '1', target: '2' }, { source: '1', target: '3' },
    { source: '2', target: '4' }, { source: '3', target: '4' },
    { source: '5', target: '6' }, { source: '5', target: '7' },
    { source: '7', target: '8' }, { source: '1', target: '9' },
    { source: '4', target: '7' },
  ]

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-indigo-500/15 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                <Network className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Inventory</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">Asset Graph</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Force-directed visualization of your attack surface and asset relationships.
                </p>
              </div>
              <button onClick={load} disabled={loading}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
          <PageGuide id="asset-graph" text="Visual map of how your scanned assets — web apps, APIs, cloud resources, and services — relate to each other. Nodes represent assets; edges show connections and data flows. Click any node to see its security score and findings. Use this to understand blast radius and identify critical hub assets that, if compromised, affect the most other systems." />

          <Legend />

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <GraphCanvas nodes={displayNodes} edges={displayEdges}
              onNodeClick={handleNodeClick} selected={selected} />
            <div className="space-y-3">
              {selectedNode ? (
                <NodeDetail node={selectedNode} onClose={() => { setSelected(null); setSelectedNode(null) }} />
              ) : (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5 text-center">
                  <Network className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Click a node to see details</p>
                </div>
              )}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Summary</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total assets</span>
                    <span className="text-white font-semibold">{displayNodes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Relationships</span>
                    <span className="text-white font-semibold">{displayEdges.length}</span>
                  </div>
                  {Object.entries(
                    displayNodes.reduce((acc, n) => ({ ...acc, [n.type]: (acc[n.type] ?? 0) + 1 }), {})
                  ).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span className="text-gray-500">{type}</span>
                      <span className="text-gray-400">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
