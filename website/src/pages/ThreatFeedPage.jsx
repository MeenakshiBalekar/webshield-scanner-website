import React, { useState, useEffect } from 'react'
import {
  Rss, ShieldAlert, ChevronDown, ChevronUp,
  Loader2, ExternalLink, Zap, Shield, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { getThreatFeed } from '../services/api'

const SEV_STYLE = {
  Critical: { badge: 'bg-red-500/15 text-red-400 border-red-500/30',    ring: '#ef4444' },
  High:     { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30', ring: '#f97316' },
  Medium:   { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',  ring: '#f59e0b' },
  Low:      { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',    ring: '#3b82f6' },
  Info:     { badge: 'bg-gray-500/15 text-gray-400 border-gray-500/30',    ring: '#6b7280' },
}

const SEV_ORDER = ['Critical', 'High', 'Medium', 'Low', 'Info']

function CvssRing({ score }) {
  const s = parseFloat(score) || 0
  const r = 22
  const circ = 2 * Math.PI * r
  const dash = (s / 10) * circ
  const color = s >= 9 ? '#ef4444' : s >= 7 ? '#f97316' : s >= 4 ? '#f59e0b' : '#22c55e'
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="shrink-0">
      <circle cx="28" cy="28" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="5" fill="none" />
      <circle cx="28" cy="28" r={r} stroke={color} strokeWidth="5" fill="none"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 28 28)" />
      <text x="28" y="31" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">{s.toFixed(1)}</text>
    </svg>
  )
}

function CveCard({ cve }) {
  const [open, setOpen] = useState(false)

  const id        = cve.cveId          ?? cve.CveId          ?? cve.id          ?? ''
  const title     = cve.title          ?? cve.Title          ?? ''
  const cvss      = cve.cvssScore      ?? cve.CvssScore      ?? 0
  const sev       = cve.severity       ?? cve.Severity       ?? 'Medium'
  const published = cve.publishedAt    ?? cve.PublishedAt    ?? ''
  const summary   = cve.summary        ?? cve.Summary        ?? ''
  const software  = cve.affectedSoftware ?? cve.AffectedSoftware ?? []
  const mapped    = cve.mappedChecks   ?? cve.MappedChecks   ?? []
  const hasExploit = cve.exploitAvailable ?? cve.ExploitAvailable ?? false
  const hasPatch   = cve.patchAvailable  ?? cve.PatchAvailable  ?? false
  const refs       = cve.references    ?? cve.References    ?? []

  const ss = SEV_STYLE[sev] || SEV_STYLE.Medium

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-4 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <CvssRing score={cvss} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono font-bold text-crimson-400">{id}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${ss.badge}`}>{sev}</span>
            {hasExploit && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded">
                <Zap className="w-3 h-3" />Exploit
              </span>
            )}
            {hasPatch && (
              <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" />Patch
              </span>
            )}
          </div>
          <p className="text-white font-semibold text-sm leading-snug">{title}</p>
          {published && <p className="text-xs text-gray-500 mt-0.5">Published {new Date(published).toLocaleDateString()}</p>}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 mt-1" />}
      </button>

      {open && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4">
          {summary && <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>}

          {software.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1.5">Affected Software</p>
              <div className="flex flex-wrap gap-1.5">
                {software.map((s, i) => (
                  <span key={i} className="text-xs bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {mapped.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-crimson-400 mb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />Mapped to Your Checks
              </p>
              <div className="flex flex-wrap gap-1.5">
                {mapped.map((m, i) => (
                  <span key={i} className="text-xs bg-crimson-500/10 border border-crimson-500/25 text-crimson-300 px-2.5 py-1 rounded-full">{m}</span>
                ))}
              </div>
            </div>
          )}

          {refs.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1.5">References</p>
              <div className="space-y-1">
                {refs.slice(0, 3).map((ref, i) => {
                  const url = typeof ref === 'string' ? ref : (ref.url ?? ref.Url ?? '')
                  return url ? (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 truncate">
                      <ExternalLink className="w-3 h-3 shrink-0" />{url}
                    </a>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const DEMO_CVES = [
  {
    cveId: 'CVE-2024-3400', title: 'PAN-OS Command Injection in GlobalProtect Gateway',
    cvssScore: 10.0, severity: 'Critical', publishedAt: '2024-04-12T00:00:00Z',
    exploitAvailable: true, patchAvailable: true,
    summary: 'A command injection vulnerability in the GlobalProtect feature of Palo Alto Networks PAN-OS allows an unauthenticated attacker to execute arbitrary code with root privileges.',
    affectedSoftware: ['PAN-OS < 11.1.2-h3', 'PAN-OS < 10.2.9-h1'],
    references: [{ url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-3400' }],
  },
  {
    cveId: 'CVE-2024-21762', title: 'Fortinet FortiOS SSL-VPN Out-of-Bound Write',
    cvssScore: 9.6, severity: 'Critical', publishedAt: '2024-02-08T00:00:00Z',
    exploitAvailable: true, patchAvailable: true,
    summary: 'An out-of-bounds write vulnerability in FortiOS could allow a remote unauthenticated attacker to execute arbitrary code via specially crafted HTTP requests.',
    affectedSoftware: ['FortiOS 7.4.0 - 7.4.2', 'FortiOS 7.2.0 - 7.2.6'],
    references: [],
  },
  {
    cveId: 'CVE-2024-1709', title: 'ConnectWise ScreenConnect Authentication Bypass',
    cvssScore: 10.0, severity: 'Critical', publishedAt: '2024-02-21T00:00:00Z',
    exploitAvailable: true, patchAvailable: true,
    summary: 'An authentication bypass vulnerability allows remote unauthenticated users to access the system through an alternate path.',
    affectedSoftware: ['ScreenConnect < 23.9.8'],
    references: [],
  },
  {
    cveId: 'CVE-2023-46805', title: 'Ivanti Connect Secure Authentication Bypass',
    cvssScore: 8.2, severity: 'High', publishedAt: '2024-01-10T00:00:00Z',
    exploitAvailable: true, patchAvailable: true,
    summary: 'An authentication bypass vulnerability allows remote attackers to access restricted resources via a crafted request.',
    affectedSoftware: ['Ivanti ICS 9.x', 'Ivanti ICS 22.x'],
    references: [],
  },
  {
    cveId: 'CVE-2024-27198', title: 'JetBrains TeamCity Remote Code Execution',
    cvssScore: 9.8, severity: 'Critical', publishedAt: '2024-03-04T00:00:00Z',
    exploitAvailable: true, patchAvailable: true,
    summary: 'An authentication bypass vulnerability in TeamCity On-Premises allows attackers to take over the server.',
    affectedSoftware: ['TeamCity < 2023.11.4'],
    references: [],
  },
  {
    cveId: 'CVE-2024-6387', title: 'OpenSSH regreSSHion Remote Code Execution',
    cvssScore: 8.1, severity: 'High', publishedAt: '2024-07-01T00:00:00Z',
    exploitAvailable: false, patchAvailable: true,
    summary: 'A signal handler race condition in OpenSSH\'s server (sshd) allows unauthenticated remote code execution as root on glibc-based Linux systems.',
    affectedSoftware: ['OpenSSH < 9.8p1'],
    references: [],
  },
]

export default function ThreatFeedPage() {
  const [cves, setCves]       = useState([])
  const [genAt, setGenAt]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemo, setIsDemo]   = useState(false)
  const [sevFilter, setSevFilter] = useState('All')
  const [mappedOnly, setMappedOnly] = useState(false)

  useEffect(() => {
    getThreatFeed()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.cves ?? data?.items ?? [])
        if (list.length > 0) {
          setCves(list)
          setGenAt(data?.generatedAt ?? data?.GeneratedAt ?? null)
        } else {
          setCves(DEMO_CVES)
          setIsDemo(true)
        }
      })
      .catch(() => { setCves(DEMO_CVES); setIsDemo(true) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = cves.filter((c) => {
    const sev = c.severity ?? c.Severity ?? 'Medium'
    if (sevFilter !== 'All' && sev !== sevFilter) return false
    if (mappedOnly) {
      const mapped = c.mappedChecks ?? c.MappedChecks ?? []
      if (mapped.length === 0) return false
    }
    return true
  })

  const counts = {}
  cves.forEach((c) => {
    const s = c.severity ?? c.Severity ?? 'Medium'
    counts[s] = (counts[s] || 0) + 1
  })

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Intelligence</p>
            <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
              <Rss className="w-8 h-8 text-crimson-400" /> CVE Threat Feed
            </h1>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-gray-400">Live CVE intelligence mapped to your scan findings.</p>
              {genAt
                ? <p className="text-xs text-gray-500">Updated {new Date(genAt).toLocaleString()}</p>
                : isDemo && <p className="text-xs text-gray-500 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">Sample CVEs — connect your API for live feed</p>}
            </div>
          </div>

          <PageGuide id="threat-feed" text="Live vulnerability intelligence from CISA KEV, EPSS, and NVD mapped to your scan findings. Use the severity filters to focus on Critical or High CVEs. Toggle 'Affects my scan findings' to see only CVEs that match vulnerabilities found in your scans. Refresh feeds manually from the status panel." />

          {/* Summary pills */}
          {cves.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {SEV_ORDER.filter((s) => counts[s]).map((s) => (
                <div key={s} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${SEV_STYLE[s]?.badge}`}>
                  {counts[s]} {s}
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <div className="flex gap-1.5">
              {['All', 'Critical', 'High', 'Medium', 'Low'].map((s) => (
                <button key={s} onClick={() => setSevFilter(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${sevFilter === s ? 'bg-crimson-500 border-crimson-500 text-white' : 'border-white/15 text-gray-400 hover:text-white'}`}>
                  {s}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none ml-2">
              <input type="checkbox" checked={mappedOnly} onChange={(e) => setMappedOnly(e.target.checked)}
                className="w-3.5 h-3.5 accent-crimson-500" />
              Affects my scan findings
            </label>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 py-12 justify-center text-sm">
              <Loader2 className="w-5 h-5 animate-spin" />Loading threat feed…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p>No CVEs match the current filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((cve, i) => (
                <CveCard key={cve.cveId ?? cve.CveId ?? i} cve={cve} />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  )
}
