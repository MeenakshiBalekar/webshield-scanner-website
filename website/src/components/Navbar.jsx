import React, { useState, useEffect } from 'react'
import { Shield, Menu, X, ChevronDown, ScanLine } from 'lucide-react'

const navLinks = [
  {
    label: 'Products',
    dropdown: ['Web Vulnerability Scanner', 'API Security', 'OWASP Scanner', 'XSS Detector', 'SQLi Tester'],
  },
  {
    label: 'Solutions',
    dropdown: ['Enterprise', 'SMB', 'DevSecOps', 'Compliance', 'Penetration Testing'],
  },
  {
    label: 'Resources',
    dropdown: ['Documentation', 'Blog', 'Whitepapers', 'Webinars', 'CVE Database'],
  },
  { label: 'Pricing' },
  { label: 'Company' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-navy-900/98 backdrop-blur-md shadow-2xl' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
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
                <button className="flex items-center gap-1 text-gray-300 hover:text-white px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-white/5">
                  {link.label}
                  {link.dropdown && <ChevronDown className="w-3.5 h-3.5" />}
                </button>
                {link.dropdown && activeDropdown === link.label && (
                  <div className="absolute top-full left-0 mt-1 w-52 bg-navy-900 border border-white/10 rounded-xl shadow-2xl py-2 animate-fade-up">
                    {link.dropdown.map((item) => (
                      <a
                        key={item}
                        href="#"
                        className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <a href="#" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
              Sign In
            </a>
            <a
              href="#/scanner"
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
                <a
                  href="#"
                  className="block text-gray-300 hover:text-white px-3 py-2.5 text-sm font-medium rounded-md hover:bg-white/5"
                >
                  {link.label}
                </a>
                {link.dropdown && (
                  <div className="pl-4 space-y-1">
                    {link.dropdown.map((item) => (
                      <a
                        key={item}
                        href="#"
                        className="block text-gray-400 hover:text-white px-3 py-2 text-sm rounded-md hover:bg-white/5"
                      >
                        {item}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <a href="#" className="text-gray-300 text-sm font-medium text-center py-2">Sign In</a>
              <a href="#/scanner" className="btn-primary justify-center text-sm">
                <ScanLine className="w-4 h-4" />
                Launch Scanner
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
