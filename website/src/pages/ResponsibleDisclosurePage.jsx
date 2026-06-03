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

export default function ResponsibleDisclosurePage() {
  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Security</p>
            <h1 className="text-4xl font-extrabold text-white mb-3">Responsible Disclosure</h1>
            <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="bg-white/3 border border-white/10 rounded-2xl px-6 py-5 mb-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-semibold mb-1">Found a vulnerability?</p>
              <p className="text-gray-400 text-sm">Report it directly to our security team. We acknowledge within 48 hours.</p>
            </div>
            <a
              href="mailto:support@udyo360.com?subject=Security%20Vulnerability%20Report"
              className="shrink-0 bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors text-center"
            >
              Report a Vulnerability
            </a>
          </div>

          <Section title="1. Our Commitment">
            <p>Udyo360 takes the security of our platform and our customers' data seriously. We welcome reports from security researchers who discover vulnerabilities in our systems. We commit to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Acknowledging your report within <span className="text-white font-semibold">48 hours</span>.</li>
              <li>Providing a status update within <span className="text-white font-semibold">7 business days</span>.</li>
              <li>Working with you to understand and validate the issue.</li>
              <li>Notifying you when the vulnerability is remediated.</li>
              <li>Publicly crediting you in our hall of fame (if you wish).</li>
            </ul>
          </Section>

          <Section title="2. Scope">
            <p>The following systems are in scope:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-crimson-400 font-mono text-xs">udyo360.com</code> — main marketing and app frontend</li>
              <li><code className="text-crimson-400 font-mono text-xs">api.udyo360.com</code> — REST API backend</li>
              <li>The Udyo360 Agent (downloadable binary)</li>
            </ul>
            <p className="mt-3">The following are <span className="text-white font-semibold">out of scope</span>:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Third-party services (Paddle, Cloudflare, Render) — report these directly to those providers.</li>
              <li>Social engineering attacks against our staff.</li>
              <li>Physical security.</li>
              <li>Denial-of-service attacks.</li>
              <li>Findings on systems not listed above.</li>
              <li>Vulnerabilities requiring physical access to a user's device.</li>
            </ul>
          </Section>

          <Section title="3. Vulnerability Classes We're Interested In">
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Authentication / authorisation bypass</li>
              <li>Remote code execution (RCE)</li>
              <li>SQL injection or NoSQL injection</li>
              <li>Server-side request forgery (SSRF)</li>
              <li>Cross-site scripting (XSS) with meaningful impact</li>
              <li>Insecure direct object reference (IDOR) leaking other users' data</li>
              <li>JWT or session token weaknesses</li>
              <li>Sensitive data exposure (PII, API keys, scan results of other users)</li>
              <li>Cryptographic weaknesses</li>
            </ul>
          </Section>

          <Section title="4. How to Report">
            <p>Email your report to <a href="mailto:support@udyo360.com?subject=Security%20Vulnerability%20Report" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a> with the subject line <span className="text-white font-mono text-xs">Security Vulnerability Report</span>.</p>
            <p>Please include:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>A clear description of the vulnerability and its potential impact.</li>
              <li>Step-by-step reproduction instructions.</li>
              <li>Screenshots, HTTP request/response logs, or a proof-of-concept (PoC) where appropriate.</li>
              <li>Your contact details and preferred credit name (optional).</li>
            </ul>
            <p>For sensitive disclosures, you may request our PGP public key by emailing the address above.</p>
          </Section>

          <Section title="5. Safe Harbour">
            <p>We will not pursue legal action against researchers who:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Report vulnerabilities through this process in good faith.</li>
              <li>Avoid accessing, modifying, or deleting data beyond what is necessary to demonstrate the vulnerability.</li>
              <li>Do not exploit the vulnerability for personal gain or to harm users.</li>
              <li>Do not publicly disclose the vulnerability before we have had a reasonable opportunity to remediate it (see Coordinated Disclosure below).</li>
            </ul>
            <p>This safe harbour does not extend to malicious actors, those who use vulnerabilities to extract data, or those who conduct unauthorised scanning of our customers' systems using our platform.</p>
          </Section>

          <Section title="6. Coordinated Disclosure">
            <p>We follow a <span className="text-white font-semibold">90-day coordinated disclosure</span> policy. We ask that you refrain from publicly disclosing vulnerability details for 90 days from the date of our acknowledgement to give us time to release a fix.</p>
            <p>If a patch is not available within 90 days, we will work with you to agree a disclosure timeline. We will always notify you before we publicly disclose a remediated vulnerability.</p>
          </Section>

          <Section title="7. Rewards">
            <p>We do not currently operate a formal paid bug bounty programme. However, we recognise exceptional contributions with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Credit on our public <span className="text-white">Security Hall of Fame</span>.</li>
              <li>Complimentary platform access for researchers who report critical or high-severity findings.</li>
              <li>A personal thank-you from our security team.</li>
            </ul>
            <p>We reserve the right to determine the severity and reward at our discretion.</p>
          </Section>

          <Section title="8. Response SLA">
            <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400">
                    <th className="text-left px-4 py-2.5">Action</th>
                    <th className="text-left px-4 py-2.5">Target SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Initial acknowledgement', '48 hours'],
                    ['Severity assessment & triage', '7 business days'],
                    ['Fix for Critical severity', '14 days'],
                    ['Fix for High severity', '30 days'],
                    ['Fix for Medium/Low severity', '90 days'],
                    ['Disclosure notification to researcher', 'Before public disclosure'],
                  ].map(([action, sla]) => (
                    <tr key={action} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5 text-gray-300">{action}</td>
                      <td className="px-4 py-2.5 text-white font-semibold">{sla}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="9. Contact">
            <p>Security disclosures: <a href="mailto:support@udyo360.com?subject=Security%20Vulnerability%20Report" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a></p>
            <p>General enquiries: <a href="mailto:support@udyo360.com" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a></p>
          </Section>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-500">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
