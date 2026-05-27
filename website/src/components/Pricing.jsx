import React, { useState } from 'react'
import { CheckCircle2, Zap, Building, Shield } from 'lucide-react'

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    price: { monthly: 0, annual: 0 },
    desc: 'Perfect for developers and small projects',
    color: 'border-gray-200',
    highlight: false,
    cta: 'Start for Free',
    ctaStyle: 'btn-outline',
    features: [
      '5 scans per month',
      'Up to 3 target URLs',
      'OWASP Top 10 scanning',
      'Basic HTML report',
      'Email alerts',
      '7-day scan history',
    ],
  },
  {
    name: 'Professional',
    icon: Shield,
    price: { monthly: 149, annual: 119 },
    desc: 'For growing security teams and DevSecOps',
    color: 'border-crimson-500',
    highlight: true,
    badge: 'Most Popular',
    cta: 'Start Free Trial',
    ctaStyle: 'btn-primary',
    features: [
      'Unlimited scans',
      'Up to 25 target URLs',
      'Full vulnerability coverage',
      'API security testing',
      'CI/CD integrations',
      'CVSS-scored PDF reports',
      'Slack & JIRA integration',
      '90-day scan history',
      'Priority email support',
    ],
  },
  {
    name: 'Enterprise',
    icon: Building,
    price: null,
    desc: 'Custom solutions for large organizations',
    color: 'border-gray-200',
    highlight: false,
    cta: 'Contact Sales',
    ctaStyle: 'btn-outline',
    features: [
      'Everything in Professional',
      'Unlimited target URLs',
      'SSO & LDAP / SAML',
      'Custom scan policies',
      'Compliance reporting (PCI, HIPAA)',
      'Dedicated security engineer',
      'SLA-backed 4hr response',
      'On-premise deployment option',
      'Custom integrations',
    ],
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="section-tag">Pricing</span>
          <h2 className="section-heading mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-6">
            Start for free and scale as your security needs grow. All plans include a 30-day free trial.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 bg-white border border-gray-200 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                !annual ? 'bg-navy-900 text-white shadow' : 'text-gray-500'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex items-center gap-1.5 ${
                annual ? 'bg-navy-900 text-white shadow' : 'text-gray-500'
              }`}
            >
              Annual
              <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = plan.price
              ? annual ? plan.price.annual : plan.price.monthly
              : null

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 ${plan.color} bg-white p-8 flex flex-col ${
                  plan.highlight ? 'shadow-2xl scale-[1.02]' : 'shadow-sm'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-crimson-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </div>
                )}

                <div className="mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                    plan.highlight ? 'bg-crimson-500' : 'bg-navy-900/10'
                  }`}>
                    <Icon className={`w-5 h-5 ${plan.highlight ? 'text-white' : 'text-navy-900'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-navy-900">{plan.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
                </div>

                <div className="mb-6">
                  {price !== null ? (
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-navy-900">
                        {price === 0 ? 'Free' : `$${price}`}
                      </span>
                      {price > 0 && <span className="text-gray-400 mb-1.5">/mo</span>}
                    </div>
                  ) : (
                    <div className="text-2xl font-extrabold text-navy-900">Custom</div>
                  )}
                  {annual && price && price > 0 && (
                    <p className="text-xs text-green-600 font-medium mt-1">Billed annually · Save 20%</p>
                  )}
                </div>

                <a
                  href="#contact"
                  className={`w-full text-center font-semibold py-3 rounded-xl transition-all duration-200 mb-7 block ${
                    plan.highlight
                      ? 'bg-crimson-500 hover:bg-crimson-600 text-white shadow-lg shadow-crimson-500/20'
                      : 'border-2 border-navy-900 text-navy-900 hover:bg-navy-900 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </a>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 30-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  )
}
