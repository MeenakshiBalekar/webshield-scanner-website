import React, { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Shield } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { importScan } from '../services/api'

const FORMATS = [
  { id: 'nessus',  label: 'Nessus',   ext: '.nessus, .xml', desc: 'Tenable Nessus scan export (.nessus or .xml)' },
  { id: 'burp',    label: 'Burp Suite', ext: '.xml',          desc: 'Burp Suite XML export' },
  { id: 'zap',     label: 'OWASP ZAP', ext: '.xml, .json',   desc: 'ZAP XML or JSON report' },
]

export default function ImportPage() {
  const [format, setFormat]       = useState('nessus')
  const [file, setFile]           = useState(null)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)
  const inputRef = useRef(null)

  const selectedFmt = FORMATS.find(f => f.id === format) ?? FORMATS[0]

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setResult(null); setError(null) }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) { setFile(f); setResult(null); setError(null) }
  }

  const handleImport = async () => {
    if (!file) return
    setLoading(true); setError(null); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const data = await importScan(format, fd)
      setResult({
        score:    data?.score        ?? data?.Score        ?? null,
        findings: data?.findingCount ?? data?.FindingCount ?? data?.findings ?? data?.Findings ?? null,
        message:  data?.message      ?? data?.Message      ?? null,
        scanId:   data?.scanId       ?? data?.ScanId       ?? data?.id ?? data?.Id ?? null,
      })
    } catch (e) { setError(e.message || 'Import failed') }
    setLoading(false)
  }

  const scoreColor = (s) => {
    if (s == null) return 'text-gray-400'
    if (s >= 80) return 'text-emerald-400'
    if (s >= 60) return 'text-yellow-400'
    if (s >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-sky-500/15 border border-sky-500/30 rounded-lg flex items-center justify-center">
                <Upload className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Scan Import</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Import Scan Results</h1>
            <p className="text-gray-400 text-sm mt-1">
              Upload existing scan files from Nessus, Burp Suite, or OWASP ZAP to consolidate findings.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Format selector */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
              <FileText className="w-4 h-4 text-sky-400" />
              <h2 className="text-sm font-bold text-white">Scan Format</h2>
            </div>
            <div className="px-6 py-5 grid sm:grid-cols-3 gap-3">
              {FORMATS.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setFormat(f.id); setFile(null); setResult(null); setError(null) }}
                  className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                    format === f.id
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                      : 'bg-white/3 border-white/10 text-gray-300 hover:border-white/20'
                  }`}
                >
                  <div className="font-semibold text-sm">{f.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.ext}</div>
                </button>
              ))}
            </div>
            <div className="px-6 pb-5">
              <p className="text-xs text-gray-500">{selectedFmt.desc}</p>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              file
                ? 'border-sky-500/50 bg-sky-500/5'
                : 'border-white/15 hover:border-white/25 bg-white/2'
            }`}
          >
            <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
            {file ? (
              <>
                <div className="w-12 h-12 bg-sky-500/15 border border-sky-500/30 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-sky-400" />
                </div>
                <p className="text-white font-semibold text-sm">{file.name}</p>
                <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB — click to change</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white/5 border border-white/15 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-300 font-semibold text-sm">Drop your file here or click to browse</p>
                <p className="text-gray-600 text-xs">Supports {selectedFmt.ext}</p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-emerald-300">Import Successful</h2>
              </div>
              <div className="px-6 py-5 flex flex-wrap gap-8">
                {result.score != null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Security Score</div>
                    <div className={`text-4xl font-extrabold ${scoreColor(result.score)}`}>
                      {result.score}
                      <span className="text-lg text-gray-500 font-normal">/100</span>
                    </div>
                  </div>
                )}
                {result.findings != null && (
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Findings</div>
                    <div className="text-4xl font-extrabold text-white">{result.findings}</div>
                  </div>
                )}
                {result.score == null && result.findings == null && (
                  <div className="flex items-center gap-2 text-gray-300 text-sm">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    {result.message || 'Scan imported and queued for analysis.'}
                  </div>
                )}
              </div>
              {result.message && (result.score != null || result.findings != null) && (
                <p className="px-6 pb-5 text-xs text-gray-500">{result.message}</p>
              )}
            </div>
          )}

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {loading ? 'Importing…' : `Import ${selectedFmt.label} File`}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
