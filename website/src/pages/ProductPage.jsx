import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Shield, LogOut, ScanLine, Loader2, AlertCircle,
  CheckCircle, XCircle, ChevronDown, ChevronUp,
  LayoutDashboard, FileText, Download, Mail, Send,
} from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { API } from '../context/AuthContext'
import { getRemediation, downloadReportPdf, emailReport } from '../services/api'

const PRODUCTS = {
  web: {
    title: 'Web Vulnerability Scanner',
    subtitle: 'Detect misconfigured security headers, exposed endpoints, and common web vulnerabilities.',
    endpoint: '/scan/headers',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  },
  api: {
    title: 'API Security',
    subtitle: 'Test API endpoints for authentication flaws, improper access controls, and data exposure risks.',
    endpoint: '/products/api-security',
    badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
  },
  owasp: {
    title: 'OWASP Scanner',
    subtitle: 'Validate your application against the OWASP Top 10 — the most critical web security risks.',
    endpoint: '/products/owasp-scan',
    badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  },
  xss: {
    title: 'XSS Detector',
    subtitle: 'Identify Cross-Site Scripting vulnerabilities and content injection risks across your pages.',
    endpoint: '/products/xss-scan',
    badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  },
  sqli: {
    title: 'SQLi Tester',
    subtitle: 'Detect SQL injection vulnerabilities and assess your database exposure risk.',
    endpoint: '/products/sqli-scan',
    badge: 'bg-red-500/15 text-red-400 border-red-500/30',
  },
}

function ResultRow({ item }) {
  const [open, setOpen] = useState(false)
  const [extra, setExtra] = useState(null)
  const [loadingExtra, setLoadingExtra] = useState(false)

  const passed = item.passed ?? item.status === 'Pass'
  const checkName = item.checkName || item.name || item.header || 'Unknown check'

  const handleToggle = async () => {
    if (!open && !passed && !extra && !item.impact) {
      setLoadingExtra(true)
      try {
        const data = await getRemediation(checkName)
        setExtra(data)
      } catch { /* backend may not have this check */ }
      setLoadingExtra(false)
    }
    setOpen((v) => !v)
  }

  // Support both new backend fields (item.impact / item.consequence)
  // and legacy remediation endpoint response
  const impact = item.impact || item.riskDescription || extra?.impact || extra?.riskDescription
  const consequence = item.consequence || item.ifNotFixed || extra?.consequence || extra?.ifNotFixed
  const fix = item.recommendation || item.remediation || extra?.recommendation || extra?.fix

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={handleToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
      >
        <div className="shrink-0 mt-0.5">
          {passed
            ? <CheckCircle className="w-4 h-4 text-green-400" />
            : <XCircle className="w-4 h-4 text-red-400" />}
        </div>
        <span className="flex-1 text-sm font-medium text-white">{checkName}</span>
        {loadingExtra
          ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500 shrink-0" />
          : open
            ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-11 pb-4 space-y-2.5">
          {item.details && (
            <p className="text-xs text-gray-400">{item.details}</p>
          )}
          {impact && (
            <div className="bg-orange-500/8 border border-orange-500/20 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-orange-400 mb-1">Why this is a risk</p>
              <p className="text-xs text-gray-300 leading-relaxed">{impact}</p>
            </div>
          )}
          {consequence && (
            <div className="bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-red-400 mb-1">If left unfixed</p>
              <p className="text-xs text-gray-300 leading-relaxed">{consequence}</p>
            </div>
          )}
          {fix && (
            <div className="bg-green-500/8 border border-green-500/20 rounded-lg px-3 py-2.5">
              <p className="text-xs font-semibold text-green-400 mb-1">How to fix</p>
              <p className="text-xs text-gray-300 leading-relaxed">{fix}</p>
            </div>
          )}
          {!impact && !consequence && !fix && !item.details && !loadingExtra && (
            <p className="text-xs text-gray-500 italic">No additional details available.</p>
          )}
        </div>
      )}
    </div>
  )
}

function ReportPanel({ scanUrl, scanResult }) {
  const [reportEmail, setReportEmail] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [sending, setSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState(null)

  const buildPayload = () => ({
    targetUrl: scanUrl,
    securityGrade: scanResult.securityGrade,
    securityScore: scanResult.securityScore,
    failedChecks: scanResult.failedChecks,
    totalChecks: scanResult.totalChecks,
    scanDate: scanResult.scanDate || new Date().toISOString(),
    results: scanResult.results || scanResult.checks || scanResult.findings || [],
  })

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const blob = await downloadReportPdf(buildPayload())
      const objUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objUrl
      a.download = `webshield-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objUrl)
    } catch (err) {
      setError(err.message)
    }
    setDownloading(false)
  }

  const handleSendEmail = async () => {
    if (!reportEmail.trim()) return
    setSending(true)
    setError(null)
    setEmailSent(false)
    try {
      await emailReport({ ...buildPayload(), email: reportEmail.trim() })
      setEmailSent(true)
    } catch (err) {
      setError(err.message)
    }
    setSending(false)
  }

  return (
    <div className="mt-6 bg-white/3 border border-white/10 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-crimson-400" />
        <h2 className="text-sm font-semibold text-white">Scan Report</h2>
      </div>
      <p className="text-xs text-gray-400 mb-5">
        Download a full PDF report with vulnerability explanations, risk impact analysis, and remediation steps.
        Optionally send it straight to an inbox.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="email"
          value={reportEmail}
          onChange={(e) => setReportEmail(e.target.value)}
          placeholder="Recipient email (optional)"
          className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
        />
        <button
          onClick={handleSendEmail}
          disabled={sending || !reportEmail.trim()}
          className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 disabled:opacity-40 border border-white/15 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? 'Sending…' : 'Send to Email'}
        </button>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {downloading ? 'Generating PDF…' : 'Download PDF Report'}
      </button>

      {emailSent && (
        <div className="flex items-center gap-2 mt-3 text-green-400 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Report sent to <span className="font-semibold">{reportEmail}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 mt-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-3 py-2.5 text-xs">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
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
          <Link to="/scanner-dashboard" className="text-crimson-400 hover:text-crimson-300 text-sm">
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
            onClick={() => { logout(); navigate('/login') }}
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

        {/* Scan error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Grade',   value: result.securityGrade ?? '—',  color: 'text-white' },
                { label: 'Score',   value: result.securityScore != null ? `${result.securityScore}/100` : '—', color: 'text-white' },
                { label: 'Passed',  value: passed,  color: 'text-green-400' },
                { label: 'Failed',  value: failed,  color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                  <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Result rows */}
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-2">
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Scan Results</p>
                <p className="text-xs text-gray-500">{results.length} checks · click a row to see details</p>
              </div>
              {results.length === 0 && (
                <p className="text-gray-500 text-sm py-10 text-center">No results returned.</p>
              )}
              {results.map((item, i) => (
                <ResultRow key={i} item={item} />
              ))}
            </div>

            {/* Report panel */}
            <ReportPanel scanUrl={url} scanResult={result} />
          </>
        )}
      </main>
    </div>
  )
}
