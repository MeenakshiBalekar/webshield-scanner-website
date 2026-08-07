import React, { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, Loader2, AlertCircle, Eye, ShieldCheck, ShieldAlert,
  FileText, FileCheck2, ExternalLink,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAegisRuntimeDetail } from '../services/api'

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

function asArray(d, ...keys) {
  if (Array.isArray(d)) return d
  const v = f(d, ...keys)
  return Array.isArray(v) ? v : []
}

const SEV = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/30',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/30',
  medium:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  low:      'text-blue-400 bg-blue-500/10 border-blue-500/30',
  none:     'text-green-400 bg-green-500/10 border-green-500/30',
  clean:    'text-green-400 bg-green-500/10 border-green-500/30',
}
function sevKey(raw) {
  const s = String(raw ?? '').toLowerCase()
  return SEV[s] ? s : (s ? 'low' : 'none')
}

function PostureItem({ icon: Icon, ok, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        ok ? 'bg-green-500/12 border border-green-500/25' : 'bg-white/5 border border-white/10'
      }`}>
        <Icon className={`w-4 h-4 ${ok ? 'text-green-400' : 'text-gray-500'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-semibold ${ok ? 'text-white' : 'text-gray-400'}`}>{value}</p>
      </div>
    </div>
  )
}

export default function AegisRuntimeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [record, setRecord]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAegisRuntimeDetail(id)
      .then(setRecord)
      .catch(() => setError('Could not load this record — it may not exist.'))
      .finally(() => setLoading(false))
  }, [id])

  const security = f(record, 'security') ?? {}

  const name        = f(record, 'name', 'title', 'artifact', 'id') ?? id
  const description = f(record, 'description', 'summary', 'overview') ?? ''
  const type        = f(record, 'type', 'kind', 'category', 'source') ?? ''
  const sev         = f(record, 'severity', 'risk', 'status')
  const updated     = f(record, 'updatedAt', 'scannedAt', 'lastScan', 'timestamp')

  const cveCount    = f(security, 'cveCount', 'cves') ?? f(record, 'cveCount', 'cves', 'findings', 'issues')
  const reduction   = f(security, 'cveReductionPercent', 'cveReduction') ?? f(record, 'cveReductionPercent')
  const sbom        = f(security, 'sbomAvailable', 'sbom') ?? f(record, 'sbomAvailable', 'sbom')
  const provenance  = f(security, 'signedProvenance', 'provenance', 'signed') ?? f(record, 'signedProvenance')

  const findings = asArray(record, 'findings', 'issues', 'vulnerabilities', 'cveList')
  const related  = asArray(record, 'related', 'artifacts', 'components')

  const sk = sevKey(sev)
  const sevLabel = sev ? String(sev) : (Number(cveCount) > 0 ? 'At risk' : 'Clean')
  const linkFor = (r) => {
    const t = String(f(r, 'type', 'kind') ?? '').toLowerCase()
    const slug = f(r, 'slug', 'name', 'id')
    if (!slug) return null
    if (t.includes('image'))   return `/images/${encodeURIComponent(slug)}`
    if (t.includes('helm') || t.includes('chart')) return `/helm/${encodeURIComponent(slug)}`
    if (t.includes('lib'))     return `/libraries/${encodeURIComponent(slug)}`
    return null
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">

        <Link to="/runtime" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to Aegis Runtime
        </Link>

        {loading && (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 text-crimson-400 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-4">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
            <button onClick={() => navigate('/runtime')} className="text-sm text-crimson-400 hover:text-crimson-300 transition-colors">
              ← Back to Aegis Runtime
            </button>
          </div>
        )}

        {!loading && !error && record && (
          <>
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
                <Eye className="w-7 h-7 text-crimson-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-3xl font-extrabold text-white leading-tight break-words">{name}</h1>
                  <span className={`text-[10px] font-bold uppercase tracking-wider rounded px-2 py-0.5 border ${SEV[sk]}`}>
                    {sevLabel}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {type}{type && updated ? ' · ' : ''}{updated ? `updated ${updated}` : ''}
                </p>
              </div>
            </div>

            {description && <p className="text-gray-300 leading-relaxed max-w-3xl mb-8">{description}</p>}

            {/* Posture */}
            <h2 className="text-lg font-bold text-white mb-3">Posture</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
              <PostureItem
                icon={Number(cveCount) > 0 ? ShieldAlert : ShieldCheck}
                ok={Number(cveCount) === 0 || cveCount == null}
                label="Findings"
                value={Number(cveCount) > 0 ? String(cveCount) : '0 — clean'}
              />
              <PostureItem icon={ShieldCheck} ok={reduction != null} label="CVE reduction" value={reduction != null ? `${reduction}%` : '—'} />
              <PostureItem icon={FileText}    ok={!!sbom}            label="SBOM"              value={sbom ? 'Included' : 'Not available'} />
              <PostureItem icon={FileCheck2}  ok={!!provenance}      label="Signed provenance" value={provenance ? 'Verified' : 'Not signed'} />
            </div>

            {/* Findings */}
            {findings.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white mb-3">Findings</h2>
                <div className="border border-white/10 rounded-2xl overflow-hidden overflow-x-auto mb-8">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="bg-white/3 border-b border-white/10 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">Severity</th>
                        <th className="text-left px-4 py-3">Component</th>
                        <th className="text-left px-4 py-3">Fixed in</th>
                      </tr>
                    </thead>
                    <tbody>
                      {findings.map((v, i) => {
                        const fid   = f(v, 'id', 'cve', 'cveId', 'name') ?? '—'
                        const fsev  = f(v, 'severity', 'risk')
                        const comp  = f(v, 'component', 'package', 'artifact') ?? '—'
                        const fixed = f(v, 'fixedIn', 'fixedVersion', 'remediation')
                        const fk    = sevKey(fsev)
                        return (
                          <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-xs text-crimson-400">{fid}</td>
                            <td className="px-4 py-2.5">
                              <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 border ${SEV[fk]}`}>{fsev ? String(fsev) : '—'}</span>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-gray-300">{comp}</td>
                            <td className="px-4 py-2.5 text-xs">
                              {fixed
                                ? <span className="text-green-400 font-mono">{fixed}</span>
                                : <span className="text-gray-600">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Related artifacts */}
            {related.length > 0 && (
              <>
                <h2 className="text-lg font-bold text-white mb-3">Related artifacts</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {related.map((r, i) => {
                    const rName = typeof r === 'string' ? r : (f(r, 'name', 'slug', 'id') ?? '—')
                    const href  = typeof r === 'string' ? null : linkFor(r)
                    const rType = typeof r === 'string' ? '' : (f(r, 'type', 'kind') ?? '')
                    const inner = (
                      <div className="flex items-center gap-3 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 rounded-xl px-4 py-3 transition-colors group h-full">
                        <div className="w-8 h-8 rounded-lg bg-crimson-500/10 border border-crimson-500/20 flex items-center justify-center shrink-0">
                          <Eye className="w-4 h-4 text-crimson-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-crimson-300 transition-colors">{rName}</p>
                          {rType && <p className="text-[11px] text-gray-500 truncate">{rType}</p>}
                        </div>
                        {href && <ExternalLink className="w-3.5 h-3.5 text-gray-600 shrink-0" />}
                      </div>
                    )
                    return href
                      ? <Link key={i} to={href}>{inner}</Link>
                      : <div key={i}>{inner}</div>
                  })}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
