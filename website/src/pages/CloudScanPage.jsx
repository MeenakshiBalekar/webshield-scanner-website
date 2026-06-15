import React, { useState, useEffect } from 'react'
import {
  Cloud, ScanLine, Loader2, AlertCircle, CheckCircle2, XCircle,
  ChevronDown, ChevronUp, Lock, Info, ShieldCheck, Eye, EyeOff, BookOpen,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getCloudChecksAws,
  startCloudScanAws,
  startCloudScanAzure,
  startCloudScanGcp,
  startCloudScanOci,
} from '../services/api'

/* ─── shared style maps ──────────────────────────────────────────────────── */
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

const OCI_REGIONS = [
  'us-ashburn-1','us-phoenix-1','us-chicago-1','us-sanjose-1',
  'eu-frankfurt-1','eu-amsterdam-1','eu-paris-1','eu-milan-1',
  'eu-stockholm-1','eu-marseille-1',
  'ap-tokyo-1','ap-osaka-1','ap-mumbai-1','ap-hyderabad-1',
  'ap-singapore-1','ap-seoul-1','ap-sydney-1',
  'ca-toronto-1','ca-montreal-1',
  'sa-saopaulo-1','sa-vinhedo-1',
  'me-jeddah-1','me-dubai-1','me-abudhabi-1',
  'af-johannesburg-1','il-jerusalem-1',
]

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return '' }
const statusStyle = (s) => STATUS_STYLES[s] || STATUS_STYLES.Error
const sevStyle    = (s) => SEVERITY_STYLES[s] || SEVERITY_STYLES.Info

/* ─── provider tab config ────────────────────────────────────────────────── */
const TABS = [
  { id: 'aws',   label: 'AWS',   color: 'text-orange-400',  ring: 'border-orange-500/40' },
  { id: 'azure', label: 'Azure', color: 'text-blue-400',    ring: 'border-blue-500/40'   },
  { id: 'gcp',   label: 'GCP',   color: 'text-green-400',   ring: 'border-green-500/40'  },
  { id: 'oci',   label: 'OCI',   color: 'text-red-400',     ring: 'border-red-500/40'    },
]

/* ─── setup guides (collapsible) ─────────────────────────────────────────── */
const AWS_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    { Effect: 'Allow', Action: ['iam:ListUsers','iam:GetLoginProfile','iam:ListMFADevices','iam:ListAccessKeys','iam:GetAccountPasswordPolicy','iam:GetAccountSummary'], Resource: '*' },
    { Effect: 'Allow', Action: ['s3:ListAllMyBuckets','s3:GetBucketAcl','s3:GetBucketPolicy','s3:GetBucketVersioning','s3:GetBucketLogging','s3:GetBucketPublicAccessBlock'], Resource: '*' },
    { Effect: 'Allow', Action: ['cloudtrail:DescribeTrails','cloudtrail:GetTrailStatus'], Resource: '*' },
    { Effect: 'Allow', Action: ['ec2:DescribeSecurityGroups','ec2:DescribeInstances'], Resource: '*' },
    { Effect: 'Allow', Action: ['rds:DescribeDBInstances'], Resource: '*' },
  ],
}, null, 2)

const SETUP_GUIDES = {
  aws: {
    title: 'IAM permissions setup guide',
    steps: [
      <>Open <b>IAM → Users → Create user</b></>,
      <>Choose <b>Attach policies directly → Create policy</b></>,
      'Paste the JSON below in the policy editor',
      <>Under <b>Security credentials</b>, create an access key</>,
      'Paste the key ID and secret into the form',
    ],
    note: 'These are all read-only actions. No write permissions are requested or needed.',
    code: AWS_POLICY,
    codeLabel: 'Required IAM Policy',
  },
  azure: {
    title: 'Service principal setup guide',
    steps: [
      <>Open <b>Azure Portal → Azure Active Directory → App registrations → New registration</b></>,
      <>Copy the <b>Application (client) ID</b> and <b>Directory (tenant) ID</b></>,
      <>Under <b>Certificates &amp; secrets → New client secret</b>, create a secret and copy its value</>,
      <>Go to your <b>Subscription → Access control (IAM) → Add role assignment</b></>,
      <>Assign the <b>Reader</b> role to your app registration</>,
      'Paste all four values into the form below',
    ],
    note: 'Reader role is read-only. No write or management operations are performed.',
  },
  gcp: {
    title: 'Service account setup guide',
    steps: [
      <>Open <b>GCP Console → IAM &amp; Admin → Service Accounts → Create</b></>,
      <>Grant the <b>Viewer</b> role (roles/viewer) to the service account</>,
      <>Under <b>Keys → Add key → Create new key → JSON</b>, download the key file</>,
      'Open the downloaded JSON file and paste its entire contents into the textarea below',
    ],
    note: 'Viewer role is read-only. No modifications are made to your GCP project.',
  },
  oci: {
    title: 'API key setup guide',
    steps: [
      <>Open <b>OCI Console → Profile (top-right) → User Settings → API Keys → Add API Key</b></>,
      'Choose "Generate API Key Pair", download both files, click Add',
      <>Copy the <b>Tenancy OCID</b> from <b>Administration → Tenancy Details</b></>,
      <>Copy your <b>User OCID</b> from <b>Profile → User Settings</b></>,
      'The fingerprint is shown after you add the key — copy it',
      'Paste the private key (.pem) contents into the textarea below',
    ],
    note: 'Only inspect permissions are required. Assign the ReadOnlyAccess policy to keep it minimal.',
  },
}

function SetupGuide({ provider }) {
  const [open, setOpen] = useState(false)
  const g = SETUP_GUIDES[provider]
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">{g.title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="border-t border-white/10 px-5 py-4 space-y-4 text-sm">
          <ol className="space-y-1.5 text-gray-400 list-decimal list-inside text-xs leading-relaxed">
            {g.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
          {g.code && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{g.codeLabel}</p>
              <pre className="bg-navy-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-gray-300 font-mono overflow-x-auto max-h-64 whitespace-pre">
                {g.code}
              </pre>
            </div>
          )}
          <p className="text-xs text-gray-500">{g.note}</p>
        </div>
      )}
    </div>
  )
}

/* ─── check preview (AWS only) ───────────────────────────────────────────── */
function CheckPreview({ checks }) {
  const [open, setOpen] = useState(false)
  if (!checks.length) return null
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Preview all {checks.length} checks</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
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
  )
}

/* ─── shared finding row ─────────────────────────────────────────────────── */
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

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        {status === 'Pass'
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

/* ─── shared results panel ───────────────────────────────────────────────── */
function ResultsPanel({ results }) {
  const [catFilter, setCatFilter] = useState('')

  const findings   = results?.findings ?? results?.Findings ?? []
  const categories = [...new Set(findings.map(f => field(f, 'category', 'Category') || 'Other'))]
  const filtered   = catFilter ? findings.filter(f => (field(f,'category','Category') || 'Other') === catFilter) : findings
  const passed     = findings.filter(f => field(f,'status','Status') === 'Pass').length
  const failed     = findings.length - passed

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Checks', value: findings.length, color: 'text-white'      },
          { label: 'Passed',       value: passed,          color: 'text-green-400'  },
          { label: 'Failed',       value: failed,          color: 'text-red-400'    },
        ].map((s) => (
          <div key={s.label} className="bg-white/3 border border-white/10 rounded-xl px-4 py-4 text-center">
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCatFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${!catFilter ? 'bg-crimson-500 text-white' : 'bg-white/5 border border-white/15 text-gray-400 hover:text-white'}`}
          >
            All ({findings.length})
          </button>
          {categories.map((cat) => {
            const cnt = findings.filter(f => (field(f,'category','Category') || 'Other') === cat).length
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
      )}

      <div className="space-y-2">
        {filtered.map((f, i) => <FindingRow key={i} finding={f} />)}
      </div>
    </div>
  )
}

/* ─── provider forms ─────────────────────────────────────────────────────── */
const inputCls    = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'
const textareaCls = `${inputCls} font-mono resize-none leading-relaxed`

function SecretInput({ value, onChange, placeholder, required = true }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        required={required}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${inputCls} pr-10 font-mono`}
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

function AwsForm({ onSubmit, scanning }) {
  const [form, setForm] = useState({ accessKeyId: '', secretAccessKey: '', region: 'us-east-1' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <Cloud className="w-4 h-4 text-orange-400" /> AWS Credentials
      </h2>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Access Key ID *</label>
        <input required value={form.accessKeyId} onChange={set('accessKeyId')} placeholder="AKIAIOSFODNN7EXAMPLE" className={`${inputCls} font-mono`} />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Secret Access Key *</label>
        <SecretInput value={form.secretAccessKey} onChange={set('secretAccessKey')} placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Region *</label>
        <select required value={form.region} onChange={set('region')} className={inputCls}>
          {AWS_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <SubmitRow scanning={scanning} label="Run AWS Audit" />
    </form>
  )
}

function AzureForm({ onSubmit, scanning }) {
  const [form, setForm] = useState({ tenantId: '', clientId: '', clientSecret: '', subscriptionId: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <Cloud className="w-4 h-4 text-blue-400" /> Azure Service Principal
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Tenant ID *</label>
          <input required value={form.tenantId} onChange={set('tenantId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Client ID *</label>
          <input required value={form.clientId} onChange={set('clientId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={`${inputCls} font-mono`} />
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Client Secret *</label>
        <SecretInput value={form.clientSecret} onChange={set('clientSecret')} placeholder="your-client-secret-value" />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Subscription ID *</label>
        <input required value={form.subscriptionId} onChange={set('subscriptionId')} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className={`${inputCls} font-mono`} />
      </div>
      <SubmitRow scanning={scanning} label="Run Azure Audit" />
    </form>
  )
}

function GcpForm({ onSubmit, scanning }) {
  const [form, setForm] = useState({ projectId: '', serviceAccountKey: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <Cloud className="w-4 h-4 text-green-400" /> GCP Service Account
      </h2>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Project ID *</label>
        <input required value={form.projectId} onChange={set('projectId')} placeholder="my-gcp-project-id" className={inputCls} />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Service Account Key JSON *</label>
        <textarea
          required
          rows={10}
          value={form.serviceAccountKey}
          onChange={set('serviceAccountKey')}
          placeholder={'{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  ...\n}'}
          className={textareaCls}
        />
        <p className="text-[10px] text-gray-500 mt-1">Paste the full contents of your downloaded JSON key file.</p>
      </div>
      <SubmitRow scanning={scanning} label="Run GCP Audit" />
    </form>
  )
}

function OciForm({ onSubmit, scanning }) {
  const [form, setForm] = useState({ tenancyOcid: '', userOcid: '', fingerprint: '', privateKey: '', region: 'us-ashburn-1' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
      <h2 className="text-base font-bold text-white flex items-center gap-2">
        <Cloud className="w-4 h-4 text-red-400" /> OCI API Key
      </h2>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Tenancy OCID *</label>
        <input required value={form.tenancyOcid} onChange={set('tenancyOcid')} placeholder="ocid1.tenancy.oc1..aaaa..." className={`${inputCls} font-mono`} />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">User OCID *</label>
        <input required value={form.userOcid} onChange={set('userOcid')} placeholder="ocid1.user.oc1..aaaa..." className={`${inputCls} font-mono`} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Fingerprint *</label>
          <input required value={form.fingerprint} onChange={set('fingerprint')} placeholder="xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx" className={`${inputCls} font-mono`} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Region *</label>
          <select required value={form.region} onChange={set('region')} className={inputCls}>
            {OCI_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Private Key (PEM) *</label>
        <textarea
          required
          rows={8}
          value={form.privateKey}
          onChange={set('privateKey')}
          placeholder={'-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----'}
          className={textareaCls}
        />
      </div>
      <SubmitRow scanning={scanning} label="Run OCI Audit" />
    </form>
  )
}

function SubmitRow({ scanning, label }) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
        <Lock className="w-3.5 h-3.5 text-green-400 shrink-0" />
        Credentials are used only for this scan — never logged, stored, or shared.
      </div>
      <button
        type="submit"
        disabled={scanning}
        className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
      >
        {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
        {scanning ? 'Scanning…' : label}
      </button>
    </>
  )
}

/* ─── main page ──────────────────────────────────────────────────────────── */
export default function CloudScanPage() {
  const [provider, setProvider] = useState('aws')
  const [scanning, setScanning] = useState(false)
  const [results,  setResults]  = useState(null)
  const [error,    setError]    = useState(null)
  const [checks,   setChecks]   = useState([])

  useEffect(() => { getCloudChecksAws().then(setChecks).catch(() => {}) }, [])

  const SCAN_FNS = { aws: startCloudScanAws, azure: startCloudScanAzure, gcp: startCloudScanGcp, oci: startCloudScanOci }

  const handleScan = async (payload) => {
    setScanning(true); setError(null); setResults(null)
    try {
      setResults(await SCAN_FNS[provider](payload))
    } catch (err) {
      setError(err.message || 'Scan failed')
    }
    setScanning(false)
  }

  const switchTab = (id) => { setProvider(id); setResults(null); setError(null) }

  const activeTab = TABS.find(t => t.id === provider)

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-500/15 border border-purple-500/30 rounded-lg flex items-center justify-center">
                <Cloud className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Cloud Security Scanner</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Cloud CIS Benchmark Audit</h1>
            <p className="text-gray-400">
              CIS-mapped security controls across IAM, storage, networking, logging, and compute —
              for AWS, Azure, GCP, and OCI.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

          {/* Provider tabs */}
          <div className="flex gap-1 bg-white/3 border border-white/10 rounded-xl p-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  provider === t.id
                    ? `bg-white/10 ${t.color}`
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Setup guide */}
          <SetupGuide provider={provider} />

          {/* Check preview (AWS only) */}
          {provider === 'aws' && <CheckPreview checks={checks} />}

          {/* Credential form */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}
            </div>
          )}

          {provider === 'aws'   && <AwsForm   onSubmit={handleScan} scanning={scanning} />}
          {provider === 'azure' && <AzureForm  onSubmit={handleScan} scanning={scanning} />}
          {provider === 'gcp'   && <GcpForm    onSubmit={handleScan} scanning={scanning} />}
          {provider === 'oci'   && <OciForm    onSubmit={handleScan} scanning={scanning} />}

          {/* Results */}
          {results && <ResultsPanel results={results} />}
        </div>
      </main>

      <Footer />
    </div>
  )
}
