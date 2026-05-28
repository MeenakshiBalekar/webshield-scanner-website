import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Database, Code2, ShieldAlert, Globe, Layers, Cpu,
  ArrowRight, CheckCircle2
} from 'lucide-react'

const PRODUCT_ROUTES = {
  'SQL Injection Detection': '/products/sqli',
  'XSS Detection':           '/products/xss',
  'OWASP Top 10':            '/products/owasp',
  'API Security Testing':    '/products/api',
  'Continuous Monitoring':   '/products/web',
  'AI-Powered Analysis':     '/products/web',
}

const features = [
  {
    icon: Database,
    color: 'text-red-500',
    bg: 'bg-red-50',
    title: 'SQL Injection Detection',
    description:
      'Automatically detect blind, error-based, time-based, and union-based SQL injection vulnerabilities across all input vectors including forms, headers, and cookies.',
    points: ['In-band & blind SQLi', 'ORM-level detection', 'Database fingerprinting', 'Automated PoC generation'],
  },
  {
    icon: Code2,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    title: 'XSS Detection',
    description:
      'Identify reflected, stored, and DOM-based cross-site scripting flaws with our context-aware payload engine that bypasses modern WAFs and sanitization filters.',
    points: ['Reflected & stored XSS', 'DOM-based analysis', 'WAF bypass payloads', 'CSP evaluation'],
  },
  {
    icon: ShieldAlert,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    title: 'OWASP Top 10',
    description:
      'Full coverage of the OWASP Top 10 2024 — from injection attacks and broken authentication to security misconfigurations and vulnerable components.',
    points: ['All 10 categories covered', 'CVSS scoring', 'CWE mapping', 'Remediation guidance'],
  },
  {
    icon: Globe,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'API Security Testing',
    description:
      'Test REST, GraphQL, and SOAP APIs for authorization bypasses, data exposure, rate limiting issues, and injection flaws with OpenAPI/Swagger integration.',
    points: ['REST & GraphQL APIs', 'BOLA/BFLA detection', 'OAuth/JWT testing', 'OpenAPI import'],
  },
  {
    icon: Layers,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    title: 'Continuous Monitoring',
    description:
      'Schedule automated scans to run on a daily, weekly, or on-commit basis. Get instant alerts when new vulnerabilities are introduced to your web applications.',
    points: ['CI/CD integration', 'Scheduled scans', 'Slack/email alerts', 'Trend analysis'],
  },
  {
    icon: Cpu,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    title: 'AI-Powered Analysis',
    description:
      'Machine learning models reduce false positives by 90%, correlate related vulnerabilities, and suggest context-aware remediation steps tailored to your stack.',
    points: ['90% fewer false positives', 'Smart deduplication', 'Stack-aware remediation', 'Risk prioritization'],
  },
]

export default function Features() {
  const navigate = useNavigate()

  const handleLearnMore = (title) => {
    const dest = PRODUCT_ROUTES[title] || '/products/web'
    const token = localStorage.getItem('ws_token')
    navigate(token ? dest : `/login?redirect=${encodeURIComponent(dest)}`)
  }

  return (
    <section id="products" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-tag">What We Detect</span>
          <h2 className="section-heading mb-4">
            Comprehensive Vulnerability Coverage
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            WebShield goes beyond surface-level scanning. Our engine tests every attack surface
            your application exposes to the internet — before the bad guys find it.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{f.description}</p>
                <ul className="space-y-1.5 mb-5">
                  {f.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => handleLearnMore(f.title)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-crimson-500 hover:gap-2 transition-all"
                >
                  Learn more <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
