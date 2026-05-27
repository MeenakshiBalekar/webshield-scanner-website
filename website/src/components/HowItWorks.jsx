import React from 'react'
import { Globe, ScanLine, BarChart3, FileText, ArrowRight } from 'lucide-react'

const steps = [
  {
    step: '01',
    icon: Globe,
    title: 'Configure Target',
    description:
      'Enter your web application URL or import an OpenAPI/Swagger spec. Set authentication, scan depth, and exclusion rules in seconds.',
    color: 'border-blue-500 bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    step: '02',
    icon: ScanLine,
    title: 'Automated Scanning',
    description:
      'Our crawler maps your entire attack surface, then the vulnerability engine fires thousands of intelligent, context-aware test payloads against every endpoint.',
    color: 'border-crimson-500 bg-red-50',
    iconColor: 'text-crimson-500',
  },
  {
    step: '03',
    icon: BarChart3,
    title: 'AI Analysis',
    description:
      'Machine learning models validate findings, eliminate false positives, correlate related issues, and calculate risk scores based on your environment.',
    color: 'border-purple-500 bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    step: '04',
    icon: FileText,
    title: 'Actionable Report',
    description:
      'Get a detailed report with CVSS scores, reproduction steps, code-level remediation advice, and compliance mapping to PCI-DSS, HIPAA, and ISO 27001.',
    color: 'border-green-500 bg-green-50',
    iconColor: 'text-green-600',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="section-tag">How It Works</span>
          <h2 className="section-heading mb-4">
            From Target URL to Full Report in Minutes
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            No agent to install. No complex configuration. Just point WebShield at your
            application and let the engine do the rest.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-500 via-crimson-500 via-purple-500 to-green-500 hidden lg:block opacity-30" />

          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={s.step} className="relative flex flex-col">
                <div className={`relative z-10 mb-5 w-16 h-16 rounded-2xl border-2 ${s.color} flex items-center justify-center mx-auto lg:mx-0`}>
                  <Icon className={`w-7 h-7 ${s.iconColor}`} />
                  <span className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-navy-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2 text-center lg:text-left">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed text-center lg:text-left">{s.description}</p>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-14 text-center">
          <a
            href="#/scanner"
            className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 shadow-lg text-base"
          >
            Start Your First Scan — It's Free
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-sm text-gray-400 mt-3">No credit card required • 30-day free trial</p>
        </div>
      </div>
    </section>
  )
}
