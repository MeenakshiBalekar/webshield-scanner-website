import React, { useEffect, useState } from 'react'
import {
  Calendar,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Bell,
  BellOff,
} from 'lucide-react'
import { getSchedules, createSchedule, deleteSchedule, toggleSchedule } from '../services/api'
import Navbar from '../components/Navbar'

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

function frequencyLabel(freq) {
  switch (freq) {
    case 'daily':   return 'Daily'
    case 'weekly':  return 'Weekly'
    case 'monthly': return 'Monthly'
    default:        return freq ?? '—'
  }
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState(null)

  // Form state
  const [newUrl, setNewUrl] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [alertOnNewFinding, setAlertOnNewFinding] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Per-row action spinner
  const [actionId, setActionId] = useState(null)

  const load = () =>
    getSchedules()
      .then(setSchedules)
      .catch(() => {})

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    setSubmitting(true)
    try {
      await createSchedule({ targetUrl: newUrl.trim(), frequency, alertOnNewFinding })
      setNewUrl('')
      setFrequency('daily')
      setAlertOnNewFinding(false)
      await load()
    } catch (e) { /* suppress */ }
    setSubmitting(false)
  }

  const handleToggle = async (id) => {
    setActionId(id)
    try { await toggleSchedule(id); await load() } catch (e) { /* suppress */ }
    setActionId(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this schedule?')) return
    setActionId(id)
    try { await deleteSchedule(id); await load() } catch (e) { /* suppress */ }
    setActionId(null)
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-10">
        <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-crimson-400" /> Scheduled Scans
        </h1>

        {/* ── Create new schedule ─────────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-white mb-4">Add New Schedule</h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">

            {/* URL input */}
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-app.com"
              required
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            />

            {/* Frequency picker */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Frequency</span>
              <div className="flex gap-2 flex-wrap">
                {FREQUENCIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFrequency(value)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      frequency === value
                        ? 'bg-crimson-500 text-white border-crimson-500'
                        : 'bg-transparent text-gray-400 border border-white/15 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert on new finding toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setAlertOnNewFinding((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                  alertOnNewFinding ? 'bg-crimson-500' : 'bg-white/15'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    alertOnNewFinding ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-300">Alert on new finding</span>
              {alertOnNewFinding && (
                <span className="text-[11px] text-crimson-400 font-semibold">— you will be notified when new issues are found</span>
              )}
            </div>

            {/* Submit */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newUrl.trim()}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Schedule
              </button>
            </div>
          </form>
        </div>

        {/* ── Schedule list ───────────────────────────────────────────────── */}
        {!schedules && (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {schedules?.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-white font-semibold mb-2">No schedules yet</p>
            <p className="text-gray-400 text-sm">Add a URL above to start automated scanning.</p>
          </div>
        )}

        {schedules?.length > 0 && (
          <div className="border border-white/10 rounded-2xl overflow-hidden">
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_100px_90px_110px_80px] gap-4 px-4 py-3 bg-white/3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Target URL</span>
              <span>Frequency</span>
              <span>Status</span>
              <span>Alerts</span>
              <span>Actions</span>
            </div>

            {schedules.map((s) => (
              <div
                key={s.id}
                className="grid sm:grid-cols-[1fr_100px_90px_110px_80px] gap-4 items-center px-4 py-3.5 border-b border-white/5 last:border-b-0"
              >
                {/* URL */}
                <p className="text-sm text-white font-medium truncate" title={s.targetUrl}>
                  {s.targetUrl}
                </p>

                {/* Frequency */}
                <p className="text-xs text-gray-400">{frequencyLabel(s.frequency)}</p>

                {/* Active / Paused badge */}
                <span
                  className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${
                    s.enabled
                      ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                      : 'text-gray-400 bg-white/5 border border-white/10'
                  }`}
                >
                  {s.enabled ? 'Active' : 'Paused'}
                </span>

                {/* Alert chip */}
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                    s.alertOnNewFinding
                      ? 'text-crimson-400 bg-crimson-500/10 border border-crimson-500/20'
                      : 'text-gray-500 bg-white/5 border border-white/10'
                  }`}
                >
                  {s.alertOnNewFinding
                    ? <><Bell className="w-3 h-3" /> Alerts on</>
                    : <><BellOff className="w-3 h-3" /> No alerts</>
                  }
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(s.id)}
                    disabled={actionId === s.id}
                    className="text-gray-400 hover:text-white transition-colors"
                    title={s.enabled ? 'Pause schedule' : 'Resume schedule'}
                  >
                    {actionId === s.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : s.enabled ? (
                      <ToggleRight className="w-4 h-4 text-green-400" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={actionId === s.id}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete schedule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
