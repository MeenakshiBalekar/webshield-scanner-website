import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Shield, ArrowRight, CreditCard, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const [countdown, setCountdown] = useState(10)

  /* Paddle passes these query params on success */
  const txnId    = searchParams.get('_ptxn') ?? searchParams.get('transactionId')
  const planName = searchParams.get('plan') ?? null

  /* Auto-redirect to billing after 10s */
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">

          {/* Success icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-white mb-2">You're all set!</h1>
          <p className="text-gray-400 mb-2">
            {planName
              ? <>Your <span className="text-white font-semibold">{planName}</span> subscription is now active.</>
              : 'Your subscription is now active.'
            }
          </p>
          <p className="text-sm text-gray-500 mb-8">
            You now have full access to all Pro features. Start scanning immediately.
          </p>

          {txnId && (
            <p className="text-[10px] text-gray-600 font-mono mb-6">
              Transaction ID: {txnId}
            </p>
          )}

          {/* What's unlocked */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-8 text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">What's now unlocked</p>
            <ul className="space-y-2">
              {[
                { icon: Shield,     label: 'Unlimited web vulnerability scans' },
                { icon: Zap,        label: 'Host, cloud, code & network scanners' },
                { icon: CreditCard, label: 'CI/CD gates + API access' },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="w-6 h-6 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-green-400" />
                  </div>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/scanner"
              className="flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              <Zap className="w-4 h-4" /> Start Scanning
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/billing"
              className="flex items-center justify-center gap-2 bg-white/5 border border-white/15 hover:bg-white/10 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              <CreditCard className="w-4 h-4" /> View Billing
            </Link>
          </div>

          {/* Auto-redirect notice */}
          {countdown > 0 && (
            <p className="text-xs text-gray-600 mt-6">
              Redirecting to billing in {countdown}s…{' '}
              <Link to="/billing" className="text-gray-400 hover:text-white underline">Go now</Link>
            </p>
          )}
          {countdown <= 0 && (
            <meta httpEquiv="refresh" content="0;url=/billing" />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
