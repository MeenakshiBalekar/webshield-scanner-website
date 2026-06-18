import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import {
  User, Mail, Lock, Trash2, Loader2, CheckCircle2, AlertCircle,
  Camera, Github, ExternalLink, Shield, CreditCard, ChevronRight, Plug,
} from 'lucide-react'
import axios from 'axios'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useAuth } from '../context/AuthContext'
import { getMe, updateProfile, changePassword, deleteAccount, uploadProfilePicture } from '../services/api'

const SETTINGS_TABS = [
  { label: 'Profile & Settings', href: '/settings/profile' },
  { label: 'Integrations',       href: '/settings/integrations' },
]

function SettingsTabBar() {
  const location = useLocation()
  return (
    <div className="flex rounded-xl overflow-hidden border border-white/10 mb-8 self-start">
      {SETTINGS_TABS.map(({ label, href }) => {
        const active = location.pathname === href
        return (
          <Link
            key={href}
            to={href}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
              active ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}

/* ── Avatar helpers (duplicated from Navbar so page is self-contained) ── */
const AVATAR_COLORS = [
  'bg-crimson-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-violet-500',  'bg-amber-500', 'bg-sky-500',
]
function userInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase()).filter(Boolean).join('').slice(0, 2) || '?'
}
function avatarBg(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 65) % AVATAR_COLORS.length]
}

/* ── OAuth provider badge ── */
const PROVIDER_META = {
  github:   { label: 'GitHub',   icon: <Github className="w-3.5 h-3.5" /> },
  google:   { label: 'Google',   icon: <span className="text-xs font-bold">G</span> },
  linkedin: { label: 'LinkedIn', icon: <span className="text-xs font-bold">in</span> },
}
function OAuthBadge({ provider }) {
  if (!provider) return null
  const p = PROVIDER_META[provider.toLowerCase()]
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/15 text-gray-300">
      {p?.icon}
      Connected via {p?.label ?? provider}
    </span>
  )
}

/* ── Plan helpers ── */
function planLabel(plan) {
  if (!plan) return null
  const type = (plan.type ?? plan.Type ?? plan.planType ?? plan.PlanType ?? '').toLowerCase()
  const name = plan.name ?? plan.Name ?? plan.planName ?? plan.PlanName ?? ''
  const days = plan.trialDaysLeft ?? plan.TrialDaysLeft ?? plan.daysLeft ?? plan.DaysLeft ?? null
  if (type === 'trial' || type === 'free' || name.toLowerCase().includes('trial')) {
    return { label: `Free Trial${days != null ? ` — ${days} days remaining` : ''}`, color: 'text-amber-400', badge: 'bg-amber-500/15 border-amber-500/30 text-amber-400' }
  }
  if (type === 'pro' || type === 'professional') {
    return { label: 'Pro', color: 'text-blue-400', badge: 'bg-blue-500/15 border-blue-500/30 text-blue-400' }
  }
  if (type === 'enterprise') {
    return { label: 'Enterprise', color: 'text-purple-400', badge: 'bg-purple-500/15 border-purple-500/30 text-purple-400' }
  }
  return { label: name || type, color: 'text-gray-300', badge: 'bg-white/5 border-white/15 text-gray-300' }
}

const LIMIT_LABELS = {
  scansPerDay:        'Scans per day',
  assets:             'Assets',
  apiAccess:          'API access',
  teamMembers:        'Team members',
  networkScan:        'Network scanning',
  hostScan:           'Host scanning',
  cloudScan:          'Cloud scanning',
  codeScan:           'Code scanning',
  scheduledScans:     'Scheduled scans',
  pdfReports:         'PDF reports',
  aiReports:          'AI reports',
  customIntegrations: 'Custom integrations',
  shadowAiScan:       'Shadow AI scanning',
  authenticatedScan:  'Authenticated scanning',
}

function FeatureList({ limits }) {
  if (!limits || !Object.keys(limits).length) return null
  return (
    <div className="space-y-2.5 mt-4">
      {Object.entries(limits).map(([key, value]) => {
        const label = LIMIT_LABELS[key] || key.replace(/([A-Z])/g, ' $1').trim()
        const isBoolean = typeof value === 'boolean'
        return (
          <div key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-400">{label}</span>
            <span className={`text-sm font-semibold tabular-nums ${
              isBoolean
                ? value ? 'text-green-400' : 'text-gray-600'
                : 'text-white'
            }`}>
              {isBoolean
                ? (value ? '✓' : '✗')
                : value === -1 || value === 'unlimited' ? 'Unlimited' : value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Inline toast ── */
function Feedback({ ok, msg }) {
  if (!msg) return null
  return (
    <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border mt-3 ${
      ok
        ? 'bg-green-500/10 border-green-500/25 text-green-400'
        : 'bg-red-500/10 border-red-500/25 text-red-400'
    }`}>
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0" />}
      {msg}
    </div>
  )
}

/* ── Section wrapper ── */
function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden mb-6">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
        <Icon className="w-4 h-4 text-crimson-400" />
        <h2 className="text-sm font-bold text-white">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

/* ── Delete confirmation modal ── */
function DeleteModal({ onConfirm, onCancel, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-navy-950 border border-red-500/30 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-2">Delete Account</h3>
        <p className="text-sm text-gray-400 mb-5">
          This will permanently delete your account and all scan data. This action cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 text-sm text-gray-400 border border-white/15 rounded-xl py-2.5 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={deleting}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Page ── */
export default function SettingsProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [profile, setProfile]           = useState(null)
  const [pageLoading, setPageLoading]   = useState(true)

  // Section 1
  const [name, setName]               = useState('')
  const [savingName, setSavingName]   = useState(false)
  const [nameFb, setNameFb]           = useState(null)   // { ok, msg }
  const [avatarUploading, setAvatarUploading] = useState(false)

  // Section 3 — password
  const [pw, setPw]           = useState({ current: '', new: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [pwFb, setPwFb]       = useState(null)

  // Delete modal
  const [showDelete, setShowDelete]   = useState(false)
  const [deleting, setDeleting]       = useState(false)

  useEffect(() => {
    getMe().then((p) => {
      if (p) {
        setProfile(p)
        setName(p.name ?? p.Name ?? p.displayName ?? p.DisplayName ?? '')
      }
      setPageLoading(false)
    }).catch(() => setPageLoading(false))
  }, [])

  const pic          = profile?.profilePictureUrl ?? profile?.ProfilePictureUrl ?? profile?.picture ?? null
  const displayName  = profile?.name             ?? profile?.Name              ?? profile?.displayName ?? ''
  const email        = profile?.email            ?? profile?.Email             ?? ''
  const oauthProvider = profile?.oauthProvider   ?? profile?.OauthProvider    ?? profile?.provider ?? null
  const hasPassword  = profile?.hasPassword      ?? profile?.HasPassword       ?? true
  const plan         = profile?.plan             ?? profile?.Plan              ?? null
  const limits       = plan?.limits              ?? plan?.Limits               ?? null
  const planInfo     = planLabel(plan)

  /* Save name */
  const handleSaveName = async () => {
    if (!name.trim()) return
    setSavingName(true); setNameFb(null)
    try {
      const res = await updateProfile({ name: name.trim() })
      const newToken = res?.token ?? res?.Token ?? res?.data?.token
      if (newToken) {
        localStorage.setItem('ws_token', newToken)
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
      }
      updateUser({ name: name.trim(), ...(newToken ? { token: newToken } : {}) })
      setProfile((p) => ({ ...p, name: name.trim() }))
      setNameFb({ ok: true, msg: 'Name updated.' })
    } catch (e) {
      setNameFb({ ok: false, msg: e.message || 'Failed to save name.' })
    }
    setSavingName(false)
  }

  /* Avatar file upload */
  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await uploadProfilePicture(fd)
      const url = res?.profilePictureUrl ?? res?.ProfilePictureUrl ?? res?.url ?? res?.Url
      if (url) {
        setProfile((p) => ({ ...p, profilePictureUrl: url }))
        updateUser({ profilePictureUrl: url })
      }
    } catch (e) {
      setNameFb({ ok: false, msg: e.message || 'Avatar upload failed.' })
    }
    setAvatarUploading(false)
  }

  /* Change password */
  const handleChangePw = async (e) => {
    e.preventDefault()
    if (pw.new !== pw.confirm) { setPwFb({ ok: false, msg: 'Passwords do not match.' }); return }
    if (pw.new.length < 8)     { setPwFb({ ok: false, msg: 'Password must be at least 8 characters.' }); return }
    setSavingPw(true); setPwFb(null)
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.new })
      setPwFb({ ok: true, msg: 'Password changed.' })
      setPw({ current: '', new: '', confirm: '' })
    } catch (e) {
      setPwFb({ ok: false, msg: e.message || 'Failed to change password.' })
    }
    setSavingPw(false)
  }

  /* Delete account */
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteAccount()
      logout()
      navigate('/')
    } catch (e) {
      alert(e.message || 'Failed to delete account.')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  const INPUT = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'
  const LABEL = 'block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5'

  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col page-bg">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-crimson-400 animate-spin" />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">

          <div className="mb-8">
            <p className="text-xs text-crimson-500 font-semibold uppercase tracking-widest mb-2">Settings</p>
            <h1 className="text-3xl font-extrabold text-white">Profile &amp; Settings</h1>
          </div>

          <SettingsTabBar />

          {/* ── Section 1: Profile ── */}
          <Section title="Profile" icon={User}>

            {/* Avatar */}
            <div className="flex items-center gap-5 mb-6">
              <div className="relative group shrink-0">
                {pic ? (
                  <img src={pic} alt={displayName} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className={`w-16 h-16 rounded-full ${avatarBg(displayName)} flex items-center justify-center text-2xl font-bold text-white`}>
                    {userInitials(displayName)}
                  </div>
                )}
                <label className="absolute inset-0 rounded-full cursor-pointer bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {avatarUploading
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{displayName || 'No name set'}</p>
                <p className="text-xs text-gray-500 mt-0.5">{email}</p>
                {oauthProvider && <div className="mt-2"><OAuthBadge provider={oauthProvider} /></div>}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className={LABEL}>Display Name</label>
              <div className="flex gap-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  placeholder="Your name"
                  className={INPUT + ' flex-1'}
                />
                <button
                  onClick={handleSaveName}
                  disabled={savingName || !name.trim()}
                  className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors shrink-0"
                >
                  {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {savingName ? 'Saving…' : 'Save'}
                </button>
              </div>
              {nameFb && <Feedback ok={nameFb.ok} msg={nameFb.msg} />}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className={LABEL}>Email</label>
              <div className="flex items-center gap-2 bg-white/3 border border-white/10 rounded-xl px-4 py-2.5">
                <Mail className="w-4 h-4 text-gray-600 shrink-0" />
                <span className="text-sm text-gray-400">{email || '—'}</span>
                <span className="ml-auto text-[10px] text-gray-600 border border-white/10 px-1.5 py-0.5 rounded">Read-only</span>
              </div>
            </div>
          </Section>

          {/* ── Section 2: Plan & Billing ── */}
          <Section title="Plan &amp; Billing" icon={CreditCard}>

            {plan ? (
              <>
                {/* Plan card */}
                <div className={`rounded-xl border p-4 mb-4 ${planInfo?.badge ? `bg-white/3 border-white/10` : 'bg-white/3 border-white/10'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Current Plan</p>
                      <p className={`text-lg font-extrabold ${planInfo?.color ?? 'text-white'}`}>
                        {planInfo?.label ?? 'Unknown'}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${planInfo?.badge}`}>
                      {(plan.type ?? plan.Type ?? 'plan').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Feature list */}
                {limits && <FeatureList limits={limits} />}

                {/* Upgrade button */}
                {((plan.type ?? plan.Type ?? '').toLowerCase() !== 'enterprise') && (
                  <button
                    onClick={() => navigate('/billing')}
                    className="mt-5 flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                  >
                    Upgrade to Pro <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 text-sm mb-3">Plan information unavailable.</p>
                <button onClick={() => navigate('/billing')}
                  className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  View Plans <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </Section>

          {/* ── Section 3: Security ── */}
          <Section title="Security" icon={Lock}>

            {/* Change password — hidden for SSO-only accounts */}
            {hasPassword !== false ? (
              <form onSubmit={handleChangePw} className="space-y-4 mb-8">
                <h3 className="text-sm font-semibold text-white">Change Password</h3>
                {[
                  { key: 'current', label: 'Current Password',  placeholder: '••••••••' },
                  { key: 'new',     label: 'New Password',      placeholder: '8+ characters' },
                  { key: 'confirm', label: 'Confirm Password',  placeholder: 'Repeat new password' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className={LABEL}>{label}</label>
                    <input
                      type="password"
                      value={pw[key]}
                      onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      autoComplete="new-password"
                      className={INPUT}
                    />
                  </div>
                ))}
                {pwFb && <Feedback ok={pwFb.ok} msg={pwFb.msg} />}
                <button
                  type="submit"
                  disabled={savingPw || !pw.current || !pw.new || !pw.confirm}
                  className="flex items-center gap-2 bg-white/8 hover:bg-white/15 border border-white/15 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  {savingPw ? 'Saving…' : 'Change Password'}
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-8 text-sm text-blue-300">
                <Shield className="w-4 h-4 shrink-0" />
                You signed in with {oauthProvider ? <OAuthBadge provider={oauthProvider} /> : 'SSO'} — no password is set.
              </div>
            )}

            {/* Danger zone */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-red-400 mb-1">Danger Zone</h3>
              <p className="text-xs text-gray-500 mb-4">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
              <button
                onClick={() => setShowDelete(true)}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </Section>

        </div>
      </main>
      <Footer />
      {showDelete && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
