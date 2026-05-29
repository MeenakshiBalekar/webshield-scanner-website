import React, { useState, useEffect } from 'react'
import {
  Cloud, ScanLine, Loader2, AlertCircle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Lock, Info, ShieldCheck, RefreshCw,
  Eye, EyeOff, BookOpen,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getCloudChecksAws, startCloudScanAws } from '../services/api'

/* ── helpers ── */
const STATUS_STYLES = {
  Pass:         'text-green-400 bg-green-500/10 border-green-500/30',
  Fail:         'text-red-400 bg-red-500/10 border-red-500/30',
  Warning:      'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  Error:        'text-orange-400 bg-orange-500/10 border-orange-500/30',
  AccessDenied: 'text-gray-400 bg-gray-500/10 border-gray-500/30',
}
const SEVERITY_STYLES = {
  Critical: 'text-red-400',
  High:     'text-orange-400',
  Medium:   'text-yellow-400',
  Low:      'text-blue-400',
  Info:     'text-gray-400',
}

const AWS_REGIONS = [
  'us-east-1','us-east-2','us-west-1','us-west-2',
  'eu-west-1','eu-west-2','eu-west-3','eu-central-1','eu-north-1',
  'ap-southeast-1','ap-southeast-2','ap-northeast-1','ap-northeast-2',
  'ap-south-1','sa-east-1','ca-central-1',
]

const CATEGORIES = ['IAM', 'S3', 'CloudTrail', 'EC2', 'RDS']

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }

function statusStyle(s) { return STATUS_STYLES[s] || STATUS_STYLES.Error }
function sevStyle(s)    { return SEVERITY_STYLES[s] || SEVERITY_STYLES.Info }

/* ── IAM setup guide ── */
function IamGuide() {
  const [open, setOpen] = useState(false)

  const POLICY = JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      { Effect: 'Allow', Action: ['iam:ListUsers','iam:GetLoginProfile','iam:ListMFADevices','iam:ListAccessKeys','iam:GetAccountPasswordPolicy','iam:GetAccountSummary'], Resource: '*' },
      { Effect: 'Allow', Action: ['s3:ListAllMyBuckets','s3:GetBucketAcl','s3:GetBucketPolicy','s3:GetBucketVersioning','s3:GetBucketLogging','s3:GetBucketPublicAccessBlock'], Resource: '*' },
      { Effect: 'Allow', Action: ['cloudtrail:DescribeTrails','cloudtrail:GetTrailStatus'], Resource: '*' },
      { Effect: 'Allow', Action: ['ec2:DescribeSecurityGroups','ec2:DescribeInstances'], Resource: '*' },
      { Effect: 'Allow', Action: ['rds:DescribeDBInstances'], Resource: '*' },
    ],
  }, null, 2)

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">IAM permissions setup guide</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4 text-sm">
          <div>
            <p className="text-gray-400 mb-2">Create a read-only IAM user and attach the following policy:</p>
            <ol className="space-y-1.5 text-gray-400 list-decimal list-inside text-xs leading-relaxed">
              <li>Open <span className="text-white">IAM → Users → Create user</span></li>
              <li>Choose <span className="text-white">Attach policies directly → Create policy</span></li>
              <li>Paste the JSON below in the policy editor</li>
              <li>Under <span className="text-white">Security credentials</span>, create an access key</li>
              <li>Paste the key ID and secret into the form</li>
            </ol>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Required IAM Policy</p>
            <pre className="bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-64 whitespace-pre">
              {POLICY}
            </pre>
          </div>
          <p className="text-xs text-gray-500">
            These are all read-only actions. No write permissions are requested or needed.
          </p>
        </div>
      )}
    </div>
  )
}

/* ── Finding row ── */
function FindingRow({ finding }) {
  const [open, setOpen] = useState(false)

  const check    = field(finding, 'checkName', 'CheckName', 'check', 'name', 'Name')
  const status   = field(finding, 'status', 'Status')
  const severity = field(finding, 'severity', 'Severity')
  const evidence = field(finding, 'evidence', 'Evidence')
  const compRef  = field(finding, 'complianceReference', 'ComplianceReference', 'compliance_reference')
  const rec      = field(finding, 'recommendation', 'Recommendation')
  const desc     = field(finding, 'description', 'Description')
  const resource = field(finding, 'resource', 'Resource', 'resourceId', 'ResourceId')

  const isPassed = status === 'Pass'

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        {isPassed
          ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{check}</p>
          {resource && <p className="text-[10px] text-gray-500 truncate">{resource}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {severity && <span className={`text-[10px] font-semibold uppercase ${sevStyle(severity)}`}>{severity}</span>}
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusStyle(status)}`}>{status}</span>
          {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          {desc && <p className="text-sm text-gray-400">{desc}</p>}
          {evidence && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Evidence</p>
              <pre className="bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-x-auto max-h-40">
                {typeof evidence === 'string' ? evidence : JSON.stringify(evidence, null, 2)}
              </pre>
            </div>
          )}
          {compRef && (
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-gray-300">Compliance: </span>{compRef}
            </p>
          )}
          {rec && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Recommendation</p>
              <p className="text-sm text-gray-300">{rec}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function CloudScanPage() {
  const [form, setForm]           = useState({ accessKeyId: '', secretAccessKey: '', region: 'us-east-1' })
  const [showSecret, setShowSecret] = useState(false)
  const [scanning, setScanning]   = useState(false)
  const [results, setResults]     = useState(null)
  const [error, setError]         = useState(null)
  const [checks, setChecks]       = useState([])
  const [showChecks, setShowChecks] = useState(false)
  const [catFilter, setCatFilter] = useState('')

  useEffect(() => {
    getCloudChecksAws().then(setChecks).catch(() => {})
  }, [])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleScan = async (e) => {
    e.preventDefault()
    setScanning(true); setError(null); setResults(null)
    try {
      const data = await startCloudScanAws(form)
      setResults(data)
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const findings   = results?.findings ?? results?.Findings ?? []
  const categories = [...new Set(findings.map(f => field(f, 'category', 'Category') || 'Other'))]
  const filtered   = catFilter ? findings.filter(f => (field(f,'category','Category') || 'Other') === catFilter) : findings
  const passed     = findings.filter(f => field(f,'status','Status') === 'Pass').length
  const failed     = findings.length - passed

  const inputCls = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-500/15 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Cloud className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Cloud Security Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">AWS CIS Benchmark Audit</h1>
            <p className="text-gray-400">
              13 CIS-mapped controls across IAM, S3, CloudTrail, EC2, and RDS. Paginated account-wide coverage
              — handles 100+ users and security groups correctly.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <IamGuide />

          {/* Check preview */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowChecks(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-white">Preview all 13 checks</span>
              </div>
              {showChecks ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {showChecks && checks.length > 0 && (
              <div className="border-t border-white/10 px-5 py-4 grid sm:grid-cols-2 gap-2">
                {checks.map((c, i) => {
                  const name = field(c, 'checkName', 'CheckName', 'name', 'Name')
                  const cat  = field(c, 'category', 'Category')
                  const sev  = field(c, 'severity', 'Severity')
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-400 shrink-0" />
                      <span className="flex-1 min-w-0 truncate">{name}</span>
                      {cat && <span className="shrink-0 text-gray-600">{cat}</span>}
                      {sev && <span className={`shrink-0 font-semibold ${sevStyle(sev)}`}>{sev}</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Scan form */}
          <form onSubmit={handleScan} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-purple-400" /> AWS Credentials
            </h2>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Access Key ID *</label>
              <input required value={form.accessKeyId} onChange={set('accessKeyId')} placeholder="AKIAIOSFODNN7EXAMPLE"
                className={`${inputCls} font-mono`} />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Secret Access Key *</label>
              <div className="relative">
                <input
                  required
                  type={showSecret ? 'text' : 'password'}
                  value={form.secretAccessKey}
                  onChange={set('secretAccessKey')}
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  className={`${inputCls} pr-10 font-mono`}
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Region *</label>
              <select required value={form.region} onChange={set('region')} className={inputCls}>
                {AWS_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
              <Lock className="w-3.5 h-3.5 text-green-400 shrink-0" />
              Credentials are used only for this scan — never logged, stored, or shared.
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
              </div>
            )}

            <button
              type="submit"
              disabled={scanning}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
            >
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
              {scanning ? 'Scanning…' : 'Run AWS Audit'}
            </button>
          </form>

          {/* Results */}
          {results && (
            <div className="space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Total Checks', value: findings.length, color: 'text-white' },
                  { label: 'Passed',       value: passed,          color: 'text-green-400' },
                  { label: 'Failed',       value: failed,          color: 'text-red-400' },
                ].map((s) => (
                  <div key={s.label} className="bg-white/3 border border-white/10 rounded-xl px-4 py-4 text-center">
                    <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCatFilter('')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!catFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'}`}
                >
                  All ({findings.length})
                </button>
                {(catFilter ? categories : CATEGORIES.filter(c => categories.includes(c))).concat(
                  categories.filter(c => !CATEGORIES.includes(c))
                ).map((cat) => {
                  const cnt = findings.filter(f => (field(f,'category','Category') || 'Other') === cat).length
                  if (!cnt) return null
                  return (
                    <button
                      key={cat}
                      onClick={() => setCatFilter(cat === catFilter ? '' : cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${catFilter === cat ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'}`}
                    >
                      {cat} ({cnt})
                    </button>
                  )
                })}
              </div>

              {/* Findings */}
              <div className="space-y-2">
                {filtered.map((f, i) => <FindingRow key={i} finding={f} />)}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
