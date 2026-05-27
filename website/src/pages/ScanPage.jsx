import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Globe, ArrowRight, History, AlertCircle } from 'lucide-react'
import { startScan } from '../services/api'

const SCAN_STEPS = [
  'Connecting to target and checking DNS…',
  'Analysing HTTP security headers…',
  'Checking HTTPS and HSTS enforcement…',
  'Testing for dangerous HTTP methods…',
  'Scanning for directory browsing exposure…',
  'Running OWASP Top 10 checks…',
  'Checking for sensitive file exposure…',
  'Generating security report…',
]

function ScanningOverlay({ url }) {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(5)

  useEffect(() => {
    const t = setInterval(() => {
      setStep((s) => (s + 1) % SCAN_STEPS.length)
      setProgress((p) => Math.min(p + Math.floor(Math.random() * 7 + 4), 90))
    }, 2200)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="flex flex-col items-center py-16 px-4 text-center max-w-xl mx-auto">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full border-4 border-crimson-500/20 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-4 border-t-crimson-500 border-r-crimson-500/50 border-b-transparent border-l-transparent absolute inset-0 animate-spin" />
          <Shield className="w-10 h-10 text-crimson-500" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Scanning in Progress</h2>
      <p className="text-gray-400 text-sm mb-6 break-all max-w-sm">{url}</p>
      <div className="w-full bg-white/10 rounded-full h-2 mb-2">
        <div
          className="h-full bg-gradient-to-r from-crimson-500 to-crimson-400 rounded-full transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between w-full text-xs text-gray-500 mb-6">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <p className="text-sm text-crimson-400 animate-pulse min-h-[1.5rem]">{SCAN_STEPS[step]}</p>
      <p className="text-xs text-gray-600 mt-4">This may take 15–30 seconds…</p>
    </div>
  )
}

export default function ScanPage() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    let target = url.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target

    setScanning(true)
    try {
      const result = await startScan(target)
      navigate('/scanner/results', { state: { scan: result } })
    } catch (err) {
      setError(err.message)
      setScanning(false)
    }
  }

  if (scanning) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col">
        <header className="flex items-center px-6 py-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Web<span className="text-crimson-500">Shield</span>
            </span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <ScanningOverlay url={url} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <Link
          to="/scanner/history"
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <History className="w-4 h-4" />
          Scan History
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-crimson-500/10 border border-crimson-500/30 rounded-2xl mb-5">
              <Shield className="w-8 h-8 text-crimson-500" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3">
              Scan Your Web Application
            </h1>
            <p className="text-gray-400 text-lg">
              Enter a URL and WebShield will check security headers, OWASP Top 10, IIS configuration, and more.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-app.com"
                required
                className="w-full bg-white/5 border border-white/15 hover:border-white/25 focus:border-crimson-500 text-white placeholder-gray-500 pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!url.trim()}
              className="w-full flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-lg transition-colors"
            >
              Start Scan
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'Security Headers', color: 'text-red-400' },
              { label: 'OWASP Top 10', color: 'text-orange-400' },
              { label: 'IIS / Server Config', color: 'text-purple-400' },
            ].map((t) => (
              <div key={t.label} className="bg-white/5 border border-white/10 rounded-xl py-3 px-2">
                <p className={`text-xs font-semibold ${t.color}`}>{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
