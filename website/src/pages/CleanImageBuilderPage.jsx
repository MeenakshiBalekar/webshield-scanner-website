import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, ChevronDown, Plus, X, Copy, Check, Loader2, AlertCircle,
  Hammer, Download, ShieldCheck,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getBuilderOptions, generateDockerfile, downloadDockerfile } from '../services/api'

/* Dual-case field accessor */
function f(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
    const cap = k.charAt(0).toUpperCase() + k.slice(1)
    if (obj[cap] !== undefined && obj[cap] !== null) return obj[cap]
  }
  return undefined
}

const inputCls =
  'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

/* Tag input — type + Enter or comma to add chips */
function TagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const add = () => {
    const t = draft.trim().replace(/,+$/, '')
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
    if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-white/5 border border-white/15 focus-within:border-crimson-500 rounded-xl px-2.5 py-2 transition-colors">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 font-mono text-xs text-gray-200 bg-white/8 border border-white/15 rounded px-2 py-0.5">
          {t}
          <button type="button" onClick={() => onChange(value.filter((v) => v !== t))} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={add}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-gray-600 outline-none px-1 py-0.5"
      />
    </div>
  )
}

/* Key/value (or source→dest) row list */
function PairRows({ rows, onChange, keyPlaceholder, valPlaceholder, addLabel }) {
  const update = (i, field, val) => {
    const next = rows.map((r, j) => (j === i ? { ...r, [field]: val } : r))
    onChange(next)
  }
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={r.key} onChange={(e) => update(i, 'key', e.target.value)} placeholder={keyPlaceholder} className={inputCls} />
          <input value={r.value} onChange={(e) => update(i, 'value', e.target.value)} placeholder={valPlaceholder} className={inputCls} />
          <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400 transition-colors shrink-0 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { key: '', value: '' }])}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> {addLabel}
      </button>
    </div>
  )
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${checked ? 'bg-crimson-500' : 'bg-white/15'}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${checked ? 'left-[18px]' : 'left-0.5'}`} />
      </button>
      <span>
        <span className="block text-sm text-gray-200">{label}</span>
        {hint && <span className="block text-[11px] text-gray-600 mt-0.5">{hint}</span>}
      </span>
    </label>
  )
}

export default function CleanImageBuilderPage() {
  const [baseImages, setBaseImages] = useState([])   // [{ slug, name, distroless, fipsAvailable, ... }]
  const [limits, setLimits]         = useState(null)

  const [name, setName]             = useState('')
  const [baseImage, setBaseImage]   = useState('')   // holds the base slug
  const [tag, setTag]               = useState('')
  const [packages, setPackages]     = useState([])
  const [envVars, setEnvVars]       = useState([])
  const [ports, setPorts]           = useState([])
  const [copies, setCopies]         = useState([])
  const [buildCommand, setBuildCommand] = useState('')
  const [workdir, setWorkdir]       = useState('')
  const [entrypoint, setEntrypoint] = useState('')
  const [cmd, setCmd]               = useState('')
  const [nonRoot, setNonRoot]       = useState(true)
  const [fips, setFips]             = useState(false)

  const [generating, setGenerating]   = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError]             = useState(null)
  const [dockerfile, setDockerfile]   = useState(null)
  const [copied, setCopied]           = useState(false)

  useEffect(() => {
    getBuilderOptions()
      .then((d) => {
        const arr = Array.isArray(d) ? d : (f(d, 'bases', 'baseImages', 'images', 'options') ?? [])
        setBaseImages(Array.isArray(arr) ? arr : [])
        setLimits(f(d, 'limits') ?? null)
      })
      .catch(() => {})
  }, [])

  const selectedBase = baseImages.find((b) => (f(b, 'slug', 'name', 'id', 'value') ?? '') === baseImage)
  const isDistroless = !!f(selectedBase, 'distroless')

  /* Split an exec-form field ("/app/server --serve") into an argv array */
  const toArgv = (s) => {
    const parts = (s || '').trim().split(/\s+/).filter(Boolean)
    return parts.length ? parts : null
  }

  const payload = () => {
    const env = {}
    envVars.filter((e) => e.key).forEach(({ key, value }) => { env[key] = value })
    return {
      imageName: name,
      baseImage,                                   // slug
      tag: tag || undefined,
      packages: isDistroless ? [] : packages,
      env,                                          // { KEY: "value" } map
      ports: ports.map((p) => Number(p)).filter((n) => Number.isFinite(n)),
      artifacts: copies.filter((c) => c.key).map(({ key, value }) => ({ source: key, dest: value })),
      buildCommand: buildCommand || undefined,
      workdir: workdir || undefined,
      entrypoint: toArgv(entrypoint) || undefined,
      cmd: toArgv(cmd) || undefined,
      nonRoot,
      fips,
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    setError(null)
    try {
      const res = await generateDockerfile(payload())
      const df = f(res, 'dockerfile', 'content', 'text') ?? (typeof res === 'string' ? res : null)
      if (!df) throw new Error('Unexpected response from builder.')
      setDockerfile(df)
    } catch (err) {
      setError(err?.message || 'Could not generate Dockerfile — please try again.')
    }
    setGenerating(false)
  }

  const handleDownload = async () => {
    setDownloading(true)
    setError(null)
    try {
      const blob = await downloadDockerfile(payload())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Dockerfile'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err?.message || 'Could not download Dockerfile — please try again.')
    }
    setDownloading(false)
  }

  const copyDockerfile = () => {
    navigator.clipboard.writeText(dockerfile || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-16">

        <Link to="/images" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> All Clean Images
        </Link>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-crimson-500/10 border border-crimson-500/25 text-crimson-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Hammer className="w-3.5 h-3.5" /> Custom Image Builder
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight">
            Build Your Own <span className="text-crimson-500">Clean Image</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Compose a hardened Dockerfile from a Clean Images base — non-root by default,
            minimal packages, FIPS optional.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5 bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Image name">
              <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="my-service" className={inputCls} />
            </Field>
            <Field label="Base image">
              <div className="relative">
                <select
                  required
                  value={baseImage}
                  onChange={(e) => setBaseImage(e.target.value)}
                  className={`${inputCls} appearance-none pr-9 cursor-pointer`}
                >
                  <option value="" disabled>Select a base…</option>
                  {baseImages.map((b, i) => {
                    const val   = typeof b === 'string' ? b : (f(b, 'slug', 'name', 'id', 'value') ?? '')
                    const label = typeof b === 'string' ? b : (f(b, 'name', 'slug', 'label') ?? val)
                    const dl    = typeof b === 'string' ? false : !!f(b, 'distroless')
                    return <option key={i} value={val}>{label}{dl ? ' (distroless)' : ''}</option>
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </Field>
            <Field label="Tag (optional)">
              <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="1.23 · latest" className={inputCls} />
            </Field>
          </div>

          {isDistroless ? (
            <p className="text-xs text-gray-500 bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2.5">
              {f(selectedBase, 'name') ?? 'This base'} is <span className="text-gray-300 font-medium">distroless</span> — it has no package manager, so extra packages can't be added.
            </p>
          ) : (
            <Field label="Packages" hint={`Press Enter or comma to add.${limits?.maxPackages ? ` Up to ${limits.maxPackages}.` : ''}`}>
              <TagInput value={packages} onChange={setPackages} placeholder="curl, ca-certificates…" />
            </Field>
          )}

          <Field label="Environment variables">
            <PairRows rows={envVars} onChange={setEnvVars} keyPlaceholder="KEY" valPlaceholder="value" addLabel="Add env var" />
          </Field>

          <Field label="Exposed ports" hint="Press Enter or comma to add.">
            <TagInput value={ports} onChange={setPorts} placeholder="8080, 443…" />
          </Field>

          <Field label="Artifact copies">
            <PairRows rows={copies} onChange={setCopies} keyPlaceholder="./source/path" valPlaceholder="/dest/path" addLabel="Add copy" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Build command (optional)">
              <input value={buildCommand} onChange={(e) => setBuildCommand(e.target.value)} placeholder="npm ci && npm run build" className={inputCls} />
            </Field>
            <Field label="Working directory (optional)">
              <input value={workdir} onChange={(e) => setWorkdir(e.target.value)} placeholder="/app" className={inputCls} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Entrypoint (optional)" hint="Space-separated exec form.">
              <input value={entrypoint} onChange={(e) => setEntrypoint(e.target.value)} placeholder="/app/server" className={inputCls} />
            </Field>
            <Field label="CMD (optional)" hint="Space-separated exec form.">
              <input value={cmd} onChange={(e) => setCmd(e.target.value)} placeholder="--serve" className={inputCls} />
            </Field>
          </div>

          <div className="flex flex-col sm:flex-row gap-5 pt-1">
            <Toggle checked={nonRoot} onChange={setNonRoot} label="Run as non-root" hint="Recommended — creates and switches to an unprivileged user." />
            <Toggle checked={fips} onChange={setFips} label="FIPS base" hint="Use the FIPS-validated variant of the base image." />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              type="submit"
              disabled={generating || downloading}
              className="flex-1 flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Hammer className="w-4 h-4" />}
              Generate Dockerfile
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || downloading || !name || !baseImage}
              className="flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download Dockerfile
            </button>
          </div>
        </form>

        {/* Generated Dockerfile */}
        {dockerfile && (
          <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
              <span className="font-mono text-xs text-gray-400">Dockerfile</span>
              <button
                onClick={copyDockerfile}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
              >
                {copied
                  ? <><Check className="w-3.5 h-3.5 text-green-400" /><span className="text-green-400">Copied</span></>
                  : <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>}
              </button>
            </div>
            <div className="p-4 overflow-x-auto max-h-[480px] overflow-y-auto">
              <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">{dockerfile}</pre>
            </div>
          </div>
        )}

        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-gray-600 mt-10">
          <ShieldCheck className="w-3.5 h-3.5" />
          Generated Dockerfiles follow Clean Images hardening defaults.
        </p>
      </main>

      <Footer />
    </div>
  )
}
