import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Network, Loader2, AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { getAttackChains } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV_COLOR = {
  Critical: { border: '#ef4444', bg: 'rgba(127,29,29,0.35)',  text: '#f87171', pill: '#ef4444' },
  High:     { border: '#f97316', bg: 'rgba(124,45,18,0.35)',  text: '#fb923c', pill: '#f97316' },
  Medium:   { border: '#f59e0b', bg: 'rgba(120,53,15,0.30)',  text: '#fbbf24', pill: '#f59e0b' },
  Low:      { border: '#3b82f6', bg: 'rgba(30,58,138,0.30)',  text: '#60a5fa', pill: '#3b82f6' },
  Info:     { border: '#6b7280', bg: 'rgba(17,24,39,0.30)',   text: '#9ca3af', pill: '#6b7280' },
}
function sc(s) { return SEV_COLOR[(s ?? '').charAt(0).toUpperCase() + (s ?? '').slice(1)] ?? SEV_COLOR.Info }

const NODE_TYPE_COL = {
  entry: 0, Entry: 0, entrypoint: 0, EntryPoint: 0,
  pivot: 1, Pivot: 1, lateral: 1, Lateral: 1, escalation: 1, Escalation: 1,
  impact: 2, Impact: 2, exfiltration: 2, Exfiltration: 2,
}

/* ── SVG graph for one chain ── */
const NW = 190, NH = 60, COL_X = [0, 280, 560], ROW_H = 82, TOP = 28, PAD = 16

function ChainGraph({ nodes, edges }) {
  const [sel, setSel] = useState(null)

  if (!Array.isArray(nodes) || !nodes.length) return null

  // Sort nodes into columns
  const cols = [[], [], []]
  for (const n of nodes) {
    const t = field(n, 'type', 'Type', 'nodeType', 'NodeType') ?? 'pivot'
    cols[NODE_TYPE_COL[t] ?? 1].push(n)
  }

  // Compute pixel positions
  const pos = {}
  const maxRows = Math.max(1, ...cols.map(c => c.length))
  for (let c = 0; c < 3; c++) {
    const colLen = cols[c].length
    const startY = TOP + ((maxRows - colLen) / 2) * ROW_H * 0.5
    for (let r = 0; r < colLen; r++) {
      const n = cols[c][r]
      const id = field(n, 'id', 'Id') ?? `${c}-${r}`
      pos[id] = { x: PAD + COL_X[c], y: startY + r * ROW_H, node: n }
    }
  }

  // Auto-generate linear edges if none provided
  const resolvedEdges = Array.isArray(edges) && edges.length > 0 ? edges : (() => {
    const all = [...cols[0], ...cols[1], ...cols[2]]
    return all.slice(0, -1).map((n, i) => ({
      from: field(n, 'id', 'Id') ?? i,
      to:   field(all[i + 1], 'id', 'Id') ?? (i + 1),
    }))
  })()

  const svgW = PAD * 2 + COL_X[2] + NW
  const svgH = TOP + maxRows * ROW_H + 16
  const selNode = sel ? pos[sel]?.node : null

  return (
    <div>
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%" style={{ display: 'block', maxHeight: svgH }}
      >
        <defs>
          <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10z" fill="rgba(255,255,255,0.2)" />
          </marker>
        </defs>

        {/* Column labels */}
        {['Entry Point', 'Pivot / Lateral Move', 'Impact'].map((lbl, c) => (
          <text key={c}
            x={PAD + COL_X[c] + NW / 2} y={14}
            textAnchor="middle" fontSize="9" fontWeight="700"
            letterSpacing="0.8" fill="rgba(255,255,255,0.3)">
            {lbl.toUpperCase()}
          </text>
        ))}

        {/* Edges */}
        {resolvedEdges.map((e, i) => {
          const fid = field(e, 'from', 'From', 'source', 'Source')
          const tid = field(e, 'to', 'To', 'target', 'Target')
          const fp  = pos[fid]; const tp = pos[tid]
          if (!fp || !tp) return null
          const x1 = fp.x + NW, y1 = fp.y + NH / 2
          const x2 = tp.x,      y2 = tp.y + NH / 2
          const cx = (x1 + x2) / 2
          return (
            <path key={i}
              d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
              fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"
              markerEnd="url(#arr)"
            />
          )
        })}

        {/* Nodes */}
        {Object.entries(pos).map(([id, { x, y, node }]) => {
          const name  = field(node, 'vuln', 'Vuln', 'vulnerability', 'Vulnerability', 'name', 'Name', 'title', 'Title') ?? 'Unknown'
          const sev   = field(node, 'severity', 'Severity') ?? 'Medium'
          const col   = sc(sev)
          const isSel = sel === id

          return (
            <g key={id} style={{ cursor: 'pointer' }} onClick={() => setSel(isSel ? null : id)}>
              <rect x={x} y={y} width={NW} height={NH} rx="8"
                fill={col.bg}
                stroke={isSel ? col.pill : col.border}
                strokeWidth={isSel ? 2 : 1}
                style={{ filter: isSel ? `drop-shadow(0 0 6px ${col.pill}80)` : 'none' }}
              />
              {/* Left severity stripe */}
              <rect x={x} y={y + 10} width="3" height={NH - 20} rx="1.5" fill={col.pill} />
              {/* Name */}
              <text x={x + 14} y={y + NH / 2 - 5} fontSize="11" fontWeight="600" fill="white">
                {name.length > 23 ? name.slice(0, 21) + '…' : name}
              </text>
              {/* Severity badge bg */}
              <rect x={x + 14} y={y + NH / 2 + 3} width={sev.length * 5.8 + 8} height={14} rx="3"
                fill={`${col.pill}30`} />
              {/* Severity text */}
              <text x={x + 18} y={y + NH / 2 + 13} fontSize="8" fontWeight="700"
                fill={col.text}>
                {sev.toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Selected node detail card */}
      {selNode && (
        <div className="mt-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 space-y-1.5 text-xs">
          <p className="font-bold text-white text-sm">
            {field(selNode, 'vuln', 'Vuln', 'vulnerability', 'Vulnerability', 'name', 'Name', 'title', 'Title')}
          </p>
          {field(selNode, 'detail', 'Detail', 'description', 'Description') && (
            <p className="text-gray-400 leading-relaxed">
              {field(selNode, 'detail', 'Detail', 'description', 'Description')}
            </p>
          )}
          {field(selNode, 'recommendation', 'Recommendation', 'fix', 'Fix', 'remediation', 'Remediation') && (
            <div className="bg-green-950/40 border border-green-800/30 rounded-lg px-3 py-2 mt-1">
              <p className="text-[10px] font-bold text-green-400 mb-0.5">Remediation</p>
              <p className="text-gray-300 leading-relaxed">
                {field(selNode, 'recommendation', 'Recommendation', 'fix', 'Fix', 'remediation', 'Remediation')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Chain card (expandable) ── */
function ChainCard({ chain }) {
  const [open, setOpen] = useState(false)

  const title    = field(chain, 'title', 'Title', 'name', 'Name') ?? 'Attack Chain'
  const severity = field(chain, 'severity', 'Severity') ?? 'High'
  const score    = field(chain, 'riskScore', 'RiskScore', 'combinedRiskScore', 'CombinedRiskScore')
  const desc     = field(chain, 'description', 'Description', 'narrative', 'Narrative')
  const nodes    = field(chain, 'nodes', 'Nodes') ?? []
  const edges    = field(chain, 'edges', 'Edges') ?? []
  const col      = sc(severity)

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  for (const n of nodes) {
    const s = (field(n, 'severity', 'Severity') ?? 'Low')
    if (counts[s] !== undefined) counts[s]++
  }

  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden" style={{ borderColor: open ? col.border : undefined }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        {/* Severity dot */}
        <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: col.pill }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-white">{title}</span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: col.pill + '33', color: col.text, border: `1px solid ${col.pill}50` }}>
              {severity}
            </span>
            {score != null && (
              <span className="text-xs font-bold" style={{ color: col.text }}>Risk {score}/10</span>
            )}
          </div>

          {/* Node count chips */}
          <div className="flex flex-wrap gap-1.5">
            {nodes.length > 0 && (
              <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 rounded px-2 py-0.5">
                {nodes.length} node{nodes.length !== 1 ? 's' : ''}
              </span>
            )}
            {Object.entries(counts).filter(([, v]) => v > 0).map(([s, v]) => (
              <span key={s} className="text-[10px] font-semibold rounded px-1.5 py-0.5"
                style={{ color: sc(s).text, backgroundColor: sc(s).pill + '20', border: `1px solid ${sc(s).pill}30` }}>
                {v} {s}
              </span>
            ))}
          </div>
        </div>

        {open
          ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4" style={{ borderColor: col.border + '40' }}>
          {desc && (
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
          )}
          {nodes.length > 0 ? (
            <ChainGraph nodes={nodes} edges={edges} />
          ) : (
            <p className="text-xs text-gray-600 text-center py-4">No node data available for this chain.</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function AttackChainsPage() {
  const [chains, setChains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await getAttackChains()
      const arr  = Array.isArray(data) ? data : (data?.chains ?? data?.Chains ?? data?.items ?? [])
      setChains(arr)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const criticalCount = chains.filter(c =>
    (field(c, 'severity', 'Severity') ?? '').toLowerCase() === 'critical'
  ).length

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4 bg-red-500/3">
          <div className="max-w-5xl mx-auto flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link to="/dashboard" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                  ← Dashboard
                </Link>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center justify-center">
                  <Network className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-red-400">Kill Chain Analysis</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white">Attack Chains</h1>
              <p className="text-gray-400 text-sm mt-1">
                {chains.length} chain{chains.length !== 1 ? 's' : ''} detected
                {criticalCount > 0 && (
                  <span className="ml-2 text-red-400 font-semibold">· {criticalCount} Critical</span>
                )}
              </p>
            </div>
            <button onClick={load} disabled={loading}
              className="flex items-center gap-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/15 text-gray-400 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <PageGuide id="attack-chains" text="AI-generated attack chain simulations based on your actual scan findings. Each chain shows the sequence of exploit steps an attacker would take, the blast radius (how much of your system is at risk), and the overall risk level. Generate a chain from a scan result by clicking 'Simulate Attack Chain' on any scan." />

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={load} className="ml-auto text-xs hover:text-white">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
            </div>
          ) : chains.length === 0 ? (
            <div className="text-center py-20 bg-white/3 border border-white/10 rounded-2xl">
              <Network className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-semibold">No attack chains found</p>
              <p className="text-xs text-gray-500 mt-1">
                Run a scan to detect multi-stage attack paths in your environment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {chains.map((chain, i) => (
                <ChainCard key={field(chain, 'id', 'Id') ?? i} chain={chain} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
