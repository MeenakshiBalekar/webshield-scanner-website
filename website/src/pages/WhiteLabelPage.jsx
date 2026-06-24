import React, { useState, useEffect, useRef } from 'react'
import { Palette, Save, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Globe, Type } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getWhiteLabel, saveWhiteLabel } from '../services/api'

const BACKEND = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function ColorInput({ label, value, onChange }) {
  const isValid = /^#[0-9a-fA-F]{6}$/.test(value)
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl border border-white/20 shrink-0 cursor-pointer"
          style={{ backgroundColor: isValid ? value : 'transparent' }}
        >
          <input
            type="color"
            value={isValid ? value : '#000000'}
            onChange={e => onChange(e.target.value)}
            className="w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="#3b82f6"
          maxLength={7}
          className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm font-mono outline-none transition-colors"
        />
      </div>
    </div>
  )
}

function PreviewFrame({ html }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!ref.current || !html) return
    const doc = ref.current.contentDocument ?? ref.current.contentWindow?.document
    if (!doc) return
    doc.open(); doc.write(html); doc.close()
  }, [html])
  if (!html) return null
  return (
    <iframe
      ref={ref}
      title="White-label preview"
      className="w-full rounded-2xl border border-white/10 bg-white"
      style={{ height: 400 }}
      sandbox="allow-same-origin"
    />
  )
}

export default function WhiteLabelPage() {
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [saved, setSaved]         = useState(false)
  const [error, setError]         = useState(null)
  const [saveErr, setSaveErr]     = useState(null)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  const [logoUrl, setLogoUrl]         = useState('')
  const [primaryColor, setPrimary]    = useState('#ef4444')
  const [secondaryColor, setSecondary] = useState('#1e1b4b')
  const [accentColor, setAccent]      = useState('#f97316')
  const [brandName, setBrandName]     = useState('')
  const [footerText, setFooterText]   = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [supportEmail, setSupportEmail] = useState('')

  useEffect(() => {
    getWhiteLabel()
      .then((data) => {
        setLogoUrl(field(data, 'logoUrl', 'LogoUrl', 'logo', 'Logo') ?? '')
        setPrimary(field(data, 'primaryColor', 'PrimaryColor', 'primary') ?? '#ef4444')
        setSecondary(field(data, 'secondaryColor', 'SecondaryColor', 'secondary') ?? '#1e1b4b')
        setAccent(field(data, 'accentColor', 'AccentColor', 'accent') ?? '#f97316')
        setBrandName(field(data, 'brandName', 'BrandName', 'name', 'Name') ?? '')
        setFooterText(field(data, 'footerText', 'FooterText', 'footer', 'Footer') ?? '')
        setCustomDomain(field(data, 'customDomain', 'CustomDomain', 'domain') ?? '')
        setSupportEmail(field(data, 'supportEmail', 'SupportEmail', 'email') ?? '')
      })
      .catch(() => {}) // silently ignore — defaults are fine
      .finally(() => setLoading(false))
  }, [])

  const payload = () => ({
    logoUrl, primaryColor, secondaryColor, accentColor,
    brandName, footerText, customDomain, supportEmail,
  })

  const handleSave = async () => {
    setSaving(true); setSaveErr(null); setSaved(false)
    try {
      await saveWhiteLabel(payload())
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { setSaveErr('Save failed — please try again') }
    setSaving(false)
  }

  const handlePreview = async () => {
    setPreviewing(true); setError(null)
    try {
      const token = localStorage.getItem('ws_token')
      const res = await fetch(`${BACKEND}/api/whitelabel/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload()),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const html = await res.text()
      setPreviewHtml(html)
      setShowPreview(true)
    } catch { setError('Preview failed — please try again') }
    setPreviewing(false)
  }

  const INPUT = 'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors'
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
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-violet-500/15 border border-violet-500/30 rounded-lg flex items-center justify-center">
                <Palette className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-violet-400">Customization</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">White-Label Settings</h1>
            <p className="text-gray-400 text-sm mt-1">
              Customize the look and feel of your portal with your brand colors, logo, and domain.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Branding */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
              <Type className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white">Brand Identity</h2>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={LABEL}>Brand Name</label>
                <input value={brandName} onChange={e => setBrandName(e.target.value)}
                  placeholder="Your Company Name"
                  className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Logo URL</label>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://yourcompany.com/logo.png"
                  className={INPUT} />
                {logoUrl && (
                  <img src={logoUrl} alt="Logo preview" className="mt-2 h-10 object-contain rounded"
                    onError={e => { e.currentTarget.style.display = 'none' }} />
                )}
              </div>
              <div>
                <label className={LABEL}>Custom Domain</label>
                <input value={customDomain} onChange={e => setCustomDomain(e.target.value)}
                  placeholder="security.yourcompany.com"
                  className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Support Email</label>
                <input value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                  placeholder="security@yourcompany.com" type="email"
                  className={INPUT} />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
              <Palette className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white">Color Palette</h2>
            </div>
            <div className="px-6 py-5 grid sm:grid-cols-3 gap-5">
              <ColorInput label="Primary Color" value={primaryColor} onChange={setPrimary} />
              <ColorInput label="Secondary Color" value={secondaryColor} onChange={setSecondary} />
              <ColorInput label="Accent Color" value={accentColor} onChange={setAccent} />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-white/10">
              <Globe className="w-4 h-4 text-violet-400" />
              <h2 className="text-sm font-bold text-white">Footer</h2>
            </div>
            <div className="px-6 py-5">
              <label className={LABEL}>Footer Text</label>
              <textarea
                value={footerText}
                onChange={e => setFooterText(e.target.value)}
                rows={3}
                placeholder="© 2025 Your Company. All rights reserved."
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          {saveErr && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{saveErr}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Settings'}
            </button>
            <button
              onClick={handlePreview}
              disabled={previewing}
              className="flex items-center gap-2 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 text-violet-300 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {previewing ? 'Generating…' : 'Preview'}
            </button>
            {showPreview && previewHtml && (
              <button
                onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 bg-white/5 border border-white/15 text-gray-400 hover:text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <EyeOff className="w-4 h-4" /> Hide Preview
              </button>
            )}
          </div>

          {/* Live preview iframe */}
          {showPreview && <PreviewFrame html={previewHtml} />}
        </div>
      </main>
      <Footer />
    </div>
  )
}
