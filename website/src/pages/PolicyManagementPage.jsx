import React, { useState, useEffect } from 'react'
import {
  Shield, Plus, Loader2, ChevronDown, ChevronUp,
  Trash2, Edit3, Check, X, Clock, CheckCircle2, XCircle,
  FileWarning, ClipboardList, ToggleLeft, ToggleRight, AlertCircle} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import {
  getPolicies, createPolicy, updatePolicy, patchPolicy, deletePolicy,
  getExceptions, createException, approveException, rejectException,
} from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEVERITY_LEVELS = ['Critical', 'High', 'Medium', 'Low']
const SEV_STYLES = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
}
const EX_STATUS_STYLES = {
  pending:  'text-amber-400 bg-amber-500/10 border-amber-500/30',
  approved: 'text-green-400 bg-green-500/10 border-green-500/30',
  rejected: 'text-red-400 bg-red-500/10 border-red-500/30',
}

/* ── Policy form modal ── */
function PolicyForm({ policy, onSave, onCancel }) {
  const [name, setName]           = useState(field(policy, 'name', 'Name') ?? '')
  const [desc, setDesc]           = useState(field(policy, 'description', 'Description') ?? '')
  const [blockOn, setBlockOn]     = useState(
    field(policy, 'severityThresholds', 'SeverityThresholds')?.blockOn ??
    field(policy, 'blockOn', 'BlockOn') ?? 'High'
  )
  const [warnOn, setWarnOn]       = useState(
    field(policy, 'severityThresholds', 'SeverityThresholds')?.warnOn ??
    field(policy, 'warnOn', 'WarnOn') ?? 'Medium'
  )
  const [checks, setChecks]       = useState(field(policy, 'checks', 'Checks') ?? [])
  const [checkInput, setCheckInput] = useState('')
  const [saving, setSaving]       = useState(false)
  const [err, setErr]             = useState(null)

  const addCheck = () => {
    const v = checkInput.trim()
    if (v && !checks.includes(v)) setChecks(c => [...c, v])
    setCheckInput('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true); setErr(null)
    try {
      await onSave({ name, description: desc, checks, severityThresholds: { blockOn, warnOn } })
    } catch (e) { setErr('Save failed — please try again') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-[#0d1117] border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-[#0d1117]">
          <h3 className="text-sm font-bold text-white">
            {policy ? 'Edit Policy' : 'Create Policy'}
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Policy Name *</label>
            <input
              required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Production Web App Policy"
              className="w-full bg-white/5 border border-white/15 focus:border-indigo-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Description</label>
            <textarea
              value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              placeholder="What does this policy enforce?"
              className="w-full bg-white/5 border border-white/15 focus:border-indigo-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Block on severity ≥</label>
              <select
                value={blockOn} onChange={e => setBlockOn(e.target.value)}
                className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 rounded-xl outline-none"
              >
                {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Warn on severity ≥</label>
              <select
                value={warnOn} onChange={e => setWarnOn(e.target.value)}
                className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 rounded-xl outline-none"
              >
                {SEVERITY_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Required Checks</label>
            <div className="flex gap-2 mb-2">
              <input
                value={checkInput} onChange={e => setCheckInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCheck())}
                placeholder="e.g. Content-Security-Policy"
                className="flex-1 bg-white/5 border border-white/15 focus:border-indigo-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
              />
              <button
                type="button" onClick={addCheck}
                className="px-3 py-2 text-sm bg-white/10 hover:bg-white/15 text-gray-300 rounded-xl transition-colors"
              >
                Add
              </button>
            </div>
            {checks.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {checks.map(c => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5"
                  >
                    {c}
                    <button
                      type="button" onClick={() => setChecks(cs => cs.filter(x => x !== c))}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="submit" disabled={saving || !name.trim()}
              className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save Policy'}
            </button>
            <button
              type="button" onClick={onCancel}
              className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-xl transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ── Policy card ── */
function PolicyCard({ policy, onEdit, onDelete, onToggle }) {
  const [deleting, setDeleting]   = useState(false)
  const [toggling, setToggling]   = useState(false)
  const [expanded, setExpanded]   = useState(false)

  const id         = field(policy, 'id', 'Id')
  const name       = field(policy, 'name', 'Name') ?? 'Unnamed Policy'
  const desc       = field(policy, 'description', 'Description')
  const checks     = field(policy, 'checks', 'Checks') ?? []
  const thresholds = field(policy, 'severityThresholds', 'SeverityThresholds') ?? {}
  const blockOn    = thresholds.blockOn ?? thresholds.BlockOn ?? field(policy, 'blockOn', 'BlockOn') ?? 'High'
  const warnOn     = thresholds.warnOn  ?? thresholds.WarnOn  ?? field(policy, 'warnOn',  'WarnOn')  ?? 'Medium'
  const active     = field(policy, 'active', 'Active', 'enabled', 'Enabled') ?? true
  const created    = field(policy, 'createdAt', 'CreatedAt', 'created', 'Created')

  const handleDelete = async () => {
    if (!confirm(`Delete policy "${name}"?`)) return
    setDeleting(true)
    try { await onDelete(id) }
    catch (e) { alert('Delete failed'); setDeleting(false) }
  }

  const handleToggle = async () => {
    setToggling(true)
    try { await onToggle(id, !active) }
    catch (e) { alert('Toggle failed') }
    finally { setToggling(false) }
  }

  return (
    <div className={`bg-white/3 border rounded-2xl overflow-hidden transition-colors ${active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
      <div className="px-5 py-4 flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        <div className="w-9 h-9 bg-indigo-500/15 border border-indigo-500/30 rounded-xl flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="text-sm font-bold text-white">{name}</span>
            {!active && (
              <span className="text-[10px] font-semibold text-gray-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">Disabled</span>
            )}
          </div>
          {desc && !expanded && <p className="text-xs text-gray-500 truncate">{desc}</p>}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEV_STYLES[blockOn] || SEV_STYLES.High}`}>
              Block ≥ {blockOn}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${SEV_STYLES[warnOn] || SEV_STYLES.Medium}`}>
              Warn ≥ {warnOn}
            </span>
            {checks.length > 0 && (
              <span className="text-[10px] text-gray-500">{checks.length} check{checks.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={handleToggle} disabled={toggling}
            title={active ? 'Disable policy' : 'Enable policy'}
            className={`transition-colors ${active ? 'text-indigo-400 hover:text-indigo-300' : 'text-gray-600 hover:text-gray-400'}`}
          >
            {toggling
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : (active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />)
            }
          </button>
          <button onClick={() => onEdit(policy)} className="text-gray-500 hover:text-white transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleDelete} disabled={deleting} className="text-gray-600 hover:text-red-400 transition-colors">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/10 px-5 py-4 space-y-3">
          {desc && <p className="text-sm text-gray-400">{desc}</p>}
          {checks.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">Required Checks</p>
              <div className="flex flex-wrap gap-1.5">
                {checks.map(c => (
                  <span key={c} className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 rounded-full px-2 py-0.5">{c}</span>
                ))}
              </div>
            </div>
          )}
          {created && (
            <p className="text-[10px] text-gray-600">Created {new Date(created).toLocaleDateString()}</p>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Exception request form ── */
function ExceptionForm({ policies, onSubmit }) {
  const [policyId, setPolicyId]     = useState('')
  const [checkName, setCheckName]   = useState('')
  const [reason, setReason]         = useState('')
  const [expiresAt, setExpiresAt]   = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [err, setErr]               = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!policyId || !checkName.trim() || !reason.trim()) return
    setSubmitting(true); setErr(null)
    try {
      await onSubmit({ policyId, checkName, reason, expiresAt: expiresAt || null })
      setSuccess(true)
      setPolicyId(''); setCheckName(''); setReason(''); setExpiresAt('')
      setTimeout(() => setSuccess(false), 4000)
    } catch (e) { setErr('Save failed — please try again') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
          <FileWarning className="w-4 h-4 text-amber-400" /> Request Exception
        </h3>
        <p className="text-xs text-gray-500">Submit a request to exempt a specific check from a policy. Requests are routed to an admin for approval.</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Policy *</label>
          <select
            required value={policyId} onChange={e => setPolicyId(e.target.value)}
            className="w-full bg-white/5 border border-white/15 focus:border-amber-500 text-white text-sm px-3 py-2 rounded-xl outline-none transition-colors"
          >
            <option value="">Select a policy…</option>
            {policies.map(p => (
              <option key={field(p,'id','Id')} value={field(p,'id','Id')}>
                {field(p,'name','Name')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Check / Control Name *</label>
          <input
            required value={checkName} onChange={e => setCheckName(e.target.value)}
            placeholder="e.g. Content-Security-Policy"
            className="w-full bg-white/5 border border-white/15 focus:border-amber-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Reason *</label>
          <textarea
            required value={reason} onChange={e => setReason(e.target.value)} rows={3}
            placeholder="Explain why this exception is needed and what compensating controls are in place…"
            className="w-full bg-white/5 border border-white/15 focus:border-amber-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors resize-none"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Expires On <span className="text-gray-600">(optional)</span></label>
          <input
            type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="bg-white/5 border border-white/15 focus:border-amber-500 text-white px-3 py-2 rounded-xl text-sm outline-none transition-colors"
          />
        </div>
        {err && <p className="text-xs text-red-400">{err}</p>}
        {success && (
          <p className="text-xs text-green-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Exception request submitted successfully.
          </p>
        )}
        <button
          type="submit" disabled={submitting || !policyId || !checkName.trim() || !reason.trim()}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileWarning className="w-3.5 h-3.5" />}
          {submitting ? 'Submitting…' : 'Submit Request'}
        </button>
      </form>
    </div>
  )
}

/* ── Exception row ── */
function ExceptionRow({ ex, onApprove, onReject, isAdmin }) {
  const [actioning, setActioning] = useState(null)

  const id         = field(ex, 'id', 'Id')
  const check      = field(ex, 'checkName', 'CheckName', 'check', 'Check')
  const reason     = field(ex, 'reason', 'Reason')
  const status     = (field(ex, 'status', 'Status') ?? 'pending').toLowerCase()
  const expiresAt  = field(ex, 'expiresAt', 'ExpiresAt')
  const reqBy      = field(ex, 'requestedBy', 'RequestedBy')
  const revBy      = field(ex, 'reviewedBy', 'ReviewedBy')
  const policyName = field(ex, 'policyName', 'PolicyName')
  const createdAt  = field(ex, 'createdAt', 'CreatedAt')

  const statusCls = EX_STATUS_STYLES[status] ?? EX_STATUS_STYLES.pending
  const StatusIcon = status === 'approved' ? CheckCircle2 : status === 'rejected' ? XCircle : Clock

  const action = async (type) => {
    setActioning(type)
    try {
      if (type === 'approve') await onApprove(id)
      else await onReject(id)
    } catch (e) { alert('Action failed') }
    finally { setActioning(null) }
  }

  return (
    <div className="flex items-start gap-4 py-3.5 border-b border-white/5 last:border-0">
      <StatusIcon className={`w-4 h-4 mt-0.5 shrink-0 ${statusCls.split(' ')[0]}`} />
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-white font-mono">{check}</span>
          {policyName && <span className="text-[10px] text-gray-500">in {policyName}</span>}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border capitalize ${statusCls}`}>{status}</span>
        </div>
        {reason && <p className="text-xs text-gray-500">{reason}</p>}
        <div className="flex flex-wrap gap-3 text-[10px] text-gray-600 mt-1">
          {reqBy && <span>Requested by {field(reqBy,'name','Name') || field(reqBy,'email','Email')}</span>}
          {createdAt && <span>{new Date(createdAt).toLocaleDateString()}</span>}
          {expiresAt && <span>Expires {new Date(expiresAt).toLocaleDateString()}</span>}
          {revBy && <span>Reviewed by {field(revBy,'name','Name')}</span>}
        </div>
      </div>
      {isAdmin && status === 'pending' && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => action('approve')} disabled={!!actioning}
            className="flex items-center gap-1 text-[10px] font-semibold text-green-400 hover:text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
          >
            {actioning === 'approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            Approve
          </button>
          <button
            onClick={() => action('reject')} disabled={!!actioning}
            className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-2.5 py-1 transition-colors disabled:opacity-50"
          >
            {actioning === 'reject' ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            Reject
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function PolicyManagementPage() {
  const [tab, setTab]               = useState('policies')
  const [policies, setPolicies]     = useState([])
  const [exceptions, setExceptions] = useState([])
  const [loadingP, setLoadingP]     = useState(true)
  const [loadingE, setLoadingE]     = useState(false)
  const [errorP, setErrorP]         = useState(null)
  const [errorE, setErrorE]         = useState(null)
  const [showForm, setShowForm]     = useState(false)
  const [editPolicy, setEditPolicy] = useState(null)
  const [exFilter, setExFilter]     = useState('all')
  const isAdmin = true

  const loadPolicies = async () => {
    setLoadingP(true); setErrorP(null)
    try {
      const data = await getPolicies()
      setPolicies(Array.isArray(data) ? data : (data?.policies ?? data?.items ?? []))
    } catch { /* backend unavailable — show empty state */ }
    finally { setLoadingP(false) }
  }

  const loadExceptions = async () => {
    setLoadingE(true); setErrorE(null)
    try {
      const data = await getExceptions()
      setExceptions(Array.isArray(data) ? data : (data?.exceptions ?? data?.items ?? []))
    } catch { /* backend unavailable — show empty state */ }
    finally { setLoadingE(false) }
  }

  useEffect(() => { loadPolicies() }, [])
  useEffect(() => {
    if (tab === 'exceptions' || tab === 'approvals') loadExceptions()
  }, [tab])

  const handleSave = async (data) => {
    if (editPolicy) {
      const id = field(editPolicy, 'id', 'Id')
      const updated = await updatePolicy(id, data)
      setPolicies(ps => ps.map(p => field(p,'id','Id') === id ? (updated ?? { ...p, ...data }) : p))
    } else {
      const created = await createPolicy(data)
      setPolicies(ps => [created, ...ps])
    }
    setShowForm(false); setEditPolicy(null)
  }

  const handleDelete = async (id) => {
    await deletePolicy(id)
    setPolicies(ps => ps.filter(p => field(p,'id','Id') !== id))
  }

  const handleToggle = async (id, active) => {
    const updated = await patchPolicy(id, { active })
    setPolicies(ps => ps.map(p =>
      field(p,'id','Id') === id ? { ...p, active, Active: active, ...(updated ?? {}) } : p
    ))
  }

  const handleExceptionSubmit = async (data) => {
    const created = await createException(data)
    setExceptions(es => [created, ...es])
  }

  const handleApprove = async (id) => {
    await approveException(id)
    setExceptions(es => es.map(e =>
      field(e,'id','Id') === id ? { ...e, status: 'approved', Status: 'approved' } : e
    ))
  }

  const handleReject = async (id) => {
    await rejectException(id)
    setExceptions(es => es.map(e =>
      field(e,'id','Id') === id ? { ...e, status: 'rejected', Status: 'rejected' } : e
    ))
  }

  const filteredExceptions = exceptions.filter(e =>
    exFilter === 'all' || (field(e,'status','Status') ?? 'pending').toLowerCase() === exFilter
  )

  const pendingCount = exceptions.filter(e =>
    (field(e,'status','Status') ?? 'pending').toLowerCase() === 'pending'
  ).length

  const TABS = [
    { id: 'policies',   label: 'Policies',   icon: Shield },
    { id: 'exceptions', label: 'Exceptions', icon: FileWarning },
    { id: 'approvals',  label: `Approvals${pendingCount > 0 ? ` (${pendingCount})` : ''}`, icon: ClipboardList },
  ]

  const EX_FILTERS = ['all', 'pending', 'approved', 'rejected']

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-500/15 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Policy Management</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Scan Policies</h1>
                <p className="text-gray-400">Define security baselines, manage compliance exceptions, and review approval requests.</p>
                <PageGuide id="policy-management" text="Define reusable security baselines for your scans — which checks to run, minimum severity thresholds, and which findings to auto-ignore. The Exceptions tab lets you request risk acceptances for findings you've decided to live with. The Approvals tab shows pending exception requests for security leads to review and approve or reject." />
              </div>
              {tab === 'policies' && (
                <button
                  onClick={() => { setEditPolicy(null); setShowForm(true) }}
                  className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 mt-1"
                >
                  <Plus className="w-4 h-4" /> New Policy
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="border-b border-white/10 px-4">
          <div className="max-w-4xl mx-auto flex">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                  tab === id
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">

          {/* Policies tab */}
          {tab === 'policies' && (
            <div className="space-y-4">
              {loadingP && (
                <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
                  <Loader2 className="w-5 h-5 animate-spin" /> Loading policies…
                </div>
              )}
              {!loadingP && policies.length === 0 && (
                <div className="text-center py-16 bg-white/3 border border-white/10 rounded-2xl">
                  <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-white font-semibold">No policies yet</p>
                  <p className="text-sm text-gray-500 mt-1">Create a policy to enforce security baselines across scans.</p>
                </div>
              )}
              {!loadingP && policies.map((p, i) => (
                <PolicyCard
                  key={field(p,'id','Id') ?? i}
                  policy={p}
                  onEdit={(pol) => { setEditPolicy(pol); setShowForm(true) }}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          )}

          {/* Exceptions tab */}
          {tab === 'exceptions' && (
            <div className="space-y-6">
              <ExceptionForm policies={policies} onSubmit={handleExceptionSubmit} />

              {loadingE && (
                <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading exceptions…
                </div>
              )}
              {!loadingE && exceptions.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-1">My Exception Requests</p>
                    <div className="flex gap-1">
                      {EX_FILTERS.map(f => (
                        <button
                          key={f} onClick={() => setExFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors capitalize ${
                            exFilter === f
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 divide-y divide-white/5">
                    {filteredExceptions.length === 0
                      ? <p className="text-xs text-gray-600 py-6 text-center">No {exFilter} exceptions.</p>
                      : filteredExceptions.map((ex, i) => (
                          <ExceptionRow
                            key={field(ex,'id','Id') ?? i}
                            ex={ex}
                            isAdmin={false}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Approvals tab */}
          {tab === 'approvals' && (
            <div>
              {loadingE && (
                <div className="flex items-center gap-2 text-gray-400 py-8 justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading requests…
                </div>
              )}
              {errorE && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorE}
                  <button onClick={loadExceptions} className="ml-auto text-xs hover:text-white transition-colors">Retry</button>
                </div>
              )}
              {!loadingE && !errorE && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex-1">Approval Queue</p>
                    <div className="flex gap-1">
                      {EX_FILTERS.map(f => (
                        <button
                          key={f} onClick={() => setExFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors capitalize ${
                            exFilter === f
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                              : 'text-gray-500 hover:text-gray-300'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 divide-y divide-white/5">
                    {filteredExceptions.length === 0
                      ? <p className="text-xs text-gray-600 py-6 text-center">No {exFilter} requests.</p>
                      : filteredExceptions.map((ex, i) => (
                          <ExceptionRow
                            key={field(ex,'id','Id') ?? i}
                            ex={ex}
                            isAdmin={isAdmin}
                            onApprove={handleApprove}
                            onReject={handleReject}
                          />
                        ))
                    }
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {showForm && (
        <PolicyForm
          policy={editPolicy}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditPolicy(null) }}
        />
      )}
    </div>
  )
}
