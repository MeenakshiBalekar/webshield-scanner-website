import React, { useState, useEffect } from 'react'
import {
  Plug, Plus, Trash2, TestTube2, Pencil, Loader2, AlertTriangle,
  CheckCircle2, XCircle, X, Clock, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getIntegrations, createIntegration, deleteIntegration,
  testIntegration, getIntegrationEvents,
} from '../services/api'

const TYPE_META = {
  slack:   { label: 'Slack',           color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', urlHint: 'https://hooks.slack.com/services/…' },
  webhook: { label: 'Generic Webhook', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30',      urlHint: 'https://yourserver.com/webhook' },
  teams:   { label: 'Microsoft Teams', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30',         urlHint: 'https://outlook.office.com/webhook/…' },
  jira:    { label: 'Jira',            color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30', urlHint: 'https://yoursite.atlassian.net' },
  splunk:  { label: 'Splunk HEC',      color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', urlHint: 'https://splunk.yourcompany.com:8088' },
  qradar:  { label: 'IBM QRadar',      color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',      urlHint: 'https://qradar.yourcompany.com' },
}

const JIRA_ISSUE_TYPES = ['Bug', 'Task', 'Story', 'Security']

function TypeBadge({ type }) {
  const m = TYPE_META[type?.toLowerCase()] || TYPE_META.webhook
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${m.color}`}>{m.label}</span>
  )
}

function Toast({ msg, ok, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold border ${ok ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

const FIELD = "w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
const LABEL = "block text-xs text-gray-400 mb-1.5"

function JiraFields({ form, set }) {
  return (
    <>
      <div>
        <label className={LABEL}>Jira Site URL</label>
        <input value={form.webhookUrl} onChange={set('webhookUrl')} placeholder="https://yoursite.atlassian.net"
          className={FIELD} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={LABEL.replace('mb-1.5', '')}>API Token</label>
          <a href="https://id.atlassian.com/manage/api-tokens" target="_blank" rel="noopener noreferrer"
            className="text-xs text-crimson-400 hover:text-crimson-300 flex items-center gap-1 transition-colors">
            Get token <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <input value={form.apiToken} onChange={set('apiToken')} placeholder="ATATT3x…" autoComplete="off"
          className={FIELD} />
      </div>
      <div>
        <label className={LABEL}>Account Email</label>
        <input value={form.email} onChange={set('email')} placeholder="you@yourcompany.com"
          className={FIELD} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Project Key</label>
          <input value={form.projectKey} onChange={set('projectKey')} placeholder="SEC"
            className={FIELD + ' font-mono uppercase'} />
        </div>
        <div>
          <label className={LABEL}>Issue Type</label>
          <select value={form.issueType} onChange={set('issueType')}
            className={FIELD} style={{ colorScheme: 'dark' }}>
            {JIRA_ISSUE_TYPES.map((t) => (
              <option key={t} value={t} className="bg-navy-900">{t}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}

function buildJiraPayload(form) {
  return {
    type: 'jira',
    name: form.name,
    webhookUrl: form.webhookUrl,
    configJson: JSON.stringify({
      email: form.email,
      apiToken: form.apiToken,
      projectKey: form.projectKey,
      issueType: form.issueType,
    }),
  }
}

function SplunkFields({ form, set }) {
  return (
    <>
      <div>
        <label className={LABEL}>Splunk Host URL</label>
        <input value={form.webhookUrl} onChange={set('webhookUrl')} placeholder="https://splunk.yourcompany.com:8088"
          className={FIELD} />
      </div>
      <div>
        <label className={LABEL}>HEC Token</label>
        <input value={form.splunkToken} onChange={set('splunkToken')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className={FIELD + ' font-mono'} autoComplete="off" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Index</label>
          <input value={form.splunkIndex} onChange={set('splunkIndex')} placeholder="main" className={FIELD} />
        </div>
        <div>
          <label className={LABEL}>Source Type</label>
          <input value={form.splunkSourceType} onChange={set('splunkSourceType')} placeholder="webshield:scan" className={FIELD} />
        </div>
      </div>
    </>
  )
}

function QRadarFields({ form, set }) {
  return (
    <>
      <div>
        <label className={LABEL}>QRadar Host URL</label>
        <input value={form.webhookUrl} onChange={set('webhookUrl')} placeholder="https://qradar.yourcompany.com"
          className={FIELD} />
      </div>
      <div>
        <label className={LABEL}>API Token</label>
        <input value={form.qradarToken} onChange={set('qradarToken')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          className={FIELD + ' font-mono'} autoComplete="off" />
      </div>
      <div>
        <label className={LABEL}>Log Source Name</label>
        <input value={form.qradarLogSource} onChange={set('qradarLogSource')} placeholder="WebShield" className={FIELD} />
      </div>
    </>
  )
}

function buildSplunkPayload(form) {
  return {
    type: 'splunk',
    name: form.name,
    webhookUrl: form.webhookUrl,
    configJson: JSON.stringify({
      hecToken: form.splunkToken,
      index: form.splunkIndex || 'main',
      sourceType: form.splunkSourceType || 'webshield:scan',
    }),
  }
}

function buildQRadarPayload(form) {
  return {
    type: 'qradar',
    name: form.name,
    webhookUrl: form.webhookUrl,
    configJson: JSON.stringify({
      apiToken: form.qradarToken,
      logSourceName: form.qradarLogSource || 'WebShield',
    }),
  }
}

function buildPayload(form) {
  if (form.type === 'jira')   return buildJiraPayload(form)
  if (form.type === 'splunk') return buildSplunkPayload(form)
  if (form.type === 'qradar') return buildQRadarPayload(form)
  return { type: form.type, name: form.name, webhookUrl: form.webhookUrl }
}

function TypeFields({ form, set }) {
  if (form.type === 'jira')   return <JiraFields   form={form} set={set} />
  if (form.type === 'splunk') return <SplunkFields form={form} set={set} />
  if (form.type === 'qradar') return <QRadarFields form={form} set={set} />
  const meta = TYPE_META[form.type] || TYPE_META.webhook
  return (
    <div>
      <label className={LABEL}>Webhook URL</label>
      <input value={form.webhookUrl} onChange={set('webhookUrl')} placeholder={meta.urlHint} className={FIELD} />
    </div>
  )
}

const EMPTY_FORM = {
  type: 'slack', name: '', webhookUrl: '',
  email: '', apiToken: '', projectKey: '', issueType: 'Bug',
  splunkToken: '', splunkIndex: 'main', splunkSourceType: 'webshield:scan',
  qradarToken: '', qradarLogSource: 'WebShield',
}

function validateForm(form) {
  if (!form.name.trim()) return 'Name is required'
  if (!form.webhookUrl.trim()) return form.type === 'jira' ? 'Jira Site URL is required' : form.type === 'splunk' ? 'Splunk Host URL is required' : form.type === 'qradar' ? 'QRadar Host URL is required' : 'Webhook URL is required'
  if (form.type === 'jira' && !form.email.trim()) return 'Account email is required'
  if (form.type === 'jira' && !form.apiToken.trim()) return 'API token is required'
  if (form.type === 'jira' && !form.projectKey.trim()) return 'Project key is required'
  if (form.type === 'splunk' && !form.splunkToken.trim()) return 'HEC token is required'
  if (form.type === 'qradar' && !form.qradarToken.trim()) return 'API token is required'
  return null
}

function AddModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    const validErr = validateForm(form)
    if (validErr) { setErr(validErr); return }
    setSaving(true); setErr(null)
    try {
      onSaved(await createIntegration(buildPayload(form)))
    } catch (e) { setErr(e.message || 'Save failed') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-navy-950 border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Add Integration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={LABEL}>Integration Type</label>
            <select value={form.type} onChange={set('type')}
              className={FIELD} style={{ colorScheme: 'dark' }}>
              <option value="slack"   className="bg-navy-900">Slack</option>
              <option value="webhook" className="bg-navy-900">Generic Webhook</option>
              <option value="teams"   className="bg-navy-900">Microsoft Teams</option>
              <option value="jira"    className="bg-navy-900">Jira</option>
              <option value="splunk"  className="bg-navy-900">Splunk HEC</option>
              <option value="qradar"  className="bg-navy-900">IBM QRadar</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Name</label>
            <input value={form.name} onChange={set('name')} placeholder="e.g. Security Alerts → #security"
              className={FIELD} />
          </div>

          <TypeFields form={form} set={set} />

          {err && <p className="text-red-400 text-xs">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 text-sm text-gray-400 border border-white/15 rounded-xl py-2.5 hover:text-white transition-colors">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditModal({ integration, onClose, onSaved }) {
  const id       = integration.id      ?? integration.Id      ?? ''
  const rawType  = (integration.type   ?? integration.Type    ?? 'webhook').toLowerCase()
  const existing = (() => {
    try { return JSON.parse(integration.configJson ?? integration.ConfigJson ?? '{}') } catch { return {} }
  })()

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    type:             rawType,
    name:             integration.name       ?? integration.Name       ?? '',
    webhookUrl:       integration.webhookUrl ?? integration.WebhookUrl ?? '',
    email:            existing.email        ?? '',
    apiToken:         existing.apiToken     ?? '',
    projectKey:       existing.projectKey   ?? '',
    issueType:        existing.issueType    ?? 'Bug',
    splunkToken:      existing.hecToken     ?? '',
    splunkIndex:      existing.index        ?? 'main',
    splunkSourceType: existing.sourceType   ?? 'webshield:scan',
    qradarToken:      existing.apiToken     ?? '',
    qradarLogSource:  existing.logSourceName ?? 'WebShield',
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr]       = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    const validErr = validateForm(form)
    if (validErr) { setErr(validErr); return }
    setSaving(true); setErr(null)
    try {
      onSaved(await createIntegration({ ...buildPayload(form), id }))
    } catch (e) { setErr(e.message || 'Save failed') }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-navy-950 border border-white/15 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Edit Integration</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Name</label>
            <input value={form.name} onChange={set('name')} className={FIELD} />
          </div>
          <TypeFields form={form} set={set} />
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 text-sm text-gray-400 border border-white/15 rounded-xl py-2.5 hover:text-white transition-colors">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function IntegrationCard({ integration, onDelete, onTest, onEdit }) {
  const id         = integration.id         ?? integration.Id         ?? ''
  const name       = integration.name       ?? integration.Name       ?? ''
  const type       = (integration.type      ?? integration.Type       ?? 'webhook').toLowerCase()
  const enabled    = integration.isEnabled  ?? integration.IsEnabled  ?? true
  const lastTested = integration.lastTestedAt ?? integration.LastTestedAt ?? ''
  const lastEvent  = integration.lastEventAt  ?? integration.LastEventAt  ?? ''

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <TypeBadge type={type} />
          <p className="text-white font-semibold text-sm">{name}</p>
          {!enabled && <span className="text-xs text-gray-500 border border-white/10 px-1.5 py-0.5 rounded">Disabled</span>}
        </div>
        <div className="flex gap-4 flex-wrap">
          {lastTested && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />Tested {new Date(lastTested).toLocaleDateString()}</span>}
          {lastEvent  && <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" />Last event {new Date(lastEvent).toLocaleDateString()}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => onTest(id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-crimson-500/40 transition-colors">
          <TestTube2 className="w-3.5 h-3.5" />Test
        </button>
        <button onClick={() => onEdit(integration)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white transition-colors">
          <Pencil className="w-3.5 h-3.5" />Edit
        </button>
        <button onClick={() => onDelete(id)} className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState([])
  const [events, setEvents]             = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [showAdd, setShowAdd]           = useState(false)
  const [editTarget, setEditTarget]     = useState(null)
  const [eventsOpen, setEventsOpen]     = useState(false)
  const [toast, setToast]               = useState(null)

  const showToast = (msg, ok = true) => setToast({ msg, ok })

  const load = () => {
    Promise.all([getIntegrations(), getIntegrationEvents()])
      .then(([ints, evts]) => {
        setIntegrations(Array.isArray(ints) ? ints : (ints?.integrations ?? []))
        setEvents(Array.isArray(evts) ? evts : (evts?.events ?? []))
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleTest = async (id) => {
    try {
      await testIntegration(id)
      showToast('Test payload delivered')
    } catch (e) {
      showToast(e.message || 'Delivery failed', false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this integration?')) return
    try {
      await deleteIntegration(id)
      setIntegrations((prev) => prev.filter((i) => (i.id ?? i.Id) !== id))
      showToast('Integration removed')
    } catch (e) {
      showToast(e.message || 'Delete failed', false)
    }
  }

  const handleSaved = () => {
    setShowAdd(false)
    setEditTarget(null)
    load()
    showToast('Integration saved')
  }

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Settings</p>
              <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                <Plug className="w-8 h-8 text-crimson-400" /> Integrations
              </h1>
              <p className="text-gray-400">Send scan alerts to Slack, Teams, Jira, or any webhook endpoint.</p>
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="shrink-0 flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mt-1"
            >
              <Plus className="w-4 h-4" />Add Integration
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertTriangle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />Loading…
            </div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-20 bg-white/3 border border-white/10 rounded-2xl">
              <Plug className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-semibold">No integrations yet</p>
              <p className="text-gray-500 text-sm mt-1 mb-5">Connect Slack, Teams, Jira, or a webhook to receive scan alerts.</p>
              <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" />Add Integration
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              {integrations.map((i, idx) => (
                <IntegrationCard
                  key={i.id ?? i.Id ?? idx}
                  integration={i}
                  onDelete={handleDelete}
                  onTest={handleTest}
                  onEdit={setEditTarget}
                />
              ))}
            </div>
          )}

          {/* Delivery log */}
          {events.length > 0 && (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setEventsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-gray-300 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-crimson-400" />Recent Delivery Log ({events.length} events)</span>
                {eventsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {eventsOpen && (
                <div className="border-t border-white/10 overflow-x-auto">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <tr className="text-gray-500 border-b border-white/10">
                        <th className="text-left px-6 py-3">Integration</th>
                        <th className="text-left px-4 py-3">Event</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((ev, i) => {
                        const ok = ev.success ?? ev.Success ?? ev.status === 'delivered'
                        const evName = ev.integrationName ?? ev.IntegrationName ?? ev.name ?? ''
                        const event  = ev.event ?? ev.Event ?? ev.eventType ?? ''
                        const ts     = ev.createdAt ?? ev.CreatedAt ?? ev.timestamp ?? ''
                        return (
                          <tr key={i} className="border-b border-white/5 last:border-0">
                            <td className="px-6 py-2.5 text-gray-300">{evName}</td>
                            <td className="px-4 py-2.5 text-gray-400">{event}</td>
                            <td className="px-4 py-2.5">
                              <span className={`flex items-center gap-1 ${ok ? 'text-green-400' : 'text-red-400'}`}>
                                {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                {ok ? 'Delivered' : 'Failed'}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-500">{ts ? new Date(ts).toLocaleString() : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
      <Footer />
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onSaved={handleSaved} />}
      {editTarget && <EditModal integration={editTarget} onClose={() => setEditTarget(null)} onSaved={handleSaved} />}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  )
}
