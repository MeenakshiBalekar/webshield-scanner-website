import React, { useState } from 'react'
import {
  FlaskConical, ScanLine, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Lock, Shield,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV_STYLE = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         dot: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       dot: 'bg-blue-400'   },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       dot: 'bg-gray-400'   },
}
function sevStyle(s) { return SEV_STYLE[s] || SEV_STYLE.Info }

const TEST_TYPES = [
  {
    key: 'idor',
    label: 'IDOR',
    desc: 'Insecure Direct Object Reference — access other users\' resources by manipulating IDs.',
  },
  {
    key: 'workflowBypass',
    label: 'Workflow Bypass',
    desc: 'Skip required steps in multi-step flows (checkout, approval, verification).',
  },
  {
    key: 'priceManipulation',
    label: 'Price / Quantity Manipulation',
    desc: 'Alter pricing, discount codes, or quantities in requests to get unauthorized discounts.',
  },
  {
    key: 'raceConditions',
    label: 'Race Conditions',
    desc: 'Send concurrent requests to exploit TOCTOU issues (double-spend, duplicate redemptions).',
  },
]

function FindingCard({ item }) {
  const [open, setOpen] = useState(false)
  const name    = field(item, 'checkName', 'CheckName', 'name', 'Name', 'title', 'Title') ?? 'Finding'
  const sev     = field(item, 'severity', 'Severity') ?? 'Medium'
  const desc    = field(item, 'description', 'Description', 'technicalDetails', 'TechnicalDetails')
  const impact  = field(item, 'businessImpact', 'BusinessImpact', 'impact', 'Impact')
  const fix     = field(item, 'recommendation', 'Recommendation', 'fix', 'Fix')
  const testType = field(item, 'testType', 'TestType', 'type', 'Type')
  const style   = sevStyle(sev)

  return (
    <div className={`border rounded-xl overflow-hidden ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{name}</p>
          {testType && <p className="text-[10px] text-gray-500 mt-0.5">{testType}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
            {sev}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          {desc && <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>}
          {impact && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Business Impact</p>
              <p className="text-xs text-gray-300 leading-relaxed">{impact}</p>
            </div>
          )}
          {fix && (
            <div className="bg-green-950/40 border border-green-800/40 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-gray-300 leading-relaxed">{Array.isArray(fix) ? fix.join(' ') : fix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BizLogicPage() {
  const [targetUrl, setTargetUrl]   = useState('')
  const [tests, setTests]           = useState({ idor: true, workflowBypass: true, priceManipulation: false, raceConditions: false })
  const [authEnabled, setAuthEnabled] = useState(false)
  const [authForm, setAuthForm]     = useState({ loginUrl: '', username: '', password: '', bearerToken: '' })
  const [authType, setAuthType]     = useState('formlogin')
  const [scanning, setScanning]     = useState(false)
  const [results, setResults]       = useState(null)
  const [error, setError]           = useState(null)

  const setAuth = (k) => (e) => setAuthForm(f => ({ ...f, [k]: e.target.value }))
  const toggleTest = (key) => setTests(t => ({ ...t, [key]: !t[key] }))

  const selectedTests = Object.entries(tests).filter(([, v]) => v).map(([k]) => k)

  const handleScan = async (e) => {
    e.preventDefault()
    if (!targetUrl.trim()) return
    if (selectedTests.length === 0) { setError('Select at least one test type.'); return }
    setScanning(true); setError(null); setResults(null)
    try {
      const token = localStorage.getItem('ws_token')
      const payload = {
        url: targetUrl.trim(),
        tests: selectedTests,
        ...(authEnabled ? {
          auth: authType === 'bearer'
            ? { type: 'bearer', bearerToken: authForm.bearerToken }
            : { type: 'formlogin', loginUrl: authForm.loginUrl, username: authForm.username, password: authForm.password },
        } : {}),
      }
      const res = await fetch(`${BASE}/api/bizlogic/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const b = await res.json(); msg = b.error || b.message || msg } catch {}
        throw new Error(msg)
      }
      setResults(await res.json())
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const findings = results?.findings ?? results?.Findings ?? results?.results ?? results?.Results
    ?? (Array.isArray(results) ? results : [])
  const total    = results?.totalTests   ?? results?.TotalTests   ?? selectedTests.length
  const passed   = results?.passedTests  ?? results?.PassedTests  ?? null
  const failed   = results?.failedTests  ?? results?.FailedTests  ?? findings.length

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-violet-500/15 border border-violet-500/30 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Business Logic Testing</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
              Business Logic Vulnerability Testing
            </h1>
            <p className="text-gray-400 leading-relaxed">
              Test for logic flaws that automated scanners miss — IDOR, workflow bypass, price manipulation,
              and race conditions in your application flows.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <form onSubmit={handleScan} className="space-y-5">
            {/* Target URL */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-white">Target</p>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Target URL</label>
                <input
                  type="url" required value={targetUrl} onChange={e => setTargetUrl(e.target.value)}
                  placeholder="https://your-app.com"
                  className="w-full bg-white/5 border border-white/15 focus:border-violet-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                />
              </div>
            </div>

            {/* Test selection */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-bold text-white">Test Types</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {TEST_TYPES.map(({ key, label, desc }) => (
                  <label key={key} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    tests[key]
                      ? 'border-violet-500/40 bg-violet-500/8'
                      : 'border-white/10 bg-white/3 hover:bg-white/5'
                  }`}>
                    <input
                      type="checkbox" checked={tests[key]} onChange={() => toggleTest(key)}
                      className="mt-0.5 accent-violet-500 w-3.5 h-3.5 shrink-0"
                    />
                    <div>
                      <p className={`text-xs font-bold ${tests[key] ? 'text-violet-300' : 'text-gray-300'}`}>{label}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Auth */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-500" /> Authentication
                  <span className="text-[10px] text-gray-600 font-normal">(optional)</span>
                </p>
                <button
                  type="button"
                  onClick={() => setAuthEnabled(v => !v)}
                  className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors ${
                    authEnabled ? 'bg-violet-500' : 'bg-white/15'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${authEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              {authEnabled && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {['formlogin', 'bearer'].map(t => (
                      <button key={t} type="button" onClick={() => setAuthType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                          authType === t
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                            : 'border-white/10 text-gray-400 hover:text-gray-200'
                        }`}>
                        {t === 'formlogin' ? 'Form Login' : 'Bearer Token'}
                      </button>
                    ))}
                  </div>

                  {authType === 'bearer' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Bearer Token</label>
                      <input
                        type="password" value={authForm.bearerToken} onChange={setAuth('bearerToken')}
                        placeholder="eyJhbGciOi…"
                        className="w-full bg-white/5 border border-white/15 focus:border-violet-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono"
                      />
                    </div>
                  )}

                  {authType === 'formlogin' && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-400 mb-1.5">Login URL <span className="text-gray-600">(optional)</span></label>
                        <input value={authForm.loginUrl} onChange={setAuth('loginUrl')} placeholder="https://app.com/login"
                          className="w-full bg-white/5 border border-white/15 focus:border-violet-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Username / Email</label>
                        <input value={authForm.username} onChange={setAuth('username')} placeholder="user@example.com" autoComplete="off"
                          className="w-full bg-white/5 border border-white/15 focus:border-violet-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1.5">Password</label>
                        <input type="password" value={authForm.password} onChange={setAuth('password')} placeholder="••••••••" autoComplete="new-password"
                          className="w-full bg-white/5 border border-white/15 focus:border-violet-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors" />
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-amber-500 flex items-start gap-1.5">
                    <span className="shrink-0">⚠</span>
                    Credentials are sent directly to your target site. WebShield does not store them.
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit" disabled={scanning || selectedTests.length === 0}
              className="flex items-center gap-2 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-500/50 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              {scanning
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Testing…</>
                : <><ScanLine className="w-4 h-4" /> Run Business Logic Tests</>}
            </button>
          </form>

          {/* Results */}
          {results && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-white">{total ?? selectedTests.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Tests Run</p>
                </div>
                <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-red-400">{failed ?? findings.length}</p>
                  <p className="text-xs text-gray-500 mt-1">Issues Found</p>
                </div>
                <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
                  <p className={`text-2xl font-extrabold ${findings.length === 0 ? 'text-green-400' : 'text-gray-400'}`}>
                    {passed ?? (total != null ? total - findings.length : '—')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Passed</p>
                </div>
              </div>

              {/* Findings */}
              <div>
                <h2 className="text-sm font-bold text-white mb-3">
                  Findings{findings.length > 0 ? ` (${findings.length})` : ''}
                </h2>
                {findings.length === 0 ? (
                  <div className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">No business logic issues found</p>
                    <p className="text-xs text-gray-500 mt-1">All tested logic flows behaved as expected.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {findings.map((f, i) => <FindingCard key={i} item={f} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
