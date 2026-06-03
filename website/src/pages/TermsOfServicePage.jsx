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

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Legal</p>
            <h1 className="text-4xl font-extrabold text-white mb-3">Terms of Service</h1>
            <p className="text-gray-500 text-sm">Last updated: {LAST_UPDATED}</p>
          </div>

          <div className="bg-crimson-500/10 border border-crimson-500/30 rounded-xl px-5 py-4 mb-10">
            <p className="text-crimson-400 text-sm font-semibold mb-1">⚠ Authorised Scanning Only</p>
            <p className="text-gray-300 text-sm leading-relaxed">You may only scan systems you own or have explicit written authorisation to test. Scanning third-party systems without permission is illegal under the Computer Fraud and Abuse Act (CFAA), the Computer Misuse Act (UK), and equivalent laws worldwide. Udyo360 cooperates fully with law enforcement investigations.</p>
          </div>

          <Section title="1. Acceptance">
            <p>By creating an account or using the Udyo360 platform (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of an organisation, you represent that you have authority to bind that organisation.</p>
          </Section>

          <Section title="2. Eligibility">
            <p>You must be at least 18 years old and capable of forming a binding contract. The Service is not available to persons previously banned from using it or residents of embargoed territories.</p>
          </Section>

          <Section title="3. Permitted Use & Authorisation Requirement">
            <p>You may use the Service only to scan:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Domains and IP addresses you own or control.</li>
              <li>Systems for which you have obtained <span className="text-white font-semibold">explicit written authorisation</span> from the system owner.</li>
              <li>Publicly available bug bounty targets within the scope defined by the programme.</li>
            </ul>
            <p className="text-crimson-400 font-medium">You must not use the Service to scan systems without authorisation, attempt to bypass rate limits, conduct denial-of-service attacks, or interfere with the Service's infrastructure.</p>
          </Section>

          <Section title="4. Account Responsibilities">
            <p>You are responsible for maintaining the confidentiality of your credentials and API keys. You are liable for all activity under your account. Notify us immediately at <a href="mailto:support@udyo360.com" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a> if you suspect unauthorised access.</p>
          </Section>

          <Section title="5. Subscription & Billing">
            <p>Paid plans are billed in advance on a monthly or annual basis via Paddle. All prices are in USD unless stated otherwise. Subscription fees are non-refundable except where required by law or at our sole discretion.</p>
            <p>We reserve the right to change pricing with 30 days' notice. Continued use after the notice period constitutes acceptance of the new pricing.</p>
          </Section>

          <Section title="6. Free Plan Limitations">
            <p>Free plans are subject to rate limits, scan history retention of 30 days, and feature restrictions as displayed on the pricing page. We reserve the right to modify free plan limits at any time.</p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>The Service, including its software, UI, and underlying algorithms, is the property of Udyo360 Security, Inc. and is protected by intellectual property laws. You receive a limited, non-exclusive, non-transferable licence to use the Service.</p>
            <p>Scan results and reports generated from your targets remain your property. You grant us a limited licence to process this data solely to operate the Service.</p>
          </Section>

          <Section title="8. Confidentiality of Scan Data">
            <p>We treat your scan results as confidential. We do not share your scan data with third parties except as described in our <Link to="/privacy-policy" className="text-crimson-400 hover:text-crimson-300">Privacy Policy</Link>. We do not use your vulnerability findings to build competitive intelligence.</p>
          </Section>

          <Section title="9. Acceptable Use Policy">
            <p>You may not use the Service to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Scan targets without authorisation (see Section 3).</li>
              <li>Generate, distribute, or store malware, ransomware, or exploit code.</li>
              <li>Circumvent authentication or access controls on third-party systems.</li>
              <li>Resell or white-label the Service without a written reseller agreement.</li>
              <li>Reverse-engineer, decompile, or extract source code from the Service.</li>
              <li>Abuse the API to conduct automated scanning at volumes that degrade service for others.</li>
            </ul>
          </Section>

          <Section title="10. Termination">
            <p>We may suspend or terminate your account immediately, without notice, for violations of these Terms, fraudulent activity, non-payment, or to comply with law. You may cancel at any time from your billing settings.</p>
            <p>Upon termination, your right to use the Service ceases immediately. Scan data will be retained per our <Link to="/privacy-policy" className="text-crimson-400 hover:text-crimson-300">Privacy Policy</Link> and then deleted.</p>
          </Section>

          <Section title="11. Disclaimer of Warranties">
            <p>The Service is provided "as is" and "as available" without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that scan results will be complete or accurate. Vulnerability scanning does not guarantee that your systems are secure.</p>
          </Section>

          <Section title="12. Limitation of Liability">
            <p>To the maximum extent permitted by law, Udyo360's total liability for any claim arising out of or relating to these Terms or the Service is limited to the amount you paid us in the 12 months preceding the claim. We are not liable for indirect, incidental, consequential, or punitive damages.</p>
          </Section>

          <Section title="13. Indemnification">
            <p>You agree to indemnify and hold harmless Udyo360 and its officers, employees, and agents from any claims, damages, or expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any third-party rights.</p>
          </Section>

          <Section title="14. Governing Law">
            <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Gurgaon, Haryana, India.</p>
          </Section>

          <Section title="15. Changes">
            <p>We may modify these Terms at any time. We will provide 14 days' notice by email for material changes. Continued use of the Service after the effective date constitutes acceptance.</p>
            <p>Questions? Email <a href="mailto:support@udyo360.com" className="text-crimson-400 hover:text-crimson-300">support@udyo360.com</a>.</p>
          </Section>

          <div className="mt-10 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-xs text-gray-500">
            <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
            <Link to="/responsible-disclosure" className="hover:text-white transition-colors">Responsible Disclosure</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
