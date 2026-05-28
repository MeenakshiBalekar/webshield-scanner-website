import React, { useState, useEffect } from 'react'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { getPricing } from '../services/api'

function PlanCard({ plan, annual }) {
  const monthly = plan.MonthlyPrice ?? plan.monthlyPrice ?? plan.price?.monthly ?? 0
  const annualP = plan.AnnualPrice ?? plan.annualPrice ?? plan.price?.annual ?? monthly
  const price   = annual ? annualP : monthly
  const isFree  = price === 0
  const isCustom = plan.IsCustom ?? plan.isCustom ?? plan.price === null
  const highlight = plan.IsMostPopular ?? plan.isMostPopular ?? plan.highlight ?? false
  const features  = plan.Features ?? plan.features ?? []
  const name      = plan.Name ?? plan.name ?? ''
  const desc      = plan.Description ?? plan.description ?? ''
  const cta       = plan.Cta ?? plan.cta ?? (isFree ? 'Start for Free' : highlight ? 'Start Free Trial' : 'Contact Sales')

  return (
    <div className={`relative rounded-2xl border-2 bg-white p-8 flex flex-col ${
      highlight ? 'border-crimson-500 shadow-2xl scale-[1.02]' : 'border-gray-200 shadow-sm'
    }`}>
      {highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-crimson-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-xl font-bold text-navy-900">{name}</h3>
        <p className="text-sm text-gray-500 mt-1">{desc}</p>
      </div>

      <div className="mb-6">
        {isCustom ? (
          <div className="text-2xl font-extrabold text-navy-900">Custom</div>
        ) : (
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-navy-900">
              {isFree ? 'Free' : `$${price}`}
            </span>
            {!isFree && <span className="text-gray-400 mb-1.5">/mo</span>}
          </div>
        )}
        {annual && !isFree && !isCustom && annualP < monthly && (
          <p className="text-xs text-green-600 font-medium mt-1">Billed annually · Save {Math.round((1 - annualP / monthly) * 100)}%</p>
        )}
      </div>

      <a
        href="#contact"
        className={`w-full text-center font-semibold py-3 rounded-xl transition-all duration-200 mb-7 block ${
          highlight
            ? 'bg-crimson-500 hover:bg-crimson-600 text-white shadow-lg shadow-crimson-500/20'
            : 'border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white'
        }`}
      >
        {cta}
      </a>

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

function FaqItem({ item }) {
  const [open, setOpen] = useState(false)
  const q = item.Question ?? item.question ?? ''
  const a = item.Answer ?? item.answer ?? ''
  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-semibold text-navy-900">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && <p className="text-sm text-gray-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function Pricing() {
  const [annual, setAnnual] = useState(true)
  const [plans, setPlans] = useState([])
  const [faqs, setFaqs] = useState([])

  useEffect(() => {
    getPricing()
      .then((d) => {
        if (d?.Plans?.length)  setPlans(d.Plans)
        else if (d?.plans?.length) setPlans(d.plans)
        if (d?.Faqs?.length)   setFaqs(d.Faqs)
        else if (d?.faqs?.length)  setFaqs(d.faqs)
      })
      .catch(() => {}) // keep static fallback
  }, [])

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="section-tag">Pricing</span>
          <h2 className="section-heading mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6">
            Start for free and scale as your security needs grow. All plans include a 30-day free trial.
          </p>

          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!annual ? 'bg-navy-900 text-white shadow' : 'text-gray-500'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${annual ? 'bg-navy-900 text-white shadow' : 'text-gray-500'}`}
            >
              Annual
              <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        {plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <PlanCard key={i} plan={plan} annual={annual} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-10">Loading plans…</p>
        )}

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 30-day free trial. No credit card required to start.
        </p>

        {faqs.length > 0 && (
          <div className="mt-16 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold text-navy-900 text-center mb-6">Frequently Asked Questions</h3>
            <div className="bg-white rounded-2xl border border-gray-200 px-6">
              {faqs.map((f, i) => <FaqItem key={i} item={f} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
