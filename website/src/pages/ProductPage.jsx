import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, ScanLine, Loader2, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp, LayoutDashboard,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { API } from '../context/AuthContext'

const PRODUCTS = {
  web: {
    title: 'Web Vulnerability Scanner',
    subtitle: 'Detect misconfigured security headers, exposed endpoints, and common web vulnerabilities.',
    endpoint: '/scan/headers',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: 'bg-blue-600',
  },
  api: {
    title: 'API Security',
    subtitle: 'Test API endpoints for authentication flaws, improper access controls, and data exposure risks.',
    endpoint: '/products/api-security',
    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    icon: 'bg-teal-600',
  },
  owasp: {
    title: 'OWASP Scanner',
    subtitle: 'Validate your application against the OWASP Top 10 — the most critical web security risks.',
    endpoint: '/products/owasp-scan',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    icon: 'bg-purple-600',
  },
  xss: {
    title: 'XSS Detector',
    subtitle: 'Identify Cross-Site Scripting vulnerabilities and content injection risks across your pages.',
    endpoint: '/products/xss-scan',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    icon: 'bg-orange-600',
  },
  sqli: {
    title: 'SQLi Tester',
    subtitle: 'Detect SQL injection vulnerabilities and assess your database exposure risk.',
    endpoint: '/products/sqli-scan',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: 'bg-red-600',
  },
}

function ResultRow({ item }) {
  const [open, setOpen] = useState(false)
  const passed = item.passed ?? item.status === 'Pass'
  const hasExtra = item.details || item.recommendation

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => hasExtra && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${hasExtra ? 'hover:bg-white/3 cursor-pointer' : 'cursor-default'}`}
      >
        <div className="shrink-0 mt-0.5">
          {passed
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <XCircle className="w-4 h-4 text-red-400" />}
        </div>
        <span className="flex-1 text-sm font-medium text-white">
          {item.checkName || item.name || item.header || 'Unknown check'}
        </span>
        {hasExtra && (
          open
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-11 pb-3.5 space-y-1.5">
          {item.details && (
            <p className="text-xs text-gray-400">{item.details}</p>
          )}
          {item.recommendation && (
            <p className="text-xs text-crimson-400 font-medium">
              Fix: {item.recommendation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductPage() {
  const { type } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const product = PRODUCTS[type]

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  if (!product) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-lg font-semibold mb-2">Unknown product</p>
          <Link to="/dashboard" className="text-crimson-400 hover:text-crimson-300 text-sm">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data } = await axios.post(`${API}${product.endpoint}`, { url: url.trim() })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Scan failed. Check the URL and try again.')
    }
    setLoading(false)
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const results = result?.results || result?.checks || result?.findings || []
  const passed = results.filter((r) => r.passed ?? r.status === 'Pass').length
  const failed = results.filter((r) => !(r.passed ?? r.status === 'Pass')).length

  return (
    <div className="min-h-screen page-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/scanner-dashboard"
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        {/* Page title */}
        <div className="mb-8">
          <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${product.badge}`}>
            Security Tool
          </span>
          <h1 className="text-3xl font-extrabold text-white mb-2">{product.title}</h1>
          <p className="text-gray-400">{product.subtitle}</p>
        </div>

        {/* Scan form */}
        <form onSubmit={handleScan} className="flex gap-3 mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.com"
            required
            className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-sm outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors shrink-0"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning…</>
              : <><ScanLine className="w-4 h-4" /> Run Scan</>}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Grade',       value: result.securityGrade ?? '—', highlight: false },
                { label: 'Score',       value: result.securityScore != null ? `${result.securityScore}/100` : '—', highlight: false },
                { label: 'Passed',      value: passed, highlight: false, green: true },
                { label: 'Failed',      value: failed, highlight: true },
              ].map(({ label, value, highlight, green }) => (
                <div key={label} className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                  <p className={`text-2xl font-extrabold ${highlight ? 'text-red-400' : green ? 'text-green-400' : 'text-white'}`}>
                    {value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Result rows */}
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Scan Results</p>
                <p className="text-xs text-gray-500">{results.length} checks</p>
              </div>
              {results.length === 0 && (
                <p className="text-gray-500 text-sm py-10 text-center">No results returned.</p>
              )}
              {results.map((item, i) => (
                <ResultRow key={i} item={item} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
