import React, { useState } from 'react'
import {
  Layers, Loader2, AlertCircle, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Eye, EyeOff,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { startSspmScan } from '../services/api'
import ApiErrorBanner from '../components/ApiErrorBanner'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const PROVIDERS = [
  { id: 'google',    label: 'Google Workspace', hint: 'Paste your service account JSON — requires domain-wide delegation.' },
  { id: 'microsoft', label: 'Microsoft 365',    hint: 'Entra ID app registration with SecurityEvents.Read.All, Directory.Read.All.' },
  { id: 'slack',     label: 'Slack',            hint: 'Bot or user token with admin:read, users:read, team:read scopes.' },
  { id: 'github',    label: 'GitHub Org',       hint: 'PAT with read:org and repo scopes for the target organization.' },
]

const SEV_STYLE = {
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
  High:     'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Medium:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Low:      'bg-blue-500/15 text-blue-400 border-blue-500/30',
  Info:     'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

const inputCls = 'w-full bg-white/5 border border-white/15 focus:border-violet-500 text-white placeholder-gray-600 px-3 py-2.5 rounded-xl text-sm outline-none transition-colors'

function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputCls} pr-10`}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

function CheckRow({ check }) {
  const [open, setOpen] = useState(false)
  const name   = field(check, 'checkName', 'CheckName', 'name', 'Name', 'title', 'Title') ?? 'Check'
  const status = field(check, 'status', 'Status', 'result', 'Result') ?? ''
  const sev    = field(check, 'severity', 'Severity') ?? 'Info'
  const detail = field(check, 'description', 'Description', 'detail', 'Detail', 'message', 'Message') ?? ''
  const rec    = field(check, 'recommendation', 'Recommendation', 'remediation', 'Remediation') ?? ''
  const passed = ['pass', 'passed', 'success', 'ok'].includes(String(status).toLowerCase())
  const hasMore = !!(detail || rec)

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => hasMore && setOpen(v => !v)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${hasMore ? 'hover:bg-white/3' : ''}`}
      >
        {passed
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
        <span className="flex-1 text-sm text-white">{name}</span>
        {passed
          ? <span className="text-[10px] font-bold px-2 py-0.5 rounded border text-green-400 bg-green-500/10 border-green-500/25 shrink-0">Pass</span>
          : <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${SEV_STYLE[sev] || SEV_STYLE.Medium}`}>{sev}</span>}
        {hasMore && (open
          ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />)}
      </button>
      {open && hasMore && (
        <div className="px-12 pb-4 space-y-2">
          {detail && <p className="text-xs text-gray-400 leading-relaxed">{detail}</p>}
          {rec && (
            <div className="text-xs text-blue-300 bg-blue-500/5 border border-blue-500/15 rounded-lg px-3 py-2">
              <span className="font-semibold">Fix: </span>{rec}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Results({ data }) {
  const checks  = field(data, 'checks', 'Checks', 'results', 'Results', 'findings', 'Findings') ?? []
  const score   = field(data, 'score', 'Score')
  const isPass  = (c) => ['pass', 'passed', 'success', 'ok'].includes(String(field(c, 'status', 'Status', 'result', 'Result') ?? '').toLowerCase())
  const passed  = checks.filter(isPass).length
  const failed  = checks.length - passed
  const crits   = checks.filter(c => field(c, 'severity', 'Severity') === 'Critical').length
  const highs   = checks.filter(c => field(c, 'severity', 'Severity') === 'High').length

  const failedChecks = checks.filter(c => !isPass(c))
  const passedChecks = checks.filter(isPass)

  return (
    <div className="space-y-5 mt-6">
      <div className={`grid gap-4 ${score != null ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        {score != null && (
          <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
            <p className={`text-3xl font-extrabold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{score}</p>
            <p className="text-xs text-gray-500 mt-0.5">Score /100</p>
          </div>
        )}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
          <p className="text-3xl font-extrabold text-green-400">{passed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Passed</p>
        </div>
        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
          <p className={`text-3xl font-extrabold ${failed > 0 ? 'text-red-400' : 'text-green-400'}`}>{failed}</p>
          <p className="text-xs text-gray-500 mt-0.5">Failed</p>
        </div>
        <div className="bg-white/3 border border-white/10 rounded-2xl p-4 text-center">
          <p className={`text-3xl font-extrabold ${crits > 0 ? 'text-red-500' : highs > 0 ? 'text-orange-400' : 'text-green-400'}`}>
            {crits || highs || 0}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{crits > 0 ? 'Critical' : 'High'} Issues</p>
        </div>
      </div>

      {failedChecks.length > 0 && (
        <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-bold text-white">Failed Checks ({failedChecks.length})</span>
          </div>
          {failedChecks.map((c, i) => <CheckRow key={i} check={c} />)}
        </div>
      )}

      {passedChecks.length > 0 && (
        <details className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden group">
          <summary className="px-5 py-3 text-sm text-gray-500 cursor-pointer hover:text-gray-300 transition-colors flex items-center gap-2 list-none">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            {passedChecks.length} check{passedChecks.length !== 1 ? 's' : ''} passed
          </summary>
          <div className="border-t border-white/10">
            {passedChecks.map((c, i) => <CheckRow key={i} check={c} />)}
          </div>
        </details>
      )}
    </div>
  )
}

function GoogleForm({ creds, set }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Customer Domain</label>
        <input value={creds.domain ?? ''} onChange={e => set('domain', e.target.value)}
          placeholder="yourcompany.com" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Service Account JSON</label>
        <textarea value={creds.serviceAccountJson ?? ''} onChange={e => set('serviceAccountJson', e.target.value)}
          placeholder={'{\n  "type": "service_account",\n  "project_id": "my-project",\n  "client_email": "sa@my-project.iam.gserviceaccount.com",\n  ...\n}'}
          rows={8}
          className="w-full bg-white/5 border border-white/15 focus:border-violet-500 text-gray-300 placeholder-gray-700 px-3 py-2.5 rounded-xl text-xs font-mono outline-none transition-colors resize-y" />
      </div>
    </div>
  )
}

function MicrosoftForm({ creds, set }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Tenant ID</label>
        <input value={creds.tenantId ?? ''} onChange={e => set('tenantId', e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Client ID</label>
        <input value={creds.clientId ?? ''} onChange={e => set('clientId', e.target.value)}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Client Secret</label>
        <SecretInput value={creds.clientSecret ?? ''} onChange={e => set('clientSecret', e.target.value)} placeholder="App client secret value" />
      </div>
    </div>
  )
}

function SlackForm({ creds, set }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Workspace Domain</label>
        <input value={creds.domain ?? ''} onChange={e => set('domain', e.target.value)}
          placeholder="yourteam.slack.com" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">OAuth Token</label>
        <SecretInput value={creds.token ?? ''} onChange={e => set('token', e.target.value)} placeholder="xoxb-000000000000-000000000000-..." />
      </div>
    </div>
  )
}

function GitHubForm({ creds, set }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Organization Name</label>
        <input value={creds.org ?? ''} onChange={e => set('org', e.target.value)}
          placeholder="my-github-org" className={inputCls} />
      </div>
      <div>
        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Personal Access Token</label>
        <SecretInput value={creds.token ?? ''} onChange={e => set('token', e.target.value)} placeholder="github_pat_..." />
      </div>
    </div>
  )
}

export default function SspmPage() {
  const [provider, setProvider] = useState('google')
  const [creds, setCreds]       = useState({})
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [result, setResult]     = useState(null)

  const setCred = (k, v) => setCreds(c => ({ ...c, [k]: v }))

  const switchProvider = (p) => { setProvider(p); setCreds({}); setResult(null); setError(null) }

  const canScan = !loading && (() => {
    if (provider === 'google')    return !!(creds.domain?.trim() && creds.serviceAccountJson?.trim())
    if (provider === 'microsoft') return !!(creds.tenantId?.trim() && creds.clientId?.trim() && creds.clientSecret?.trim())
    if (provider === 'slack')     return !!(creds.token?.trim())
    if (provider === 'github')    return !!(creds.org?.trim() && creds.token?.trim())
    return false
  })()

  const scan = async () => {
    setLoading(true); setError(null); setResult(null)
    try { setResult(await startSspmScan({ provider, credentials: creds })) }
    catch { setError('Scan failed — the service is temporarily unavailable. Check your credentials and try again.') }
    setLoading(false)
  }

  const prov = PROVIDERS.find(p => p.id === provider)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-violet-400 font-semibold uppercase tracking-widest mb-2">Scanners</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Layers className="w-8 h-8 text-violet-400" /> SaaS Security Posture
            </h1>
            <p className="text-gray-400">Audit your SaaS applications for misconfigured MFA, excess admin privileges, overshared data, and missing security controls.</p>
          </div>

          {/* Provider tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {PROVIDERS.map(p => (
              <button
                key={p.id}
                onClick={() => switchProvider(p.id)}
                className={`text-sm font-semibold px-4 py-2 rounded-xl border transition-colors ${
                  provider === p.id
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-white/3 border-white/15 text-gray-400 hover:text-white hover:border-white/30'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Credential form */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-white mb-0.5">{prov.label} Credentials</h2>
              <p className="text-xs text-gray-500">{prov.hint}</p>
            </div>

            {provider === 'google'    && <GoogleForm    creds={creds} set={setCred} />}
            {provider === 'microsoft' && <MicrosoftForm creds={creds} set={setCred} />}
            {provider === 'slack'     && <SlackForm     creds={creds} set={setCred} />}
            {provider === 'github'    && <GitHubForm    creds={creds} set={setCred} />}

            <button
              onClick={scan}
              disabled={!canScan}
              className="mt-5 flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-500/25 disabled:text-white/30 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
              {loading ? 'Auditing…' : 'Run SSPM Audit'}
            </button>
          </div>

          {error && <ApiErrorBanner error={error} className="mt-5" />}

          {result && <Results data={result} />}

        </div>
      </main>

      <Footer />
    </div>
  )
}
