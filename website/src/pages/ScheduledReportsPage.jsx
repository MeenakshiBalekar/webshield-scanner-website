import React, { useState, useEffect } from 'react'
import {
  CalendarClock, Plus, Trash2, Pencil, Loader2, AlertTriangle,
  Send, ToggleLeft, ToggleRight, X, CheckCircle2, Clock,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getScheduledReports, createScheduledReport, updateScheduledReport,
  deleteScheduledReport, sendReportNow,
} from '../services/api'

const FREQ_OPTS  = ['Daily', 'Weekly', 'Monthly']
const DAY_OPTS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const FORMAT_OPTS = ['PDF', 'Email Summary']
const FORMAT_STYLE = {
  PDF:            'bg-crimson-500/15 text-crimson-400 border-crimson-500/30',
  'Email Summary':'bg-blue-500/15 text-blue-400 border-blue-500/30',
}

const BLANK = { targetUrl: '', frequency: 'Weekly', dayOfWeek: 'Monday', recipients: '', format: 'PDF', includeAiSummary: true }

function Toast({ msg, ok, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold border ${ok ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}>
      {ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
    </div>
  )
}

function ScheduleModal({ existing, onClose, onSaved }) {
  const isEdit = !!existing
  const [form, setForm] = useState(isEdit ? {
    targetUrl: existing.targetUrl ?? existing.TargetUrl ?? '',
    frequency: existing.frequency ?? existing.Frequency ?? 'Weekly',
    dayOfWeek: existing.dayOfWeek ?? existing.DayOfWeek ?? 'Monday',
    recipients: (existing.recipients ?? existing.Recipients ?? []).join(', '),
    format: existing.format ?? existing.Format ?? 'PDF',
    includeAiSummary: existing.includeAiSummary ?? existing.IncludeAiSummary ?? true,
  } : { ...BLANK })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const toggle = (k) => setForm((f) => ({ ...f, [k]: !f[k] }))

  const save = async () => {
    if (!form.targetUrl.trim()) { setErr('Target URL is required'); return }
    if (!form.recipients.trim()) { setErr('At least one recipient email is required'); return }
    setSaving(true); setErr(null)
    const payload = {
      ...form,
      recipients: form.recipients.split(',').map((e) => e.trim()).filter(Boolean),
    }
    try {
      const res = isEdit
        ? await updateScheduledReport(existing.id ?? existing.Id, payload)
        : await createScheduledReport(payload)
      onSaved(res)
    } catch (e) { setErr('Save failed') }
    setSaving(false)
  }

  const fieldCls = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'
  const selectCls = `${fieldCls} appearance-none`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-navy-950 border border-white/15 rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">{isEdit ? 'Edit Schedule' : 'Add Schedule'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Target URL *</label>
            <input value={form.targetUrl} onChange={set('targetUrl')} placeholder="https://example.com" className={fieldCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Frequency</label>
              <select value={form.frequency} onChange={set('frequency')} className={selectCls} style={{ colorScheme: 'dark' }}>
                {FREQ_OPTS.map((o) => <option key={o} value={o} className="bg-navy-900">{o}</option>)}
              </select>
            </div>
            {form.frequency === 'Weekly' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Day of Week</label>
                <select value={form.dayOfWeek} onChange={set('dayOfWeek')} className={selectCls} style={{ colorScheme: 'dark' }}>
                  {DAY_OPTS.map((d) => <option key={d} value={d} className="bg-navy-900">{d}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Recipients * (comma-separated)</label>
            <input value={form.recipients} onChange={set('recipients')} placeholder="cto@company.com, dev@company.com" className={fieldCls} />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Report Format</label>
            <select value={form.format} onChange={set('format')} className={selectCls} style={{ colorScheme: 'dark' }}>
              {FORMAT_OPTS.map((o) => <option key={o} value={o} className="bg-navy-900">{o}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <button type="button" onClick={() => toggle('includeAiSummary')} className={`w-10 h-5 rounded-full border transition-colors ${form.includeAiSummary ? 'bg-crimson-500 border-crimson-600' : 'bg-white/10 border-white/20'}`}>
              <span className={`block w-3.5 h-3.5 rounded-full bg-white shadow transition-transform mx-0.5 ${form.includeAiSummary ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm text-gray-300">Include AI Narrative Summary</span>
          </label>

          {err && <p className="text-red-400 text-xs">{err}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 text-sm text-gray-400 border border-white/15 rounded-xl py-2.5 hover:text-white transition-colors">Cancel</button>
            <button onClick={save} disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ScheduleRow({ schedule, onDelete, onEdit, onSendNow, onToggle }) {
  const id       = schedule.id       ?? schedule.Id       ?? ''
  const url      = schedule.targetUrl ?? schedule.TargetUrl ?? ''
  const freq     = schedule.frequency  ?? schedule.Frequency ?? ''
  const day      = schedule.dayOfWeek  ?? schedule.DayOfWeek ?? ''
  const recips   = schedule.recipients ?? schedule.Recipients ?? []
  const format   = schedule.format     ?? schedule.Format     ?? 'PDF'
  const ai       = schedule.includeAiSummary ?? schedule.IncludeAiSummary ?? false
  const enabled  = schedule.isEnabled  ?? schedule.IsEnabled  ?? true
  const nextRun  = schedule.nextRunAt  ?? schedule.NextRunAt  ?? ''
  const lastRun  = schedule.lastRunAt  ?? schedule.LastRunAt  ?? ''
  const [sending, setSending] = useState(false)

  const doSendNow = async () => {
    setSending(true)
    await onSendNow(id)
    setSending(false)
  }

  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="px-6 py-3 text-gray-300 text-sm max-w-[200px] truncate">{url}</td>
      <td className="px-4 py-3 text-gray-400 text-sm">{freq}{freq === 'Weekly' && day ? ` · ${day}` : ''}</td>
      <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">{Array.isArray(recips) ? recips.join(', ') : recips}</td>
      <td className="px-4 py-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${FORMAT_STYLE[format] || FORMAT_STYLE.PDF}`}>{format}</span>
        {ai && <span className="ml-1.5 text-xs text-crimson-400 font-medium">+AI</span>}
      </td>
      <td className="px-4 py-3 text-gray-500 text-xs">
        {lastRun ? new Date(lastRun).toLocaleDateString() : '—'}
      </td>
      <td className="px-4 py-3 text-gray-400 text-xs">
        {nextRun ? (
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(nextRun).toLocaleDateString()}</span>
        ) : '—'}
      </td>
      <td className="px-4 py-3">
        <button onClick={() => onToggle(id, !enabled)} className="text-gray-400 hover:text-white transition-colors">
          {enabled ? <ToggleRight className="w-5 h-5 text-green-400" /> : <ToggleLeft className="w-5 h-5" />}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button onClick={doSendNow} disabled={sending}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/15 text-gray-300 hover:text-white hover:border-crimson-500/40 transition-colors flex items-center gap-1">
            {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Now
          </button>
          <button onClick={() => onEdit(schedule)} className="text-gray-400 hover:text-white transition-colors p-1">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(id)} className="text-red-400/60 hover:text-red-400 transition-colors p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function ScheduledReportsPage() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [toast, setToast]         = useState(null)

  const showToast = (msg, ok = true) => setToast({ msg, ok })

  const load = () => {
    getScheduledReports()
      .then((data) => setSchedules(Array.isArray(data) ? data : (data?.schedules ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return
    try {
      await deleteScheduledReport(id)
      setSchedules((prev) => prev.filter((s) => (s.id ?? s.Id) !== id))
      showToast('Schedule deleted')
    } catch (e) { showToast('Delete failed', false) }
  }

  const handleSendNow = async (id) => {
    try {
      await sendReportNow(id)
      showToast('Report sent')
    } catch (e) { showToast('Send failed', false) }
  }

  const handleToggle = async (id, enable) => {
    try {
      const fn = enable
        ? () => updateScheduledReport(id, { isEnabled: true })
        : () => updateScheduledReport(id, { isEnabled: false })
      await fn()
      setSchedules((prev) => prev.map((s) => {
        if ((s.id ?? s.Id) !== id) return s
        return { ...s, isEnabled: enable, IsEnabled: enable }
      }))
    } catch (e) { showToast('Update failed', false) }
  }

  const handleSaved = () => { setShowModal(false); setEditTarget(null); load(); showToast('Schedule saved') }

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          <div className="mb-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Intelligence</p>
              <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
                <CalendarClock className="w-8 h-8 text-crimson-400" /> Scheduled Reports
              </h1>
              <p className="text-gray-400">Automated PDF or email reports delivered on your schedule.</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="shrink-0 flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors mt-1">
              <Plus className="w-4 h-4" />Add Schedule
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />Loading…
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-20 bg-white/3 border border-white/10 rounded-2xl">
              <CalendarClock className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-white font-semibold">No scheduled reports yet</p>
              <p className="text-gray-500 text-sm mt-1 mb-5">Automate weekly PDF reports delivered directly to your inbox.</p>
              <button onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                <Plus className="w-4 h-4" />Add Schedule
              </button>
            </div>
          ) : (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left px-6 py-3">URL</th>
                    <th className="text-left px-4 py-3">Frequency</th>
                    <th className="text-left px-4 py-3">Recipients</th>
                    <th className="text-left px-4 py-3">Format</th>
                    <th className="text-left px-4 py-3">Last Sent</th>
                    <th className="text-left px-4 py-3">Next Send</th>
                    <th className="text-left px-4 py-3">Enabled</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, i) => (
                    <ScheduleRow
                      key={s.id ?? s.Id ?? i}
                      schedule={s}
                      onDelete={handleDelete}
                      onEdit={setEditTarget}
                      onSendNow={handleSendNow}
                      onToggle={handleToggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </main>
      <Footer />
      {(showModal || editTarget) && (
        <ScheduleModal
          existing={editTarget || null}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
          onSaved={handleSaved}
        />
      )}
      {toast && <Toast msg={toast.msg} ok={toast.ok} onClose={() => setToast(null)} />}
    </div>
  )
}
