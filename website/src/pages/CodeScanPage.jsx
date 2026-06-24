import React, { useState } from 'react'
import {
  FileCode2, ScanLine, Loader2, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, Eye, EyeOff, Trash2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { scanCodeText } from '../services/api'

/* ── helpers ── */
const SEVERITY_STYLES = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         dot: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       dot: 'bg-blue-400'   },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       dot: 'bg-gray-400'   },
}
const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }
function sevStyle(s) { return SEVERITY_STYLES[s] || SEVERITY_STYLES.Info }

function redact(val) {
  if (!val || typeof val !== 'string') return val
  if (val.length <= 8) return '••••••••'
  return val.slice(0, 4) + '•'.repeat(Math.min(val.length - 8, 12)) + val.slice(-4)
}

/* ── CVE Similarity helpers ── */
function cveSimilarityStyle(score) {
  if (score >= 80) return 'text-red-400 bg-red-500/10 border-red-500/30'
  if (score >= 50) return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
  return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
}

/* ── Finding row ── */
function FindingRow({ finding }) {
  const [open, setOpen]       = useState(false)
  const [reveal, setReveal]   = useState(false)
  const [cveOpen, setCveOpen] = useState(false)

  const checkName     = field(finding, 'checkName', 'CheckName', 'type', 'Type', 'name', 'Name', 'rule', 'Rule')
  const severity      = field(finding, 'severity', 'Severity')
  const file          = field(finding, 'file', 'File', 'filename', 'Filename', 'path', 'Path')
  const line          = field(finding, 'line', 'Line', 'lineNumber', 'LineNumber')
  const value         = field(finding, 'value', 'Value', 'secret', 'Secret', 'match', 'Match')
  const context       = field(finding, 'context', 'Context', 'snippet', 'Snippet')
  const rec           = field(finding, 'recommendation', 'Recommendation', 'fix', 'Fix')
  const desc          = field(finding, 'description', 'Description')
  const isSecret      = !!(value)
  const style         = sevStyle(severity)

  const similarityCves = (finding.similarityCves ?? finding.SimilarityCves ?? finding.cveSimilarity ?? finding.CveSimilarity ?? [])
  const topCve = similarityCves.length > 0
    ? [...similarityCves].sort((a, b) => (b.score ?? b.Score ?? 0) - (a.score ?? a.Score ?? 0))[0]
    : null
  const topScore = topCve ? (topCve.score ?? topCve.Score ?? 0) : 0
  const topLabel = topCve ? (topCve.label ?? topCve.Label ?? topCve.cveId ?? topCve.CveId ?? topCve.id ?? '') : ''

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{checkName}</p>
          {(file || line) && (
            <p className="text-[10px] text-gray-500 font-mono truncate">
              {file}{line ? `:${line}` : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {topCve && (
            <button
              onClick={e => { e.stopPropagation(); setCveOpen(v => !v); setOpen(true) }}
              className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${cveSimilarityStyle(topScore)}`}
            >
              {topScore}% {topLabel ? `— ${topLabel}` : 'CVE match'}
            </button>
          )}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${style.badge}`}>
            {severity || 'Info'}
          </span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          {desc && <p className="text-sm text-gray-400">{desc}</p>}

          {similarityCves.length > 0 && (
            <div>
              <button
                onClick={() => setCveOpen(v => !v)}
                className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-white transition-colors mb-1"
              >
                🧬 CVE Similarity
                {cveOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {cveOpen && (
                <div className="space-y-2">
                  {similarityCves.map((cve, i) => {
                    const score  = cve.score       ?? cve.Score       ?? 0
                    const cveId  = cve.cveId       ?? cve.CveId       ?? cve.id ?? `CVE-${i}`
                    const cveDesc = cve.description ?? cve.Description ?? null
                    return (
                      <div key={i} className={`rounded-lg px-3 py-2 border text-xs ${cveSimilarityStyle(score)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-[10px]">{score}%</span>
                          <span className="font-mono font-bold">{cveId}</span>
                        </div>
                        {cveDesc && <p className="text-gray-300 leading-relaxed">{cveDesc}</p>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {isSecret && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Secret Value</p>
                <button
                  onClick={() => setReveal(r => !r)}
                  className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors"
                >
                  {reveal ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {reveal ? 'Hide' : 'Reveal'}
                </button>
              </div>
              <code className="block bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-red-300 break-all">
                {reveal ? value : redact(value)}
              </code>
            </div>
          )}

          {context && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Code Context</p>
              <pre className="bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono overflow-x-auto max-h-32 whitespace-pre">
                {context}
              </pre>
            </div>
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

/* ── Main page ── */
export default function CodeScanPage() {
  const [code, setCode]           = useState('')
  const [filename, setFilename]   = useState('snippet.js')
  const [scanning, setScanning]   = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [sevFilter, setSevFilter] = useState('')

  const handleScan = async (e) => {
    e.preventDefault()
    if (!code.trim()) { setError('Paste some code first.'); return }
    setScanning(true); setError(null); setResults(null)
    try {
      const data = await scanCodeText({ files: [{ name: filename, content: code }] })
      setResults(data)
    } catch (err) {
      setError('Scan failed')
    }
    setScanning(false)
  }

  const handleClear = () => { setCode(''); setResults(null); setError(null); setSevFilter('') }

  const findings   = results?.findings ?? results?.Findings ?? []
  const severities = ['Critical', 'High', 'Medium', 'Low', 'Info']
  const filtered   = sevFilter
    ? findings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === sevFilter)
    : findings
  const counts = severities.reduce((acc, s) => {
    acc[s] = findings.filter(f => (field(f, 'severity', 'Severity') || 'Info') === s).length
    return acc
  }, {})

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-teal-500/15 border border-teal-500/30 rounded-lg flex items-center justify-center">
                <FileCode2 className="w-4 h-4 text-teal-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Code Security Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Scan Code for Secrets & Vulnerabilities</h1>
            <p className="text-gray-400 leading-relaxed">
              Paste any source code below. Udyo360 detects hardcoded secrets, weak algorithms, SQL injection,
              and insecure patterns — findings grouped by severity with redacted values.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {/* Scan form */}
          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-4">

            {/* Filename (optional context) */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1.5">Filename <span className="text-gray-600">(optional — helps with context)</span></label>
                <input
                  value={filename}
                  onChange={e => setFilename(e.target.value)}
                  placeholder="e.g. Config.cs, .env, main.py"
                  className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2 rounded-xl text-sm outline-none transition-colors font-mono"
                />
              </div>
            </div>

            {/* Code textarea — always visible */}
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Code</label>
              <textarea
                rows={14}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`Paste your code here, for example:\n\nvar password = "Admin1234!";\nvar apiKey = "abc123xyz";\nMD5.Create();\nnew HttpClient();\nvar sql = "SELECT * FROM users WHERE id = " + userId;`}
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm outline-none transition-colors resize-y font-mono leading-relaxed"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={scanning}
                className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
              >
                {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                {scanning ? 'Scanning…' : 'Run Security Scan'}
              </button>
              {code && !scanning && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </form>

          {/* Results */}
          {results && (
            <div className="space-y-5">
              {/* Summary stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {severities.map((s) => {
                  const style = sevStyle(s)
                  return (
                    <div key={s} className="bg-white/3 border border-white/10 rounded-xl px-3 py-3 text-center">
                      <div className={`text-xl font-extrabold ${style.badge.split(' ')[0]}`}>{counts[s]}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{s}</div>
                    </div>
                  )
                })}
              </div>

              {/* Severity filter pills */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSevFilter('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    !sevFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'
                  }`}
                >
                  All ({findings.length})
                </button>
                {severities.filter(s => counts[s] > 0).map(s => {
                  const style = sevStyle(s)
                  return (
                    <button
                      key={s}
                      onClick={() => setSevFilter(sevFilter === s ? '' : s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        sevFilter === s
                          ? `${style.badge} border-current`
                          : 'bg-white/5 border-white/15 text-gray-400 hover:text-white'
                      }`}
                    >
                      {s} ({counts[s]})
                    </button>
                  )
                })}
              </div>

              {/* Empty state */}
              {filtered.length === 0 && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                  <p className="text-white font-semibold">
                    {findings.length === 0 ? 'No issues found' : 'No issues match this filter'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {findings.length === 0 ? 'Your code looks clean.' : 'Try a different severity filter.'}
                  </p>
                </div>
              )}

              {/* Finding list */}
              {filtered.length > 0 && (
                <div className="space-y-2">
                  {filtered.map((f, i) => <FindingRow key={i} finding={f} />)}
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
