import React, { useState, useRef } from 'react'
import { Key, Upload, ScanLine, Loader2, AlertCircle, Eye, EyeOff, FileText } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { runSecretsScan } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         bar: 'bg-red-500',    row: 'border-red-500/20 bg-red-500/3'   },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', bar: 'bg-orange-500', row: 'border-orange-500/15 bg-orange-500/3' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', bar: 'bg-yellow-400', row: 'border-yellow-500/15 bg-yellow-500/3' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       bar: 'bg-blue-400',   row: 'border-white/10'                  },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       bar: 'bg-gray-400',   row: 'border-white/10'                  },
}
function sevStyle(s) { return SEV[(s ?? '').charAt(0).toUpperCase() + (s ?? '').slice(1)] || SEV.Info }

function entropyColor(score) {
  const n = parseFloat(score) || 0
  if (n >= 4.5) return 'text-red-400'
  if (n >= 3.5) return 'text-orange-400'
  if (n >= 2.5) return 'text-yellow-400'
  return 'text-gray-400'
}

function mask(val) {
  if (!val || typeof val !== 'string') return '••••••••'
  if (val.length <= 8) return '••••••••'
  return val.slice(0, 4) + '•'.repeat(Math.min(val.length - 8, 16)) + val.slice(-4)
}

/* ── Finding row ── */
function SecretRow({ finding }) {
  const [reveal, setReveal] = useState(false)

  const type     = field(finding, 'type', 'Type', 'secretType', 'SecretType', 'name', 'Name') ?? 'Unknown Secret'
  const sev      = field(finding, 'severity', 'Severity') ?? 'High'
  const file     = field(finding, 'file', 'File', 'filename', 'Filename', 'path', 'Path') ?? '—'
  const line     = field(finding, 'line', 'Line', 'lineNumber', 'LineNumber')
  const value    = field(finding, 'value', 'Value', 'secret', 'Secret', 'match', 'Match') ?? ''
  const entropy  = field(finding, 'entropy', 'Entropy', 'entropyScore', 'EntropyScore')
  const desc     = field(finding, 'description', 'Description', 'detail', 'Detail')
  const s        = sevStyle(sev)

  return (
    <div className={`border rounded-xl px-4 py-3 space-y-2 ${s.row}`}>
      {/* Top row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.badge}`}>{sev}</span>
        <span className="text-sm font-semibold text-white">{type}</span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* File + line */}
        <div className="bg-black/20 border border-white/8 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500 mb-0.5">File</p>
          <p className="text-xs font-mono text-gray-300 truncate" title={file}>
            {file}{line != null ? `:${line}` : ''}
          </p>
        </div>

        {/* Value */}
        <div className="bg-black/20 border border-white/8 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[10px] text-gray-500">Value</p>
            {value && (
              <button
                onClick={() => setReveal(v => !v)}
                className="text-[9px] text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-0.5"
              >
                {reveal ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                {reveal ? 'Hide' : 'Reveal'}
              </button>
            )}
          </div>
          <p className="text-xs font-mono text-yellow-300/80 truncate">
            {reveal ? value : mask(value)}
          </p>
        </div>

        {/* Entropy */}
        <div className="bg-black/20 border border-white/8 rounded-lg px-3 py-2">
          <p className="text-[10px] text-gray-500 mb-0.5">Entropy Score</p>
          {entropy != null ? (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold tabular-nums ${entropyColor(entropy)}`}>
                {parseFloat(entropy).toFixed(2)}
              </span>
              {/* Entropy bar (0-6 range) */}
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${s.bar}`}
                  style={{ width: `${Math.min(100, (parseFloat(entropy) / 6) * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <span className="text-xs text-gray-600">N/A</span>
          )}
        </div>
      </div>

      {desc && <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>}
    </div>
  )
}

/* ── Page ── */
export default function SecretsScannerPage() {
  const [code, setCode]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [results, setResults]   = useState(null)
  const [fileNames, setFileNames] = useState([])
  const fileRef = useRef(null)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setFileNames(files.map(f => f.name))
    const texts = await Promise.all(files.map(f => f.text()))
    setCode(texts.map((t, i) => `// === ${files[i].name} ===\n${t}`).join('\n\n'))
  }

  const handleScan = async () => {
    if (!code.trim()) return
    setLoading(true); setError(null); setResults(null)
    try {
      const data = await runSecretsScan({ code: code.trim() })
      setResults(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const findings = results ? (field(results, 'findings', 'Findings') ?? []) : []
  const summary  = field(results, 'summary', 'Summary') ?? {}
  const total    = field(summary, 'total', 'Total')    ?? findings.length
  const files    = field(summary, 'files', 'Files', 'filesScanned', 'FilesScanned') ?? fileNames.length
  const highRisk = field(summary, 'highRisk', 'HighRisk', 'critical', 'Critical')
    ?? findings.filter(f => ['Critical','High'].includes((field(f,'severity','Severity') ?? ''))).length

  const grouped = findings.reduce((acc, f) => {
    const sev = (field(f, 'severity', 'Severity') ?? 'Low')
    ;(acc[sev] = acc[sev] ?? []).push(f)
    return acc
  }, {})
  const ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info']

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4 bg-yellow-500/3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-yellow-500/15 border border-yellow-500/30 rounded-lg flex items-center justify-center">
                <Key className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Secrets Detection</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Secrets Scanner</h1>
            <p className="text-gray-400 text-sm mt-1">
              Detect hardcoded credentials, API keys, tokens, and private keys in source code.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Input card */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
            {/* File upload */}
            <div className="flex items-center gap-3 flex-wrap">
              <input ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-xs font-semibold bg-white/5 hover:bg-white/8 border border-white/15 text-gray-300 px-4 py-2 rounded-xl transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload files
              </button>
              {fileNames.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`}
                </div>
              )}
              <span className="text-xs text-gray-600">or paste code below</span>
            </div>

            {/* Paste area */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={'# Paste source code, config files, or environment files here\n\nAWS_SECRET=AKIA...\nDATABASE_URL=postgres://...'}
              rows={12}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-gray-300 placeholder:text-gray-600 resize-none outline-none focus:border-white/20 transition-colors"
            />

            <button
              onClick={handleScan}
              disabled={!code.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {loading ? 'Scanning…' : 'Scan for Secrets'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {results && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Secrets Found', val: total,    cls: total > 0 ? 'text-red-400' : 'text-green-400' },
                  { label: 'Files Scanned', val: files,    cls: 'text-white'           },
                  { label: 'High Risk',     val: highRisk, cls: highRisk > 0 ? 'text-orange-400' : 'text-green-400' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="bg-white/3 border border-white/10 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-extrabold ${cls}`}>{val}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {findings.length === 0 ? (
                <div className="text-center py-12 bg-green-500/5 border border-green-500/20 rounded-2xl">
                  <Key className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">No secrets detected</p>
                  <p className="text-xs text-gray-500 mt-1">Your code appears to be free of hardcoded credentials.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {ORDER.filter(sev => grouped[sev]?.length > 0).map(sev => (
                    <div key={sev} className="space-y-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${sevStyle(sev).bar}`} />
                        {sev} · {grouped[sev].length}
                      </p>
                      {grouped[sev].map((f, i) => <SecretRow key={i} finding={f} />)}
                    </div>
                  ))}
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
