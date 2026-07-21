import React, { useState, useEffect, useRef } from 'react'
import { Menu, X, ChevronDown, ScanLine, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PRODUCTS_NAV = {
  label: 'Scanners',
  dropdown: [
    { label: 'Web Scanner',       href: '/products/web' },
    { label: 'API Scanner',       href: '/scanner/api' },
    { label: 'Network Scanner',   href: '/scanner/network' },
    { label: 'Host Scanner',      href: '/scanner/host' },
    { label: 'Cloud Scanner',     href: '/scanner/cloud' },
    { label: 'Code Scanner',      href: '/scanner/code' },
    { label: 'Email Security',    href: '/scanner/email-security' },
    { label: 'Container & IaC',   href: '/scanner/container-iac' },
    { label: 'All Scanners',      href: '/scanner' },
  ],
}

const SCANNERS_NAV = {
  label: 'Scanners',
  dropdown: [
    // Web & App
    { label: 'Web Scanner',        href: '/products/web' },
    { label: 'Authenticated Scan', href: '/products/web' },
    { label: 'API Scanner',        href: '/scanner/api' },
    { label: 'API Security',       href: '/scanner/api-security' },
    { label: 'Email Security',     href: '/scanner/email-security' },
    { label: 'Crawl Scanner',      href: '/crawl-scan' },
    { label: 'Subdomain Scanner',  href: '/subdomain-scan' },
    { label: 'DNS Scanner',        href: '/dns-scan' },
    // Infrastructure
    { label: 'Network Scanner',    href: '/scanner/network' },
    { label: 'Host Scanner',       href: '/scanner/host' },
    { label: 'Cloud Scanner',      href: '/scanner/cloud' },
    { label: 'VMDR',               href: '/scanner/vmdr' },
    { label: 'EASM Scan',          href: '/easm' },
    // Code & IaC
    { label: 'Code Scanner',       href: '/scanner/code' },
    { label: 'Secrets Scanner',    href: '/scanner/secrets' },
    { label: 'IaC Scanner',        href: '/scanner/iac' },
    { label: 'Container & IaC',    href: '/scanner/container-iac' },
    // Platform
    { label: 'CI/CD Setup',        href: '/scanner/cicd' },
    { label: 'SSPM Scanner',       href: '/scanner/sspm' },
    { label: 'Shadow AI Scanner',  href: '/scanner/shadow-ai' },
    { label: 'Agent Scanner',      href: '/scanner/agent' },
    { label: 'All Scanners',       href: '/scanner' },
  ],
}

const COMMON_NAV = [
  {
    label: 'Solutions',
    dropdown: [
      { label: 'Enterprise',          href: '/solutions/enterprise' },
      { label: 'SMB',                 href: '/solutions/smb' },
      { label: 'DevSecOps',           href: '/solutions/devsecops' },
      { label: 'Compliance',          href: '/solutions/compliance' },
      { label: 'Penetration Testing', href: '/solutions/penetration-testing' },
    ],
  },
  {
    label: 'Platform',
    dropdown: [
      { label: 'Dashboard',            href: '/dashboard' },
      { label: 'Executive Dashboard',  href: '/executive-dashboard' },
      { label: 'Portfolio',            href: '/portfolio' },
      { label: 'Assets',               href: '/assets' },
      { label: 'Asset Graph',          href: '/asset-graph' },
      { label: 'Vendor Risk',          href: '/vendor-risk' },
      { label: 'Scan History',         href: '/scanner/history' },
      { label: 'Monitoring',           href: '/monitoring' },
      { label: 'Trends',               href: '/trends' },
      { label: 'Remediation',          href: '/remediation' },
      { label: 'Remediation Tasks',    href: '/remediation-tasks' },
      { label: 'Schedules',            href: '/schedule' },
      { label: 'Discover',             href: '/discover' },
    ],
  },
  {
    label: 'Threat Intelligence',
    dropdown: [
      { label: 'AI Report',          href: '/ai-report' },
      { label: 'Alert Triage',       href: '/alert-triage' },
      { label: 'Dark Web Monitor',   href: '/dark-web' },
      { label: 'Threat Feed',        href: '/threat-feed' },
      { label: 'Threat Intel',       href: '/threat' },
      { label: 'Attack Paths',       href: '/attack-paths' },
      { label: 'Attack Chains',      href: '/attack-chains' },
      { label: 'Identity Exposure',  href: '/identity' },
      { label: 'SBOM',               href: '/sbom' },
      { label: 'Compliance Report',  href: '/compliance' },
      { label: 'Biz Logic Scan',     href: '/bizlogic' },
      { label: 'Patch Management',   href: '/patch' },
      { label: 'EDR',                href: '/edr' },
    ],
  },
  {
    label: 'Security Ops',
    dropdown: [
      { label: 'Phishing Simulation', href: '/phishing' },
      { label: 'SIEM Integrations',   href: '/settings/siem' },
      { label: 'Monitoring',          href: '/monitoring' },
      { label: 'Alert Config',        href: '/alerts/config' },
      { label: 'Integrations',        href: '/integrations' },
      { label: 'Import Scan',         href: '/import' },
      { label: 'Scheduled Reports',   href: '/reports/schedule' },
      { label: 'Policy Management',   href: '/policy' },
      { label: 'Audit Log',           href: '/audit' },
      { label: 'Organization',        href: '/org' },
    ],
  },
  {
    label: 'Agent',
    dropdown: [
      { label: 'Udyo360 Agent',     href: '/agent' },
      { label: 'Auto Scan',         href: '/autoscan' },
      { label: 'Server Monitor',    href: '/servermonitor' },
      { label: 'Agent Management',  href: '/agents' },
      { label: 'Container Scan',    href: '/container-scan' },
      { label: 'EASM Scan',         href: '/easm' },
    ],
  },
  {
    label: 'Resources',
    dropdown: [
      { label: 'Billing',       href: '/billing' },
      { label: 'White Label',   href: '/whitelabel' },
      { label: 'Trust Badge',   href: '/trust' },
      { label: 'CVE Database',  href: '/cve-database' },
      { label: 'Clean Images',  href: '/images' },
      { label: 'Helm Charts',   href: '/helm' },
      { label: 'Blog',          href: '/blog' },
      { label: 'Help',          href: '/help' },
      { label: 'Pricing',       href: '/pricing' },
      { label: 'Company',       href: '/company' },
    ],
  },
]

/* ── Avatar helpers ── */
const AVATAR_COLORS = [
  'bg-crimson-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-violet-500',  'bg-amber-500', 'bg-sky-500',
]

function userInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2) || '?'
}

function avatarBg(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 65) % AVATAR_COLORS.length]
}

function Avatar({ user, size = 8 }) {
  const pic  = user?.profilePictureUrl ?? user?.ProfilePictureUrl ?? user?.picture ?? null
  const name = user?.name ?? user?.Name ?? user?.displayName ?? user?.email ?? ''
  const dim  = `w-${size} h-${size}`
  if (pic) {
    return <img src={pic} alt={name} className={`${dim} rounded-full object-cover`} />
  }
  return (
    <div className={`${dim} rounded-full ${avatarBg(name)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
      {userInitials(name)}
    </div>
  )
}

function PlanBadge({ plan }) {
  if (!plan) return null
  const type = (plan.type ?? plan.Type ?? plan.planType ?? plan.PlanType ?? '').toLowerCase()
  const name = plan.name ?? plan.Name ?? plan.planName ?? plan.PlanName ?? ''
  const days = plan.trialDaysLeft ?? plan.TrialDaysLeft ?? plan.daysLeft ?? plan.DaysLeft ?? null

  if (type === 'trial' || type === 'free' || name.toLowerCase().includes('trial')) {
    return (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 whitespace-nowrap">
        Free Trial{days != null ? ` · ${days}d` : ''}
      </span>
    )
  }
  if (type === 'pro' || type === 'professional') {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-400">Pro</span>
  }
  if (type === 'enterprise') {
    return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-400">Enterprise</span>
  }
  return name
    ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-500/15 border border-gray-500/30 text-gray-400">{name}</span>
    : null
}

function AvatarDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  const name  = user?.name ?? user?.Name ?? user?.displayName ?? user?.email ?? 'Account'
  const email = user?.email ?? user?.Email ?? ''
  const plan  = user?.plan ?? user?.Plan ?? null

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full focus:outline-none hover:ring-2 ring-white/20 transition-all"
        aria-label="Account menu"
      >
        <Avatar user={user} size={8} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-60 bg-navy-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fade-up">
          {/* Identity strip */}
          <div className="px-4 py-3 border-b border-white/10 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-white truncate max-w-[140px]">{name}</p>
              {plan && <PlanBadge plan={plan} />}
            </div>
            {email && name !== email && (
              <p className="text-xs text-gray-500 truncate mt-0.5">{email}</p>
            )}
          </div>

          <button
            onClick={() => { setOpen(false); navigate('/settings/profile') }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0" /> Profile &amp; Settings
          </button>

          <button
            onClick={() => { setOpen(false); onLogout() }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </div>
      )}
    </div>
  )
}

/* ── Navbar ── */
export default function Navbar({ banner }) {
  const [scrolled, setScrolled]         = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navLinks = [user ? SCANNERS_NAV : PRODUCTS_NAV, ...COMMON_NAV]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goToHref = (href, e) => {
    if (href.startsWith('/')) {
      e?.preventDefault()
      setActiveDropdown(null)
      setMobileOpen(false)
      navigate(href)
    }
  }

  const renderItem = (item) => (
    <a
      key={item.label}
      href={item.href || '#'}
      onClick={item.href?.startsWith('/') ? (e) => goToHref(item.href, e) : undefined}
      className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
    >
      {item.label}
    </a>
  )

  const handleLaunchScanner = (e) => {
    e.preventDefault()
    const dest = '/products/web'
    navigate(user ? dest : `/login?redirect=${encodeURIComponent(dest)}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-navy-900/98 backdrop-blur-md shadow-2xl' : 'bg-transparent'
      }`}
    >
      {banner}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9" />
            <span className="text-white font-bold text-xl tracking-tight">
              Udy◎<span className="text-crimson-500">360</span>
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.dropdown && setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  onClick={() => !link.dropdown && link.href && goToHref(link.href)}
                  className="flex items-center gap-1 text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-white/5"
                >
                  {link.label}
                  {link.dropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {link.dropdown && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-navy-900 border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-up max-h-[70vh] overflow-y-auto">
                    {link.dropdown.map((item) => renderItem(item))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA / Avatar */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <AvatarDropdown user={user} onLogout={handleLogout} />
            ) : (
              <>
                <a
                  href="/login"
                  onClick={(e) => { e.preventDefault(); navigate('/login') }}
                  className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="/dashboard"
                  onClick={handleLaunchScanner}
                  className="flex items-center gap-1.5 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <ScanLine className="w-4 h-4" />
                  Launch Scanner
                </a>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-900 border-t border-white/10">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <div key={link.label}>
                <span className="block text-gray-300 px-3 py-2.5 text-sm font-medium">{link.label}</span>
                {link.dropdown && (
                  <div className="pl-4 space-y-1">
                    {link.dropdown.map((item) => renderItem(item))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-2">
                    <Avatar user={user} size={8} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.name ?? user?.Name ?? user?.email ?? 'Account'}
                      </p>
                      {(user?.plan ?? user?.Plan) && (
                        <PlanBadge plan={user?.plan ?? user?.Plan} />
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { navigate('/settings/profile'); setMobileOpen(false) }}
                    className="flex items-center gap-2 text-gray-300 text-sm font-medium px-3 py-2 hover:text-white"
                  >
                    <Settings className="w-4 h-4" /> Profile &amp; Settings
                  </button>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false) }}
                    className="flex items-center gap-2 text-red-400 text-sm font-medium px-3 py-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    onClick={(e) => { e.preventDefault(); navigate('/login'); setMobileOpen(false) }}
                    className="text-gray-300 text-sm font-medium text-center py-2"
                  >
                    Sign In
                  </a>
                  <button
                    onClick={handleLaunchScanner}
                    className="btn-primary justify-center text-sm flex items-center gap-2"
                  >
                    <ScanLine className="w-4 h-4" />
                    Launch Scanner
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
