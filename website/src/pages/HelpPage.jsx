import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, ChevronRight, ChevronDown, ExternalLink,
  ScanLine, Globe, Wifi, Server, Cloud, Code2, GitMerge,
  Bot, RefreshCw, Wrench, LayoutDashboard, CreditCard,
  Shield, AlertCircle, BookOpen, MessageCircle, Mail,
  Play, Settings, Key, Download, BarChart3, Clock,
  CheckCircle, FileText, Zap, Lock,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

/* ─── Data ─────────────────────────────────────────────────── */
const CATEGORIES = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    icon: Play,
    articles: [
      { id: 'gs-overview',    title: 'Platform overview' },
      { id: 'gs-first-scan',  title: 'Run your first scan' },
      { id: 'gs-results',     title: 'Understanding scan results' },
      { id: 'gs-dashboard',   title: 'Navigating the dashboard' },
    ],
  },
  {
    id: 'scanners',
    label: 'Scanners',
    icon: ScanLine,
    articles: [
      { id: 'sc-web',     title: 'Web vulnerability scanner' },
      { id: 'sc-api',     title: 'API security scanner' },
      { id: 'sc-network', title: 'Network scanner' },
      { id: 'sc-host',    title: 'Host scanner' },
      { id: 'sc-cloud',   title: 'Cloud scanner (AWS)' },
      { id: 'sc-code',    title: 'Code & secrets scanner' },
    ],
  },
  {
    id: 'agent',
    label: 'Agent & Automation',
    icon: Bot,
    articles: [
      { id: 'ag-install',   title: 'Installing the Udyo360 Agent' },
      { id: 'ag-autoscan',  title: 'Auto scan configuration' },
      { id: 'ag-monitor',   title: 'Server monitor mode' },
      { id: 'ag-remediation', title: 'Automated remediation tasks' },
    ],
  },
  {
    id: 'cicd',
    label: 'CI/CD Integration',
    icon: GitMerge,
    articles: [
      { id: 'ci-github',  title: 'GitHub Actions' },
      { id: 'ci-gitlab',  title: 'GitLab CI' },
      { id: 'ci-jenkins', title: 'Jenkins pipeline' },
      { id: 'ci-azure',   title: 'Azure DevOps' },
      { id: 'ci-gate',    title: 'Security gate configuration' },
    ],
  },
  {
    id: 'remediation',
    label: 'Remediation',
    icon: Wrench,
    articles: [
      { id: 're-database',  title: 'Security knowledge base' },
      { id: 're-workflow',  title: 'Remediation workflow' },
      { id: 're-cvss',      title: 'Understanding CVSS scores' },
      { id: 're-priority',  title: 'Prioritising vulnerabilities' },
    ],
  },
  {
    id: 'account',
    label: 'Account & Billing',
    icon: CreditCard,
    articles: [
      { id: 'ac-plans',    title: 'Plans and pricing' },
      { id: 'ac-billing',  title: 'Billing and invoices' },
      { id: 'ac-api-keys', title: 'API keys' },
      { id: 'ac-team',     title: 'Team management' },
    ],
  },
]

const ARTICLES = {
  /* ── Getting Started ── */
  'gs-overview': {
    title: 'Platform Overview',
    icon: Globe,
    content: [
      {
        heading: 'What is Udyo360?',
        body: 'Udyo360 is a continuous web security platform that helps development teams and security engineers find, understand, and fix vulnerabilities before attackers do. It combines automated scanning across multiple attack surfaces — web, API, network, host, cloud, and code — with a remediation knowledge base and CI/CD integration.',
      },
      {
        heading: 'Core concepts',
        body: null,
        list: [
          { term: 'Scan', def: 'A single test run against a target URL or asset. Scans are on-demand or scheduled.' },
          { term: 'Finding', def: 'A detected issue with a severity rating (Critical, High, Medium, Low), CVSS score, and remediation guidance.' },
          { term: 'Remediation check', def: 'A knowledge-base entry mapping a vulnerability class to framework-specific fix code.' },
          { term: 'Agent', def: 'A lightweight binary that runs on your server for continuous monitoring and automated tasks.' },
          { term: 'Security gate', def: 'A CI/CD step that fails the pipeline if scan results exceed a severity threshold.' },
        ],
      },
      {
        heading: 'Quick navigation',
        body: null,
        links: [
          { label: 'Web Scanner',         to: '/scanner' },
          { label: 'Dashboard',           to: '/dashboard' },
          { label: 'CVE / Knowledge Base',to: '/cve-database' },
          { label: 'Remediation',         to: '/remediation' },
          { label: 'Schedule Scans',      to: '/schedule' },
          { label: 'CI/CD Setup',         to: '/scanner/cicd' },
        ],
      },
    ],
  },
  'gs-first-scan': {
    title: 'Run Your First Scan',
    icon: ScanLine,
    content: [
      {
        heading: 'Step 1 — Create an account',
        body: 'Sign up at udyo360.com and verify your email address. Free accounts get 5 scans per month with 30-day result retention.',
      },
      {
        heading: 'Step 2 — Navigate to the Web Scanner',
        body: 'Go to Scanners → Web Scanner or click "Launch Scanner" in the navigation bar. You can also reach it directly at /scanner.',
      },
      {
        heading: 'Step 3 — Enter your target URL',
        body: 'Enter the full URL including the scheme (https://your-domain.com). You must own or have written authorisation to scan this target.',
      },
      {
        heading: 'Step 4 — Review results',
        body: 'Scan results typically return in 15–60 seconds. Results include a security score (0–100), infrastructure profile, and a list of findings grouped by severity. Click any finding to expand its technical details, attack scenario, and step-by-step fix guidance.',
      },
      {
        heading: 'Step 5 — Download or share your report',
        body: 'Use the Report panel at the bottom of the results page to download a PDF or send the report by email.',
      },
    ],
  },
  'gs-results': {
    title: 'Understanding Scan Results',
    icon: BarChart3,
    content: [
      {
        heading: 'Security score',
        body: 'A 0–100 score reflecting the overall security posture of the scanned target. 80–100 is good; below 60 indicates significant exposure. The score delta (▲ / ▼) compares this scan to the previous scan of the same target.',
      },
      {
        heading: 'Severity levels',
        body: null,
        list: [
          { term: 'Critical (9–10)', def: 'Immediate risk of compromise. Address within 24 hours.' },
          { term: 'High (7–8.9)', def: 'Significant risk. Address within 7 days.' },
          { term: 'Medium (4–6.9)', def: 'Moderate risk. Address within 30 days.' },
          { term: 'Low (0.1–3.9)', def: 'Informational or low-impact. Address in next sprint.' },
        ],
      },
      {
        heading: 'Finding detail panel',
        body: 'Click any finding row to expand its detail. You will see: What Was Found (technical evidence), Why It Is This Severity, What Happens If Not Fixed, Business Impact, a Real Attack Scenario, and step-by-step fix guidance. The risk score bar shows severity on a 0–10 scale.',
      },
      {
        heading: 'View Fix link',
        body: 'Findings that have a corresponding knowledge-base entry show a "View Fix →" button. Clicking it opens the Remediation page pre-filtered to that check, with framework-specific code snippets for your stack.',
      },
    ],
  },
  'gs-dashboard': {
    title: 'Navigating the Dashboard',
    icon: LayoutDashboard,
    content: [
      {
        heading: 'Overview',
        body: 'The Dashboard at /dashboard shows your security posture at a glance: total scans run, average score, open vulnerabilities by severity, and recent scan history.',
      },
      {
        heading: 'Open Vulnerabilities widget',
        body: 'The Open Vulnerabilities panel lists your top 5 highest-CVSS findings across all recent scans. Each finding links directly to its remediation guidance.',
      },
      {
        heading: 'Scan history',
        body: 'Full scan history is available at /scanner/history. You can filter by target URL, date range, and severity. Export history as CSV from this page.',
      },
    ],
  },

  /* ── Scanners ── */
  'sc-web': {
    title: 'Web Vulnerability Scanner',
    icon: Globe,
    content: [
      { heading: 'What it scans', body: 'HTTP security headers (CSP, HSTS, X-Frame-Options, etc.), TLS configuration, cookie flags, information disclosure, open redirects, and OWASP Top 10 indicators.' },
      { heading: 'How to use it', body: 'Navigate to /scanner, enter your target URL, and click Scan. Results include an infrastructure profile (WAF, CDN, runtime, TLS version) and a list of findings.' },
      { heading: 'Rate limits', body: 'Free plans: 5 scans/month. Starter: 50 scans/month. Pro and above: unlimited. Concurrent scans are limited to 1 (free), 3 (starter), or 10 (pro+).' },
    ],
  },
  'sc-api': {
    title: 'API Security Scanner',
    icon: Zap,
    content: [
      { heading: 'What it scans', body: 'REST API endpoints for broken authentication, missing rate limiting, CORS misconfiguration, verbose error messages, and sensitive data exposure in responses.' },
      { heading: 'How to use it', body: 'Navigate to /scanner, select "API Scanner", enter your API base URL. Optionally provide a Bearer token for authenticated endpoint testing.' },
    ],
  },
  'sc-network': {
    title: 'Network Scanner',
    icon: Wifi,
    content: [
      { heading: 'What it scans', body: 'Open ports, running services, banner information, and known CVEs for detected service versions.' },
      { heading: 'How to use it', body: 'Navigate to /scanner/network, enter a hostname or IP address. Results show open ports grouped by risk level with service details and advisories.' },
      { heading: 'Authorisation requirement', body: 'You must own or have written authorisation to scan any host. Scanning third-party systems is illegal.' },
    ],
  },
  'sc-host': {
    title: 'Host Scanner',
    icon: Server,
    content: [
      { heading: 'What it scans', body: 'SSH configuration, OS hardening, running processes, file permissions, and 18 CIS-benchmark checks.' },
      { heading: 'How to use it', body: 'Navigate to /scanner/host and enter your server hostname along with SSH credentials. Credentials are used only for the duration of the scan and are never stored.' },
    ],
  },
  'sc-cloud': {
    title: 'Cloud Scanner (AWS)',
    icon: Cloud,
    content: [
      { heading: 'What it scans', body: 'AWS IAM misconfigurations, publicly accessible S3 buckets, security group rules, CloudTrail logging, and 13 CIS AWS benchmark checks.' },
      { heading: 'How to use it', body: 'Navigate to /scanner/cloud. Create a read-only IAM role using the policy shown on the page, then enter your AWS Access Key ID and Secret. Credentials are used only for the scan and are never persisted.' },
    ],
  },
  'sc-code': {
    title: 'Code & Secrets Scanner',
    icon: Code2,
    content: [
      { heading: 'What it scans', body: 'Hardcoded secrets (API keys, passwords, tokens), weak cryptography, SQL injection patterns, and path traversal risks in pasted code.' },
      { heading: 'How to use it', body: 'Navigate to /scanner/code and paste your code snippet. Detected secrets are automatically redacted in the results display. Click the eye icon to reveal a secret if needed.' },
    ],
  },

  /* ── Agent ── */
  'ag-install': {
    title: 'Installing the Udyo360 Agent',
    icon: Download,
    content: [
      { heading: 'Overview', body: 'The Udyo360 Agent is a lightweight binary that runs on your server. It supports continuous monitoring, automated remediation tasks, and scheduled scanning without requiring inbound firewall rules.' },
      {
        heading: 'Installation',
        body: null,
        code: { lang: 'bash', snippet: '# Linux / macOS\ncurl -sSL https://udyo360.com/install-agent.sh | bash\n\n# Or download directly from /agent and run:\nchmod +x udyo360-agent\n./udyo360-agent --key YOUR_API_KEY' },
      },
      { heading: 'Your API key', body: 'Find your API key in Dashboard → Settings → API Keys. Keep it secret — it grants access to scan on your behalf.' },
    ],
  },
  'ag-autoscan': {
    title: 'Auto Scan Configuration',
    icon: RefreshCw,
    content: [
      { heading: 'What is Auto Scan?', body: 'Auto Scan lets you define a list of assets and scan them automatically on a schedule. Results are posted to your dashboard and optionally emailed to your team.' },
      { heading: 'Setting it up', body: 'Navigate to /autoscan. Add your target assets and configure scan intervals (hourly, daily, weekly). The Agent must be installed and running on a host with network access to your targets.' },
    ],
  },
  'ag-monitor': {
    title: 'Server Monitor Mode',
    icon: Settings,
    content: [
      { heading: 'Overview', body: 'Monitor mode runs the Agent as a lightweight daemon that continuously checks server health, detects configuration drift, and alerts on anomalies.' },
      {
        heading: 'Start monitor mode',
        body: null,
        code: { lang: 'bash', snippet: 'udyo360-agent --mode monitor --key YOUR_API_KEY' },
      },
      { heading: 'Viewing data', body: 'Monitor data streams to /servermonitor in your dashboard. Alerts are sent via email and optionally webhook.' },
    ],
  },
  'ag-remediation': {
    title: 'Automated Remediation Tasks',
    icon: CheckCircle,
    content: [
      { heading: 'Overview', body: 'The Agent can automatically apply low-risk remediation tasks (e.g., setting security headers, adjusting file permissions) that you approve in the dashboard.' },
      { heading: 'Workflow', body: 'Tasks are surfaced at /remediation-tasks. Review each task, click Acknowledge to queue it, then Resolve once applied. The Agent executes tasks on the next heartbeat cycle.' },
    ],
  },

  /* ── CI/CD ── */
  'ci-github': {
    title: 'GitHub Actions',
    icon: GitMerge,
    content: [
      { heading: 'Overview', body: 'Add a security gate to your GitHub Actions workflow that fails the build if critical or high-severity vulnerabilities are detected.' },
      {
        heading: 'Workflow YAML',
        body: null,
        code: {
          lang: 'yaml',
          snippet: `name: Udyo360 Security Scan
on: [push, pull_request]
jobs:
  udyo360:
    runs-on: ubuntu-latest
    steps:
      - name: Run Udyo360 Security Gate
        run: |
          curl -s -X POST \\
            -H "Authorization: Bearer \${{ secrets.UDYO360_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"url": "\${{ vars.UDYO360_URL }}"}' \\
            https://webshield-backend-api.onrender.com/api/cicd/gate > result.json
          cat result.json | jq .
          [ "$(cat result.json | jq -r '.passed')" = "true" ] || exit 1`,
        },
      },
      { heading: 'Required secrets', body: 'Add UDYO360_API_KEY as a repository secret and UDYO360_URL as a repository variable in Settings → Secrets and Variables.' },
    ],
  },
  'ci-gate': {
    title: 'Security Gate Configuration',
    icon: Lock,
    content: [
      { heading: 'What is a security gate?', body: 'A security gate is a CI/CD step that calls the /api/cicd/gate endpoint and returns pass/fail based on whether scan findings exceed a configured threshold.' },
      { heading: 'Gate parameters', body: null, list: [
        { term: 'url', def: 'Target URL to scan (required).' },
        { term: 'failOn', def: 'Minimum severity to fail the gate. Default: "High". Options: "Critical", "High", "Medium", "Low".' },
        { term: 'timeout', def: 'Maximum scan duration in seconds. Default: 120.' },
      ]},
      { heading: 'Live gate tester', body: 'Use the live gate tester at /scanner/cicd to test your configuration before committing it to your pipeline.' },
    ],
  },

  /* ── Remediation ── */
  're-database': {
    title: 'Security Knowledge Base',
    icon: BookOpen,
    content: [
      { heading: 'Overview', body: 'The Knowledge Base at /cve-database contains 69 vulnerability checks with CVSS scores, CWE mappings, compliance framework references (PCI-DSS, ISO 27001, SOC 2, NIST), and framework-specific fix code.' },
      { heading: 'Searching', body: 'Use the search bar to find checks by name, category, or keyword. Filter by severity using the chips at the top of the list. Clicking a check opens its detail panel with fix tabs for different technology stacks.' },
    ],
  },
  're-cvss': {
    title: 'Understanding CVSS Scores',
    icon: AlertCircle,
    content: [
      { heading: 'What is CVSS?', body: 'The Common Vulnerability Scoring System (CVSS) provides a standardised numerical score (0–10) representing the severity of a vulnerability. Udyo360 uses CVSS v3.1.' },
      { heading: 'Score ranges', body: null, list: [
        { term: '9.0 – 10.0', def: 'Critical — exploit likely, severe impact.' },
        { term: '7.0 – 8.9', def: 'High — significant risk, active exploitation possible.' },
        { term: '4.0 – 6.9', def: 'Medium — notable risk but requires specific conditions.' },
        { term: '0.1 – 3.9', def: 'Low — limited impact, difficult to exploit.' },
        { term: '0.0', def: 'None — informational only.' },
      ]},
    ],
  },
  're-priority': {
    title: 'Prioritising Vulnerabilities',
    icon: BarChart3,
    content: [
      { heading: 'Recommended order', body: 'Address findings in this order: (1) Internet-facing Critical/High findings. (2) Findings with known public exploits. (3) Findings affecting authentication or data storage. (4) Medium findings on production systems. (5) Low findings and internal systems.' },
      { heading: 'Using the dashboard widget', body: 'The Open Vulnerabilities widget on your dashboard lists your top 5 by CVSS score across all recent scans, giving you a prioritised to-do list at a glance.' },
    ],
  },
  're-workflow': {
    title: 'Remediation Workflow',
    icon: Wrench,
    content: [
      { heading: 'Standard workflow', body: null, list: [
        { term: '1. Scan', def: 'Run a scan to identify findings.' },
        { term: '2. Prioritise', def: 'Sort by CVSS score and business impact.' },
        { term: '3. Fix', def: 'Apply the framework-specific fix from the knowledge base.' },
        { term: '4. Re-scan', def: 'Run the scanner again to verify the fix.' },
        { term: '5. Close', def: 'Mark the finding as resolved in /remediation.' },
      ]},
    ],
  },

  /* ── Account ── */
  'ac-plans': {
    title: 'Plans and Pricing',
    icon: CreditCard,
    content: [
      { heading: 'Overview', body: 'Udyo360 offers Free, Starter, Pro, and Enterprise plans. View the full feature comparison at /pricing.' },
      { heading: 'Upgrading', body: 'Click Upgrade in the Billing page (/billing) or in the Pricing page. Upgrades take effect immediately and are prorated.' },
    ],
  },
  'ac-api-keys': {
    title: 'API Keys',
    icon: Key,
    content: [
      { heading: 'Creating an API key', body: 'Go to Dashboard → Settings → API Keys and click Generate Key. Give it a name and optionally restrict it to specific IP addresses.' },
      { heading: 'Using your API key', body: 'Pass the key as a Bearer token: Authorization: Bearer YOUR_API_KEY. Treat your API key like a password — rotate it immediately if compromised.' },
      { heading: 'Revoking a key', body: 'Click the trash icon next to any key in the API Keys list to revoke it immediately.' },
    ],
  },
  'ac-billing': {
    title: 'Billing and Invoices',
    icon: FileText,
    content: [
      { heading: 'Viewing invoices', body: 'All invoices are available at /billing under the Invoice History section. Click any invoice to download a PDF.' },
      { heading: 'Payment methods', body: 'We accept all major credit/debit cards via Paddle. You can update your payment method in /billing → Manage Billing.' },
      { heading: 'Cancellation', body: 'You can cancel at any time from /billing. Your plan remains active until the end of the current billing period.' },
    ],
  },
  'ac-team': {
    title: 'Team Management',
    icon: Shield,
    content: [
      { heading: 'Coming soon', body: 'Multi-user team workspaces are in development. When available, team admins will be able to invite members, assign roles, and share scan results across the organisation.' },
      { heading: 'In the meantime', body: 'Use API keys to integrate Udyo360 into shared CI/CD pipelines. Scan reports can be shared via email from the results page.' },
    ],
  },
}

/* ─── Sub-components ──────────────────────────────────────── */
function ArticleContent({ article }) {
  if (!article) return null
  const Icon = article.icon
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        {Icon && (
          <div className="w-10 h-10 bg-crimson-500/10 border border-crimson-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-crimson-400" />
          </div>
        )}
        <h2 className="text-2xl font-bold text-white">{article.title}</h2>
      </div>
      <div className="space-y-6">
        {article.content.map((block, i) => (
          <div key={i}>
            <h3 className="text-sm font-semibold text-white mb-2">{block.heading}</h3>
            {block.body && <p className="text-gray-400 text-sm leading-relaxed">{block.body}</p>}
            {block.list && (
              <dl className="space-y-2 mt-2">
                {block.list.map((item) => (
                  <div key={item.term} className="flex gap-3">
                    <dt className="text-xs font-semibold text-crimson-400 shrink-0 min-w-[110px] pt-0.5">{item.term}</dt>
                    <dd className="text-sm text-gray-400 leading-relaxed">{item.def}</dd>
                  </div>
                ))}
              </dl>
            )}
            {block.links && (
              <div className="flex flex-wrap gap-2 mt-2">
                {block.links.map((l) => (
                  <Link key={l.to} to={l.to}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-crimson-400 hover:text-crimson-300 bg-crimson-500/8 hover:bg-crimson-500/15 border border-crimson-500/20 px-3 py-1.5 rounded-lg transition-colors">
                    {l.label} <ChevronRight className="w-3 h-3" />
                  </Link>
                ))}
              </div>
            )}
            {block.code && (
              <div className="mt-2 bg-[#0d1117] border border-white/10 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/8">
                  <span className="font-mono text-[10px] bg-white/8 border border-white/15 px-2 py-0.5 rounded text-gray-400">{block.code.lang}</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre leading-relaxed">{block.code.snippet}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────────── */
export default function HelpPage() {
  const [search, setSearch]         = useState('')
  const [activeId, setActiveId]     = useState('gs-overview')
  const [openCats, setOpenCats]     = useState(() => new Set(CATEGORIES.map((c) => c.id)))

  const toggleCat = (id) => setOpenCats((s) => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const searchLower = search.toLowerCase()
  const filteredCats = CATEGORIES.map((cat) => ({
    ...cat,
    articles: cat.articles.filter((a) =>
      !searchLower ||
      a.title.toLowerCase().includes(searchLower) ||
      (ARTICLES[a.id]?.content ?? []).some((b) =>
        b.heading.toLowerCase().includes(searchLower) ||
        (b.body ?? '').toLowerCase().includes(searchLower)
      )
    ),
  })).filter((c) => c.articles.length > 0)

  const activeArticle = ARTICLES[activeId]

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />

      {/* Hero */}
      <div className="pt-20 pb-12 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-3">Help Center</p>
          <h1 className="text-4xl font-extrabold text-white mb-4">How can we help?</h1>
          <p className="text-gray-400 mb-8">Documentation, guides, and answers for the Udyo360 platform.</p>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); if (e.target.value && filteredCats[0]?.articles[0]) setActiveId(filteredCats[0].articles[0].id) }}
              placeholder="Search documentation…"
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 flex overflow-hidden">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row">

          {/* Sidebar */}
          <aside className="md:w-64 shrink-0 border-r border-white/10 overflow-y-auto py-6 px-3">
            {filteredCats.map((cat) => {
              const CatIcon = cat.icon
              const isOpen = openCats.has(cat.id)
              return (
                <div key={cat.id} className="mb-2">
                  <button
                    onClick={() => toggleCat(cat.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors rounded-lg hover:bg-white/3"
                  >
                    <CatIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
                  </button>
                  {isOpen && (
                    <div className="ml-2 mt-0.5 space-y-0.5">
                      {cat.articles.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => setActiveId(a.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeId === a.id
                              ? 'bg-crimson-500/10 border border-crimson-500/20 text-crimson-400'
                              : 'text-gray-400 hover:text-white hover:bg-white/3'
                          }`}
                        >
                          {a.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </aside>

          {/* Article panel */}
          <main className="flex-1 overflow-y-auto py-10 px-6 md:px-10">
            {activeArticle
              ? <ArticleContent article={activeArticle} />
              : (
                <div className="text-center py-20">
                  <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-white font-semibold mb-1">No results found</p>
                  <p className="text-gray-500 text-sm">Try different keywords or browse the sidebar.</p>
                </div>
              )
            }

            {/* Contact block */}
            <div className="mt-14 pt-8 border-t border-white/10">
              <p className="text-sm font-semibold text-white mb-4">Still need help?</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <a href="mailto:support@udyo360.com"
                  className="flex items-center gap-3 bg-white/3 hover:bg-white/6 border border-white/10 rounded-xl px-4 py-3.5 transition-colors group">
                  <div className="w-9 h-9 bg-crimson-500/10 border border-crimson-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-crimson-300 transition-colors">Email Support</p>
                    <p className="text-xs text-gray-500">support@udyo360.com</p>
                  </div>
                </a>
                <Link to="/contact"
                  className="flex items-center gap-3 bg-white/3 hover:bg-white/6 border border-white/10 rounded-xl px-4 py-3.5 transition-colors group">
                  <div className="w-9 h-9 bg-crimson-500/10 border border-crimson-500/20 rounded-lg flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 text-crimson-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white group-hover:text-crimson-300 transition-colors">Contact Page</p>
                    <p className="text-xs text-gray-500">Sales, partnerships, press</p>
                  </div>
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  )
}
