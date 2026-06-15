import React, { useState, useEffect, useCallback } from 'react'
import {
  ClipboardList, Loader2, AlertCircle, Download, ChevronLeft,
  ChevronRight, Filter, RefreshCw, CheckCircle2, XCircle,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAuditLog, getAuditSummary, exportAuditCsv } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const PAGE_SIZE = 25

function StatusDot({ status }) {
  const ok = (status ?? '').toLowerCase() === 'success' || status === 200 || status === true
  return ok
    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
    : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
}

function ActionChip({ action }) {
  if (!action) return null
  const a = String(action).toLowerCase()
  const cls = a.includes('delete') || a.includes('revoke') ? 'text-red-400 bg-red-500/10 border-red-500/25'
    : a.includes('create') || a.includes('invite') ? 'text-green-400 bg-green-500/10 border-green-500/25'
    : a.includes('login') || a.includes('auth')   ? 'text-blue-400 bg-blue-500/10 border-blue-500/25'
    : a.includes('scan')                           ? 'text-crimson-400 bg-crimson-500/10 border-crimson-500/25'
    :                                                'text-gray-400 bg-gray-500/10 border-gray-500/25'
  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${cls}`}>{action}</span>
  )
}

function SummaryCard({ label, value, sub, color }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
      <p className={`text-2xl font-extrabold ${color}`}>{value ?? '—'}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

export default function AuditLogPage() {
  const [summary, setSummary]   = useState(null)
  const [events, setEvents]     = useState([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [exporting, setExporting] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters]   = useState({ actor: '', action: '', dateFrom: '', dateTo: '', status: '' })
  const setF = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }))

  const loadSummary = () => {
    getAuditSummary().then(setSummary).catch(() => {})
  }

  const loadEvents = useCallback(() => {
    setLoading(true); setError(null)
    const params = { ...filters, page, pageSize: PAGE_SIZE }
    getAuditLog(params)
      .then(data => {
        const list  = Array.isArray(data) ? data : (data?.events ?? data?.items ?? data?.logs ?? [])
        const count = Array.isArray(data) ? data.length : (data?.total ?? data?.Total ?? data?.count ?? list.length)
        setEvents(list)
        setTotal(count)
      })
      .catch(e => setError(e.message || 'Failed to load audit log'))
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => { loadSummary() }, [])
  useEffect(() => { loadEvents() }, [loadEvents])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportAuditCsv()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href = url; a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
      a.click(); URL.revokeObjectURL(url)
    } catch (e) { alert(e.message || 'Export failed') }
    finally { setExporting(false) }
  }

  const handleSearch = () => { setPage(1); loadEvents() }
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const fmtTs = (ts) => ts ? new Date(ts).toLocaleString() : '—'

  const sumTotal   = field(summary, 'totalEvents', 'TotalEvents', 'total', 'Total')
  const sumActors  = field(summary, 'uniqueActors', 'UniqueActors', 'actors', 'Actors')
  const sumFailed  = field(summary, 'failedEvents', 'FailedEvents', 'failed', 'Failed')
  const sumWindow  = field(summary, 'windowDays', 'WindowDays') ?? 30

  const inputCls = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-xs outline-none transition-colors'

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-gray-500/15 border border-gray-500/30 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Audit Log</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Audit Log</h1>
                <p className="text-gray-400">Security-relevant activity across your organization.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 mt-1">
                <button
                  onClick={loadEvents}
                  disabled={loading}
                  className="text-gray-500 hover:text-white transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
                >
                  {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* 30-day summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              <SummaryCard label={`Events (${sumWindow}d)`} value={sumTotal} color="text-white" />
              <SummaryCard label="Unique Actors"  value={sumActors} color="text-blue-400" />
              <SummaryCard label="Failed Events"  value={sumFailed} color={sumFailed > 0 ? 'text-red-400' : 'text-green-400'} />
            </div>
          )}

          {/* Filter panel */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-white">Filters</span>
                {Object.values(filters).some(v => v) && (
                  <span className="text-[10px] font-bold text-crimson-400 bg-crimson-500/10 border border-crimson-500/30 px-1.5 py-0.5 rounded">Active</span>
                )}
              </div>
              {showFilters ? <ChevronLeft className="w-4 h-4 text-gray-400 rotate-90" /> : <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />}
            </button>

            {showFilters && (
              <div className="border-t border-white/10 px-5 py-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Actor (email)</label>
                    <input value={filters.actor} onChange={setF('actor')} placeholder="user@example.com" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Action</label>
                    <input value={filters.action} onChange={setF('action')} placeholder="scan.start" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                    <select value={filters.status} onChange={setF('status')} className={inputCls}>
                      <option value="">All</option>
                      <option value="success">Success</option>
                      <option value="failure">Failure</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">From</label>
                    <input type="date" value={filters.dateFrom} onChange={setF('dateFrom')} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">To</label>
                    <input type="date" value={filters.dateTo} onChange={setF('dateTo')} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSearch}
                    className="bg-crimson-500 hover:bg-crimson-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => { setFilters({ actor: '', action: '', dateFrom: '', dateTo: '', status: '' }); setPage(1) }}
                    className="text-xs text-gray-500 hover:text-white px-4 py-2 rounded-xl transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Table */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-12 px-5 py-3 border-b border-white/10 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <span className="col-span-1 hidden sm:block">OK</span>
              <span className="col-span-3">Timestamp</span>
              <span className="col-span-3">Actor</span>
              <span className="col-span-2">Action</span>
              <span className="col-span-2 hidden lg:block">Resource</span>
              <span className="col-span-1 hidden sm:block text-right">IP</span>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-gray-400 py-10 justify-center text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading events…
              </div>
            )}

            {!loading && events.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-500">
                No audit events match your filters.
              </div>
            )}

            {!loading && events.length > 0 && (
              <div className="divide-y divide-white/5">
                {events.map((ev, i) => {
                  const ts       = field(ev, 'timestamp', 'Timestamp', 'createdAt', 'CreatedAt', 'date', 'Date')
                  const actor    = field(ev, 'actor', 'Actor', 'userEmail', 'UserEmail', 'user', 'User') ?? 'system'
                  const action   = field(ev, 'action', 'Action', 'eventType', 'EventType', 'type', 'Type')
                  const resource = field(ev, 'resource', 'Resource', 'resourceId', 'ResourceId', 'target', 'Target')
                  const ip       = field(ev, 'ipAddress', 'IpAddress', 'ip', 'Ip')
                  const status   = field(ev, 'status', 'Status', 'success', 'Success')
                  return (
                    <div key={i} className="grid grid-cols-12 px-5 py-3 hover:bg-white/3 transition-colors items-center">
                      <div className="col-span-1 hidden sm:flex"><StatusDot status={status} /></div>
                      <div className="col-span-3">
                        <span className="text-[10px] text-gray-400 font-mono">{fmtTs(ts)}</span>
                      </div>
                      <div className="col-span-3 min-w-0">
                        <span className="text-xs text-white truncate block" title={actor}>{actor}</span>
                      </div>
                      <div className="col-span-2">
                        <ActionChip action={action} />
                      </div>
                      <div className="col-span-2 hidden lg:block min-w-0">
                        <span className="text-[10px] text-gray-500 truncate block font-mono" title={resource}>{resource ?? '—'}</span>
                      </div>
                      <div className="col-span-1 hidden sm:block text-right">
                        <span className="text-[10px] text-gray-600 font-mono">{ip ?? ''}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{total} total events</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <span className="text-gray-400">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 disabled:opacity-40 hover:text-white transition-colors"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
