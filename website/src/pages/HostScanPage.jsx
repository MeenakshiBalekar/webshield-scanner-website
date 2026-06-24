import React, { useState, useEffect, useCallback } from 'react'
import {
  Server, ScanLine, Loader2, AlertCircle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Key, Lock, Terminal, RefreshCw, Info,
  ShieldCheck, Wifi, Package, HardDrive, Cpu, UserCheck, FileText,
  Shield, Settings, ClipboardList, Bug,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getHostChecks, startHostScan } from '../services/api'

/* ── helpers ── */
const STATUS_STYLES = {
  Pass:         'text-green-400 bg-green-500/10 border-green-500/30',
  Fail:         'text-red-400 bg-red-500/10 border-red-500/30',
  Warning:      'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Error:        'text-orange-400 bg-orange-500/10 border-orange-500/30',
  AccessDenied: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}
const SEVERITY_STYLES = {
  Critical: 'text-red-400',
  High:     'text-orange-400',
  Medium:   'text-yellow-400',
  Low:      'text-blue-400',
  Info:     'text-gray-400',
}
const CATEGORY_ICONS = {
  Authentication:       Lock,
  'Account Security':   UserCheck,
  Network:              Wifi,
  Patching:             Package,
  'Software Vulnerability': Bug,
  Filesystem:           HardDrive,
  'File Permissions':   HardDrive,
  Services:             Cpu,
  'System Services':    Cpu,
  'Kernel Hardening':   Settings,
  'Audit & Logging':    ClipboardList,
  Compliance:           Shield,
}

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }

function statusStyle(s) { return STATUS_STYLES[s] || STATUS_STYLES.Error }
function sevStyle(s)    { return SEVERITY_STYLES[s] || SEVERITY_STYLES.Info }

/* ── Category summary bar ── */
function CategoryPill({ cat, findings }) {
  const total   = findings.length
  const passed  = findings.filter(f => field(f,'status','Status') === 'Pass').length
  const failed  = total - passed
  const Icon    = CATEGORY_ICONS[cat] || Server
  return (
    <div className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
      <Icon className="w-4 h-4 text-crimson-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white">{cat}</p>
        <p className="text-[10px] text-gray-500">{passed}/{total} passed</p>
      </div>
      {failed > 0 && (
        <span className="text-xs font-bold text-red-400">{failed} fail</span>
      )}
    </div>
  )
}

/* ── Single finding row ── */
function FindingRow({ finding }) {
  const [open, setOpen] = useState(false)

  const check     = field(finding, 'checkName', 'CheckName', 'check', 'name', 'Name')
  const status    = field(finding, 'status', 'Status')
  const severity  = field(finding, 'severity', 'Severity')
  const evidence  = field(finding, 'evidence', 'Evidence')
  const compRef   = field(finding, 'complianceReference', 'ComplianceReference', 'compliance_reference')
  const rec       = field(finding, 'recommendation', 'Recommendation')
  const desc      = field(finding, 'description', 'Description')
  const cveId     = field(finding, 'cveId', 'CveId', 'cve_id', 'CVE')
  const cvssScore = field(finding, 'cvssScore', 'CvssScore', 'cvss_score')
  const isPassed  = status === 'Pass'

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        {isPassed
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        }
        <span className="flex-1 text-sm font-medium text-white min-w-0 truncate">{check}</span>
        <div className="flex items-center gap-2 shrink-0">
          {cveId && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30 hidden sm:block">
              {cveId}
            </span>
          )}
          {severity && (
            <span className={`text-[10px] font-semibold uppercase ${sevStyle(severity)}`}>{severity}</span>
          )}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyle(status)}`}>
            {status}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          {desc && <p className="text-sm text-gray-400">{desc}</p>}

          {/* CVE / CVSS chips */}
          {(cveId || cvssScore) && (
            <div className="flex flex-wrap gap-2">
              {cveId && (
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${cveId}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 transition-colors"
                >
                  {cveId}
                </a>
              )}
              {cvssScore && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-500/10 text-purple-400 border-purple-500/30">
                  CVSS {Number(cvssScore).toFixed(1)}
                </span>
              )}
            </div>
          )}

          {evidence && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Evidence</p>
              <pre className="bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                {typeof evidence === 'string' ? evidence : JSON.stringify(evidence, null, 2)}
              </pre>
            </div>
          )}
          {compRef && (
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-300">Compliance: </span>{compRef}
            </p>
          )}
          {rec && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Recommendation</p>
              <p className="text-sm text-gray-300">{rec}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Severity breakdown ── */
function SeverityBar({ findings }) {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
  findings.forEach(f => {
    const sev = field(f, 'severity', 'Severity')
    if (sev in counts) counts[sev]++
  })
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  const colors = { Critical: 'bg-red-500', High: 'bg-orange-500', Medium: 'bg-yellow-400', Low: 'bg-blue-400' }

  return (
    <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Severity Breakdown</p>
      <div className="flex h-2.5 rounded-full overflow-hidden mb-3">
        {Object.entries(counts).map(([sev, cnt]) =>
          cnt > 0 ? (
            <div key={sev} className={`${colors[sev]}`} style={{ width: `${(cnt / total) * 100}%` }} />
          ) : null
        )}
      </div>
      <div className="flex flex-wrap gap-4">
        {Object.entries(counts).map(([sev, cnt]) => (
          <div key={sev} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${colors[sev]}`} />
            <span className="text-xs text-gray-400">{sev}: <span className="text-white font-semibold">{cnt}</span></span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function HostScanPage() {
  const [authType, setAuthType]   = useState('password')
  const [form, setForm]           = useState({ host: '', port: '22', username: 'root', password: '', privateKey: '' })
  const [scanning, setScanning]   = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [checks, setChecks]       = useState([])
  const [showChecks, setShowChecks] = useState(false)
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    getHostChecks().then(setChecks).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleScan = async (e) => {
    e.preventDefault()
    setScanning(true); setError(null); setResults(null)
    try {
      const payload = {
        host:     form.host,
        port:     parseInt(form.port, 10) || 22,
        username: form.username,
        authType,
        ...(authType === 'password' ? { password: form.password } : { privateKey: form.privateKey }),
      }
      const data = await startHostScan(payload)
      setResults(data)
    } catch (err) {
      setError('Scan failed')
    }
    setScanning(false)
  }

  /* grouped findings */
  const findings = results?.findings ?? results?.Findings ?? []
  const categories = [...new Set(findings.map(f => field(f, 'category', 'Category') || 'Other'))]
  const filtered = catFilter ? findings.filter(f => (field(f, 'category', 'Category') || 'Other') === catFilter) : findings
  const passed  = findings.filter(f => field(f,'status','Status') === 'Pass').length
  const failed  = findings.length - passed

  const inputCls = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-orange-500/15 border border-orange-500/30 rounded-lg flex items-center justify-center">
                <Server className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-400">Host Security Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Agentless Linux Audit</h1>
            <p className="text-gray-400">
              SSH into your Linux host and run 18 CIS-mapped checks across authentication, network, patching, filesystem, and services. Credentials are never logged or persisted.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {/* Check preview */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowChecks(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Preview checks {checks.length > 0 ? `(${checks.length})` : ''}</span>
              </div>
              {showChecks ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showChecks && checks.length > 0 && (
              <div className="border-t border-white/10 px-5 py-4 grid sm:grid-cols-2 gap-2">
                {checks.map((c, i) => {
                  const name = field(c, 'checkName', 'CheckName', 'name', 'Name')
                  const cat  = field(c, 'category', 'Category')
                  const sev  = field(c, 'severity', 'Severity')
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{name}</span>
                      {sev && <span className={`shrink-0 font-semibold ${sevStyle(sev)}`}>{sev}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Scan form */}
          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-crimson-400" /> SSH Connection
            </h2>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs text-gray-400 mb-1.5">Host / IP *</label>
                <input required value={form.host} onChange={set('host')} placeholder="192.168.1.10 or host.example.com"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Port</label>
                <input type="number" value={form.port} onChange={set('port')} min={1} max={65535}
                  className={inputCls} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Username *</label>
              <input required value={form.username} onChange={set('username')} placeholder="root"
                className={inputCls} />
            </div>

            {/* Auth type toggle */}
            <div>
              <label className="block text-xs text-gray-400 mb-2">Authentication</label>
              <div className="flex gap-2 mb-3">
                {['password', 'key'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAuthType(t)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      authType === t
                        ? 'bg-crimson-500 text-white'
                        : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'
                    }`}
                  >
                    {t === 'password' ? <Lock className="w-3.5 h-3.5" /> : <Key className="w-3.5 h-3.5" />}
                    {t === 'password' ? 'Password' : 'PEM Key'}
                  </button>
                ))}
              </div>

              {authType === 'password' ? (
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="SSH password"
                  className={inputCls}
                />
              ) : (
                <textarea
                  required
                  rows={6}
                  value={form.privateKey}
                  onChange={set('privateKey')}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                  className={`${inputCls} resize-none font-mono text-xs`}
                />
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
              <Lock className="w-3.5 h-3.5 text-green-400 shrink-0" />
              Credentials are held in memory only during the scan — never logged or persisted.
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={scanning}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {scanning ? 'Scanning…' : 'Start Host Scan'}
            </button>
          </form>

          {/* Results */}
          {results && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Checks', value: findings.length, color: 'text-white' },
                  { label: 'Passed',        value: passed,          color: 'text-green-400' },
                  { label: 'Failed',        value: failed,          color: 'text-red-400' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/3 border border-white/10 rounded-xl px-4 py-4 text-center">
                    <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              <SeverityBar findings={findings} />

              {/* Category grid */}
              {categories.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <CategoryPill
                      key={cat}
                      cat={cat}
                      findings={findings.filter(f => (field(f,'category','Category') || 'Other') === cat)}
                    />
                  ))}
                </div>
              )}

              {/* Category filter pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCatFilter('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!catFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'}`}
                >
                  All ({findings.length})
                </button>
                {categories.map((cat) => {
                  const cnt = findings.filter(f => (field(f,'category','Category') || 'Other') === cat).length
                  return (
                    <button
                      key={cat}
                      onClick={() => setCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'}`}
                    >
                      {cat} ({cnt})
                    </button>
                  )
                })}
              </div>

              {/* Findings — grouped by category when unfiltered */}
              {catFilter ? (
                <div className="space-y-2">
                  {filtered.map((f, i) => <FindingRow key={i} finding={f} />)}
                </div>
              ) : (
                <div className="space-y-6">
                  {categories.map((cat) => {
                    const catFindings = findings.filter(f => (field(f, 'category', 'Category') || 'Other') === cat)
                    const CatIcon = CATEGORY_ICONS[cat] || Server
                    const catFailed = catFindings.filter(f => field(f, 'status', 'Status') !== 'Pass').length
                    return (
                      <div key={cat}>
                        <div className="flex items-center gap-2 mb-2">
                          <CatIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <h3 className="text-sm font-bold text-gray-200">{cat}</h3>
                          {catFailed > 0 && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-1.5 py-0.5 rounded">
                              {catFailed} fail
                            </span>
                          )}
                        </div>
                        <div className="space-y-2">
                          {catFindings.map((f, i) => <FindingRow key={i} finding={f} />)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
