import React, { useState } from 'react'
import {
  Building2, Plus, Trash2, Loader2,
  Shield, X, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { assessVendorRisk } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const RISK_BADGE = {
  Critical: 'text-red-400 bg-red-500/10 border border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border border-orange-500/30',
  Medium:   'text-amber-400 bg-amber-500/10 border border-amber-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border border-blue-500/30',
}

function scoreTier(score) {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Medium'
  return 'Low'
}

function RiskBadge({ score, tier }) {
  const t = tier ?? (score != null ? scoreTier(score) : null)
  if (!t) return <span className="text-gray-500 text-xs">—</span>
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${RISK_BADGE[t]}`}>
      {score != null ? `${score} · ` : ''}{t}
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
    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{cat}</span>
  )
}

const DATA_ACCESS_LABELS = {
  none:   { label: 'No data access',   color: 'text-gray-400' },
  read:   { label: 'Read access',      color: 'text-blue-400' },
  write:  { label: 'Read/Write access', color: 'text-amber-400' },
  admin:  { label: 'Admin / full access', color: 'text-red-400' },
}

const CATEGORIES = ['SaaS', 'Cloud', 'Payment', 'Security', 'HR', 'Other']

const DEMO_VENDORS = [
  {
    id: '1', vendorName: 'Stripe', vendorUrl: 'stripe.com', category: 'Payment', dataAccess: 'write',
    riskScore: 12, tier: 'Low', assessedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    recommendations: ['Restrict API key scope to charge-only', 'Enable webhook signature verification'],
  },
  {
    id: '2', vendorName: 'AWS', vendorUrl: 'amazonaws.com', category: 'Cloud', dataAccess: 'admin',
    riskScore: 18, tier: 'Low', assessedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    recommendations: ['Enable CloudTrail in all regions', 'Enable MFA delete on S3 buckets'],
  },
  {
    id: '3', vendorName: 'Salesforce', vendorUrl: 'salesforce.com', category: 'SaaS', dataAccess: 'read',
    riskScore: 55, tier: 'High', assessedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    recommendations: ['Review OAuth scopes', 'Audit field-level permissions for PII fields', 'Enable Shield Platform Encryption'],
  },
  {
    id: '4', vendorName: 'Legacy Vendor', vendorUrl: 'legacyco.com', category: 'Other', dataAccess: 'write',
    riskScore: 82, tier: 'Critical', assessedAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    recommendations: ['Request latest security audit / SOC 2 report', 'Limit data sharing to minimum necessary', 'Add DPA / security addendum to contract', 'Schedule quarterly review'],
  },
]

function relDate(val) {
  if (!val) return 'Never'
  const days = Math.floor((Date.now() - new Date(val)) / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  return `${Math.floor(days / 30)}mo ago`
}

function SummaryCard({ label, value, color = 'text-white' }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
      <span className={`text-2xl font-bold ${color}`}>{value ?? '—'}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  )
}

function VendorCard({ vendor, onDelete }) {
  const [open, setOpen] = useState(false)
  const name        = field(vendor, 'vendorName', 'name', 'Name') ?? 'Unknown'
  const url         = field(vendor, 'vendorUrl', 'domain', 'url') ?? ''
  const category    = field(vendor, 'category', 'Category') ?? 'Other'
  const dataAccess  = field(vendor, 'dataAccess', 'DataAccess', 'data_access') ?? 'none'
  const riskScore   = field(vendor, 'riskScore', 'RiskScore', 'risk_score', 'score')
  const tier        = field(vendor, 'tier', 'Tier', 'riskTier', 'RiskTier') ?? (riskScore != null ? scoreTier(riskScore) : null)
  const assessedAt  = field(vendor, 'assessedAt', 'AssessedAt', 'lastAssessed', 'createdAt')
  const recs        = field(vendor, 'recommendations', 'Recommendations', 'supplyChainRecommendations') ?? []

  const daInfo = DATA_ACCESS_LABELS[dataAccess] ?? DATA_ACCESS_LABELS.none

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-white/3 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center shrink-0">
          <Building2 className="w-4.5 h-4.5 text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-white font-semibold text-sm">{name}</p>
            <CategoryBadge category={category} />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-gray-500 font-mono truncate">{url}</span>
            <span className={`text-[10px] ${daInfo.color}`}>{daInfo.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <RiskBadge score={riskScore} tier={tier} />
          <span className="text-[10px] text-gray-600">{relDate(assessedAt)}</span>
          <button
            onClick={e => { e.stopPropagation(); if (window.confirm(`Remove "${name}"?`)) onDelete(vendor.id) }}
            className="w-7 h-7 flex items-center justify-center bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>

      {open && Array.isArray(recs) && recs.length > 0 && (
        <div className="border-t border-white/8 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-2.5">Supply Chain Recommendations</p>
          <ul className="space-y-1.5">
            {recs.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                {typeof r === 'string' ? r : (r.text ?? r.recommendation ?? JSON.stringify(r))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function AssessForm({ onResult, onCancel }) {
  const [vendorName, setVendorName] = useState('')
  const [vendorUrl,  setVendorUrl]  = useState('')
  const [category,   setCategory]   = useState('SaaS')
  const [dataAccess, setDataAccess] = useState('read')
  const [saving,     setSaving]     = useState(false)

  const INPUT = 'w-full bg-white/5 border border-white/15 focus:border-orange-500/50 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors'
  const SELECT = `${INPUT} appearance-none`

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!vendorName.trim() || !vendorUrl.trim()) return
    setSaving(true)
    const payload = { vendorName: vendorName.trim(), vendorUrl: vendorUrl.trim(), category, dataAccess }
    let result
    try {
      result = await assessVendorRisk(payload)
    } catch {
      // Simulate assessment locally when API unavailable
      result = null
    }
    const vendor = {
      id: Date.now().toString(),
      vendorName: vendorName.trim(),
      vendorUrl:  vendorUrl.trim(),
      category,
      dataAccess,
      assessedAt: new Date().toISOString(),
      riskScore:  result ? (field(result, 'riskScore', 'RiskScore', 'score', 'Score') ?? null) : null,
      tier:       result ? (field(result, 'tier', 'Tier', 'riskTier') ?? null) : null,
      recommendations: result ? (field(result, 'recommendations', 'Recommendations', 'supplyChainRecommendations') ?? []) : [],
    }
    setSaving(false)
    onResult(vendor)
  }

  return (
    <div className="bg-white/3 border border-orange-500/20 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white">Assess a Vendor</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Vendor Name *</label>
            <input required value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. Stripe" className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Vendor URL *</label>
            <input required value={vendorUrl} onChange={e => setVendorUrl(e.target.value)} placeholder="e.g. stripe.com" className={`${INPUT} font-mono`} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} className={SELECT} style={{ colorScheme: 'dark' }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Data Access Level</label>
            <select value={dataAccess} onChange={e => setDataAccess(e.target.value)} className={SELECT} style={{ colorScheme: 'dark' }}>
              <option value="none">None — no data access</option>
              <option value="read">Read — can view data</option>
              <option value="write">Read/Write — can modify data</option>
              <option value="admin">Admin — full access</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button type="submit" disabled={saving || !vendorName.trim() || !vendorUrl.trim()}
            className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
            {saving ? 'Assessing…' : 'Assess Vendor'}
          </button>
          <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-white px-4 py-2 rounded-xl transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default function VendorRiskPage() {
  const [vendors,   setVendors]   = useState(DEMO_VENDORS)
  const [isDemo,    setIsDemo]    = useState(true)
  const [showForm,  setShowForm]  = useState(false)

  const handleResult = (vendor) => {
    setVendors(vs => [vendor, ...vs])
    setIsDemo(false)
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setVendors(vs => vs.filter(v => v.id !== id))
  }

  const criticalCount = vendors.filter(v => (field(v, 'riskScore', 'risk_score', 'score') ?? 0) >= 75).length
  const highCount     = vendors.filter(v => { const s = field(v, 'riskScore', 'risk_score', 'score') ?? 0; return s >= 50 && s < 75 }).length
  const reviewQueue   = vendors.filter(v => {
    const score = field(v, 'riskScore', 'risk_score', 'score') ?? 0
    const t     = field(v, 'tier', 'Tier') ?? scoreTier(score)
    const age   = field(v, 'assessedAt', 'lastAssessed')
    const days  = age ? Math.floor((Date.now() - new Date(age)) / 86400000) : Infinity
    return t === 'Critical' || t === 'High' || days > 90
  })

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
                  {isDemo && <span className="text-[10px] font-semibold text-gray-500 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">Sample Data</span>}
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Vendor Risk</h1>
              <p className="text-gray-400 text-sm">Assess third-party suppliers for security posture, CVE exposure, and supply chain risk.</p>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancel' : 'Assess Vendor'}
            </button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <PageGuide
            id="vendor-risk"
            text="Vendor Risk assesses third-party suppliers for security posture using their public attack surface, CVE exposure, and data-access level. Submit a vendor's name and URL to generate a risk score, tier classification, and specific supply chain recommendations."
          />

          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryCard label="Total Vendors"   value={vendors.length} color="text-orange-400" />
            <SummaryCard label="Critical Risk"   value={criticalCount}  color="text-red-400" />
            <SummaryCard label="High Risk"       value={highCount}      color="text-orange-400" />
            <SummaryCard label="Needs Review"    value={reviewQueue.length} color="text-amber-400" />
          </div>

          {showForm && (
            <AssessForm onResult={handleResult} onCancel={() => setShowForm(false)} />
          )}

          {vendors.length === 0 ? (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-12 text-center">
              <Building2 className="w-12 h-12 text-orange-400/30 mx-auto mb-4" />
              <p className="text-white font-semibold text-lg mb-2">No vendors assessed yet</p>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">Click "Assess Vendor" to evaluate a supplier's security posture and generate supply chain recommendations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map(v => (
                <VendorCard key={v.id} vendor={v} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {reviewQueue.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-sm font-semibold text-amber-300">Review Queue — {reviewQueue.length} vendor{reviewQueue.length !== 1 ? 's' : ''} need attention</p>
              </div>
              <p className="text-xs text-gray-500">Critical/High risk vendors or assessments older than 90 days. Re-assess them to get updated recommendations.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {reviewQueue.map(v => (
                  <span key={v.id} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-full">
                    {field(v, 'vendorName', 'name', 'Name') ?? '?'}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
