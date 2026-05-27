import React, { useState } from 'react'
import { Building2, Code, ShieldCheck, Briefcase, CheckCircle2, ArrowRight } from 'lucide-react'

const solutions = [
  {
    id: 'enterprise',
    icon: Building2,
    label: 'Enterprise',
    headline: 'Secure Your Entire Web Portfolio at Scale',
    description:
      'WebShield Enterprise gives large organizations centralized visibility, role-based access control, and automated scanning across hundreds of applications. Integrate with your SIEM, ticketing systems, and CI/CD pipelines to embed security into every stage of development.',
    points: [
      'Scan unlimited applications',
      'SSO & LDAP integration',
      'Custom compliance reporting',
      'Dedicated security engineer',
      'SLA-backed support',
    ],
    image: 'enterprise',
  },
  {
    id: 'devsecops',
    icon: Code,
    label: 'DevSecOps',
    headline: 'Shift Security Left in Your SDLC',
    description:
      'Embed WebShield directly into your CI/CD pipeline with native integrations for GitHub Actions, GitLab CI, Jenkins, and Azure DevOps. Break builds on critical findings, track security debt over time, and give developers fix-as-you-code guidance without context switching.',
    points: [
      'GitHub / GitLab / Jenkins plugins',
      'PR-level scan comments',
      'Developer-friendly fix guidance',
      'Security debt tracking',
      'JIRA/ServiceNow integration',
    ],
    image: 'devsecops',
  },
  {
    id: 'compliance',
    icon: ShieldCheck,
    label: 'Compliance',
    headline: 'Achieve and Maintain Regulatory Compliance',
    description:
      'WebShield maps every finding to relevant compliance frameworks, so you can demonstrate due diligence to auditors. Generate PCI-DSS, HIPAA, SOC 2, ISO 27001, and GDPR-ready reports with a single click.',
    points: [
      'PCI-DSS 4.0 readiness',
      'HIPAA security scanning',
      'SOC 2 evidence collection',
      'ISO 27001 mapping',
      'Audit-ready PDF reports',
    ],
    image: 'compliance',
  },
  {
    id: 'pentest',
    icon: Briefcase,
    label: 'Pen Testing',
    headline: 'Supercharge Your Manual Pen Testing Workflow',
    description:
      'Professional penetration testers use WebShield as a force-multiplier — our automated recon and scanning handles the repetitive work so you can focus on complex logical vulnerabilities and chaining exploits that only human expertise can uncover.',
    points: [
      'Export findings to Burp Suite',
      'Raw HTTP request/response',
      'PoC script generation',
      'Custom payload libraries',
      'API for tool integration',
    ],
    image: 'pentest',
  },
]

// Simple diagram-style SVG placeholders for each solution
function SolutionVisual({ type }) {
  const colors = {
    enterprise: { main: '#0D1F3C', accent: '#E31837' },
    devsecops: { main: '#1d4ed8', accent: '#10b981' },
    compliance: { main: '#7c3aed', accent: '#f59e0b' },
    pentest: { main: '#0f766e', accent: '#f97316' },
  }
  const c = colors[type] || colors.enterprise

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: c.main }}>
      <div className="p-8 h-72 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <div className="h-3 w-32 rounded-full opacity-30 bg-white" />
            <div className="h-3 w-24 rounded-full opacity-20 bg-white" />
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: c.accent }}
          >
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[80, 95, 70, 88, 60, 92].map((h, i) => (
            <div key={i} className="space-y-1">
              <div
                className="w-full rounded-lg opacity-60"
                style={{ height: `${h / 4}px`, background: i % 2 === 0 ? c.accent : 'rgba(255,255,255,0.3)' }}
              />
              <div className="h-1.5 w-3/4 rounded-full bg-white opacity-10" />
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ background: c.accent, opacity: 0.8 }} />
          <div className="flex-1 h-2 rounded-full bg-white opacity-20" />
          <div className="w-8 h-2 rounded-full bg-white opacity-10" />
        </div>
      </div>
    </div>
  )
}

export default function Solutions() {
  const [active, setActive] = useState('enterprise')
  const sol = solutions.find((s) => s.id === active)
  const Icon = sol.icon

  return (
    <section id="solutions" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <span className="section-tag">Solutions</span>
          <h2 className="section-heading mb-4">Built for Every Security Team</h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Whether you're an enterprise CISO, a DevOps team lead, or a solo pen tester — WebShield has a solution tailored to your workflow.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {solutions.map((s) => {
            const TabIcon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  active === s.id
                    ? 'bg-navy-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-navy-900 rounded-xl flex items-center justify-center">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{sol.label}</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-navy-900 mb-4">{sol.headline}</h3>
            <p className="text-gray-500 leading-relaxed mb-6">{sol.description}</p>
            <ul className="space-y-2.5 mb-7">
              {sol.points.map((pt) => (
                <li key={pt} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  {pt}
                </li>
              ))}
            </ul>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-navy-900 font-semibold hover:text-crimson-500 transition-colors"
            >
              Explore {sol.label} solution <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div>
            <SolutionVisual type={sol.id} />
          </div>
        </div>
      </div>
    </section>
  )
}
