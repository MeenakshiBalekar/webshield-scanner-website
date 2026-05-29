import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Network, Server, Lock, GitCompare,
  Download, Terminal, Cpu, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL ?? ''

const FEATURES = [
  {
    icon: Network,
    title: 'Port Scanner',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    desc: 'Full TCP/UDP port scan with service detection. Identifies exposed services, risky open ports, and misconfigurations before attackers do.',
  },
  {
    icon: Server,
    title: 'Web Server Config',
    color: 'text-teal-400',
    bg: 'bg-teal-500/10 border-teal-500/20',
    desc: 'Checks Nginx, Apache, and IIS configurations for missing security headers, TLS weaknesses, directory listing, and exposed server tokens.',
  },
  {
    icon: Lock,
    title: 'OS Hardening',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    desc: 'Validates against CIS Benchmarks for Linux and Windows. Covers SSH config, firewall rules, password policies, kernel parameters, and more.',
  },
  {
    icon: GitCompare,
    title: 'Drift Detection',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10 border-orange-500/20',
    desc: 'Save a secure baseline, then run again to catch any changes. Know the moment a file, config, or port state deviates from your golden state.',
  },
]

const WIN_STEPS = [
  { cmd: 'webshield-agent.exe --baseline', comment: '# first run: save baseline' },
  { cmd: 'webshield-agent.exe',            comment: '# scan & compare drift' },
]

const LINUX_STEPS = [
  { cmd: './webshield-agent --baseline', comment: '# first run: save baseline' },
  { cmd: './webshield-agent',            comment: '# scan & compare drift' },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={copy}
      className="text-xs text-gray-500 hover:text-gray-300 transition-colors shrink-0 ml-3"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

function CodeBlock({ steps, platform }) {
  const full = steps.map((s) => s.cmd).join('\n')
  return (
    <div className="bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400 font-medium">{platform}</span>
        </div>
        <CopyButton text={full} />
      </div>
      <div className="px-4 py-4 space-y-2 font-mono text-sm">
        {steps.map((s, i) => (
          <div key={i}>
            <span className="text-gray-500">{s.comment}</span>
            <br />
            <span className="text-green-400">{s.cmd}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function OllamaSection() {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-violet-400 shrink-0" />
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Optional: AI Analysis via Ollama</p>
            <p className="text-xs text-gray-400 mt-0.5">If Ollama is running at localhost:11434, the agent adds natural-language risk summaries to your report</p>
          </div>
        </div>
        {open
          ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
          : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4">
          <p className="text-sm text-gray-400">
            The agent auto-detects Ollama at <code className="text-violet-300 bg-white/5 px-1.5 py-0.5 rounded text-xs">localhost:11434</code>. No config needed — just have Ollama running with any model (llama3, mistral, etc.) before you run the scan.
          </p>
          <div className="bg-[#0d1117] border border-white/10 rounded-xl px-4 py-3 font-mono text-sm space-y-1">
            <div><span className="text-gray-500"># pull a model (one time)</span></div>
            <div><span className="text-green-400">ollama pull llama3</span></div>
            <div className="mt-2"><span className="text-gray-500"># run as usual — AI analysis is automatic</span></div>
            <div><span className="text-green-400">./webshield-agent</span></div>
          </div>
          <p className="text-xs text-gray-500">
            All AI inference runs locally. No API keys. No data sent to any cloud model.
          </p>
        </div>
      )}
    </div>
  )
}

export default function AgentPage() {
  const [agentInfo, setAgentInfo] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/agent/info`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setAgentInfo(d))
      .catch(() => {})
  }, [])

  const version   = agentInfo?.version   ?? agentInfo?.Version   ?? null
  const cliUsage  = agentInfo?.usage     ?? agentInfo?.Usage     ?? agentInfo?.cliUsage ?? agentInfo?.CliUsage ?? null
  const commands  = agentInfo?.commands  ?? agentInfo?.Commands  ?? []

  return (
    <div className="min-h-screen page-bg flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-crimson-500 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Web<span className="text-crimson-500">Shield</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-gray-400 hover:text-white text-sm transition-colors">Pricing</Link>
          <Link to="/login" className="bg-crimson-500 hover:bg-crimson-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">Sign In</Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-crimson-500/10 border border-crimson-500/25 text-crimson-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Shield className="w-3.5 h-3.5" /> Free Download · No Account Required
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
            WebShield Agent
          </h1>
          <p className="text-xl text-gray-300 font-medium mb-2">Security Scanner for Your Server</p>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            Runs locally on your machine. Scans ports, web server config, and OS hardening.
            Data never leaves your server.
          </p>

          {/* Download buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <a
              href={`${API}/api/agent/download?platform=win`}
              className="flex items-center gap-2.5 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              Download for Windows (.exe)
            </a>
            <a
              href={`${API}/api/agent/download?platform=linux`}
              className="flex items-center gap-2.5 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors w-full sm:w-auto justify-center"
            >
              <Download className="w-4 h-4" />
              Download for Linux
            </a>
          </div>

          {/* Version badge + trust line */}
          {version && (
            <p className="text-xs text-gray-600 mb-2">
              Latest: <span className="text-gray-400 font-mono">v{version}</span>
            </p>
          )}
          <p className="text-sm text-gray-500">
            No account needed &nbsp;·&nbsp; Free forever &nbsp;·&nbsp; Data stays on your machine
          </p>
        </div>

        {/* Feature cards */}
        <div className="grid sm:grid-cols-2 gap-4 mb-16">
          {FEATURES.map((f) => (
            <div key={f.title} className={`border rounded-2xl p-5 ${f.bg}`}>
              <div className="flex items-center gap-3 mb-2">
                <f.icon className={`w-5 h-5 ${f.color} shrink-0`} />
                <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Installation */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-white mb-1">Installation</h2>
          <p className="text-sm text-gray-400 mb-6">No installer. Single binary — download and run.</p>
          <div className="space-y-4">
            <CodeBlock steps={WIN_STEPS} platform="Windows" />
            <CodeBlock steps={LINUX_STEPS} platform="Linux / macOS" />
          </div>

          {/* Live CLI usage from /api/agent/info */}
          {(cliUsage || commands.length > 0) && (
            <div className="mt-6 bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10">
                <Terminal className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-400 font-medium">CLI Reference</span>
              </div>
              <div className="px-4 py-4 font-mono text-sm space-y-2">
                {cliUsage && (
                  <pre className="text-gray-300 whitespace-pre-wrap text-xs leading-relaxed">{cliUsage}</pre>
                )}
                {commands.map((c, i) => {
                  const cmd  = c.command ?? c.Command ?? c.cmd ?? c
                  const desc = c.description ?? c.Description ?? c.desc ?? ''
                  return (
                    <div key={i} className="flex gap-4">
                      <span className="text-green-400 shrink-0">{cmd}</span>
                      {desc && <span className="text-gray-500">{desc}</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="bg-white/3 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-500/15 border border-green-500/25 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white mb-1">Output: <code className="text-green-400 font-mono">webshield-report.html</code></p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Every scan generates a self-contained HTML report in the current directory.
                Open it in any browser — no server, no internet connection required.
                Includes severity ratings, findings, and remediation steps for every check.
              </p>
            </div>
          </div>
        </div>

        {/* Ollama */}
        <div className="mb-16">
          <OllamaSection />
        </div>

        {/* Bottom CTA */}
        <div className="bg-crimson-500/10 border border-crimson-500/20 rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Need cloud-based scanning?</h3>
          <p className="text-gray-400 text-sm mb-5">
            The WebShield platform adds scheduled scans, team dashboards, API security testing, and more — from your browser.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              View Pricing
            </Link>
            <Link
              to="/scanner"
              className="inline-flex items-center justify-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Try Online Scanner
            </Link>
          </div>
        </div>

      </main>

      <footer className="border-t border-white/10 px-6 py-5 text-center">
        <p className="text-xs text-gray-600">
          WebShield Agent is open source and free forever.{' '}
          <a
            href="https://github.com/meenakshibalekar/webshield-scanner-website"
            target="_blank"
            rel="noreferrer"
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            View source on GitHub
          </a>
        </p>
      </footer>
    </div>
  )
}
