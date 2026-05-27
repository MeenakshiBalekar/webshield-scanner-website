import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Globe, ArrowRight, History, AlertCircle } from 'lucide-react'
import { startScan } from '../services/api'

export default function ScanPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    let target = url.trim()
    if (!target) return
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target

    setLoading(true)
    try {
      const result = await startScan(target)
      const id = result.id ?? result.scanId ?? result.Id
      if (!id) throw new Error('Backend did not return a scan ID')
      navigate(`/scanner/results/${id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2 group">
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

      {/* Main */}
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
              Enter a URL and WebShield will detect SQL injection, XSS, OWASP Top 10, and more.
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
                disabled={loading}
                className="w-full bg-white/5 border border-white/15 hover:border-white/25 focus:border-crimson-500 text-white placeholder-gray-500 pl-12 pr-4 py-4 rounded-xl text-lg outline-none transition-colors disabled:opacity-50"
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
              disabled={loading || !url.trim()}
              className="w-full flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl text-lg transition-colors"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting Scan…
                </>
              ) : (
                <>
                  Start Scan
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[
              { label: 'SQL Injection', color: 'text-red-400' },
              { label: 'XSS Detection', color: 'text-orange-400' },
              { label: 'OWASP Top 10', color: 'text-purple-400' },
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
