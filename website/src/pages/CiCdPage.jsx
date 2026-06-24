import React, { useState } from 'react'
import {
  GitBranch, Copy, Check, ChevronDown, ChevronUp, ScanLine,
  Loader2, AlertCircle, CheckCircle2, XCircle, Shield, Code2,
  BookOpen, Zap, ExternalLink,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { testCicdGate } from '../services/api'

/* ── Pipeline YAML snippets ── */
const PIPELINES = {
  'GitHub Actions': {
    filename: '.github/workflows/udyo360.yml',
    yaml: `name: Udyo360 Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  udyo360:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Udyo360 Scan
        id: scan
        run: |
          curl -sf -X POST \\
            -H "Authorization: Bearer \${{ secrets.UDYO360_API_KEY }}" \\
            -H "Content-Type: application/json" \\
            -d '{"url":"\${{ vars.TARGET_URL }}","failOn":"high"}' \\
            \${{ vars.UDYO360_URL }}/api/cicd/gate > result.json
          cat result.json

      - name: Evaluate Gate
        run: |
          PASSED=\$(jq -r '.passed' result.json)
          if [ "\$PASSED" != "true" ]; then
            echo "Udyo360 gate FAILED — critical/high findings detected"
            jq '.summary' result.json
            exit 1
          fi
          echo "Udyo360 gate PASSED"

      - name: Upload Findings
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: udyo360-results
          path: result.json`,
  },
  'GitLab CI': {
    filename: '.gitlab-ci.yml',
    yaml: `stages:
  - security

udyo360-scan:
  stage: security
  image: curlimages/curl:latest
  variables:
    TARGET_URL: \$TARGET_URL
    UDYO360_API_KEY: \$UDYO360_API_KEY
    UDYO360_URL: \$UDYO360_URL
  script:
    - |
      curl -sf -X POST \\
        -H "Authorization: Bearer \$UDYO360_API_KEY" \\
        -H "Content-Type: application/json" \\
        -d "{\\\"url\\\":\\\"\$TARGET_URL\\\",\\\"failOn\\\":\\\"high\\\"}" \\
        \$UDYO360_URL/api/cicd/gate > result.json
    - cat result.json
    - |
      PASSED=\$(cat result.json | python3 -c "import sys,json; print(json.load(sys.stdin)['passed'])")
      if [ "\$PASSED" != "True" ]; then
        echo "Udyo360 gate FAILED"
        exit 1
      fi
  artifacts:
    when: always
    paths:
      - result.json
    expire_in: 7 days
  rules:
    - if: '\$CI_COMMIT_BRANCH == "main"'
    - if: '\$CI_PIPELINE_SOURCE == "merge_request_event"'`,
  },
  'CircleCI': {
    filename: '.circleci/config.yml',
    yaml: `version: 2.1

jobs:
  udyo360-scan:
    docker:
      - image: cimg/base:current
    steps:
      - checkout
      - run:
          name: Run Udyo360 Security Gate
          command: |
            curl -sf -X POST \\
              -H "Authorization: Bearer \$UDYO360_API_KEY" \\
              -H "Content-Type: application/json" \\
              -d "{\"url\":\"\$TARGET_URL\",\"failOn\":\"high\"}" \\
              \$UDYO360_URL/api/cicd/gate > result.json
            cat result.json
            PASSED=\$(python3 -c "import json; d=json.load(open('result.json')); exit(0 if d['passed'] else 1)")
      - store_artifacts:
          path: result.json
          destination: udyo360-results

workflows:
  security:
    jobs:
      - udyo360-scan:
          context: udyo360-credentials`,
  },
  Jenkins: {
    filename: 'Jenkinsfile',
    yaml: `pipeline {
  agent any

  environment {
    UDYO360_API_KEY = credentials('udyo360-api-key')
    TARGET_URL        = credentials('target-url')
    UDYO360_URL     = 'https://your-udyo360-instance'
  }

  stages {
    stage('Security Scan') {
      steps {
        script {
          def response = sh(
            script: """
              curl -sf -X POST \\
                -H "Authorization: Bearer \${UDYO360_API_KEY}" \\
                -H "Content-Type: application/json" \\
                -d '{"url":"\${TARGET_URL}","failOn":"high"}' \\
                \${UDYO360_URL}/api/cicd/gate
            """,
            returnStdout: true
          ).trim()

          def result = readJSON text: response
          if (!result.passed) {
            error("Udyo360 gate FAILED — critical/high findings: \${result.summary}")
          }
          echo "Udyo360 gate PASSED"
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'udyo360-result.json', allowEmptyArchive: true
    }
  }
}`,
  },
  'Azure DevOps': {
    filename: 'azure-pipelines.yml',
    yaml: `trigger:
  - main

pool:
  vmImage: ubuntu-latest

variables:
  - group: udyo360-secrets   # contains UDYO360_API_KEY, TARGET_URL, UDYO360_URL

steps:
  - script: |
      curl -sf -X POST \\
        -H "Authorization: Bearer \$(UDYO360_API_KEY)" \\
        -H "Content-Type: application/json" \\
        -d '{"url":"\$(TARGET_URL)","failOn":"high"}' \\
        \$(UDYO360_URL)/api/cicd/gate > result.json
      cat result.json
    displayName: 'Run Udyo360 Security Gate'

  - script: |
      python3 -c "
      import json, sys
      d = json.load(open('result.json'))
      print(d.get('summary', ''))
      sys.exit(0 if d['passed'] else 1)
      "
    displayName: 'Evaluate Gate Result'

  - publish: result.json
    artifact: udyo360-findings
    condition: always()`,
  },
}

const PLATFORM_TABS = Object.keys(PIPELINES)

const FAIL_ON_OPTIONS = [
  { value: 'critical', label: 'Critical only' },
  { value: 'high',     label: 'High & above' },
  { value: 'medium',   label: 'Medium & above' },
  { value: 'any',      label: 'Any finding' },
]

const API_ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/cicd/gate',
    desc: 'Run a scan and evaluate against a threshold. Returns pass/fail with finding counts.',
    body: `{
  "url":    "https://your-app.example.com",
  "failOn": "high"   // critical | high | medium | any
}`,
    response: `{
  "passed":  true,
  "summary": { "critical": 0, "high": 0, "medium": 3, "low": 8 }
}`,
  },
  {
    method: 'GET',
    path: '/api/badge/:domain',
    desc: 'Returns an SVG badge showing the latest scan result for a domain.',
    body: null,
    response: '<svg xmlns="http://www.w3.org/2000/svg">…</svg>',
  },
  {
    method: 'POST',
    path: '/api/scan/headers',
    desc: 'Full header scan. Returns detailed findings for use in custom gate logic.',
    body: `{ "url": "https://your-app.example.com" }`,
    response: `{ "score": 72, "findings": [ … ] }`,
  },
]

/* ── Copy button ── */
function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors ${className}`}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

/* ── API reference item ── */
function ApiEndpoint({ endpoint }) {
  const [open, setOpen] = useState(false)
  const methodColor = endpoint.method === 'GET' ? 'text-green-400 bg-green-500/10 border-green-500/30'
    : 'text-blue-400 bg-blue-500/10 border-blue-500/30'

  return (
    <div className={`border rounded-xl overflow-hidden ${open ? 'border-crimson-500/30' : 'border-white/10'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors"
      >
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${methodColor} shrink-0`}>
          {endpoint.method}
        </span>
        <code className="text-sm text-white font-mono flex-1 min-w-0 truncate">{endpoint.path}</code>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3">
          <p className="text-sm text-gray-400">{endpoint.desc}</p>
          {endpoint.body && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Request Body</p>
                <CopyButton text={endpoint.body} />
              </div>
              <pre className="bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono overflow-x-auto">
                {endpoint.body}
              </pre>
            </div>
          )}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Response</p>
              <CopyButton text={endpoint.response} />
            </div>
            <pre className="bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono overflow-x-auto">
              {endpoint.response}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main page ── */
export default function CiCdPage() {
  const [activeTab, setActiveTab]     = useState(PLATFORM_TABS[0])
  const [gateUrl, setGateUrl]         = useState('')
  const [failOn, setFailOn]           = useState('high')
  const [testing, setTesting]         = useState(false)
  const [gateResult, setGateResult]   = useState(null)
  const [gateError, setGateError]     = useState(null)
  const [badgeUrl, setBadgeUrl]       = useState('')

  const pipeline = PIPELINES[activeTab]

  const handleGateTest = async (e) => {
    e.preventDefault()
    setTesting(true); setGateError(null); setGateResult(null)
    try {
      const data = await testCicdGate({ url: gateUrl, failOn })
      setGateResult(data)
    } catch (err) {
      setGateError('Gate test failed')
    }
    setTesting(false)
  }

  const summary     = gateResult?.summary ?? gateResult?.Summary ?? {}
  const gatePassed  = gateResult?.passed  ?? gateResult?.Passed

  const badgeDomain = badgeUrl.replace(/^https?:\/\//, '').split('/')[0] || 'your-domain.com'
  const badgeImgUrl = `${import.meta.env.VITE_API_URL || ''}/api/badge/${encodeURIComponent(badgeDomain)}`
  const badgeMarkdown = `![Udyo360](${badgeImgUrl})`
  const badgeHtml     = `<img src="${badgeImgUrl}" alt="Udyo360 Security" />`
  const badgeShieldIo = `https://img.shields.io/badge/udyo360-passing-green?logo=shield`

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-500/15 border border-indigo-500/30 rounded-lg flex items-center justify-center">
                <GitBranch className="w-4 h-4 text-indigo-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">CI/CD Integration</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Shift Security Left</h1>
            <p className="text-gray-400 max-w-2xl leading-relaxed">
              Drop a Udyo360 gate into any pipeline in under 5 minutes. Copy the YAML for your platform,
              configure secrets, and every deploy gets a security check before it ships.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-10">

          {/* ── Pipeline YAML ── */}
          <section>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Code2 className="w-4 h-4 text-crimson-400" /> Pipeline Configuration
            </h2>

            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              {/* Platform tabs */}
              <div className="flex overflow-x-auto border-b border-white/10">
                {PLATFORM_TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? 'border-crimson-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Filename + copy */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/3 border-b border-white/10">
                <code className="text-xs text-gray-400 font-mono">{pipeline.filename}</code>
                <CopyButton text={pipeline.yaml} />
              </div>

              {/* YAML */}
              <div className="overflow-x-auto max-h-96">
                <pre className="px-5 py-4 text-xs text-gray-300 font-mono leading-relaxed whitespace-pre">
                  {pipeline.yaml}
                </pre>
              </div>
            </div>

            {/* Required secrets table */}
            <div className="mt-4 bg-white/3 border border-white/10 rounded-xl px-4 py-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Required Secrets / Variables</p>
              <div className="space-y-2">
                {[
                  { name: 'UDYO360_API_KEY', desc: 'Your Udyo360 API key — found in Settings → API Keys' },
                  { name: 'TARGET_URL',         desc: 'The URL of the app to scan (e.g. https://staging.example.com)' },
                  { name: 'UDYO360_URL',       desc: 'Your Udyo360 instance URL (e.g. https://ws.example.com)' },
                ].map((s) => (
                  <div key={s.name} className="flex items-start gap-3">
                    <code className="text-xs font-mono text-crimson-400 shrink-0 mt-0.5">{s.name}</code>
                    <p className="text-xs text-gray-500">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Live Gate Tester ── */}
          <section>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-crimson-400" /> Live Gate Tester
            </h2>

            <div className="bg-white/3 border border-white/10 rounded-2xl p-6">
              <p className="text-sm text-gray-400 mb-5">
                Test your gate configuration before committing it. Enter a target URL, set the failure threshold,
                and see if the gate would pass or fail right now.
              </p>

              <form onSubmit={handleGateTest} className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-400 mb-1.5">Target URL *</label>
                    <input
                      required
                      value={gateUrl}
                      onChange={e => setGateUrl(e.target.value)}
                      placeholder="https://staging.example.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Fail on</label>
                    <select
                      value={failOn}
                      onChange={e => setFailOn(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-gray-300 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                    >
                      {FAIL_ON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {gateError && (
                  <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{gateError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={testing}
                  className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  {testing ? 'Testing gate…' : 'Test Gate'}
                </button>
              </form>

              {/* Gate result */}
              {gateResult && (
                <div className={`mt-5 rounded-xl border px-5 py-4 ${
                  gatePassed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {gatePassed
                      ? <CheckCircle2 className="w-6 h-6 text-green-400" />
                      : <XCircle className="w-6 h-6 text-red-400" />
                    }
                    <span className={`text-lg font-bold ${gatePassed ? 'text-green-400' : 'text-red-400'}`}>
                      Gate {gatePassed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>
                  {Object.keys(summary).length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {['critical','high','medium','low'].map(s => (
                        summary[s] !== undefined && (
                          <div key={s} className="text-xs text-gray-400">
                            <span className="capitalize">{s}: </span>
                            <span className="text-white font-bold">{summary[s]}</span>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ── Badge Previews ── */}
          <section>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-crimson-400" /> Badge Previews
            </h2>

            <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Your app URL (for badge domain)</label>
                <input
                  value={badgeUrl}
                  onChange={e => setBadgeUrl(e.target.value)}
                  placeholder="https://your-app.example.com"
                  className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Shields.io Badge', snippet: badgeMarkdown, preview: badgeShieldIo, type: 'Markdown' },
                  { label: 'HTML Badge',       snippet: badgeHtml,     preview: badgeShieldIo, type: 'HTML' },
                  { label: 'Direct SVG URL',   snippet: badgeImgUrl,   preview: null,          type: 'URL' },
                ].map((b) => (
                  <div key={b.label} className="bg-navy-950 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-400">{b.label}</span>
                      <CopyButton text={b.snippet} />
                    </div>
                    {b.preview && (
                      <div className="mb-3">
                        <img
                          src={`https://img.shields.io/badge/udyo360-${badgeDomain !== 'your-domain.com' ? 'passing' : 'unchecked'}-${badgeDomain !== 'your-domain.com' ? 'brightgreen' : 'lightgrey'}?logo=shield&logoColor=white`}
                          alt="Udyo360 badge"
                          className="h-5"
                        />
                      </div>
                    )}
                    <code className="text-[10px] text-gray-500 font-mono break-all block leading-relaxed">
                      {b.snippet}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── API Reference ── */}
          <section>
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-crimson-400" /> API Reference
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              All endpoints require an <code className="text-crimson-400 font-mono">Authorization: Bearer &lt;key&gt;</code> header.
            </p>
            <div className="space-y-3">
              {API_ENDPOINTS.map((ep, i) => <ApiEndpoint key={i} endpoint={ep} />)}
            </div>

            {/* Auth note */}
            <div className="mt-4 flex items-start gap-3 bg-white/3 border border-white/10 rounded-xl px-4 py-3">
              <Shield className="w-4 h-4 text-crimson-400 shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400 leading-relaxed">
                Generate an API key in your <span className="text-white font-medium">Dashboard → Settings → API Keys</span>.
                Keys can be scoped to specific domains and revoked at any time.
              </div>
            </div>
          </section>

        </div>
      </main>

      <Footer />
    </div>
  )
}
