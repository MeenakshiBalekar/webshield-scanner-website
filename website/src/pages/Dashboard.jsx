import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, LogOut, Loader2, AlertCircle, CheckCircle, XCircle, ScanLine } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { API } from '../context/AuthContext'

const PRODUCTS = [
  { id: 'web',   label: 'Web Vulnerability Scanner', endpoint: '/scan/headers' },
  { id: 'api',   label: 'API Security',              endpoint: '/products/api-security' },
  { id: 'owasp', label: 'OWASP Scanner',             endpoint: '/products/owasp-scan' },
  { id: 'xss',   label: 'XSS Detector',              endpoint: '/products/xss-scan' },
  { id: 'sqli',  label: 'SQLi Tester',               endpoint: '/products/sqli-scan' },
]

function ResultItem({ item }) {
  const passed = item.passed ?? item.status === 'Pass'
  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="mt-0.5 shrink-0">
        {passed
          ? <CheckCircle className="w-4 h-4 text-green-400" />
          : <XCircle className="w-4 h-4 text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{item.checkName || item.name || item.header}</p>
        {item.details && <p className="text-xs text-gray-400 mt-0.5">{item.details}</p>}
        {item.recommendation && <p className="text-xs text-crimson-400 mt-0.5">{item.recommendation}</p>}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const validTabs = PRODUCTS.map((p) => p.id)
  const initialTab = validTabs.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'web'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    const product = PRODUCTS.find((p) => p.id === activeTab)
    try {
      const { data } = await axios.post(`${API}${product.endpoint}`, { url: url.trim() })
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Scan failed')
    }
    setLoading(false)
  }

  const results = result?.results || result?.checks || result?.findings || []
  const grade = result?.securityGrade
  const score = result?.securityScore
  const passed = results.filter((r) => r.passed ?? r.status === 'Pass').length
  const failed = results.filter((r) => !(r.passed ?? r.status === 'Pass')).length

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
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
        <h1 className="text-2xl font-bold text-white mb-6">Security Dashboard</h1>

        {/* Product tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {PRODUCTS.map((p) => (
            <button
              key={p.id}
              onClick={() => { setActiveTab(p.id); setResult(null); setError(null) }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                activeTab === p.id
                  ? 'bg-crimson-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Scan form */}
        <form onSubmit={handleScan} className="flex gap-3 mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://your-app.com"
            required
            className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {loading ? 'Scanning…' : 'Scan'}
          </button>
        </form>

        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-extrabold text-white">{grade ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">Grade</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-extrabold text-white">{score ?? '—'}</p>
                <p className="text-xs text-gray-400 mt-1">Score / 100</p>
              </div>
              <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-3xl font-extrabold text-red-400">{failed}</p>
                <p className="text-xs text-gray-400 mt-1">Failed checks</p>
              </div>
            </div>

            {/* Results list */}
            <div className="bg-white/3 border border-white/10 rounded-2xl px-4 divide-y divide-white/5">
              {results.length === 0 && (
                <p className="text-gray-500 text-sm py-8 text-center">No results returned.</p>
              )}
              {results.map((item, i) => (
                <ResultItem key={i} item={item} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
