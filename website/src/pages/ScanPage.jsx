import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Shield, Globe, ArrowRight, History, AlertCircle, LayoutDashboard, Calendar } from 'lucide-react'
import { startScan } from '../services/api'
import { getScanType } from '../config/scanTypes'

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

function ScanningOverlay({ url, title }) {
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
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
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
  const [searchParams] = useSearchParams()
  const scanType = searchParams.get('type') || 'vuln'
  const config = getScanType(scanType)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    let target = url.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target

    setScanning(true)
    try {
      const result = await startScan(target)
      navigate('/scanner/results', { state: { scan: result, scanType } })
    } catch (err) {
      setError(err.message)
      setScanning(false)
    }
  }

  if (scanning) {
    return (
      <div className="min-h-screen page-bg flex flex-col">
        <header className="flex items-center px-6 py-4 border-b border-white/10">
          <Link to="/" className="flex items-center gap-2">
            <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9 rounded-lg" />
            <span className="text-white font-bold text-xl tracking-tight">
              Udy<span className="text-crimson-500">◎</span><span className="text-gray-400 font-normal">360</span>
            </span>
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <ScanningOverlay url={url} title={`Running ${config.title}…`} />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9 rounded-lg" />
          <span className="text-white font-bold text-xl tracking-tight">
            Udy<span className="text-crimson-500">◎</span><span className="text-gray-400 font-normal">360</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/scanner/history" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <History className="w-4 h-4" /> History
          </Link>
          <Link to="/schedule" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <Calendar className="w-4 h-4" /> Schedules
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-4 ${config.badgeColor}`}>
              {config.badge}
            </span>
            <h1 className="text-4xl font-extrabold text-white mb-3">{config.title}</h1>
            <p className="text-gray-400 text-lg">{config.subtitle}</p>
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
              Start Scan <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {config.features.map((f) => (
              <div key={f} className="bg-white/5 border border-white/10 rounded-xl py-3 px-2">
                <p className="text-xs font-semibold text-gray-400">{f}</p>
              </div>
            ))}
          </div>

          {/* Switch scanner type */}
          <div className="mt-10 pt-8 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center mb-4">Switch scanner</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { key: 'vuln', label: 'Web Vuln Scanner' },
                { key: 'xss', label: 'XSS Detector' },
                { key: 'sqli', label: 'SQLi Tester' },
                { key: 'owasp', label: 'OWASP Scanner' },
                { key: 'api', label: 'API Security' },
              ].map(({ key, label }) => (
                <Link
                  key={key}
                  to={`/scanner?type=${key}`}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    scanType === key
                      ? 'bg-crimson-500 border-crimson-500 text-white font-semibold'
                      : 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
