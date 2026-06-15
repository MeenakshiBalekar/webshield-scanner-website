import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  ShieldAlert, Loader2, AlertCircle, CheckCircle2, XCircle,
  RefreshCw, Plus, X, Trash2, Activity, Flag, Check,
  AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getEdrAlerts, updateEdrAlert, getEdrRules,
  createEdrRule, toggleEdrRule, deleteEdrRule,
  analyzeAgent, getAgents,
} from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

const STATUS_STYLE = {
  New:            'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Acknowledged:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Resolved:       'bg-green-500/15 text-green-400 border-green-500/30',
  FalsePositive:  'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const TYPE_PLACEHOLDERS = {
  port:     '22, 3389, 4444',
  service:  'sshd, winrm, mysqld',
  software: 'netcat, masscan, nmap',
  process:  '/bin/nc, mimikatz.exe, powershell.exe',
}

/* ── Shared helpers ── */
function ErrorBanner({ error }) {
  return (
    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />{error}
    </div>
  )
}

function SevBadge({ sev }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${SEV_STYLE[sev] || SEV_STYLE.Medium}`}>{sev}</span>
  )
}

function RuleToggle({ enabled, onChange, disabled }) {
  return (
    <button onClick={onChange} disabled={disabled} aria-label={enabled ? 'Disable' : 'Enable'}
      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${enabled ? 'bg-amber-500' : 'bg-white/15'} disabled:opacity-40`}>
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-4' : ''}`} />
    </button>
  )
}

/* ─────────────────────────────────────────
   New Rule Modal
───────────────────────────────────────── */
function NewRuleModal({ onClose, onCreated }) {
  const [form, setForm]   = useState({ name: '', description: '', ruleType: 'port', condition: '', severity: 'High' })
  const [saving, setSave] = useState(false)
  const [error, setError] = useState(null)
  const setF = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (!form.name.trim() || !form.condition.trim()) { setError('Name and condition are required'); return }
    setSave(true); setError(null)
    try { onCreated(await createEdrRule(form)); onClose() }
    catch (e) { setError(e.message || 'Failed to create rule') }
    setSave(false)
  }

  const inputCls = 'w-full bg-white/5 border border-white/15 focus:border-amber-500 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0d0f14] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-sm font-bold text-white">New Detection Rule</span>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Rule Name</label>
            <input value={form.name} onChange={setF('name')} placeholder="Suspicious Port Open" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={form.description} onChange={setF('description')} placeholder="Triggers when…" rows={2}
              className={`${inputCls} resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Rule Type</label>
              <select value={form.ruleType} onChange={setF('ruleType')} className={`${inputCls} bg-[#0d0f14]`}>
                <option value="port">Port</option>
                <option value="service">Service</option>
                <option value="software">Software</option>
                <option value="process">Process</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Severity</label>
              <select value={form.severity} onChange={setF('severity')} className={`${inputCls} bg-[#0d0f14]`}>
                <option>Critical</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Condition Value</label>
            <input value={form.condition} onChange={setF('condition')}
              placeholder={TYPE_PLACEHOLDERS[form.ruleType]}
              className={`${inputCls} font-mono`} />
            <p className="text-[10px] text-gray-600 mt-1">Comma-separated values to match. Matched at scan time.</p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/30 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {saving ? 'Creating…' : 'Create Rule'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   Tab 1 — Alerts
───────────────────────────────────────── */
function AlertsTab() {
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoad]    = useState(true)
  const [error, setError]     = useState(null)
  const [sevFilter, setSev]   = useState('')
  const [statFilter, setStat] = useState('')
  const [updating, setUpd]    = useState({})

  const load = useCallback(async () => {
    setLoad(true); setError(null)
    try {
      const params = {}
      if (sevFilter)  params.severity = sevFilter
      if (statFilter) params.status   = statFilter
      const data = await getEdrAlerts(params)
      setAlerts(Array.isArray(data) ? data : (data?.alerts ?? data?.Alerts ?? data?.items ?? data?.Items ?? []))
    } catch (e) { setError(e.message || 'Failed to load alerts') }
    setLoad(false)
  }, [sevFilter, statFilter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id, status) => {
    setUpd(u => ({ ...u, [id]: true }))
    try {
      await updateEdrAlert(id, { status })
      setAlerts(prev => prev.map(a =>
        (field(a, 'alertId', 'AlertId', 'id', 'Id') === id) ? { ...a, status, Status: status } : a
      ))
    } catch (e) { alert(e.message || 'Update failed') }
    setUpd(u => ({ ...u, [id]: false }))
  }

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {['', 'New', 'Acknowledged', 'Resolved', 'FalsePositive'].map(v => (
              <button key={v} onClick={() => setStat(v)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${statFilter === v ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {v || 'All'}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {['', 'Critical', 'High', 'Medium', 'Low'].map(v => (
              <button key={v} onClick={() => setSev(v)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${sevFilter === v ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                {v || 'All'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={load} disabled={loading}
          className="text-gray-500 hover:text-white transition-colors" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <ErrorBanner error={error} />}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-16 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading alerts…
        </div>
      )}

      {!loading && alerts.length === 0 && !error && (
        <div className="text-center py-16">
          <CheckCircle2 className="w-10 h-10 text-green-500/40 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No alerts match your filters.</p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            <span className="col-span-1">Sev</span>
            <span className="col-span-2">Agent</span>
            <span className="col-span-3">Rule</span>
            <span className="col-span-3">Description</span>
            <span className="col-span-1">Time</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1 text-right">Act</span>
          </div>
          <div className="divide-y divide-white/5">
            {alerts.map((alert, i) => {
              const id    = field(alert, 'alertId', 'AlertId', 'id', 'Id') ?? i
              const sev   = field(alert, 'severity', 'Severity') ?? 'Medium'
              const agent = field(alert, 'agentName', 'AgentName', 'agent', 'Agent', 'hostname', 'Hostname') ?? '—'
              const rule  = field(alert, 'ruleName', 'RuleName', 'rule', 'Rule', 'ruleTriggered', 'RuleTriggered') ?? '—'
              const desc  = field(alert, 'description', 'Description', 'message', 'Message') ?? ''
              const ts    = field(alert, 'timestamp', 'Timestamp', 'createdAt', 'CreatedAt', 'date', 'Date')
              const stat  = field(alert, 'status', 'Status') ?? 'New'
              const busy  = updating[id]
              const fmtTs = ts ? new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

              return (
                <div key={id} className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-white/3 transition-colors">
                  <div className="col-span-1"><SevBadge sev={sev} /></div>
                  <div className="col-span-2 min-w-0">
                    <span className="text-xs text-white truncate block">{agent}</span>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <span className="text-xs text-gray-300 font-mono truncate block">{rule}</span>
                  </div>
                  <div className="col-span-3 min-w-0">
                    <span className="text-xs text-gray-500 truncate block">{desc}</span>
                  </div>
                  <div className="col-span-1">
                    <span className="text-[10px] text-gray-600 font-mono">{fmtTs}</span>
                  </div>
                  <div className="col-span-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${STATUS_STYLE[stat] || STATUS_STYLE.New}`}>{stat}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end gap-1.5">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" /> : (
                      <>
                        {stat === 'New' && (
                          <button onClick={() => updateStatus(id, 'Acknowledged')}
                            title="Acknowledge"
                            className="text-gray-600 hover:text-amber-400 transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {stat !== 'Resolved' && stat !== 'FalsePositive' && (
                          <button onClick={() => updateStatus(id, 'Resolved')}
                            title="Resolve"
                            className="text-gray-600 hover:text-green-400 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {stat !== 'FalsePositive' && (
                          <button onClick={() => updateStatus(id, 'FalsePositive')}
                            title="Mark False Positive"
                            className="text-gray-600 hover:text-gray-300 transition-colors">
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Tab 2 — Detection Rules
───────────────────────────────────────── */
function RulesTab() {
  const [rules, setRules]     = useState([])
  const [loading, setLoad]    = useState(true)
  const [error, setError]     = useState(null)
  const [showModal, setModal] = useState(false)
  const [toggling, setTog]    = useState({})
  const [deleting, setDel]    = useState({})

  const load = useCallback(async () => {
    setLoad(true); setError(null)
    try {
      const data = await getEdrRules()
      setRules(Array.isArray(data) ? data : (data?.rules ?? data?.Rules ?? data?.items ?? data?.Items ?? []))
    } catch (e) { setError(e.message || 'Failed to load rules') }
    setLoad(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleToggle = async (id) => {
    setTog(t => ({ ...t, [id]: true }))
    try {
      await toggleEdrRule(id)
      setRules(prev => prev.map(r => {
        const rid = field(r, 'ruleId', 'RuleId', 'id', 'Id')
        if (rid !== id) return r
        const cur = field(r, 'enabled', 'Enabled', 'isEnabled', 'IsEnabled') ?? true
        return { ...r, enabled: !cur, Enabled: !cur, isEnabled: !cur }
      }))
    } catch (e) { alert(e.message || 'Toggle failed') }
    setTog(t => ({ ...t, [id]: false }))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this custom rule?')) return
    setDel(d => ({ ...d, [id]: true }))
    try { await deleteEdrRule(id); setRules(prev => prev.filter(r => field(r, 'ruleId', 'RuleId', 'id', 'Id') !== id)) }
    catch (e) { alert(e.message || 'Delete failed') }
    setDel(d => ({ ...d, [id]: false }))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{rules.length} rule{rules.length !== 1 ? 's' : ''} loaded</p>
        <button onClick={() => setModal(true)}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> New Rule
        </button>
      </div>

      {error && <ErrorBanner error={error} />}

      {loading && (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-16 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading rules…
        </div>
      )}

      {!loading && rules.length === 0 && !error && (
        <div className="text-center py-12 text-sm text-gray-500">No rules defined. Create your first detection rule.</div>
      )}

      {!loading && rules.length > 0 && (
        <div className="bg-white/3 border border-white/10 rounded-2xl divide-y divide-white/5">
          {rules.map((rule, i) => {
            const id       = field(rule, 'ruleId', 'RuleId', 'id', 'Id') ?? i
            const name     = field(rule, 'name', 'Name', 'ruleName', 'RuleName') ?? '—'
            const desc     = field(rule, 'description', 'Description') ?? ''
            const ruleType = field(rule, 'ruleType', 'RuleType', 'type', 'Type') ?? '—'
            const sev      = field(rule, 'severity', 'Severity') ?? 'Medium'
            const enabled  = field(rule, 'enabled', 'Enabled', 'isEnabled', 'IsEnabled') ?? true
            const builtIn  = field(rule, 'builtIn', 'BuiltIn', 'isBuiltIn', 'IsBuiltIn') ?? false
            const condition= field(rule, 'condition', 'Condition', 'conditionValue', 'ConditionValue') ?? ''

            return (
              <div key={id} className="flex items-center gap-4 px-5 py-4">
                <RuleToggle enabled={!!enabled} onChange={() => handleToggle(id)} disabled={!!toggling[id]} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{name}</span>
                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">{ruleType}</span>
                    <SevBadge sev={sev} />
                    {builtIn && <span className="text-[10px] text-gray-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">built-in</span>}
                  </div>
                  {desc && <p className="text-xs text-gray-500 mt-0.5 truncate">{desc}</p>}
                  {condition && <p className="text-[10px] text-gray-600 font-mono mt-0.5">{condition}</p>}
                </div>
                {!builtIn && (
                  <button onClick={() => handleDelete(id)} disabled={!!deleting[id]}
                    className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-40 shrink-0">
                    {deleting[id] ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <NewRuleModal
          onClose={() => setModal(false)}
          onCreated={(rule) => setRules(prev => [rule, ...prev])}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Tab 3 — Analyze Agent
───────────────────────────────────────── */
function AnalyzeTab() {
  const [agents, setAgents]   = useState([])
  const [agentsLoad, setAL]   = useState(true)
  const [selected, setSelected] = useState('')
  const [result, setResult]   = useState(null)
  const [loading, setLoad]    = useState(false)
  const [error, setError]     = useState(null)

  useEffect(() => {
    getAgents()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.agents ?? data?.Agents ?? data?.items ?? data?.Items ?? [])
        setAgents(list)
        if (list.length > 0) setSelected(field(list[0], 'agentId', 'AgentId', 'id', 'Id') ?? '')
      })
      .catch(() => {})
      .finally(() => setAL(false))
  }, [])

  const run = async () => {
    if (!selected) return
    setLoad(true); setError(null); setResult(null)
    try { setResult(await analyzeAgent(selected)) }
    catch (e) { setError(e.message || 'Analysis failed') }
    setLoad(false)
  }

  const checks = Array.isArray(result) ? result
    : (result?.checks ?? result?.Checks ?? result?.results ?? result?.Results ?? result?.findings ?? result?.Findings ?? [])

  const passed = checks.filter(c => {
    const s = (field(c, 'status', 'Status', 'result', 'Result') ?? '').toLowerCase()
    return s === 'pass' || s === 'passed' || s === 'ok'
  }).length
  const failed = checks.length - passed

  return (
    <div className="space-y-5">
      <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white mb-1">Run Detection Analysis</h2>
        <p className="text-xs text-gray-500 mb-4">Runs all enabled detection rules against the agent's latest report and returns per-rule results with matched evidence.</p>

        {agentsLoad ? (
          <div className="flex items-center gap-2 text-gray-400 text-xs"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading agents…</div>
        ) : agents.length === 0 ? (
          <p className="text-xs text-gray-500">No agents registered. Deploy an agent first via the <a href="/agents" className="text-amber-400 hover:underline">Agents</a> page.</p>
        ) : (
          <div className="flex gap-3 flex-wrap">
            <select value={selected} onChange={e => setSelected(e.target.value)}
              className="flex-1 min-w-48 bg-white/5 border border-white/15 focus:border-amber-500 text-white px-3 py-2.5 rounded-xl text-sm outline-none transition-colors">
              {agents.map((a, i) => {
                const id   = field(a, 'agentId', 'AgentId', 'id', 'Id') ?? i
                const name = field(a, 'name', 'Name', 'hostname', 'Hostname', 'agentName', 'AgentName') ?? `Agent ${i + 1}`
                return <option key={id} value={id} className="bg-gray-900">{name}</option>
              })}
            </select>
            <button onClick={run} disabled={loading || !selected}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/30 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {loading ? 'Analyzing…' : 'Run Analysis'}
            </button>
          </div>
        )}
      </div>

      {error && <ErrorBanner error={error} />}

      {checks.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-white">{checks.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Rules Checked</p>
            </div>
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
              <p className={`text-2xl font-extrabold ${failed > 0 ? 'text-red-400' : 'text-green-400'}`}>{failed}</p>
              <p className="text-xs text-gray-500 mt-0.5">Triggered</p>
            </div>
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-extrabold text-green-400">{passed}</p>
              <p className="text-xs text-gray-500 mt-0.5">Passed</p>
            </div>
          </div>

          {/* Triggered rules */}
          {failed > 0 && (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-white">Triggered ({failed})</span>
              </div>
              {checks.filter(c => {
                const s = (field(c, 'status', 'Status', 'result', 'Result') ?? '').toLowerCase()
                return s !== 'pass' && s !== 'passed' && s !== 'ok'
              }).map((c, i) => <CheckRow key={i} check={c} />)}
            </div>
          )}

          {/* Passed rules */}
          {passed > 0 && (
            <details className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <summary className="px-5 py-3 text-sm text-gray-500 cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-2 list-none">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                {passed} rule{passed !== 1 ? 's' : ''} passed
              </summary>
              <div className="border-t border-white/10">
                {checks.filter(c => {
                  const s = (field(c, 'status', 'Status', 'result', 'Result') ?? '').toLowerCase()
                  return s === 'pass' || s === 'passed' || s === 'ok'
                }).map((c, i) => <CheckRow key={i} check={c} passed />)}
              </div>
            </details>
          )}
        </div>
      )}

      {result && checks.length === 0 && !error && (
        <div className="text-center text-sm text-gray-500 py-8">No detection results returned.</div>
      )}
    </div>
  )
}

function CheckRow({ check, passed }) {
  const [open, setOpen] = useState(false)
  const name     = field(check, 'ruleName', 'RuleName', 'name', 'Name', 'rule', 'Rule') ?? '—'
  const sev      = field(check, 'severity', 'Severity') ?? 'Medium'
  const evidence = field(check, 'evidence', 'Evidence', 'matched', 'Matched', 'detail', 'Detail') ?? ''
  const desc     = field(check, 'description', 'Description', 'message', 'Message') ?? ''
  const hasMore  = !!(evidence || desc)

  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => hasMore && setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${hasMore ? 'hover:bg-white/3' : ''}`}>
        {passed
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
        <span className="flex-1 text-sm text-white">{name}</span>
        {!passed && <SevBadge sev={sev} />}
        {hasMore && (open ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />)}
      </button>
      {open && hasMore && (
        <div className="px-12 pb-4 space-y-2">
          {desc && <p className="text-xs text-gray-400">{desc}</p>}
          {evidence && (
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
              <p className="text-[10px] text-amber-400 font-semibold mb-0.5">Matched Evidence</p>
              <code className="text-xs text-gray-300 font-mono break-all">
                {typeof evidence === 'string' ? evidence : JSON.stringify(evidence)}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
const TABS = [
  { id: 'alerts',  label: 'Alerts',            icon: ShieldAlert },
  { id: 'rules',   label: 'Detection Rules',   icon: Activity    },
  { id: 'analyze', label: 'Analyze Agent',     icon: CheckCircle2},
]

export default function EdrPage() {
  const [tab, setTab] = useState('alerts')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Endpoint Detection & Response</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">EDR</h1>
            <p className="text-gray-400">Triage endpoint alerts, manage detection rules, and run on-demand analysis against registered agents.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-wrap gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 w-fit">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${tab === id ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white'}`}>
                <Icon className="w-4 h-4" />{label}
              </button>
            ))}
          </div>

          {tab === 'alerts'  && <AlertsTab />}
          {tab === 'rules'   && <RulesTab />}
          {tab === 'analyze' && <AnalyzeTab />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
