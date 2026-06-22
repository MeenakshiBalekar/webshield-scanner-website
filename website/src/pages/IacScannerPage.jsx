import React, { useState, useRef } from 'react'
import { Server, Upload, ScanLine, Loader2, AlertCircle, ChevronDown, ChevronUp, FileCode2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { runIacScan } from '../services/api'
import ApiErrorBanner from '../components/ApiErrorBanner'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const SEV = {
  Critical: { badge: 'text-red-400 bg-red-500/10 border-red-500/30',         dot: 'bg-red-500',    bar: 'bg-red-500'    },
  High:     { badge: 'text-orange-400 bg-orange-500/10 border-orange-500/30', dot: 'bg-orange-500', bar: 'bg-orange-500' },
  Medium:   { badge: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30', dot: 'bg-yellow-400', bar: 'bg-yellow-400' },
  Low:      { badge: 'text-blue-400 bg-blue-500/10 border-blue-500/30',       dot: 'bg-blue-400',   bar: 'bg-blue-400'   },
  Info:     { badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',       dot: 'bg-gray-400',   bar: 'bg-gray-400'   },
}
function sevStyle(s) { return SEV[(s ?? '').charAt(0).toUpperCase() + (s ?? '').slice(1)] || SEV.Info }

const FORMATS = [
  { id: 'terraform',       label: 'Terraform',         ext: '.tf',           hint: 'resource "aws_s3_bucket" "example" {\n  bucket = "my-bucket"\n}' },
  { id: 'kubernetes',      label: 'Kubernetes',        ext: '.yaml/.yml',    hint: 'apiVersion: v1\nkind: Pod\nmetadata:\n  name: example\nspec:\n  containers: []' },
  { id: 'cloudformation',  label: 'CloudFormation',    ext: '.yaml/.json',   hint: 'AWSTemplateFormatVersion: "2010-09-09"\nResources:\n  MyBucket:\n    Type: AWS::S3::Bucket' },
]

/* ── Resource group card ── */
function ResourceGroup({ resourceName, findings }) {
  const [open, setOpen] = useState(true)

  const worstSev = ['Critical','High','Medium','Low','Info'].find(s =>
    findings.some(f => (field(f,'severity','Severity') ?? '') === s)
  ) ?? 'Info'
  const s = sevStyle(worstSev)

  return (
    <div className={`border rounded-xl overflow-hidden ${open ? `border-white/15` : 'border-white/8'}`}
      style={{ borderColor: open ? undefined : undefined }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/3 transition-colors"
      >
        <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        <span className="flex-1 text-sm font-mono font-semibold text-white truncate">{resourceName}</span>
        <span className="text-[10px] text-gray-500 shrink-0">
          {findings.length} issue{findings.length !== 1 ? 's' : ''}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${s.badge}`}>
          {worstSev}
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-white/8 divide-y divide-white/5">
          {findings.map((f, i) => {
            const check = field(f, 'check', 'Check', 'checkName', 'CheckName', 'name', 'Name', 'rule', 'Rule') ?? 'Issue'
            const sev   = field(f, 'severity', 'Severity') ?? 'Medium'
            const desc  = field(f, 'description', 'Description', 'detail', 'Detail')
            const fix   = field(f, 'fix', 'Fix', 'recommendation', 'Recommendation', 'remediation', 'Remediation', 'fixSuggestion', 'FixSuggestion')
            const line  = field(f, 'line', 'Line', 'lineNumber', 'LineNumber')
            const fs    = sevStyle(sev)

            return (
              <div key={i} className="px-4 py-3.5 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${fs.badge}`}>{sev}</span>
                  <span className="text-sm font-medium text-white">{check}</span>
                  {line != null && (
                    <span className="text-[10px] font-mono text-gray-500 ml-auto">line {line}</span>
                  )}
                </div>
                {desc && <p className="text-xs text-gray-400 leading-relaxed pl-0.5">{desc}</p>}
                {fix && (
                  <div className="bg-green-950/30 border border-green-800/30 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] font-bold text-green-400 mb-1">Fix Suggestion</p>
                    <p className="text-xs text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">{fix}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Page ── */
export default function IacScannerPage() {
  const [format, setFormat]   = useState('terraform')
  const [code, setCode]       = useState('')
  const [fileName, setFileName] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [results, setResults] = useState(null)
  const fileRef = useRef(null)

  const currentFmt = FORMATS.find(f => f.id === format) ?? FORMATS[0]

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileName(f.name)
    f.text().then(t => setCode(t))
  }

  const handleScan = async () => {
    if (!code.trim()) return
    setLoading(true); setError(null); setResults(null)
    try {
      const data = await runIacScan({ code: code.trim(), format })
      setResults(data)
    } catch (e) { setError(e) }
    finally { setLoading(false) }
  }

  const findings = results ? (field(results, 'findings', 'Findings') ?? []) : []
  const summary  = field(results, 'summary', 'Summary') ?? {}
  const totalChecks  = field(summary, 'total', 'Total', 'checksRun', 'ChecksRun') ?? findings.length
  const totalIssues  = field(summary, 'issues', 'Issues', 'failed', 'Failed') ?? findings.length
  const totalPassed  = field(summary, 'passed', 'Passed') ?? Math.max(0, totalChecks - totalIssues)

  // Group by resource
  const grouped = {}
  for (const f of findings) {
    const res = field(f, 'resource', 'Resource', 'resourceName', 'ResourceName', 'block', 'Block') ?? 'Unknown Resource'
    ;(grouped[res] = grouped[res] ?? []).push(f)
  }
  const resourceNames = Object.keys(grouped).sort((a, b) => {
    const sevOrder = ['Critical','High','Medium','Low','Info']
    const worstSev = (name) => {
      const wIdx = sevOrder.findIndex(s => grouped[name].some(f => (field(f,'severity','Severity') ?? '') === s))
      return wIdx === -1 ? 99 : wIdx
    }
    return worstSev(a) - worstSev(b)
  })

  const sevCounts = findings.reduce((acc, f) => {
    const s = (field(f, 'severity', 'Severity') ?? 'Low')
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4 bg-purple-500/3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500/15 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Server className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Infrastructure as Code</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">IaC Security Scanner</h1>
            <p className="text-gray-400 text-sm mt-1">
              Scan Terraform, Kubernetes manifests, and CloudFormation templates for misconfigurations.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {/* Input card */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
            {/* Format selector */}
            <div>
              <p className="text-xs text-gray-500 mb-2">Format</p>
              <div className="flex gap-2 flex-wrap">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                      format === f.id
                        ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                        : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/8'
                    }`}
                  >
                    {f.label}
                    <span className="ml-1 opacity-50 font-normal">{f.ext}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* File upload */}
            <div className="flex items-center gap-3 flex-wrap">
              <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 text-xs font-semibold bg-white/5 hover:bg-white/8 border border-white/15 text-gray-300 px-4 py-2 rounded-xl transition-colors"
              >
                <Upload className="w-3.5 h-3.5" /> Upload file
              </button>
              {fileName && (
                <div className="flex items-center gap-1.5 text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-1.5">
                  <FileCode2 className="w-3.5 h-3.5" /> {fileName}
                </div>
              )}
              <span className="text-xs text-gray-600">or paste below</span>
            </div>

            {/* Code area */}
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={currentFmt.hint}
              rows={12}
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-gray-300 placeholder:text-gray-600 resize-none outline-none focus:border-white/20 transition-colors"
            />

            <button
              onClick={handleScan}
              disabled={!code.trim() || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {loading ? 'Scanning…' : `Scan ${currentFmt.label}`}
            </button>
          </div>

          {error && <ApiErrorBanner error={error} />}

          {results && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Checks Run', val: totalChecks, cls: 'text-white'        },
                  { label: 'Issues',     val: totalIssues, cls: totalIssues > 0 ? 'text-red-400' : 'text-green-400' },
                  { label: 'Passed',     val: totalPassed, cls: 'text-green-400'    },
                  { label: 'Resources',  val: resourceNames.length, cls: 'text-purple-400' },
                ].map(({ label, val, cls }) => (
                  <div key={label} className="bg-white/3 border border-white/10 rounded-xl p-4 text-center">
                    <p className={`text-2xl font-extrabold ${cls}`}>{val}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Severity breakdown pills */}
              {Object.keys(sevCounts).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {['Critical','High','Medium','Low','Info'].filter(s => sevCounts[s] > 0).map(s => (
                    <span key={s} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${sevStyle(s).badge}`}>
                      {sevCounts[s]} {s}
                    </span>
                  ))}
                </div>
              )}

              {/* Resource groups */}
              {resourceNames.length === 0 ? (
                <div className="text-center py-12 bg-green-500/5 border border-green-500/20 rounded-2xl">
                  <Server className="w-10 h-10 text-green-400 mx-auto mb-3" />
                  <p className="text-white font-semibold">No issues found</p>
                  <p className="text-xs text-gray-500 mt-1">Your IaC configuration looks secure.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {resourceNames.length} Resource{resourceNames.length !== 1 ? 's' : ''} with Issues
                  </p>
                  {resourceNames.map(name => (
                    <ResourceGroup key={name} resourceName={name} findings={grouped[name]} />
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
