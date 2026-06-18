import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Github, LayoutGrid, MessageSquare, Users,
  Loader2, CheckCircle2, XCircle, AlertCircle, Save, TestTube2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

function IntegrationCard({ id, icon, iconBg, iconColor, title, description, fields, accentLabel }) {
  const token = localStorage.getItem('ws_token')
  const initForm = () => Object.fromEntries(fields.map((f) => [f.key, '']))
  const [form, setForm] = useState(initForm)
  const [saving, setSaving] = useState(false)
  const [saveDone, setSaveDone] = useState(false)
  const [saveErr, setSaveErr] = useState(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)

  const handleSave = async () => {
    setSaving(true)
    setSaveErr(null)
    setSaveDone(false)
    try {
      const res = await fetch(`${BASE}/api/integrations/${id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error((await res.json()).message || res.statusText)
      setSaveDone(true)
      setTimeout(() => setSaveDone(false), 3000)
    } catch (e) {
      setSaveErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${BASE}/api/integrations/${id}/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || res.statusText)
      setTestResult({ ok: true, msg: data.message || 'Connection successful' })
    } catch (e) {
      setTestResult({ ok: false, msg: e.message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {React.cloneElement(icon, { className: `w-4.5 h-4.5 ${iconColor}` })}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-400 mb-1">{f.label}</label>
            <input
              type={f.type || 'text'}
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: f.upper ? e.target.value.toUpperCase() : e.target.value }))}
              placeholder={f.placeholder || ''}
              className={`w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-crimson-500/50 focus:ring-1 focus:ring-crimson-500/20 ${f.mono ? 'font-mono tracking-wider' : ''}`}
            />
            {f.hint && <p className="text-xs text-gray-500 mt-1">{f.hint}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 bg-crimson-500 hover:bg-crimson-600 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : saveDone ? 'Saved' : 'Save'}
        </button>
        <button
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/15 text-gray-300 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-60 transition-colors"
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TestTube2 className="w-3.5 h-3.5" />}
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
        {saveErr && (
          <span className="inline-flex items-center gap-1 text-xs text-red-400">
            <AlertCircle className="w-3.5 h-3.5" /> {saveErr}
          </span>
        )}
      </div>

      {testResult && (
        <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg w-fit ${testResult.ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
          {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
          {testResult.msg}
        </div>
      )}
    </div>
  )
}

const INTEGRATIONS = [
  {
    id: 'github',
    icon: <Github />,
    iconBg: 'bg-gray-800',
    iconColor: 'text-white',
    title: 'GitHub',
    description: 'Receive webhook events from your GitHub repositories.',
    fields: [
      { key: 'webhookUrl', label: 'Webhook URL', type: 'text', hint: 'Paste this URL into your GitHub repo → Settings → Webhooks' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password' },
    ],
  },
  {
    id: 'jira',
    icon: <LayoutGrid />,
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    title: 'Jira',
    description: 'Sync findings and create issues in your Jira projects.',
    fields: [
      { key: 'siteUrl', label: 'Jira Site URL', type: 'text' },
      { key: 'email', label: 'Account Email', type: 'text' },
      { key: 'apiToken', label: 'API Token', type: 'password', hint: 'Get at id.atlassian.com/manage/api-tokens' },
      { key: 'projectKey', label: 'Project Key', type: 'text', mono: true, upper: true },
    ],
  },
  {
    id: 'slack',
    icon: <MessageSquare />,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    title: 'Slack',
    description: 'Send scan alerts and reports to a Slack channel.',
    fields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'text', hint: 'Create at api.slack.com/apps → Incoming Webhooks' },
    ],
  },
  {
    id: 'teams',
    icon: <Users />,
    iconBg: 'bg-sky-500/20',
    iconColor: 'text-sky-400',
    title: 'Microsoft Teams',
    description: 'Post notifications directly into a Teams channel.',
    fields: [
      { key: 'webhookUrl', label: 'Incoming Webhook URL', type: 'text', hint: 'Create in Teams channel → Connectors → Incoming Webhook' },
    ],
  },
]

export default function SettingsIntegrationsPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <Navbar />

      <div className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 flex gap-0">
          {[
            { label: 'Profile & Settings', path: '/settings/profile' },
            { label: 'Integrations', path: '/settings/integrations' },
          ].map((tab) => {
            const active = tab.path === '/settings/integrations'
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                  active
                    ? 'border-crimson-500 text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Integrations</h1>
            <p className="text-gray-400 mt-1 text-sm">Connect WebShield to your dev tools</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {INTEGRATIONS.map((integration) => (
              <IntegrationCard key={integration.id} {...integration} />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
