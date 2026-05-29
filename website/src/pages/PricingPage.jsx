import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, CheckCircle2, ChevronDown, ChevronUp, Zap, Building, AlertCircle, Loader2 } from 'lucide-react'
import { initializePaddle } from '@paddle/paddle-js'
import { getPricing } from '../services/api'

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
    <div className={`relative rounded-2xl border-2 bg-white p-8 flex flex-col ${
      highlight ? 'border-crimson-500 shadow-2xl scale-[1.02]' : 'border-gray-200 shadow-sm'
    }`}>
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-crimson-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        {highlight
          ? <div className="w-9 h-9 bg-crimson-500 rounded-xl flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
          : <div className="w-9 h-9 bg-navy-900/10 rounded-xl flex items-center justify-center"><Zap className="w-4 h-4 text-navy-900" /></div>
        }
        <div>
          <h3 className="text-lg font-bold text-navy-900">{name}</h3>
          <p className="text-xs text-gray-400">{desc}</p>
        </div>
      </div>

      <div className="mb-6">
        {isCustom ? (
          <div className="text-3xl font-extrabold text-navy-900">Custom</div>
        ) : (
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-navy-900">
              {isFree ? 'Free' : `$${price}`}
            </span>
            {!isFree && <span className="text-gray-400 mb-1.5 text-sm">/mo</span>}
          </div>
        )}
        {annual && isPro && annualP < monthly && (
          <p className="text-xs text-green-600 font-medium mt-1">
            Billed annually · Save {Math.round((1 - annualP / monthly) * 100)}%
          </p>
        )}
      </div>

      {/* CTA */}
      {isFree ? (
        <Link
          to="/login?redirect=/products/web"
          className="w-full text-center font-semibold py-3 rounded-xl transition-all mb-6 block text-sm border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white"
        >
          Start for Free
        </Link>
      ) : isCustom ? (
        <Link
          to="/company"
          state={{ scrollTo: 'contact' }}
          className="w-full text-center font-semibold py-3 rounded-xl transition-all mb-6 block text-sm border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white"
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
              : 'border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white disabled:opacity-50'
          }`}
        >
          {checkoutLoading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening checkout…</>
            : 'Start Free Trial'}
        </button>
      )}

      <ul className="space-y-2.5 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
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
    <div className="border-b border-gray-200 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="text-sm font-semibold text-navy-900">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <p className="text-sm text-gray-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function PricingPage() {
  const navigate = useNavigate()
  const [paddle, setPaddle]               = useState(null)
  const [annual, setAnnual]               = useState(true)

  useEffect(() => {
    initializePaddle({
      environment: 'sandbox',
      token: 'test_08a537e4556462f374577ae2bae',
    }).then(setPaddle)
  }, [])
  const [plans, setPlans]                 = useState([])
  const [faqs, setFaqs]                   = useState([])
  const [error, setError]                 = useState(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    getPricing()
      .then((d) => {
        setPlans(d?.Plans ?? d?.plans ?? [])
        setFaqs(d?.Faqs  ?? d?.faqs  ?? [])
      })
      .catch((e) => setError(e.message))
  }, [])

  const handleCheckout = async (annual = false) => {
    const token = localStorage.getItem('ws_token')
    if (!token) { navigate('/login'); return }
    setCheckoutLoading(true)
    setError(null)
    const res = await fetch(`${API}/api/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ annual }),
    })
    const data = await res.json()
    if (res.ok) {
      window.location.href = data.url
    } else {
      alert(data.error ?? 'Checkout failed')
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy-900 flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to home</Link>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-navy-900 mb-3">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Start for free and scale as your security needs grow. All plans include a 30-day free trial.
          </p>

          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1 shadow-sm">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!annual ? 'bg-navy-900 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${annual ? 'bg-navy-900 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Annual
              <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-8 max-w-lg mx-auto">
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
                onProClick={() => handleCheckout(annual)}
                checkoutLoading={checkoutLoading}
              />
            ))}
          </div>
        ) : !error ? (
          <div className="flex justify-center py-16">
            <span className="w-8 h-8 border-2 border-gray-300 border-t-navy-900 rounded-full animate-spin" />
          </div>
        ) : null}

        <p className="text-center text-sm text-gray-400 mb-16">
          All plans include a 30-day free trial. No credit card required to start.
        </p>

        {/* FAQ */}
        {faqs.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-navy-900 text-center mb-8">Frequently Asked Questions</h2>
            <div className="bg-white rounded-2xl border border-gray-200 px-6 shadow-sm">
              {faqs.map((f, i) => <FaqRow key={i} item={f} />)}
            </div>
          </div>
        )}

        {/* CTA strip */}
        <div className="mt-16 bg-navy-900 rounded-2xl p-8 text-center">
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
    </div>
  )
}
