import React, { useState, useEffect } from 'react'
import {
  Database, Plus, Trash2, TestTube2, ToggleLeft, ToggleRight,
  Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import {
  getSiemPlatforms, getSiemConfigs, createSiemConfig,
  deleteSiemConfig, testSiemConfig, updateSiemConfig,
} from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

// ── Static fallback field schemas per platform ──────────────────────────────
const STATIC_PLATFORMS = [
  {
    id: 'splunk',
    name: 'Splunk',
    color: '#00BC00',
    fields: [
      { key: 'hecUrl',     label: 'HEC URL',      placeholder: 'https://splunk.example.com:8088',  type: 'url' },
      { key: 'token',      label: 'HEC Token',     placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'password' },
      { key: 'index',      label: 'Index',          placeholder: 'main',                              type: 'text' },
      { key: 'sourcetype', label: 'Source Type',    placeholder: 'webshield:scan',                    type: 'text' },
    ],
  },
  {
    id: 'sentinel',
    name: 'Microsoft Sentinel',
    color: '#0078D4',
    fields: [
      { key: 'workspaceId', label: 'Workspace ID',  placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', type: 'text' },
      { key: 'sharedKey',   label: 'Shared Key',    placeholder: 'base64-encoded-key',                   type: 'password' },
      { key: 'logType',     label: 'Log Type',      placeholder: 'WebShieldScan',                        type: 'text' },
    ],
  },
]

function SplunkDot() {
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00BC00]" />
}
function SentinelDot() {
  return <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#0078D4]" />
}

function PlatformIcon({ id }) {
  if (id === 'splunk')   return <SplunkDot />
  if (id === 'sentinel') return <SentinelDot />
  return <Database className="w-3 h-3 text-gray-400" />
}

const INPUT = 'w-full bg-white/5 border border-white/15 focus:border-blue-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'
const LABEL = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

// ── Test result component ──────────────────────────────────────────────────
function TestResult({ result }) {
  if (!result) return null
  return (
    <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border ${
      result.ok
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      {result.ok
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <AlertCircle  className="w-4 h-4 shrink-0" />}
      <span>{result.msg}</span>
      {result.latencyMs != null && (
        <span className="ml-auto text-xs opacity-70">{result.latencyMs}ms</span>
      )}
    </div>
  )
}

// ── Single config card ──────────────────────────────────────────────────────
function ConfigCard({ config, platforms, onDelete, onToggle, onTestDone }) {
  const id       = field(config, 'id', 'Id') ?? ''
  const name     = field(config, 'name', 'Name') ?? id
  const platform = field(config, 'platform', 'Platform', 'type', 'Type') ?? ''
  const enabled  = field(config, 'enabled', 'Enabled') ?? true

  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [toggling,   setToggling]   = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [expanded,   setExpanded]   = useState(false)

  const platformMeta = platforms.find(p => p.id === platform || p.id === platform.toLowerCase())

  const handleTest = async () => {
    setTesting(true); setTestResult(null)
    try {
      const data = await testSiemConfig(id)
      const latency = field(data, 'latencyMs', 'LatencyMs', 'latency', 'Latency')
      const msg     = field(data, 'message', 'Message') ?? 'Connection successful'
      setTestResult({ ok: true, msg, latencyMs: latency })
    } catch (e) {
      setTestResult({ ok: false, msg: e.message || 'Test failed' })
    }
    setTesting(false)
    if (onTestDone) onTestDone()
  }

  const handleToggle = async () => {
    setToggling(true)
    try {
      await updateSiemConfig(id, { enabled: !enabled })
      onToggle(id, !enabled)
    } catch {}
    setToggling(false)
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${name}"?`)) return
    setDeleting(true)
    try {
      await deleteSiemConfig(id)
      onDelete(id)
    } catch { setDeleting(false) }
  }

  return (
    <div className={`bg-white/3 border rounded-2xl overflow-hidden transition-colors ${enabled ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
      <div className="flex items-center gap-3 px-5 py-4">
        <PlatformIcon id={platform.toLowerCase()} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{name}</p>
          <p className="text-xs text-gray-500 capitalize">{platformMeta?.name ?? platform}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Test */}
          <button onClick={handleTest} disabled={testing}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube2 className="w-3.5 h-3.5" />}
            Test
          </button>
          {/* Toggle */}
          <button onClick={handleToggle} disabled={toggling}
            className="text-gray-400 hover:text-white transition-colors disabled:opacity-50">
            {enabled
              ? <ToggleRight className="w-6 h-6 text-emerald-400" />
              : <ToggleLeft  className="w-6 h-6" />}
          </button>
          {/* Delete */}
          <button onClick={handleDelete} disabled={deleting}
            className="text-gray-600 hover:text-red-400 transition-colors disabled:opacity-50">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          </button>
          {/* Expand test result */}
          {testResult && (
            <button onClick={() => setExpanded(e => !e)} className="text-gray-500 hover:text-gray-300">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
      {testResult && expanded && (
        <div className="px-5 pb-4">
          <TestResult result={testResult} />
        </div>
      )}
      {testResult && !expanded && (
        <div className="px-5 pb-4">
          <TestResult result={testResult} />
        </div>
      )}
    </div>
  )
}

// ── Add-new form ────────────────────────────────────────────────────────────
function AddConfigForm({ platforms, onSaved, onCancel }) {
  const [activeTab, setActiveTab] = useState(platforms[0]?.id ?? 'splunk')
  const [name,      setName]      = useState('')
  const [form,      setForm]      = useState({})
  const [saving,    setSaving]    = useState(false)
  const [err,       setErr]       = useState(null)

  const platform = platforms.find(p => p.id === activeTab) ?? platforms[0]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setErr(null)
    try {
      const saved = await createSiemConfig({ platform: activeTab, name: name || platform?.name, ...form })
      onSaved(saved)
    } catch (e) { setErr(e.message || 'Save failed') }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/3 border border-blue-500/30 rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h3 className="text-sm font-bold text-white">New SIEM Connection</h3>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-300 text-xs">Cancel</button>
      </div>

      {/* Platform tabs */}
      <div className="flex border-b border-white/10">
        {platforms.map(p => (
          <button key={p.id} type="button" onClick={() => { setActiveTab(p.id); setForm({}) }}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === p.id
                ? 'text-white border-b-2 border-blue-400'
                : 'text-gray-500 hover:text-gray-300'
            }`}>
            <PlatformIcon id={p.id} />
            {p.name}
          </button>
        ))}
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Connection name */}
        <div>
          <label className={LABEL}>Connection Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder={`My ${platform?.name ?? ''} Connection`}
            className={INPUT} />
        </div>

        {/* Dynamic fields from platform schema */}
        {(platform?.fields ?? []).map(f => (
          <div key={f.key}>
            <label className={LABEL}>{f.label}</label>
            <input
              type={f.type === 'password' ? 'password' : f.type === 'url' ? 'url' : 'text'}
              value={form[f.key] ?? ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder ?? ''}
              className={INPUT}
              required={f.required !== false}
            />
          </div>
        ))}

        {err && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{err}</span>
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Add Connection'}
          </button>
          <button type="button" onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function SiemPage() {
  const [configs,  setConfigs]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [loadErr,  setLoadErr]  = useState(null)
  const [platforms, setPlatforms] = useState(STATIC_PLATFORMS)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true); setLoadErr(null)
    Promise.all([getSiemPlatforms(), getSiemConfigs()])
      .then(([platData, cfgData]) => {
        if (platData) {
          const list = Array.isArray(platData)
            ? platData
            : (field(platData, 'platforms', 'Platforms') ?? [])
          if (list.length > 0) {
            setPlatforms(list.map(p => ({
              id:     field(p, 'id', 'Id') ?? '',
              name:   field(p, 'name', 'Name') ?? '',
              fields: field(p, 'fields', 'Fields') ?? [],
            })))
          }
        }
        const cfgList = Array.isArray(cfgData)
          ? cfgData
          : (field(cfgData, 'configs', 'Configs', 'items', 'Items') ?? [])
        setConfigs(cfgList)
      })
      .catch(e => setLoadErr(e?.message || 'Failed to load SIEM configurations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSaved = (newCfg) => {
    setConfigs(prev => [...prev, newCfg])
    setShowForm(false)
  }

  const handleDelete = (id) => setConfigs(prev => prev.filter(c => (field(c,'id','Id') ?? '') !== id))

  const handleToggle = (id, enabled) => {
    setConfigs(prev => prev.map(c =>
      (field(c,'id','Id') ?? '') === id ? { ...c, enabled, Enabled: enabled } : c
    ))
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-500/15 border border-blue-500/30 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Security Operations</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white">SIEM Integrations</h1>
                <p className="text-gray-400 text-sm mt-1">
                  Push scan findings directly to Splunk or Microsoft Sentinel.
                </p>
              </div>
              <button onClick={load} disabled={loading}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          <PageGuide id="siem" text="Connects Udyo360 to your Splunk or Microsoft Sentinel environment so scan findings flow directly into your SOC. Click 'Add Connection,' choose Splunk or Sentinel, enter your HEC URL + token (Splunk) or Workspace ID + shared key (Sentinel), then click Test Connection. Once connected, use the 'Push to SIEM' button on any scan result to send findings instantly." />

          {loadErr && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{loadErr}</span>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-blue-400 animate-spin" /></div>
          ) : (
            <>
              {/* Configs list */}
              {configs.length === 0 && !showForm ? (
                <div className="text-center py-14 bg-white/2 border border-white/8 rounded-2xl">
                  <Database className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-medium">No SIEM connections yet</p>
                  <p className="text-gray-600 text-xs mt-1">Add Splunk or Microsoft Sentinel to start pushing findings.</p>
                  <button onClick={() => setShowForm(true)}
                    className="mt-5 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mx-auto">
                    <Plus className="w-4 h-4" />Add Connection
                  </button>
                </div>
              ) : (
                <>
                  {configs.map((cfg, i) => (
                    <ConfigCard key={field(cfg,'id','Id') ?? i} config={cfg}
                      platforms={platforms} onDelete={handleDelete} onToggle={handleToggle} />
                  ))}
                  {!showForm && (
                    <button onClick={() => setShowForm(true)}
                      className="flex items-center gap-2 w-full justify-center border-2 border-dashed border-white/15 hover:border-white/25 text-gray-500 hover:text-gray-300 py-3.5 rounded-2xl text-sm font-semibold transition-colors">
                      <Plus className="w-4 h-4" />Add New Connection
                    </button>
                  )}
                </>
              )}

              {showForm && (
                <AddConfigForm
                  platforms={platforms}
                  onSaved={handleSaved}
                  onCancel={() => setShowForm(false)}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
