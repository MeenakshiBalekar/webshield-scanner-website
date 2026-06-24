import React, { useState } from 'react'
import {
  Server, ScanLine, Loader2, AlertCircle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { startDnsScan } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }

const CHECK_META = {
  spf:         { label: 'SPF',          desc: 'Sender Policy Framework — prevents email spoofing' },
  dmarc:       { label: 'DMARC',        desc: 'Domain-based Message Authentication, Reporting & Conformance' },
  'dmarc policy': { label: 'DMARC Policy', desc: 'Enforcement policy: none / quarantine / reject' },
  dkim:        { label: 'DKIM',         desc: 'DomainKeys Identified Mail — cryptographic email signing' },
  caa:         { label: 'CAA',          desc: 'Certification Authority Authorization — restricts which CAs can issue certs' },
  mx:          { label: 'MX',           desc: 'Mail Exchange records — routes email delivery' },
  dnssec:      { label: 'DNSSEC',       desc: 'DNS Security Extensions — cryptographic signing of DNS records' },
  'mta-sts':   { label: 'MTA-STS',      desc: 'Mail Transfer Agent Strict Transport Security — enforces TLS for email' },
  'tls-rpt':   { label: 'TLS-RPT',      desc: 'TLS Reporting — SMTP TLS failure reports sent to a reporting address' },
  tlsrpt:      { label: 'TLS-RPT',      desc: 'TLS Reporting — SMTP TLS failure reports sent to a reporting address' },
  bimi:        { label: 'BIMI',         desc: 'Brand Indicators for Message Identification — email brand logo in inbox' },
}

function checkMeta(checkName) {
  const key = (checkName ?? '').toLowerCase()
  for (const [k, v] of Object.entries(CHECK_META)) {
    if (key.includes(k)) return v
  }
  return { label: checkName, desc: '' }
}

function StatusBadge({ status }) {
  const s = (status ?? '').toLowerCase()
  const passed = s === 'passed' || s === 'pass' || s === 'ok'
  if (passed) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-2 py-0.5 rounded-full">
        <CheckCircle2 className="w-3.5 h-3.5" /> Pass
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-full">
      <XCircle className="w-3.5 h-3.5" /> Fail
    </span>
  )
}

function SeverityChip({ severity }) {
  if (!severity) return null
  const map = {
    Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
    High:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
    Medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    Low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
    Info:     'text-gray-400 bg-gray-500/10 border-gray-500/30',
  }
  const cls = map[severity] || map.Info
  return (
    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${cls}`}>{severity}</span>
  )
}

function FindingRow({ finding, idx }) {
  const [open, setOpen] = useState(false)
  const checkName   = field(finding, 'checkName', 'CheckName', 'name', 'Name', 'check', 'Check')
  const status      = field(finding, 'status', 'Status')
  const severity    = field(finding, 'severity', 'Severity')
  const rec         = field(finding, 'recommendation', 'Recommendation', 'fix', 'Fix')
  const details     = field(finding, 'technicalDetails', 'TechnicalDetails', 'description', 'Description', 'details', 'Details', 'evidence', 'Evidence')
  const value       = field(finding, 'value', 'Value', 'record', 'Record')
  const { label, desc } = checkMeta(checkName)
  const isPassed    = (status ?? '').toLowerCase() === 'passed' || (status ?? '').toLowerCase() === 'pass'

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : isPassed ? 'border-white/5' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-4 px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
      >
        <div className="w-6 shrink-0 text-center text-xs text-gray-600 font-mono">{idx + 1}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{label}</p>
            <SeverityChip severity={severity} />
          </div>
          {desc && <p className="text-[10px] text-gray-500 mt-0.5">{desc}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={status} />
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-3 text-sm">
          {value && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Record Value</p>
              <code className="block bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono break-all">{value}</code>
            </div>
          )}
          {details && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Details</p>
              <p className="text-sm text-gray-300">{details}</p>
            </div>
          )}
          {rec && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Recommendation</p>
              <p className="text-sm text-green-300">{rec}</p>
            </div>
          )}
          {!details && !rec && !value && (
            <p className="text-xs text-gray-600">No additional details available.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function DnsScanPage() {
  const [domain, setDomain]     = useState('')
  const [scanning, setScanning] = useState(false)
  const [results, setResults]   = useState(null)
  const [error, setError]       = useState(null)
  const [filter, setFilter]     = useState('all')

  const handleScan = async (e) => {
    e.preventDefault()
    let d = domain.trim()
    if (!d) { setError('Enter a domain name.'); return }
    // strip protocol if pasted as URL
    d = d.replace(/^https?:\/\//i, '').replace(/\/.*$/, '')
    setScanning(true); setError(null); setResults(null)
    try {
      const data = await startDnsScan(d)
      setResults(data)
    } catch (err) {
      setError('DNS scan failed')
    }
    setScanning(false)
  }

  const findings   = results?.findings ?? results?.Findings ?? results?.checks ?? results?.Checks ?? []
  const summary    = results?.summary  ?? results?.Summary  ?? {}
  const domainName = results?.domain   ?? results?.Domain   ?? domain

  const passed  = findings.filter(f => { const s = (field(f,'status','Status')||'').toLowerCase(); return s === 'passed' || s === 'pass' || s === 'ok' })
  const failed  = findings.filter(f => { const s = (field(f,'status','Status')||'').toLowerCase(); return s !== 'passed' && s !== 'pass' && s !== 'ok' })

  const display = filter === 'failed' ? failed : filter === 'passed' ? passed : findings

  const summaryFailed = summary.failed ?? summary.Failed ?? failed.length
  const summaryTotal  = summary.total  ?? summary.Total  ?? findings.length
  const summaryHigh   = summary.high   ?? summary.High   ?? 0
  const summaryMedium = summary.medium ?? summary.Medium ?? 0

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-500/15 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                <Server className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">DNS Security Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">DNS & Email Security Check</h1>
            <p className="text-gray-400 leading-relaxed">
              Verify SPF, DMARC, DKIM, CAA, and MX records to protect your domain from
              email spoofing, phishing, and certificate mis-issuance.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
              />
              <p className="text-[10px] text-gray-600 mt-1">Protocol (https://) is stripped automatically.</p>
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
              {scanning ? 'Scanning DNS…' : 'Run DNS Check'}
            </button>
          </form>

          {/* What we check */}
          {!results && !scanning && (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" /> Checks performed
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.values(CHECK_META).map(({ label, desc }) => (
                  <div key={label} className="bg-white/3 border border-white/10 rounded-xl px-3 py-2.5">
                    <p className="text-xs font-bold text-white font-mono">{label}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-5">
              {/* Domain + summary */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Domain scanned</p>
                    <p className="text-white font-bold font-mono text-lg">{domainName}</p>
                  </div>
                  <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full border ${
                    summaryFailed === 0
                      ? 'text-green-400 bg-green-500/10 border-green-500/30'
                      : 'text-red-400 bg-red-500/10 border-red-500/30'
                  }`}>
                    {summaryFailed === 0
                      ? <><CheckCircle2 className="w-4 h-4" /> All checks passed</>
                      : <><XCircle className="w-4 h-4" /> {summaryFailed} check{summaryFailed !== 1 ? 's' : ''} failed</>
                    }
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[64px]">
                    <div className="text-xl font-extrabold text-white">{summaryTotal}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Total</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[64px]">
                    <div className="text-xl font-extrabold text-green-400">{passed.length}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Passed</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[64px]">
                    <div className="text-xl font-extrabold text-red-400">{failed.length}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Failed</div>
                  </div>
                  {summaryHigh > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-3 text-center min-w-[64px]">
                      <div className="text-xl font-extrabold text-orange-400">{summaryHigh}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">High</div>
                    </div>
                  )}
                  {summaryMedium > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-center min-w-[64px]">
                      <div className="text-xl font-extrabold text-yellow-400">{summaryMedium}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">Medium</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filter pills */}
              {findings.length > 0 && (
                <div className="flex gap-2">
                  {[
                    { key: 'all',    label: `All (${findings.length})` },
                    { key: 'failed', label: `Failed (${failed.length})` },
                    { key: 'passed', label: `Passed (${passed.length})` },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        filter === key
                          ? 'bg-crimson-500 text-white'
                          : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Findings table */}
              {display.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                  <p className="text-white font-semibold">No findings for this filter.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {display.map((f, i) => <FindingRow key={i} finding={f} idx={i} />)}
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
