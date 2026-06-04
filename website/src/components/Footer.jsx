import React from 'react'
import { Link } from 'react-router-dom'
import { Github, Facebook, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  Products: [
    { label: 'Web Scanner',     to: '/scanner' },
    { label: 'API Scanner',     to: '/scanner' },
    { label: 'Network Scanner', to: '/scanner/network' },
    { label: 'Host Scanner',    to: '/scanner/host' },
    { label: 'Cloud Scanner',   to: '/scanner/cloud' },
    { label: 'Code Scanner',    to: '/scanner/code' },
    { label: 'CI/CD Setup',     to: '/scanner/cicd' },
  ],
  Solutions: [
    { label: 'Enterprise',          to: '/solutions/enterprise' },
    { label: 'SMB & Startups',      to: '/solutions/smb' },
    { label: 'DevSecOps',           to: '/solutions/devsecops' },
    { label: 'Compliance',          to: '/solutions/compliance' },
    { label: 'Penetration Testing', to: '/solutions/penetration-testing' },
    { label: 'Managed Security',    to: '/solutions/managed' },
  ],
  Resources: [
    { label: 'Documentation',    to: '/help' },
    { label: 'API Reference',    to: '/help' },
    { label: 'Blog',             to: '/blog' },
    { label: 'Whitepapers',      to: '/blog' },
    { label: 'CVE Database',     to: '/cve-database' },
    { label: 'Webinars',         to: '/blog' },
    { label: 'Security Glossary',to: '/blog' },
  ],
  Company: [
    { label: 'About Us',     to: '/company' },
    { label: 'Careers',      to: '/company' },
    { label: 'Press',        to: '/company' },
    { label: 'Partners',     to: '/company' },
    { label: 'Contact',      to: '/contact' },
    { label: 'Trust Center', to: '/privacy-policy' },
  ],
}

const social = [
  { icon: Github,    label: 'GitHub',    href: '#' },
  { icon: Facebook,  label: 'Facebook',  href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Youtube,   label: 'YouTube',   href: '#' },
]

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">

          {/* Brand column */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9" />
              <span className="text-white font-bold text-xl">
                Udy◎<span className="text-crimson-500">360</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-5 max-w-xs">
              Continuous security intelligence — scan, monitor, and remediate across your entire web estate.
            </p>

            {/* Contact */}
            <div className="space-y-2 text-xs mb-6">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-crimson-500" />
                <a href="mailto:support@udyo360.com" className="hover:text-white transition-colors">support@udyo360.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-crimson-500" />
                <a href="tel:+919860646298" className="hover:text-white transition-colors">+91 98606 46298</a>
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
                  target="_blank"
                  rel="noopener noreferrer"
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
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <Link to={to} className="text-xs hover:text-white transition-colors">
                      {label}
                    </Link>
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
            {[
              { label: 'Privacy Policy',         to: '/privacy-policy' },
              { label: 'Terms of Service',       to: '/terms-of-service' },
              { label: 'Cookie Policy',          to: '/cookie-policy' },
              { label: 'Responsible Disclosure', to: '/responsible-disclosure' },
            ].map(({ label, to }) => (
              <Link key={label} to={to} className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
