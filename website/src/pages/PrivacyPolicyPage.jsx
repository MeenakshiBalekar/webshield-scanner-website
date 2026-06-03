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

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Legal</p>
            <h1 className="text-4xl font-extrabold text-white mb-3">Privacy Policy</h1>
            <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>

          <Section title="1. Who We Are">
            <p>Udyo360 Security, Inc. ("Udyo360", "we", "our") operates the web-based vulnerability scanning platform at udyo360.com. We are the data controller for personal data collected through this platform.</p>
            <p>Contact: <a href="mailto:support@udyo360.com" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a> · Gurgaon, Haryana, India</p>
          </Section>

          <Section title="2. Data We Collect">
            <p><span className="text-white font-semibold">Account data:</span> name, email address, password (bcrypt-hashed), company name, and billing details (tokenised by Paddle — we never see raw card numbers).</p>
            <p><span className="text-white font-semibold">Scan data:</span> target URLs you submit for scanning, scan results, vulnerability findings, and remediation status. You own this data entirely.</p>
            <p><span className="text-white font-semibold">Usage data:</span> page views, feature usage, and error logs collected via first-party analytics. IP addresses are anonymised within 24 hours.</p>
            <p><span className="text-white font-semibold">Agent telemetry:</span> if you run the Udyo360 Agent, it sends heartbeat pings and scan metadata. No source code or file contents are transmitted.</p>
          </Section>

          <Section title="3. Legal Basis for Processing (GDPR)">
            <p>For users in the EEA, UK, or Switzerland, our lawful bases are:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-white">Contract performance</span> — account creation, scan execution, billing.</li>
              <li><span className="text-white">Legitimate interests</span> — security monitoring, fraud prevention, product improvement.</li>
              <li><span className="text-white">Legal obligation</span> — tax records, responding to lawful requests.</li>
              <li><span className="text-white">Consent</span> — marketing emails (you may withdraw at any time).</li>
            </ul>
          </Section>

          <Section title="4. How We Use Your Data">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Provision and operate the scanning platform</li>
              <li>Send transactional emails (scan complete, vulnerability alerts)</li>
              <li>Process payments via Paddle</li>
              <li>Investigate security incidents and abuse</li>
              <li>Improve and develop features (using aggregated, anonymised data)</li>
              <li>Comply with applicable law</li>
            </ul>
            <p>We do not sell your personal data to third parties. We do not use your scan results for training AI models.</p>
          </Section>

          <Section title="5. Data Retention">
            <p>We retain data for the following periods:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-white">Account data:</span> for the life of your account + 30 days after deletion request.</li>
              <li><span className="text-white">Scan results:</span> 12 months on paid plans, 30 days on free plans, unless you delete them earlier.</li>
              <li><span className="text-white">Billing records:</span> 7 years (legal obligation).</li>
              <li><span className="text-white">Access logs:</span> 90 days.</li>
              <li><span className="text-white">Anonymised analytics:</span> indefinitely.</li>
            </ul>
            <p>You can request deletion of your account and all associated scan data at any time by emailing <a href="mailto:support@udyo360.com" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a>. We will action the request within 30 days.</p>
          </Section>

          <Section title="6. Sharing & Sub-processors">
            <p>We share data only with the following trusted sub-processors, all of whom are bound by data processing agreements:</p>
            <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-white/10"><th className="text-left px-4 py-2 text-gray-400">Provider</th><th className="text-left px-4 py-2 text-gray-400">Purpose</th><th className="text-left px-4 py-2 text-gray-400">Location</th></tr></thead>
                <tbody>
                  {[
                    ['Paddle', 'Payment processing', 'UK / US'],
                    ['Render', 'Backend hosting', 'US'],
                    ['GitHub', 'Code hosting, CI/CD', 'US'],
                    ['Cloudflare', 'CDN, DDoS protection', 'US'],
                  ].map(([p, pu, l]) => (
                    <tr key={p} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2 text-white font-medium">{p}</td>
                      <td className="px-4 py-2">{pu}</td>
                      <td className="px-4 py-2">{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="7. International Transfers">
            <p>Some sub-processors are located outside your country. Where data is transferred outside the EEA/UK, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission, or equivalent safeguards.</p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your jurisdiction, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-white">Access</span> — request a copy of your personal data.</li>
              <li><span className="text-white">Rectification</span> — correct inaccurate data.</li>
              <li><span className="text-white">Erasure</span> — request deletion ("right to be forgotten").</li>
              <li><span className="text-white">Portability</span> — receive your data in a machine-readable format.</li>
              <li><span className="text-white">Restriction</span> — limit how we process your data.</li>
              <li><span className="text-white">Objection</span> — object to processing based on legitimate interests.</li>
              <li><span className="text-white">Withdraw consent</span> — for any consent-based processing.</li>
            </ul>
            <p>To exercise any right, email <a href="mailto:support@udyo360.com" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a>. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority.</p>
          </Section>

          <Section title="9. Security">
            <p>We implement industry-standard security controls including TLS 1.2+ in transit, AES-256 encryption at rest, role-based access control, and annual penetration testing. See our <Link to="/responsible-disclosure" className="text-crimson-400 hover:text-crimson-300">Responsible Disclosure Policy</Link> for our vulnerability reporting process.</p>
          </Section>

          <Section title="10. Cookies">
            <p>We use cookies for session management and analytics. See our <Link to="/cookie-policy" className="text-crimson-400 hover:text-crimson-300">Cookie Policy</Link> for full details.</p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>We may update this policy periodically. We will notify you by email for material changes. Continued use of the platform after the effective date constitutes acceptance.</p>
          </Section>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-500">
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link to="/responsible-disclosure" className="hover:text-white transition-colors">Responsible Disclosure</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
