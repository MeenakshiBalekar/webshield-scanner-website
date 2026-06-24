import React, { useState, useRef } from 'react'
import {
  Container, FileCode, Loader2, AlertCircle, CheckCircle2,
  Upload, RefreshCw, ChevronDown, ChevronUp, Hash,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { scanIacFile } from '../services/api'

const FILE_TYPES = [
  { id: 'dockerfile',  label: 'Dockerfile',  accept: '.dockerfile,Dockerfile,.txt', desc: 'Docker image build file' },
  { id: 'kubernetes',  label: 'Kubernetes',  accept: '.yaml,.yml',                  desc: 'K8s manifest (Pod, Deployment, Service…)' },
  { id: 'terraform',   label: 'Terraform',   accept: '.tf,.tfvars',                 desc: 'Terraform HCL resource files' },
]

const SEV = {
  Critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  High:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  Medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
  Info:     'text-gray-400 bg-gray-500/10 border-gray-500/30',
}
const SEV_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3, Info: 4 }

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function SevBadge({ sev }) {
  const s = sev ?? 'Info'
  return (
    <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full border ${SEV[s] ?? SEV.Info}`}>
      {s}
    </span>
  )
}

function FindingRow({ finding }) {
  const [open, setOpen] = useState(false)
  const rule    = field(finding, 'rule', 'Rule', 'checkName', 'CheckName', 'id', 'Id') ?? '—'
  const title   = field(finding, 'title', 'Title', 'name', 'Name', 'description', 'Description') ?? rule
  const sev     = field(finding, 'severity', 'Severity') ?? 'Info'
  const line    = field(finding, 'line', 'Line', 'lineNumber', 'LineNumber', 'startLine', 'StartLine')
  const file    = field(finding, 'file', 'File', 'fileName', 'FileName', 'resource', 'Resource')
  const detail  = field(finding, 'description', 'Description', 'detail', 'Detail', 'message', 'Message')
  const fix     = field(finding, 'remediation', 'Remediation', 'fix', 'Fix', 'resolution', 'Resolution')
  const snippet = field(finding, 'codeSnippet', 'CodeSnippet', 'code', 'Code', 'snippet', 'Snippet')

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${open ? 'border-white/20' : 'border-white/10'}`}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <SevBadge sev={sev} />
        <span className="flex-1 text-sm text-white font-medium truncate">{title}</span>
        <div className="flex items-center gap-2 shrink-0 text-xs text-gray-500">
          {line != null && (
            <span className="flex items-center gap-1">
              <Hash className="w-3 h-3" />{line}
            </span>
          )}
          {file && <span className="font-mono truncate max-w-[120px]">{file}</span>}
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-4 space-y-3 bg-white/2">
          {detail && <p className="text-sm text-gray-300 leading-relaxed">{detail}</p>}
          {snippet && (
            <pre className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap">
              {snippet}
            </pre>
          )}
          {fix && (
            <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-lg px-3 py-2.5">
              <span className="text-xs font-bold text-emerald-400 block mb-1">Remediation</span>
              <p className="text-xs text-gray-300 leading-relaxed">{fix}</p>
            </div>
          )}
          <div className="flex gap-3 text-xs text-gray-500">
            {rule !== title && <span>Rule: <span className="font-mono text-gray-400">{rule}</span></span>}
            {line != null && <span>Line: <span className="text-gray-400">{line}</span></span>}
            {file && <span>File: <span className="font-mono text-gray-400 truncate">{file}</span></span>}
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreRing({ score }) {
  if (score == null) return null
  const r = 28, circ = 2 * Math.PI * r
  const fill = circ * (score / 100)
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : score >= 40 ? '#f97316' : '#ef4444'
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 36 36)" />
      <text x={36} y={40} textAnchor="middle" fill="white" fontSize={14} fontWeight={700}>{score}</text>
    </svg>
  )
}

function SummaryBar({ findings }) {
  const counts = findings.reduce((acc, f) => {
    const s = field(f, 'severity', 'Severity') ?? 'Info'
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})
  const items = Object.entries(counts).sort((a, b) => (SEV_ORDER[a[0]] ?? 9) - (SEV_ORDER[b[0]] ?? 9))
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(([sev, count]) => (
        <span key={sev} className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${SEV[sev] ?? SEV.Info}`}>
          {count} {sev}
        </span>
      ))}
    </div>
  )
}

export default function ContainerIacPage() {
  const [fileType, setFileType] = useState('dockerfile')
  const [file, setFile]         = useState(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState(null)
  const [sevFilter, setSevFilter] = useState('all')
  const inputRef = useRef(null)

  const selectedType = FILE_TYPES.find(t => t.id === fileType) ?? FILE_TYPES[0]

  const handleFile = (f) => {
    if (f) { setFile(f); setResult(null); setError(null) }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    handleFile(e.dataTransfer.files?.[0])
  }

  const handleScan = async () => {
    if (!file) return
    setScanning(true); setError(null); setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('fileType', fileType)
      fd.append('type', fileType)
      const data = await scanIacFile(fd)
      setResult(data)
    } catch (e) { setError('Scan failed') }
    setScanning(false)
  }

  const findings = result
    ? (field(result, 'findings', 'Findings', 'results', 'Results', 'checks', 'Checks') ?? [])
    : []

  const filtered = sevFilter === 'all'
    ? findings
    : findings.filter(f => (field(f, 'severity', 'Severity') ?? 'Info').toLowerCase() === sevFilter)

  const sortedFindings = [...filtered].sort((a, b) => {
    const sa = SEV_ORDER[field(a, 'severity', 'Severity') ?? 'Info'] ?? 9
    const sb = SEV_ORDER[field(b, 'severity', 'Severity') ?? 'Info'] ?? 9
    return sa - sb
  })

  const score        = field(result, 'score', 'Score', 'securityScore', 'SecurityScore')
  const scannedFile  = field(result, 'fileName', 'FileName', 'file', 'File')
  const checkedCount = field(result, 'totalChecks', 'TotalChecks', 'checked', 'Checked')

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-cyan-500/15 border border-cyan-500/30 rounded-lg flex items-center justify-center">
                <Container className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Infrastructure Security</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Container & IaC Scanner</h1>
            <p className="text-gray-400 text-sm mt-1">
              Upload Dockerfiles, Kubernetes manifests, or Terraform configs to find misconfigurations and security issues.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <PageGuide id="container-iac" text="Scans Dockerfile, Kubernetes manifests, Terraform, CloudFormation, and Bicep files for misconfigurations before they reach production. Upload or paste your file — select the format first, then upload. Findings include the exact line number, severity, and a code-level fix recommendation." />
          {/* File type selector */}
          <div className="grid grid-cols-3 gap-3">
            {FILE_TYPES.map(t => (
              <button key={t.id} onClick={() => { setFileType(t.id); setFile(null); setResult(null) }}
                className={`text-left rounded-xl border px-4 py-3 transition-colors ${
                  fileType === t.id
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                    : 'bg-white/3 border-white/10 text-gray-300 hover:border-white/20'
                }`}>
                <div className="font-semibold text-sm">{t.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{t.accept}</div>
              </button>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/15 hover:border-white/25'
            }`}
          >
            <input ref={inputRef} type="file" className="hidden" accept={selectedType.accept}
              onChange={e => handleFile(e.target.files?.[0])} />
            {file ? (
              <>
                <div className="w-12 h-12 bg-cyan-500/15 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                  <FileCode className="w-6 h-6 text-cyan-400" />
                </div>
                <p className="text-white font-semibold text-sm">{file.name}</p>
                <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB · click to change</p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-white/5 border border-white/15 rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
                <p className="text-gray-300 font-semibold text-sm">Drop your {selectedType.label} here or click to browse</p>
                <p className="text-gray-600 text-xs">{selectedType.desc}</p>
              </>
            )}
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          <button onClick={handleScan} disabled={!file || scanning}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Container className="w-4 h-4" />}
            {scanning ? 'Scanning…' : `Scan ${selectedType.label}`}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-6">
                  <ScoreRing score={score} />
                  <div className="flex-1">
                    <p className="text-white font-bold text-lg mb-1">Scan Complete</p>
                    <SummaryBar findings={findings} />
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>{findings.length} finding{findings.length !== 1 ? 's' : ''}</span>
                      {checkedCount && <span>{checkedCount} checks</span>}
                      {scannedFile && <span className="font-mono">{scannedFile}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter */}
              {findings.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {['all', 'critical', 'high', 'medium', 'low'].map(s => (
                    <button key={s} onClick={() => setSevFilter(s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                        sevFilter === s
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/3 border-white/10 text-gray-400 hover:border-white/20'
                      }`}>{s === 'all' ? `All (${findings.length})` : s}</button>
                  ))}
                </div>
              )}

              {/* Findings list */}
              {sortedFindings.length === 0 && findings.length === 0 ? (
                <div className="text-center py-10 bg-white/2 border border-white/8 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">No issues found</p>
                  <p className="text-gray-500 text-xs mt-1">Your {selectedType.label} looks clean.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedFindings.map((f, i) => <FindingRow key={i} finding={f} />)}
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
