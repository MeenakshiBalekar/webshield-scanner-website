import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Server, Cloud, Bot, FileCode2, GitBranch, Network, ArrowRight, Lock, Shield, Zap, CheckCircle2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'

const SCANNERS = [
  {
    icon: Globe,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Web Vulnerability Scanner',
    description: 'Detect misconfigured security headers, XSS, SQLi, OWASP Top 10 flaws, and exposed endpoints across your web apps.',
    badge: 'Production Ready',
    badgeColor: 'text-green-400 bg-green-500/10 border-green-500/30',
    features: ['Security headers audit', 'OWASP Top 10', 'XSS & SQLi detection', 'Actionable remediation'],
    href: '/products/web',
    requiresAuth: true,
    cta: 'Launch Scanner',
  },
  {
    icon: Network,
    iconColor: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10 border-cyan-500/20',
    title: 'Network / Port Scanner',
    description: 'Scan a host for open ports and exposed services. Each finding shows the risk rating, service name, and exactly what to close or restrict.',
    badge: 'Production Ready',
    badgeColor: 'text-green-400 bg-green-500/10 border-green-500/30',
    features: ['Standard & extended modes', 'Service + banner detection', 'Per-port risk rating', 'Actionable advice cards'],
    href: '/scanner/network',
    requiresAuth: false,
    cta: 'Run Port Scan',
  },
  {
    icon: Server,
    iconColor: 'text-orange-400',
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    title: 'Host Security Scanner',
    description: 'Agentless Linux security audit over SSH. Maps findings to CIS Benchmarks across authentication, network, patching, filesystem, and services.',
    badge: 'Production Ready',
    badgeColor: 'text-green-400 bg-green-500/10 border-green-500/30',
    features: ['18 CIS-mapped checks', 'SSH password or PEM key', 'Per-category breakdown', 'Compliance evidence'],
    href: '/scanner/host',
    requiresAuth: false,
    cta: 'Run Host Scan',
  },
  {
    icon: Cloud,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    title: 'Cloud Security Scanner',
    description: 'AWS CIS Foundations Benchmark audit. Checks IAM, S3, CloudTrail, EC2, and RDS across 13 controls with paginated account-wide coverage.',
    badge: 'Production Ready',
    badgeColor: 'text-green-400 bg-green-500/10 border-green-500/30',
    features: ['13 CIS AWS checks', 'IAM, S3, CloudTrail, EC2, RDS', 'Region whitelist validation', 'Access-denied safe'],
    href: '/scanner/cloud',
    requiresAuth: false,
    cta: 'Run Cloud Scan',
  },
  {
    icon: FileCode2,
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-500/10 border-teal-500/20',
    title: 'Code Security Scanner',
    description: 'Upload source files or paste snippets. Detects hardcoded secrets, API keys, passwords, and known vulnerability patterns — findings shown with redacted values.',
    badge: 'Production Ready',
    badgeColor: 'text-green-400 bg-green-500/10 border-green-500/30',
    features: ['Drag-and-drop file upload', 'Paste code snippets', 'Secrets detection', 'Redacted finding output'],
    href: '/scanner/code',
    requiresAuth: false,
    cta: 'Scan Code',
  },
  {
    icon: GitBranch,
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    title: 'CI/CD Integration',
    description: 'Security gates for GitHub Actions, GitLab CI, CircleCI, Jenkins, and Azure DevOps. Live gate tester, badge previews, and full API reference included.',
    badge: 'Production Ready',
    badgeColor: 'text-green-400 bg-green-500/10 border-green-500/30',
    features: ['5 platform YAML snippets', 'Live gate tester', 'Badge previews', 'API reference'],
    href: '/scanner/cicd',
    requiresAuth: false,
    cta: 'Set Up CI/CD',
  },
  {
    icon: Bot,
    iconColor: 'text-gray-500',
    iconBg: 'bg-gray-500/10 border-gray-500/20',
    title: 'AI Agent Scanner',
    description: 'Autonomous security agent that crawls, tests, and reports — with context-aware attack simulation and natural-language findings.',
    badge: 'Coming Soon',
    badgeColor: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
    features: ['AI-driven attack paths', 'Multi-step exploitation chains', 'NLP findings report', 'Zero config'],
    href: null,
    requiresAuth: false,
    cta: 'Notify Me',
    disabled: true,
  },
]

const STATS = [
  { value: '18',  label: 'Host checks',       icon: Server },
  { value: '13',  label: 'Cloud controls',    icon: Cloud },
  { value: '50+', label: 'Web checks',        icon: Globe },
  { value: '5',   label: 'CI/CD platforms',   icon: GitBranch },
]

export default function ScannerHubPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleLaunch = (scanner) => {
    if (scanner.disabled) return
    if (!scanner.href) return
    if (scanner.requiresAuth && !user) {
      navigate(`/login?redirect=${encodeURIComponent(scanner.href)}`)
      return
    }
    navigate(scanner.href)
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-crimson-500/15 border border-crimson-500/30 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-crimson-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-crimson-400">Scanner Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              All Scanners in One Place
            </h1>
            <p className="text-gray-400 max-w-2xl leading-relaxed">
              Web, host, and cloud security scanning — unified under one platform. Pick the right scanner for
              your target and get actionable findings in minutes.
            </p>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 mt-8">
              {STATS.map((s) => {
                const Icon = s.icon
                return (
                  <div key={s.label} className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-xl px-4 py-2.5">
                    <Icon className="w-4 h-4 text-crimson-400" />
                    <span className="text-lg font-bold text-white">{s.value}</span>
                    <span className="text-xs text-gray-400">{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Scanner cards */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 gap-6">
            {SCANNERS.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.title}
                  className={`relative bg-white/3 border rounded-2xl p-6 flex flex-col transition-all ${
                    s.disabled
                      ? 'border-white/5 opacity-60'
                      : 'border-white/10 hover:border-crimson-500/40 hover:bg-white/5'
                  }`}
                >
                  {/* Icon + badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 ${s.iconBg} border rounded-xl flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${s.iconColor}`} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white mb-2">{s.title}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed mb-5 flex-1">{s.description}</p>

                  {/* Feature list */}
                  <ul className="space-y-1.5 mb-6">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleLaunch(s)}
                    disabled={s.disabled}
                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      s.disabled
                        ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                        : 'bg-crimson-500 hover:bg-crimson-600 text-white'
                    }`}
                  >
                    {s.requiresAuth && !user && !s.disabled && <Lock className="w-3.5 h-3.5" />}
                    {!s.disabled && !(s.requiresAuth && !user) && <Zap className="w-3.5 h-3.5" />}
                    {s.cta}
                    {!s.disabled && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
