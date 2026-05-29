import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, CreditCard, Calendar, CheckCircle2, AlertCircle,
  Loader2, ExternalLink, RefreshCw, XCircle, Clock, Zap,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getSubscription, getBillingPortalUrl, getInvoices } from '../services/api'

/* ── helpers ── */
const STATUS_CONFIG = {
  active:    { label: 'Active',    color: 'text-green-400 bg-green-500/10 border-green-500/30',   icon: CheckCircle2 },
  trialing:  { label: 'Trial',     color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',      icon: Zap },
  past_due:  { label: 'Past Due',  color: 'text-red-400 bg-red-500/10 border-red-500/30',         icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'text-gray-400 bg-gray-500/10 border-gray-500/30',      icon: XCircle },
  paused:    { label: 'Paused',    color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', icon: Clock },
}

function statusConfig(s) {
  return STATUS_CONFIG[s?.toLowerCase()] ?? STATUS_CONFIG.active
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })
}

function fmtCurrency(amount, currency = 'USD') {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100)
}

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

/* ── Invoice row ── */
function InvoiceRow({ invoice }) {
  const id       = field(invoice, 'id', 'Id', 'invoiceId')
  const date     = field(invoice, 'date', 'Date', 'billedAt', 'createdAt')
  const amount   = field(invoice, 'amount', 'Amount', 'total')
  const currency = field(invoice, 'currency', 'Currency') ?? 'USD'
  const status   = field(invoice, 'status', 'Status') ?? 'paid'
  const url      = field(invoice, 'url', 'Url', 'pdfUrl', 'invoiceUrl')

  const isPaid = status?.toLowerCase() === 'paid'

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium">{fmtDate(date)}</p>
        {id && <p className="text-[10px] text-gray-500 font-mono truncate">{id}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-semibold ${isPaid ? 'text-green-400' : 'text-yellow-400'}`}>
          {isPaid ? 'Paid' : status}
        </span>
        <span className="text-sm font-semibold text-white">{fmtCurrency(amount, currency)}</span>
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function BillingPage() {
  const [sub, setSub]             = useState(null)
  const [invoices, setInvoices]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [portalLoading, setPortal] = useState(false)
  const [portalError, setPortalError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [subData, invData] = await Promise.allSettled([
        getSubscription(),
        getInvoices(),
      ])
      if (subData.status === 'fulfilled') setSub(subData.value)
      if (invData.status === 'fulfilled') {
        const arr = Array.isArray(invData.value)
          ? invData.value
          : invData.value?.invoices ?? invData.value?.Invoices ?? []
        setInvoices(arr)
      }
      if (subData.status === 'rejected') setError(subData.reason?.message || 'Failed to load subscription')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleManage = async () => {
    setPortal(true); setPortalError(null)
    try {
      const data = await getBillingPortalUrl()
      const url  = data?.url ?? data?.Url ?? data?.portalUrl ?? data?.PortalUrl
      if (url) window.open(url, '_blank', 'noopener')
      else setPortalError('Portal URL not returned by server.')
    } catch (err) {
      setPortalError(err.message || 'Failed to open billing portal.')
    }
    setPortal(false)
  }

  /* derived */
  const planName     = field(sub, 'planName', 'PlanName', 'plan', 'Plan', 'productName') ?? 'Free'
  const status       = field(sub, 'status', 'Status') ?? 'active'
  const renewalDate  = field(sub, 'nextBillingDate', 'NextBillingDate', 'renewsAt', 'currentPeriodEnd')
  const cancelAt     = field(sub, 'cancelAt', 'CancelAt', 'cancelledAt', 'endsAt')
  const amount       = field(sub, 'amount', 'Amount', 'price', 'unitPrice')
  const currency     = field(sub, 'currency', 'Currency') ?? 'USD'
  const interval     = field(sub, 'interval', 'Interval', 'billingInterval') ?? ''
  const cfg          = statusConfig(status)
  const StatusIcon   = cfg.icon
  const isFree       = planName?.toLowerCase() === 'free' || !sub

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-crimson-500/15 border border-crimson-500/30 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-crimson-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-crimson-400">Billing</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Subscription & Billing</h1>
            <p className="text-gray-400 text-sm">Manage your plan, payment method, and invoices.</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {loading && (
            <div className="flex items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 text-crimson-400 animate-spin" />
              <span className="text-gray-400 text-sm">Loading subscription…</span>
            </div>
          )}

          {!loading && error && (
            <div className="flex items-start justify-between gap-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={fetchData} className="shrink-0 flex items-center gap-1 text-xs hover:text-white transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && (
            <>
              {/* Current plan */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Current Plan</h2>

                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-crimson-500/15 border border-crimson-500/30 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-crimson-400" />
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{planName}</p>
                        {amount != null && !isFree && (
                          <p className="text-xs text-gray-400">
                            {fmtCurrency(amount, currency)}{interval ? `/${interval}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3">
                      <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
                      {renewalDate && !cancelAt && (
                        <span className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                          <Calendar className="w-3 h-3" />
                          Renews {fmtDate(renewalDate)}
                        </span>
                      )}
                      {cancelAt && (
                        <span className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          Ends {fmtDate(cancelAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Manage button */}
                  {!isFree ? (
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={handleManage}
                        disabled={portalLoading}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                      >
                        {portalLoading
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <ExternalLink className="w-4 h-4" />
                        }
                        {portalLoading ? 'Opening…' : 'Manage Subscription'}
                      </button>
                      {portalError && (
                        <p className="text-xs text-red-400">{portalError}</p>
                      )}
                    </div>
                  ) : (
                    <Link
                      to="/pricing"
                      className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                    >
                      <Zap className="w-4 h-4" /> Upgrade to Pro
                    </Link>
                  )}
                </div>
              </div>

              {/* What's included */}
              {!isFree && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">What's Included</h2>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {[
                      'Unlimited web scans',
                      'Host & cloud security audits',
                      'Code & secrets scanning',
                      'CI/CD gate integration',
                      'Asset fleet management',
                      'Remediation playbooks',
                      'Priority support',
                      'API access',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Invoice history */}
              {invoices.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
                  <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Invoice History</h2>
                  <div>
                    {invoices.map((inv, i) => <InvoiceRow key={i} invoice={inv} />)}
                  </div>
                </div>
              )}

              {/* Upgrade prompt for free users */}
              {isFree && (
                <div className="bg-crimson-500/10 border border-crimson-500/30 rounded-2xl p-6 text-center">
                  <Shield className="w-8 h-8 text-crimson-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2">Unlock the Full Platform</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Upgrade to Pro for unlimited scans, host & cloud audits, code scanning, CI/CD gates, and more.
                  </p>
                  <Link
                    to="/pricing"
                    className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    <Zap className="w-4 h-4" /> View Plans
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
