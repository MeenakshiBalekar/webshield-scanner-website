import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Plus, AlertCircle, Trash2, ToggleLeft, ToggleRight, Loader2, Calendar, LayoutDashboard } from 'lucide-react'
import { getSchedules, createSchedule, deleteSchedule, toggleSchedule } from '../services/api'

export default function SchedulePage() {
  const [schedules, setSchedules] = useState(null)
  const [error, setError] = useState(null)
  const [newUrl, setNewUrl] = useState('')
  const [interval, setInterval] = useState(60)
  const [submitting, setSubmitting] = useState(false)
  const [actionId, setActionId] = useState(null)

  const load = () =>
    getSchedules()
      .then(setSchedules)
      .catch((e) => setError(e.message))

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    setSubmitting(true)
    try {
      await createSchedule({ targetUrl: newUrl.trim(), intervalMinutes: Number(interval), enabled: true })
      setNewUrl('')
      setInterval(60)
      await load()
    } catch (e) {
      setError(e.message)
    }
    setSubmitting(false)
  }

  const handleToggle = async (id) => {
    setActionId(id)
    try { await toggleSchedule(id); await load() } catch (e) { setError(e.message) }
    setActionId(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this schedule?')) return
    setActionId(id)
    try { await deleteSchedule(id); await load() } catch (e) { setError(e.message) }
    setActionId(null)
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9" />
          <span className="text-white font-bold text-xl tracking-tight">
            Udy◎<span className="text-crimson-500">360</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/scanner" className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Scan
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-crimson-400" /> Scheduled Scans
        </h1>

        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Create new schedule */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-semibold text-white mb-4">Add New Schedule</h2>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-app.com"
              required
              className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            />
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="bg-white/5 border border-white/15 text-white px-3 py-2.5 rounded-xl text-sm outline-none"
            >
              <option value={30}>Every 30 min</option>
              <option value={60}>Every 1 hour</option>
              <option value={360}>Every 6 hours</option>
              <option value={720}>Every 12 hours</option>
              <option value={1440}>Every day</option>
            </select>
            <button
              type="submit"
              disabled={submitting || !newUrl.trim()}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </form>
        </div>

        {/* Schedule list */}
        {!schedules && !error && (
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
            <div className="hidden sm:grid grid-cols-[1fr_120px_80px_80px] gap-4 px-4 py-3 bg-white/3 border-b border-white/10 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <span>Target URL</span>
              <span>Interval</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {schedules.map((s) => (
              <div key={s.id} className="grid sm:grid-cols-[1fr_120px_80px_80px] gap-4 items-center px-4 py-3.5 border-b border-white/5 last:border-b-0">
                <p className="text-sm text-white font-medium truncate">{s.targetUrl}</p>
                <p className="text-xs text-gray-400">{s.intervalMinutes} min</p>
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                  s.enabled ? 'text-green-400 bg-green-500/10 border border-green-500/20' : 'text-gray-400 bg-white/5 border border-white/10'
                }`}>
                  {s.enabled ? 'Active' : 'Paused'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(s.id)}
                    disabled={actionId === s.id}
                    className="text-gray-400 hover:text-white transition-colors"
                    title={s.enabled ? 'Pause' : 'Resume'}
                  >
                    {actionId === s.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : s.enabled
                        ? <ToggleRight className="w-4 h-4 text-green-400" />
                        : <ToggleLeft className="w-4 h-4" />
                    }
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={actionId === s.id}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    title="Delete"
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
