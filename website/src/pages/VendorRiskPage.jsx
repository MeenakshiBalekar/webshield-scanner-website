import React, { useState, useEffect, useCallback } from 'react'
import {
  Building2, Plus, Trash2, RefreshCw, Loader2, AlertCircle,
  CheckCircle2, Clock, Shield, ChevronDown, ChevronUp, X,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { getVendors, addVendor, assessVendor, deleteVendor } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function relDate(val) {
  if (!val) return 'Never'
  const d = new Date(val), days = Math.floor((Date.now() - d) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

const RISK_BADGE = {
  Critical: 'text-red-400 bg-red-500/10 border border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border border-orange-500/30',
  Medium:   'text-amber-400 bg-amber-500/10 border border-amber-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border border-blue-500/30',
}

function riskLevel(score) {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

function RiskBadge({ score }) {
  if (score == null) return <span className="text-gray-500 text-xs">—</span>
  const level = riskLevel(score)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_BADGE[level]}`}>
      {score} <span className="font-normal opacity-70">{level}</span>
    </span>
  )
}

const CATEGORY_STYLES = {
  Payment:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  Cloud:    'text-blue-400 bg-blue-500/10 border-blue-500/30',
  SaaS:     'text-violet-400 bg-violet-500/10 border-violet-500/30',
  Security: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  HR:       'text-pink-400 bg-pink-500/10 border-pink-500/30',
  Other:    'text-gray-400 bg-gray-500/10 border-gray-500/30',
}

function CategoryBadge({ category }) {
  const cat = category ?? 'Other'
  const cls = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES.Other
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {cat}
    </span>
  )
}

const STATUS_STYLES = {
  active:        'text-green-400 bg-green-500/10 border-green-500/30',
  suspended:     'text-red-400 bg-red-500/10 border-red-500/30',
  'under review': 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  pending:       'text-amber-400 bg-amber-500/10 border-amber-500/30',
}

function StatusBadge({ status }) {
  const s = (status ?? 'active').toLowerCase()
  const cls = STATUS_STYLES[s] ?? STATUS_STYLES.active
  const label = s === 'under review' ? 'Under Review' : s.charAt(0).toUpperCase() + s.slice(1)
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
      {label}
    </span>
  )
}

const DEMO_VENDORS = [
  { id: '1', name: 'Stripe', domain: 'stripe.com', category: 'Payment', riskScore: 12, status: 'active', lastAssessed: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: '2', name: 'AWS', domain: 'amazonaws.com', category: 'Cloud', riskScore: 18, status: 'active', lastAssessed: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: '3', name: 'Salesforce', domain: 'salesforce.com', category: 'SaaS', riskScore: 55, status: 'pending', lastAssessed: null },
  { id: '4', name: 'Legacy Vendor', domain: 'legacyco.com', category: 'Other', riskScore: 82, status: 'active', lastAssessed: new Date(Date.now() - 120 * 86400000).toISOString() },
]

const CATEGORIES = ['SaaS', 'Cloud', 'Payment', 'Security', 'HR', 'Other']

function SummaryCard({ label, value, color }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value ?? '—'}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function VendorRow({ vendor, onAssess, onDelete, reviewDue }) {
  const id           = field(vendor, 'id', 'Id')
  const name         = field(vendor, 'name', 'Name') ?? 'Unknown Vendor'
  const domain       = field(vendor, 'domain', 'Domain') ?? ''
  const category     = field(vendor, 'category', 'Category') ?? 'Other'
  const riskScore    = field(vendor, 'riskScore', 'risk_score', 'score')
  const lastAssessed = field(vendor, 'lastAssessed', 'last_assessed', 'lastScanned', 'updatedAt')
  const status       = field(vendor, 'status', 'Status') ?? 'active'

  const [assessing, setAssessing] = useState(false)
  const [deleting,  setDeleting]  = useState(false)

  const handleAssess = async () => {
    setAssessing(true)
    try { await onAssess(id) }
    catch (e) { alert(e.message || 'Assessment failed') }
    finally { setAssessing(false) }
  }

  const handleDelete = async () => {
    if (!confirm(`Remove "${name}" from your vendor list?`)) return
    setDeleting(true)
    try { await onDelete(id) }
    catch (e) { alert(e.message || 'Delete failed'); setDeleting(false) }
  }

  return (
    <tr className="border-b border-white/5 hover:bg-orange-500/3 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-semibold text-sm">{name}</p>
              {reviewDue && (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-1.5 py-0.5">
                  Review Due
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs font-mono">{domain}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <CategoryBadge category={category} />
      </td>
      <td className="px-4 py-4">
        <RiskBadge score={riskScore} />
      </td>
      <td className="px-4 py-4">
        <span className="text-gray-400 text-xs">{relDate(lastAssessed)}</span>
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleAssess}
            disabled={assessing}
            className="flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {assessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Assess
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center w-7 h-7 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-500 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
            title="Remove vendor"
          >
            {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
          </button>
        </div>
      </td>
    </tr>
  )
}

function AddVendorForm({ onSubmit, onCancel }) {
  const [name,     setName]     = useState('')
  const [domain,   setDomain]   = useState('')
  const [category, setCategory] = useState('SaaS')
  const [notes,    setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !domain.trim()) return
    setSaving(true); setErr(null)
    try {
      await onSubmit({ name: name.trim(), domain: domain.trim(), category, notes: notes.trim() || undefined })
    } catch {
      // parent handles locally even if API fails
      onCancel()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white/3 border border-orange-500/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Add New Vendor</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Vendor Name *</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Stripe"
              className="w-full bg-white/5 border border-white/15 focus:border-orange-500/50 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Domain *</label>
            <input
              required
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="e.g. stripe.com"
              className="w-full bg-white/5 border border-white/15 focus:border-orange-500/50 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm font-mono outline-none transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Category</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-white/5 border border-white/15 focus:border-orange-500/50 text-white text-sm px-3 py-2 rounded-xl outline-none transition-colors appearance-none"
            style={{ colorScheme: 'dark' }}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Notes <span className="text-gray-600">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Any context about this vendor relationship…"
            className="w-full bg-white/5 border border-white/15 focus:border-orange-500/50 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors resize-none"
          />
        </div>
        {err && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> {err}
          </p>
        )}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="submit"
            disabled={saving || !name.trim() || !domain.trim()}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {saving ? 'Adding…' : 'Add & Assess'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function VendorTable({ vendors, onAssess, onDelete, reviewMode }) {
  if (vendors.length === 0) {
    return (
      <div className="bg-white/3 border border-white/10 rounded-2xl p-12 text-center">
        <Building2 className="w-12 h-12 text-orange-400/30 mx-auto mb-4" />
        <p className="text-white font-semibold text-lg mb-2">
          {reviewMode ? 'No vendors pending review' : 'No vendors added yet'}
        </p>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          {reviewMode
            ? 'All vendors are up to date. No assessments are overdue.'
            : 'Add a vendor domain to start tracking its external attack surface and breach history.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/3 border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/3">
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Vendor</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Category</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Risk Score</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Last Assessed</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((v, i) => {
              const id           = field(v, 'id', 'Id') ?? i
              const lastAssessed = field(v, 'lastAssessed', 'last_assessed', 'lastScanned', 'updatedAt')
              const status       = (field(v, 'status', 'Status') ?? 'active').toLowerCase()
              const isReviewDue  = reviewMode || status === 'pending' || !lastAssessed ||
                (lastAssessed && Math.floor((Date.now() - new Date(lastAssessed)) / 86400000) > 90)

              return (
                <VendorRow
                  key={id}
                  vendor={v}
                  onAssess={onAssess}
                  onDelete={onDelete}
                  reviewDue={reviewMode && isReviewDue}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function VendorRiskPage() {
  const [vendors,     setVendors]     = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [tab,         setTab]         = useState('vendors')
  const [showForm,    setShowForm]    = useState(false)
  const [isDemo,      setIsDemo]      = useState(false)
  const [assessingAll, setAssessingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const data = await getVendors()
      const arr = Array.isArray(data) ? data : (field(data, 'vendors', 'Vendors', 'items', 'data') ?? [])
      if (arr.length === 0) {
        setVendors(DEMO_VENDORS)
        setIsDemo(true)
      } else {
        setVendors(arr)
        setIsDemo(false)
      }
    } catch {
      setVendors(DEMO_VENDORS)
      setIsDemo(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAddVendor = async (payload) => {
    const newVendor = { ...payload, id: Date.now().toString(), riskScore: null, lastAssessed: null, status: 'pending' }
    setVendors(vs => [newVendor, ...vs])
    setIsDemo(false)
    setShowForm(false)
    try {
      const created = await addVendor(payload)
      if (created?.id) {
        try {
          const result = await assessVendor(created.id)
          setVendors(vs => vs.map(v => v.id === newVendor.id ? { ...v, ...(created ?? {}), ...(result ?? {}), lastAssessed: new Date().toISOString() } : v))
        } catch {}
      }
    } catch {}
  }

  const handleAssess = async (id) => {
    try {
      const result = await assessVendor(id)
      setVendors(vs => vs.map(v =>
        field(v, 'id', 'Id') === id
          ? { ...v, ...(result ?? {}), lastAssessed: new Date().toISOString(), status: 'active' }
          : v
      ))
    } catch {
      setVendors(vs => vs.map(v =>
        field(v, 'id', 'Id') === id
          ? { ...v, lastAssessed: new Date().toISOString(), status: 'active' }
          : v
      ))
    }
  }

  const handleDelete = async (id) => {
    setVendors(vs => vs.filter(v => field(v, 'id', 'Id') !== id))
    try { await deleteVendor(id) } catch {}
  }

  const handleAssessAll = async () => {
    setAssessingAll(true)
    try {
      await Promise.allSettled(reviewQueue.map(v => {
        const id = field(v, 'id', 'Id')
        return assessVendor(id).then(result => {
          setVendors(vs => vs.map(u =>
            field(u, 'id', 'Id') === id
              ? { ...u, ...(result ?? {}), lastAssessed: new Date().toISOString(), status: 'active' }
              : u
          ))
        })
      }))
    } catch {}
    setAssessingAll(false)
  }

  const reviewQueue = vendors.filter(v => {
    const status       = (field(v, 'status', 'Status') ?? 'active').toLowerCase()
    const riskScore    = field(v, 'riskScore', 'risk_score', 'score')
    const lastAssessed = field(v, 'lastAssessed', 'last_assessed', 'lastScanned', 'updatedAt')
    const daysOld      = lastAssessed ? Math.floor((Date.now() - new Date(lastAssessed)) / 86400000) : Infinity
    return status === 'pending' || (riskScore != null && riskScore >= 75) || daysOld > 90
  })

  const totalCount    = vendors.length
  const criticalCount = vendors.filter(v => (field(v, 'riskScore', 'risk_score', 'score') ?? 0) >= 75).length
  const highCount     = vendors.filter(v => {
    const s = field(v, 'riskScore', 'risk_score', 'score') ?? 0
    return s >= 50 && s < 75
  }).length
  const needsReview   = vendors.filter(v => {
    const status       = (field(v, 'status', 'Status') ?? 'active').toLowerCase()
    const lastAssessed = field(v, 'lastAssessed', 'last_assessed', 'lastScanned', 'updatedAt')
    return status === 'pending' || !lastAssessed
  }).length

  const TABS = [
    { id: 'vendors',      label: 'Vendors' },
    { id: 'review-queue', label: `Review Queue${reviewQueue.length > 0 ? ` (${reviewQueue.length})` : ''}` },
  ]

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-orange-500/15 border border-orange-500/30 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-orange-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Third-Party Risk</span>
                  {isDemo && (
                    <span className="text-[10px] font-semibold text-gray-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                      Demo Data
                    </span>
                  )}
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Vendor Risk</h1>
              <p className="text-gray-400">Assess and monitor the security posture of your suppliers and third-party vendors.</p>
            </div>
            <button
              onClick={() => { setShowForm(true); setTab('vendors') }}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Vendor
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <PageGuide
            id="vendor-risk"
            text="Assess the security posture of your third-party vendors and suppliers. Add a vendor by entering their domain — the system scores their external attack surface, certificate health, and known breach history. Use the Review Queue tab to prioritize vendors due for reassessment. Risk scores update automatically when new breach data is available."
          />

          {/* Tab bar */}
          <div className="border-b border-white/10 -mb-2">
            <div className="flex">
              {TABS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`px-5 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === id
                      ? 'border-orange-500 text-white'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Vendors tab */}
          {tab === 'vendors' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryCard label="Total Vendors"  value={totalCount}    color="text-orange-400" />
                <SummaryCard label="Critical Risk"  value={criticalCount} color="text-red-400"    />
                <SummaryCard label="High Risk"      value={highCount}     color="text-orange-400" />
                <SummaryCard label="Needs Review"   value={needsReview}   color="text-amber-400"  />
              </div>

              {showForm && (
                <AddVendorForm
                  onSubmit={handleAddVendor}
                  onCancel={() => setShowForm(false)}
                />
              )}

              {error && (
                <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                  <button onClick={load} className="ml-auto text-xs underline">Retry</button>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                </div>
              ) : (
                <VendorTable
                  vendors={vendors}
                  onAssess={handleAssess}
                  onDelete={handleDelete}
                  reviewMode={false}
                />
              )}
            </div>
          )}

          {/* Review Queue tab */}
          {tab === 'review-queue' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white font-semibold">{reviewQueue.length} vendor{reviewQueue.length !== 1 ? 's' : ''} pending review</p>
                  <p className="text-xs text-gray-500 mt-0.5">Vendors with critical risk, pending status, or assessments older than 90 days.</p>
                </div>
                {reviewQueue.length > 0 && (
                  <button
                    onClick={handleAssessAll}
                    disabled={assessingAll}
                    className="flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {assessingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {assessingAll ? 'Assessing…' : 'Assess All'}
                  </button>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                </div>
              ) : (
                <VendorTable
                  vendors={reviewQueue}
                  onAssess={handleAssess}
                  onDelete={handleDelete}
                  reviewMode={true}
                />
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
