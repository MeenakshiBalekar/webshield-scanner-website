import React, { useState } from 'react'
import { Mail, Search, Loader2, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Shield, Info } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PageGuide from '../components/PageGuide'
import { checkEmailSecurity } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

const RECORD_COLORS = {
  pass:    { ring: '#22c55e', icon: CheckCircle2, badge: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', label: 'Pass' },
  fail:    { ring: '#ef4444', icon: XCircle,      badge: 'text-red-400 bg-red-500/10 border-red-500/30',             label: 'Fail' },
  warn:    { ring: '#f59e0b', icon: AlertTriangle, badge: 'text-amber-400 bg-amber-500/10 border-amber-500/30',       label: 'Warning' },
  missing: { ring: '#6b7280', icon: AlertCircle,  badge: 'text-gray-400 bg-gray-500/10 border-gray-500/30',          label: 'Missing' },
  unknown: { ring: '#6b7280', icon: Info,          badge: 'text-gray-400 bg-white/5 border-white/10',                 label: 'Unknown' },
}

function statusOf(v) {
  if (v == null) return 'unknown'
  const s = String(v).toLowerCase()
  if (['pass', 'valid', 'enabled', 'true', '1', 'ok', 'found'].includes(s)) return 'pass'
  if (['fail', 'invalid', 'failed', 'false', '0', 'error'].includes(s)) return 'fail'
  if (['warn', 'warning', 'partial', 'missing', 'none', 'not found', 'absent'].includes(s)) return 'missing'
  return 'unknown'
}

function ScoreRing({ score }) {
  const s = score ?? 0
  const r = 36, circ = 2 * Math.PI * r, fill = circ * (s / 100)
  const color = s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : s >= 40 ? '#f97316' : '#ef4444'
  return (
    <svg width={90} height={90} viewBox="0 0 90 90">
      <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
      <circle cx={45} cy={45} r={r} fill="none" stroke={color} strokeWidth={7}
        strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" transform="rotate(-90 45 45)" />
      <text x={45} y={50} textAnchor="middle" fill="white" fontSize={18} fontWeight={700}>{s}</text>
    </svg>
  )
}

function StatusBadge({ status }) {
  const cfg = RECORD_COLORS[status] ?? RECORD_COLORS.unknown
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${cfg.badge}`}>
      <Icon className="w-3 h-3" />{cfg.label}
    </span>
  )
}

function RecordCard({ title, status, record, description, recommendation }) {
  const cfg   = RECORD_COLORS[status] ?? RECORD_COLORS.unknown
  const Icon  = cfg.icon
  return (
    <div className={`bg-white/3 border rounded-2xl overflow-hidden ${status === 'pass' ? 'border-emerald-500/20' : status === 'fail' ? 'border-red-500/20' : status === 'missing' ? 'border-amber-500/20' : 'border-white/10'}`}>
      <div className="px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            status === 'pass' ? 'bg-emerald-500/15' : status === 'fail' ? 'bg-red-500/15' : 'bg-amber-500/15'
          }`}>
            <Icon className={`w-4 h-4 ${cfg.badge.split(' ')[0]}`} />
          </div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <StatusBadge status={status} />
      </div>

      {(record || description || recommendation) && (
        <div className="border-t border-white/8 px-5 py-4 space-y-2.5">
          {record && (
            <div className="bg-black/30 border border-white/8 rounded-lg px-3 py-2">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Record</p>
              <p className="text-xs text-gray-300 font-mono break-all leading-relaxed">{record}</p>
            </div>
          )}
          {description && <p className="text-xs text-gray-400 leading-relaxed">{description}</p>}
          {recommendation && status !== 'pass' && (
            <div className="bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Recommendation</p>
              <p className="text-xs text-gray-300 leading-relaxed">{recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SpoofingBadge({ risk }) {
  if (!risk) return null
  const r = String(risk).toLowerCase()
  const style =
    r === 'high'   ? 'bg-red-500/15 border-red-500/30 text-red-300' :
    r === 'medium' ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' :
                     'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
  return (
    <div className={`flex items-center gap-3 border rounded-2xl px-5 py-4 ${style}`}>
      <Shield className="w-5 h-5 shrink-0" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">Spoofing Risk</p>
        <p className="text-lg font-extrabold capitalize">{risk}</p>
      </div>
    </div>
  )
}

function MxRow({ mx }) {
  const host   = field(mx, 'host', 'Host', 'hostname', 'Hostname') ?? '—'
  const tls    = field(mx, 'tls', 'Tls', 'tlsEnabled', 'TlsEnabled', 'hasTls', 'HasTls')
  const pref   = field(mx, 'preference', 'Preference', 'priority', 'Priority')
  const tlsVer = field(mx, 'tlsVersion', 'TlsVersion')
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        {pref != null && <span className="text-xs text-gray-500 w-6 text-right">{pref}</span>}
        <span className="text-sm text-gray-200 font-mono">{host}</span>
      </div>
      <div className="flex items-center gap-2">
        {tlsVer && <span className="text-xs text-gray-500">{tlsVer}</span>}
        {tls != null && (
          tls === true || tls === 'true' || tls === 1
            ? <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />TLS</span>
            : <span className="flex items-center gap-1 text-xs text-red-400 font-semibold"><XCircle className="w-3.5 h-3.5" />No TLS</span>
        )}
      </div>
    </div>
  )
}

export default function EmailSecurityPage() {
  const [domain,  setDomain]  = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState(null)

  const handleCheck = async () => {
    const d = domain.trim().replace(/^https?:\/\//i, '').replace(/\/.*/, '')
    if (!d) return
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await checkEmailSecurity(d)
      setResult(data)
    } catch (e) { setError(e.message || 'Check failed') }
    setLoading(false)
  }

  // Extract data using dual-case field access
  const spf    = result ? { status: statusOf(field(result, 'spfStatus', 'SpfStatus', 'spf', 'Spf')), record: field(result, 'spfRecord', 'SpfRecord', 'spf', 'Spf'), description: field(result, 'spfDescription', 'SpfDescription') } : null
  const dkim   = result ? { status: statusOf(field(result, 'dkimStatus', 'DkimStatus', 'dkim', 'Dkim')), record: field(result, 'dkimRecord', 'DkimRecord', 'dkim', 'Dkim'), description: field(result, 'dkimDescription', 'DkimDescription') } : null
  const dmarc  = result ? { status: statusOf(field(result, 'dmarcStatus', 'DmarcStatus', 'dmarc', 'Dmarc')), record: field(result, 'dmarcRecord', 'DmarcRecord', 'dmarc', 'Dmarc'), description: field(result, 'dmarcDescription', 'DmarcDescription'), recommendation: field(result, 'dmarcRecommendation', 'DmarcRecommendation') } : null
  const mxList = result ? (field(result, 'mxRecords', 'MxRecords', 'mx', 'Mx') ?? []) : []
  const score  = result ? field(result, 'score', 'Score', 'emailScore', 'EmailScore') : null
  const spoof  = result ? field(result, 'spoofingRisk', 'SpoofingRisk', 'spoofRisk', 'SpoofRisk') : null
  const checkedDomain = result ? (field(result, 'domain', 'Domain') ?? domain) : null

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-violet-500/15 border border-violet-500/30 rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Email Security</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Email Security Scanner</h1>
            <p className="text-gray-400 text-sm mt-1">
              Check SPF, DKIM, DMARC, MX TLS, and spoofing risk for any domain.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <PageGuide id="email-security" text="Verifies your domain's email security posture: SPF, DKIM, DMARC, MX record TLS, and BIMI. Enter a domain name and click Check Domain. A spoofing risk rating tells you whether an attacker can send email pretending to be your domain. Fix recommendations are provided inline for each failed check." />
          {/* Input */}
          <div className="flex gap-3">
            <input
              type="text"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCheck()}
              placeholder="example.com"
              className="flex-1 bg-white/5 border border-white/15 focus:border-violet-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors font-mono"
            />
            <button onClick={handleCheck} disabled={loading || !domain.trim()}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Checking…' : 'Check Domain'}
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Hero row */}
              <div className="flex flex-wrap items-center gap-5 bg-white/3 border border-white/10 rounded-2xl p-5">
                {score != null && <ScoreRing score={score} />}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-lg">{checkedDomain}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Email security analysis</p>
                </div>
                {spoof && <SpoofingBadge risk={spoof} />}
              </div>

              {/* Record cards */}
              {spf && (
                <RecordCard title="SPF" status={spf.status} record={typeof spf.record === 'string' ? spf.record : null}
                  description={spf.description}
                  recommendation="Add a TXT record: v=spf1 include:your-mail-provider.com ~all" />
              )}
              {dkim && (
                <RecordCard title="DKIM" status={dkim.status} record={typeof dkim.record === 'string' ? dkim.record : null}
                  description={dkim.description}
                  recommendation="Configure DKIM signing in your email provider and publish the public key as a TXT record." />
              )}
              {dmarc && (
                <RecordCard title="DMARC" status={dmarc.status} record={typeof dmarc.record === 'string' ? dmarc.record : null}
                  description={dmarc.description}
                  recommendation={dmarc.recommendation ?? "Add a TXT record at _dmarc: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com"} />
              )}

              {/* MX TLS */}
              {mxList.length > 0 && (
                <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white">MX Records & TLS</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Mail exchange servers and their TLS support</p>
                  </div>
                  <div className="px-5 py-2">
                    {mxList.map((mx, i) => <MxRow key={i} mx={mx} />)}
                  </div>
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
