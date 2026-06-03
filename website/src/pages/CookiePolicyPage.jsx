import React from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const LAST_UPDATED = 'June 2026'

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">{title}</h2>
      <div className="space-y-3 text-gray-400 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

const COOKIES = [
  { name: 'ws_token', type: 'Essential', duration: 'Session', purpose: 'Stores your authentication JWT. Required to use the platform.' },
  { name: '__cf_bm', type: 'Essential', duration: '30 minutes', purpose: 'Cloudflare bot management — protects the platform from automated abuse.' },
  { name: 'cf_clearance', type: 'Essential', duration: '1 day', purpose: 'Cloudflare challenge clearance — set after passing a browser integrity check.' },
  { name: '_udyo_session', type: 'Functional', duration: 'Session', purpose: 'Remembers UI preferences such as active scanner tab and filter state.' },
  { name: '_udyo_anon', type: 'Analytics', duration: '1 year', purpose: 'Anonymous visitor identifier for first-party analytics. No cross-site tracking.' },
]

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Legal</p>
            <h1 className="text-4xl font-extrabold text-white mb-3">Cookie Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>

          <Section title="1. What Are Cookies">
            <p>Cookies are small text files stored on your device when you visit a website. They are widely used to make websites work efficiently and to provide information to site owners.</p>
            <p>We also use similar technologies such as localStorage (for your authentication token) and sessionStorage (for in-page state). This policy covers all such technologies collectively referred to as "cookies".</p>
          </Section>

          <Section title="2. Cookies We Use">
            <div className="bg-white/3 border border-white/10 rounded-xl overflow-x-auto">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="text-left px-4 py-2.5">Cookie</th>
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-left px-4 py-2.5">Duration</th>
                    <th className="text-left px-4 py-2.5">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map((c) => (
                    <tr key={c.name} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-white">{c.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          c.type === 'Essential' ? 'bg-blue-500/15 text-blue-400' :
                          c.type === 'Functional' ? 'bg-purple-500/15 text-purple-400' :
                          'bg-yellow-500/15 text-yellow-400'
                        }`}>{c.type}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">{c.duration}</td>
                      <td className="px-4 py-2.5 text-gray-400">{c.purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="3. Third-Party Cookies">
            <p>Cloudflare sets cookies for security and DDoS protection purposes. These are strictly necessary and cannot be disabled without breaking platform functionality.</p>
            <p>Paddle, our payment processor, may set cookies during the checkout flow on their domain. These are governed by <a href="https://www.paddle.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-crimson-400 hover:text-crimson-300">Paddle's Privacy Policy</a>.</p>
            <p>We do not use Google Analytics, Facebook Pixel, or any third-party advertising cookies.</p>
          </Section>

          <Section title="4. Essential vs Non-Essential Cookies">
            <p><span className="text-white font-semibold">Essential cookies</span> are required for the platform to function. You cannot opt out of these without losing core functionality such as staying logged in.</p>
            <p><span className="text-white font-semibold">Functional and analytics cookies</span> are non-essential. You can opt out by adjusting your browser settings (see Section 5). Opting out of analytics cookies does not affect platform functionality.</p>
          </Section>

          <Section title="5. Managing Cookies">
            <p>Most browsers allow you to control cookies through their settings. Here are links to cookie management guides for popular browsers:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-crimson-400 hover:text-crimson-300">Google Chrome</a></li>
              <li><a href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer" className="text-crimson-400 hover:text-crimson-300">Mozilla Firefox</a></li>
              <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-crimson-400 hover:text-crimson-300">Apple Safari</a></li>
              <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-crimson-400 hover:text-crimson-300">Microsoft Edge</a></li>
            </ul>
            <p>Note that deleting or blocking the <code className="text-crimson-400 font-mono text-xs">ws_token</code> cookie will log you out of the platform.</p>
          </Section>

          <Section title="6. Changes">
            <p>We may update this policy as we introduce new features or service providers. Material changes will be communicated via email and a notice on this page.</p>
            <p>Questions? Email <a href="mailto:support@udyo360.com" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a>.</p>
          </Section>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-500">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/responsible-disclosure" className="hover:text-white transition-colors">Responsible Disclosure</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
