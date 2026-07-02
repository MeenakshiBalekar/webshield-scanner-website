import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, CheckCircle2, ChevronDown, ChevronUp, Zap, Building, AlertCircle, Loader2 } from 'lucide-react'
import { getPricing, getBillingPlans, createBillingCheckout } from '../services/api'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const API = import.meta.env.VITE_API_URL ?? ''

/* ── Plan card ── */
function PlanCard({ plan, annual, onProClick, checkoutLoading }) {
  const monthly   = plan.MonthlyPrice ?? plan.monthlyPrice ?? plan.price?.monthly ?? 0
  const annualP   = plan.AnnualPrice  ?? plan.annualPrice  ?? plan.price?.annual  ?? monthly
  const price     = annual ? annualP : monthly
  const name      = plan.Name ?? plan.name ?? ''
  const nameLower = name.toLowerCase()
  const desc      = plan.Description ?? plan.description ?? ''
  const features  = plan.Features ?? plan.features ?? []
  const highlight = plan.IsMostPopular ?? plan.isMostPopular ?? plan.highlight ?? false

  // Detect plan type by explicit flag first, then name, then price
  const isCustom  = !!(plan.IsCustom ?? plan.isCustom ?? nameLower.includes('enterprise'))
  const isPro     = !isCustom && (price > 0 || nameLower.includes('pro') || nameLower.includes('team') || nameLower.includes('business') || nameLower.includes('starter'))
  const isFree    = !isCustom && !isPro

  return (
    <div className={`relative rounded-2xl border p-8 flex flex-col ${
      highlight
        ? 'border-crimson-500 bg-crimson-500/5 shadow-2xl shadow-crimson-500/10 scale-[1.02]'
        : 'border-white/10 bg-white/3'
    }`}>
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-crimson-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        {highlight
          ? <div className="w-9 h-9 bg-crimson-500 rounded-xl flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
          : <div className="w-9 h-9 bg-white/8 rounded-xl flex items-center justify-center"><Zap className="w-4 h-4 text-gray-300" /></div>
        }
        <div>
          <h3 className="text-lg font-bold text-white">{name}</h3>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>

      <div className="mb-6">
        {isCustom ? (
          <div className="text-3xl font-extrabold text-white">Custom</div>
        ) : (
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-white">
              {isFree ? 'Free' : `$${price}`}
            </span>
            {!isFree && <span className="text-gray-400 mb-1.5 text-sm">/mo</span>}
          </div>
        )}
        {annual && isPro && annualP < monthly && (
          <p className="text-xs text-green-400 font-medium mt-1">
            Billed annually · Save {Math.round((1 - annualP / monthly) * 100)}%
          </p>
        )}
      </div>

      {/* CTA */}
      {isFree ? (
        <Link
          to="/login?redirect=/products/web"
          className="w-full text-center font-semibold py-3 rounded-xl transition-all mb-6 block text-sm border border-white/25 text-white hover:bg-white/10"
        >
          Start for Free
        </Link>
      ) : isCustom ? (
        <Link
          to="/company"
          state={{ scrollTo: 'contact' }}
          className="w-full text-center font-semibold py-3 rounded-xl transition-all mb-6 block text-sm border border-white/25 text-white hover:bg-white/10"
        >
          Contact Sales
        </Link>
      ) : (
        <button
          onClick={onProClick}
          disabled={checkoutLoading}
          className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-all mb-6 text-sm ${
            highlight
              ? 'bg-crimson-500 hover:bg-crimson-600 text-white shadow-lg shadow-crimson-500/20 disabled:bg-crimson-500/50'
              : 'border border-white/25 text-white hover:bg-white/10 disabled:opacity-50'
          }`}
        >
          Start Free Trial
        </button>
      )}

      <ul className="space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            {f}
          </li>
        ))}
      </ul>
    </div>
  )
}

function FaqRow({ item }) {
  const [open, setOpen] = useState(false)
  const q = item.Question ?? item.question ?? ''
  const a = item.Answer   ?? item.answer   ?? ''
  return (
    <div className="border-b border-white/10 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-sm font-semibold text-white">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <p className="text-sm text-gray-400 pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function PricingPage() {
  const navigate = useNavigate()
  const [annual, setAnnual]               = useState(true)
  const [plans, setPlans]                 = useState([])
  const [faqs, setFaqs]                   = useState([])
  const [error, setError]                 = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    // Try new billing/plans endpoint first; fall back to pricing for FAQs
    Promise.allSettled([getBillingPlans(), getPricing()]).then(([billingRes, pricingRes]) => {
      const billingPlans = billingRes.status === 'fulfilled'
        ? (billingRes.value?.plans ?? billingRes.value?.Plans ?? (Array.isArray(billingRes.value) ? billingRes.value : null))
        : null
      const pricingData = pricingRes.status === 'fulfilled' ? pricingRes.value : null
      const pricingPlans = pricingData?.Plans ?? pricingData?.plans ?? []

      setPlans(billingPlans ?? pricingPlans)
      setFaqs(pricingData?.Faqs ?? pricingData?.faqs ?? [])
    })
  }, [])

  const handleCheckout = async (plan, isAnnual) => {
    const token = localStorage.getItem('ws_token')
    if (!token) { navigate('/login?redirect=/pricing'); return }
    setError(null)
    setCheckoutLoading(true)
    try {
      // Normalize to the planId strings the backend expects
      const raw = (plan?.Name ?? plan?.name ?? '').toLowerCase()
      const planId = raw.includes('enterprise') ? 'enterprise'
                   : raw.includes('free')       ? 'free'
                   : 'pro'

      const data = await createBillingCheckout({ planId, annual: isAnnual })
      const redirectUrl = data?.url ?? data?.Url ?? data?.checkoutUrl ?? data?.CheckoutUrl
      if (redirectUrl) {
        window.location.href = redirectUrl
      }
    } catch (e) {
      const msg = e?.message ?? ''
      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        navigate('/login?redirect=/pricing')
      } else {
        setError('Checkout failed. Please try again.')
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pt-24 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-3">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
            Start for free and scale as your security needs grow. All plans include a 30-day free trial.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => { setAnnual(false); setError(null) }}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!annual ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => { setAnnual(true); setError(null) }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${annual ? 'bg-crimson-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
            >
              Annual
              <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-8 max-w-lg mx-auto">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Plan cards */}
        {plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {plans.map((plan, i) => (
              <PlanCard
                key={i}
                plan={plan}
                annual={annual}
                onProClick={() => handleCheckout(plan, annual)}
                checkoutLoading={checkoutLoading}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : null}

        <p className="text-center text-sm text-gray-500 mb-16">
          All plans include a 30-day free trial. No credit card required to start.
        </p>

        {/* FAQ */}
        {faqs.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
            <div className="bg-white/3 border border-white/10 rounded-2xl px-6">
              {faqs.map((f, i) => <FaqRow key={i} item={f} />)}
            </div>
          </div>
        )}

        {/* CTA strip */}
        <div className="mt-16 bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Need a custom plan?</h3>
          <p className="text-gray-400 mb-5">Our enterprise team will build a solution around your specific requirements.</p>
          <Link
            to="/company"
            state={{ scrollTo: 'contact' }}
            className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            <Building className="w-4 h-4" /> Talk to Sales
          </Link>
        </div>
      </main>
    <Footer />
    </div>
  )
}
