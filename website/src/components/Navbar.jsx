import React, { useState, useEffect } from 'react'
import { Shield, Menu, X, ChevronDown, ScanLine } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinks = [
  {
    label: 'Products',
    dropdown: [
      { label: 'Web Vulnerability Scanner', tab: 'web' },
      { label: 'API Security',              tab: 'api' },
      { label: 'OWASP Scanner',             tab: 'owasp' },
      { label: 'XSS Detector',              tab: 'xss' },
      { label: 'SQLi Tester',               tab: 'sqli' },
    ],
  },
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
    label: 'Scanners',
    dropdown: [
      { label: 'Web Scanner',     tab: 'web' },
      { label: 'Network Scanner', href: '/scanner/network' },
      { label: 'Host Scanner',    href: '/scanner/host' },
      { label: 'Cloud Scanner',   href: '/scanner/cloud' },
      { label: 'Code Scanner',    href: '/scanner/code' },
      { label: 'CI/CD Setup',     href: '/scanner/cicd' },
      { label: 'All Scanners',    href: '/scanner' },
    ],
  },
  {
    label: 'Agent',
    dropdown: [
      { label: 'WebShield Agent',   href: '/agent' },
      { label: 'Auto Scan',         href: '/autoscan' },
      { label: 'Remediation Tasks', href: '/remediation-tasks' },
      { label: 'Server Monitor',    href: '/servermonitor' },
    ],
  },
  {
    label: 'Resources',
    dropdown: [
      { label: 'Dashboard',     href: '/dashboard' },
      { label: 'Billing',       href: '/billing' },
      { label: 'Assets',        href: '/assets' },
      { label: 'Remediation',   href: '/remediation' },
      { label: 'Scan History',  href: '/scanner/history' },
      { label: 'Schedules',     href: '/schedule' },
      { label: 'Blog',          href: '/blog' },
      { label: 'CVE Database',  href: '/cve' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Company', href: '/company' },
]

export default function Navbar({ banner }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goToProduct = (tab) => {
    setActiveDropdown(null)
    setMobileOpen(false)
    const dest = `/products/${tab}`
    navigate(user ? dest : `/login?redirect=${encodeURIComponent(dest)}`)
  }

  const goToHref = (href, e) => {
    if (href.startsWith('/')) {
      e?.preventDefault()
      setActiveDropdown(null)
      setMobileOpen(false)
      navigate(href)
    }
  }

  const renderItem = (item) => {
    if (item.tab) {
      return (
        <button
          key={item.label}
          onClick={() => goToProduct(item.tab)}
          className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          {item.label}
        </button>
      )
    }
    return (
      <a
        key={item.label}
        href={item.href || '#'}
        onClick={item.href?.startsWith('/') ? (e) => goToHref(item.href, e) : undefined}
        className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
      >
        {item.label}
      </a>
    )
  }

  const handleLaunchScanner = (e) => {
    e.preventDefault()
    const dest = '/products/web'
    navigate(user ? dest : `/login?redirect=${encodeURIComponent(dest)}`)
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
            <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center group-hover:bg-crimson-600 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Web<span className="text-crimson-500">Shield</span>
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
                  <div className="absolute top-full left-0 mt-1 w-56 bg-navy-900 border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-up">
                    {link.dropdown.map((item) => renderItem(item))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
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
          </div>

          {/* Mobile Toggle */}
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
                <span className="block text-gray-300 px-3 py-2.5 text-sm font-medium">
                  {link.label}
                </span>
                {link.dropdown && (
                  <div className="pl-4 space-y-1">
                    {link.dropdown.map((item) => renderItem(item))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 flex flex-col gap-2">
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
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
