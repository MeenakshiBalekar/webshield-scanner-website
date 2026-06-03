import React from 'react'
import { Shield, Twitter, Linkedin, Github, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Products: [
    'Web Vulnerability Scanner',
    'API Security Testing',
    'OWASP Scanner',
    'XSS Detector',
    'SQL Injection Tester',
    'Malware Detection',
  ],
  Solutions: [
    'Enterprise',
    'SMB & Startups',
    'DevSecOps',
    'Compliance',
    'Penetration Testing',
    'Managed Security',
  ],
  Resources: [
    'Documentation',
    'API Reference',
    'Blog',
    'Whitepapers',
    'CVE Database',
    'Webinars',
    'Security Glossary',
  ],
  Company: [
    'About Us',
    'Careers',
    'Press',
    'Partners',
    'Contact',
    'Trust Center',
  ],
}

const social = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
  { icon: Youtube, label: 'YouTube', href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-400">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand column */}
          <div className="col-span-2">
            <a href="#" className="flex items-center gap-2 mb-4">
              <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9 rounded-lg" />
              <span className="text-white font-bold text-xl">
                Udy<span className="text-crimson-500">◎</span><span className="text-gray-400 font-normal">360</span>
              </span>
            </a>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Continuous security intelligence — scan, monitor, and remediate across your entire web estate.
            </p>

            {/* Contact */}
            <div className="space-y-2 text-xs mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-crimson-500" />
                <span>hello@udyo360.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-crimson-500" />
                <span>+91 98606 46298</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-crimson-500" />
                <span>Gurgaon, India</span>
              </div>
            </div>

            {/* Social */}
            <div className="flex gap-2">
              {social.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-8 h-8 bg-white/5 hover:bg-crimson-500 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-xs hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Compliance badges */}
        <div className="border-t border-white/10 pt-8 mb-6">
          <div className="flex flex-wrap gap-3">
            {['SOC 2 Type II', 'ISO 27001', 'PCI-DSS Compliant', 'GDPR Ready', 'HIPAA Aligned'].map((badge) => (
              <span
                key={badge}
                className="text-[10px] font-bold text-gray-400 border border-white/15 px-3 py-1.5 rounded-full uppercase tracking-wider"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">
            © {new Date().getFullYear()} Udyo360 Security, Inc. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-xs">
            {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'Responsible Disclosure'].map((l) => (
              <a key={l} href="#" className="hover:text-white transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
