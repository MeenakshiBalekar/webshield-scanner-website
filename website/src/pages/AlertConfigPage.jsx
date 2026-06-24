import React, { useState, useEffect } from 'react'
import { Bell, Slack, CheckCircle2, AlertCircle, Loader2, Info, MessageSquare } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAlertConfig, configSlackAlert, configTeamsAlert } from '../services/api'

function TeamsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#6264A7">
      <path d="M19.5 4.5h-4a.5.5 0 0 0 0 1h1.75v8a.5.5 0 0 0 1 0v-8H20a.5.5 0 0 0-.5-1zM14 7H8a1 1 0 0 0-1 1v8.5a3.5 3.5 0 0 0 7 0V8a1 1 0 0 0-1-1zm-3 12a2.5 2.5 0 0 1-2.5-2.5V8h5v8.5A2.5 2.5 0 0 1 11 19z"/>
    </svg>
  )
}

export default function AlertConfigPage() {
  const [loading, setLoading]         = useState(true)
  const [slackUrl, setSlackUrl]       = useState('')
  const [teamsUrl, setTeamsUrl]       = useState('')
  const [slackSaving, setSlackSaving] = useState(false)
  const [teamsSaving, setTeamsSaving] = useState(false)
  const [slackSaved, setSlackSaved]   = useState(false)
  const [teamsSaved, setTeamsSaved]   = useState(false)
  const [slackErr, setSlackErr]       = useState(null)
  const [teamsErr, setTeamsErr]       = useState(null)

  useEffect(() => {
    getAlertConfig()
      .then((data) => {
        setSlackUrl(data?.slackWebhookUrl ?? data?.SlackWebhookUrl ?? data?.slack ?? data?.Slack ?? '')
        setTeamsUrl(data?.teamsWebhookUrl ?? data?.TeamsWebhookUrl ?? data?.teams ?? data?.Teams ?? '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSlack = async () => {
    setSlackSaving(true); setSlackErr(null); setSlackSaved(false)
    try {
      await configSlackAlert({ webhookUrl: slackUrl })
      setSlackSaved(true)
      setTimeout(() => setSlackSaved(false), 3000)
    } catch (e) { setSlackErr('Failed to save Slack config') }
    setSlackSaving(false)
  }

  const handleTeams = async () => {
    setTeamsSaving(true); setTeamsErr(null); setTeamsSaved(false)
    try {
      await configTeamsAlert({ webhookUrl: teamsUrl })
      setTeamsSaved(true)
      setTimeout(() => setTeamsSaved(false), 3000)
    } catch (e) { setTeamsErr('Failed to save Teams config') }
    setTeamsSaving(false)
  }

  const INPUT = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors'
  const LABEL = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

  if (loading) {
    return (
      <div className="min-h-screen page-bg flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-crimson-400 animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        {/* Header */}
        <div className="border-b border-white/10 py-10 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-amber-500/15 border border-amber-500/30 rounded-lg flex items-center justify-center">
                <Bell className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Notifications</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Alert Configuration</h1>
            <p className="text-gray-400 text-sm mt-1">
              Receive instant alerts on Slack or Microsoft Teams when your security score changes.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Trigger info */}
          <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/20 rounded-xl px-4 py-3.5">
            <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-200/80">
              Alerts fire automatically when your security score drops by <strong className="text-amber-300">5 or more points</strong> from the previous scan.
            </p>
          </div>

          {/* Slack */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
              <Slack className="w-4 h-4 text-[#E01E5A]" />
              <h2 className="text-sm font-bold text-white">Slack</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Incoming Webhook URL</label>
                <input
                  type="url"
                  value={slackUrl}
                  onChange={e => { setSlackUrl(e.target.value); setSlackSaved(false) }}
                  placeholder="https://hooks.slack.com/services/T.../B.../..."
                  className={INPUT}
                />
                <p className="text-xs text-gray-600 mt-1.5">
                  Create one at <span className="text-gray-400">api.slack.com/apps → Incoming Webhooks</span>
                </p>
              </div>
              {slackErr && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{slackErr}</span>
                </div>
              )}
              <button
                onClick={handleSlack}
                disabled={slackSaving || !slackUrl}
                className="flex items-center gap-2 bg-[#E01E5A]/90 hover:bg-[#E01E5A] disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {slackSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : slackSaved ? <CheckCircle2 className="w-4 h-4" /> : <Slack className="w-4 h-4" />}
                {slackSaving ? 'Saving…' : slackSaved ? 'Saved!' : 'Save Slack Webhook'}
              </button>
            </div>
          </div>

          {/* Teams */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
              <TeamsIcon />
              <h2 className="text-sm font-bold text-white">Microsoft Teams</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Incoming Webhook URL</label>
                <input
                  type="url"
                  value={teamsUrl}
                  onChange={e => { setTeamsUrl(e.target.value); setTeamsSaved(false) }}
                  placeholder="https://yourorg.webhook.office.com/webhookb2/..."
                  className={INPUT}
                />
                <p className="text-xs text-gray-600 mt-1.5">
                  Add a connector in Teams channel settings → <span className="text-gray-400">Connectors → Incoming Webhook</span>
                </p>
              </div>
              {teamsErr && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{teamsErr}</span>
                </div>
              )}
              <button
                onClick={handleTeams}
                disabled={teamsSaving || !teamsUrl}
                className="flex items-center gap-2 bg-[#6264A7]/90 hover:bg-[#6264A7] disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                {teamsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : teamsSaved ? <CheckCircle2 className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                {teamsSaving ? 'Saving…' : teamsSaved ? 'Saved!' : 'Save Teams Webhook'}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
