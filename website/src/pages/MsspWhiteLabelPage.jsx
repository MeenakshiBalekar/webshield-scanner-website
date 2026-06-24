import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Globe, Loader2, AlertCircle, RefreshCw, Save,
  Palette, Mail, Building2, Eye, CheckCircle2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMsspWhiteLabel, updateMsspWhiteLabel, getMsspTenants, updateTenantWhiteLabel } from '../services/api'

const field = (obj, ...keys) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return null }

function ColorSwatch({ color }) {
  const isValid = /^#[0-9a-fA-F]{6}$/.test(color)
  return (
    <div
      className="w-8 h-8 rounded-lg border border-white/20 shrink-0"
      style={{ backgroundColor: isValid ? color : 'transparent' }}
    />
  )
}

function PreviewHeader({ logoUrl, primaryColor, brandName, supportEmail }) {
  const isValidColor = /^#[0-9a-fA-F]{6}$/.test(primaryColor)
  const bg = isValidColor ? primaryColor : '#14b8a6'
  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div className="px-5 py-3 flex items-center justify-between" style={{ backgroundColor: bg }}>
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="h-7 object-contain max-w-[120px]"
              onError={e => { e.currentTarget.style.display = 'none' }} />
          ) : (
            <div className="h-7 px-3 bg-white/20 rounded flex items-center">
              <span className="text-white text-xs font-bold">{brandName || 'Your Brand'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-white/80 text-xs">
          {supportEmail && <span>{supportEmail}</span>}
          <span className="bg-white/20 rounded px-2 py-0.5 text-white text-[10px] font-semibold">Portal</span>
        </div>
      </div>
      <div className="bg-zinc-900 px-5 py-4">
        <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wider">Preview — Dashboard</p>
        <div className="grid grid-cols-3 gap-3">
          {['Assets', 'Findings', 'Compliance'].map(label => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-3 text-center">
              <p className="text-base font-extrabold text-white">—</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MsspWhiteLabelPage() {
  const [global, setGlobal]     = useState(null)
  const [tenants, setTenants]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [saveErr, setSaveErr]   = useState(null)

  const [scope, setScope]       = useState('global')   // 'global' | 'tenant'
  const [tenantId, setTenantId] = useState('')

  const [logoUrl, setLogoUrl]         = useState('')
  const [primaryColor, setPrimaryColor] = useState('#14b8a6')
  const [brandName, setBrandName]     = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [supportEmail, setSupportEmail] = useState('')

  const loadData = async () => {
    setLoading(true); setError(null)
    try {
      const [wl, ts] = await Promise.all([getMsspWhiteLabel(), getMsspTenants()])
      setGlobal(wl)
      const tArr = Array.isArray(ts) ? ts : (ts?.tenants ?? ts?.items ?? [])
      setTenants(tArr)
      applyConfig(wl)
    } catch (e) { setError('Action failed — please try again') }
    finally { setLoading(false) }
  }

  const applyConfig = (cfg) => {
    if (!cfg) return
    setLogoUrl(field(cfg, 'logoUrl', 'LogoUrl', 'logo') ?? '')
    setPrimaryColor(field(cfg, 'primaryColor', 'PrimaryColor', 'color') ?? '#14b8a6')
    setBrandName(field(cfg, 'brandName', 'BrandName', 'name') ?? '')
    setCustomDomain(field(cfg, 'customDomain', 'CustomDomain', 'domain') ?? '')
    setSupportEmail(field(cfg, 'supportEmail', 'SupportEmail', 'email') ?? '')
  }

  useEffect(() => { loadData() }, [])

  const handleScopeChange = (s) => {
    setScope(s)
    setSaved(false); setSaveErr(null)
    if (s === 'global' && global) applyConfig(global)
    else if (s === 'tenant') { setLogoUrl(''); setPrimaryColor('#14b8a6'); setBrandName(''); setCustomDomain(''); setSupportEmail('') }
  }

  const handleTenantSelect = (id) => {
    setTenantId(id)
    const t = tenants.find(t => String(field(t, 'id', 'Id')) === String(id))
    if (t) {
      const cfg = field(t, 'whiteLabelConfig', 'WhiteLabelConfig', 'config', 'Config')
      if (cfg) applyConfig(cfg)
      else { setLogoUrl(''); setPrimaryColor('#14b8a6'); setBrandName(''); setCustomDomain(''); setSupportEmail('') }
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true); setSaveErr(null); setSaved(false)
    const payload = {
      logoUrl:      logoUrl.trim()      || undefined,
      primaryColor: primaryColor.trim() || undefined,
      brandName:    brandName.trim()    || undefined,
      customDomain: customDomain.trim() || undefined,
      supportEmail: supportEmail.trim() || undefined,
    }
    try {
      if (scope === 'global') {
        await updateMsspWhiteLabel(payload)
      } else {
        if (!tenantId) throw new Error('Select a tenant first')
        await updateTenantWhiteLabel(tenantId, payload)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) { setSaveErr('Action failed — please try again') }
    finally { setSaving(false) }
  }

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <div className="border-b border-white/10 py-10 px-4 bg-teal-500/5">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Link to="/mssp/dashboard" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">← Dashboard</Link>
            </div>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-teal-500/15 border border-teal-500/30 rounded-lg flex items-center justify-center">
                    <Globe className="w-3.5 h-3.5 text-teal-400" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-teal-400">MSSP Portal</span>
                </div>
                <h1 className="text-3xl font-extrabold text-white">White Label</h1>
                <p className="text-gray-400 text-sm mt-1">Customize branding for your portal and managed tenants.</p>
              </div>
              <button onClick={loadData} disabled={loading}
                className="flex items-center gap-1.5 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/15 text-gray-400 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={loadData} className="ml-auto text-xs hover:text-white">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-teal-400 animate-spin" /></div>
          ) : (
            <div className="grid lg:grid-cols-5 gap-8">
              <form onSubmit={handleSave} className="lg:col-span-3 space-y-6">
                {/* Scope selector */}
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-bold text-white">Configuration Scope</p>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => handleScopeChange('global')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        scope === 'global'
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                          : 'bg-white/3 border-white/10 text-gray-400 hover:text-gray-200'
                      }`}>
                      <Globe className="w-4 h-4" /> All Tenants (Global)
                    </button>
                    <button type="button" onClick={() => handleScopeChange('tenant')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                        scope === 'tenant'
                          ? 'bg-teal-500/15 border-teal-500/40 text-teal-300'
                          : 'bg-white/3 border-white/10 text-gray-400 hover:text-gray-200'
                      }`}>
                      <Building2 className="w-4 h-4" /> Specific Tenant
                    </button>
                  </div>
                  {scope === 'tenant' && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5">Select Tenant</label>
                      <select
                        value={tenantId} onChange={e => handleTenantSelect(e.target.value)} required
                        className="w-full bg-white/5 border border-white/15 focus:border-teal-500 text-white px-3 py-2 rounded-xl text-sm outline-none transition-colors">
                        <option value="">— choose a tenant —</option>
                        {tenants.map((t, i) => {
                          const tid  = field(t, 'id', 'Id') ?? i
                          const name = field(t, 'name', 'Name') ?? 'Unnamed'
                          return <option key={tid} value={tid}>{name}</option>
                        })}
                      </select>
                    </div>
                  )}
                </div>

                {/* Brand settings */}
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-teal-400" /> Brand Settings
                  </p>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Brand Name</label>
                    <input
                      value={brandName} onChange={e => setBrandName(e.target.value)}
                      placeholder="Acme Security"
                      className="w-full bg-white/5 border border-white/15 focus:border-teal-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Logo URL</label>
                    <input
                      type="url" value={logoUrl} onChange={e => setLogoUrl(e.target.value)}
                      placeholder="https://cdn.example.com/logo.png"
                      className="w-full bg-white/5 border border-white/15 focus:border-teal-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">PNG or SVG recommended. Max display height: 28px.</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Primary Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color" value={/^#[0-9a-fA-F]{6}$/.test(primaryColor) ? primaryColor : '#14b8a6'}
                        onChange={e => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0.5"
                      />
                      <input
                        value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
                        placeholder="#14b8a6"
                        className="flex-1 bg-white/5 border border-white/15 focus:border-teal-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono"
                      />
                      <ColorSwatch color={primaryColor} />
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">Hex format, e.g. #14b8a6. Used for nav bar and accent colors.</p>
                  </div>
                </div>

                {/* Domain & contact */}
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-teal-400" /> Domain & Contact
                  </p>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Custom Domain</label>
                    <input
                      value={customDomain} onChange={e => setCustomDomain(e.target.value)}
                      placeholder="security.acme.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-teal-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors font-mono"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">Point your CNAME to the platform before enabling.</p>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1.5">Support Email</label>
                    <input
                      type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)}
                      placeholder="support@acme.com"
                      className="w-full bg-white/5 border border-white/15 focus:border-teal-500 text-white placeholder-gray-600 px-3 py-2 rounded-xl text-sm outline-none transition-colors"
                    />
                    <p className="text-[10px] text-gray-600 mt-1">Shown in the portal footer and in alert emails.</p>
                  </div>
                </div>

                {saveErr && <p className="text-sm text-red-400">{saveErr}</p>}

                <button type="submit" disabled={saving || (scope === 'tenant' && !tenantId)}
                  className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-500/50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
                  {saving
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                    : saved
                    ? <><CheckCircle2 className="w-4 h-4" /> Saved!</>
                    : <><Save className="w-4 h-4" /> Save Changes</>
                  }
                </button>
              </form>

              {/* Preview panel */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white/3 border border-white/10 rounded-2xl p-5 space-y-4">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-teal-400" /> Live Preview
                  </p>
                  <PreviewHeader
                    logoUrl={logoUrl}
                    primaryColor={primaryColor}
                    brandName={brandName}
                    supportEmail={supportEmail}
                  />
                  <div className="space-y-2 text-[10px] text-gray-500">
                    <div className="flex justify-between">
                      <span>Brand Name</span>
                      <span className="text-gray-300">{brandName || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Color</span>
                      <span className="font-mono text-gray-300">{primaryColor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custom Domain</span>
                      <span className="font-mono text-gray-300">{customDomain || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Support Email</span>
                      <span className="text-gray-300">{supportEmail || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-amber-400">DNS Setup</p>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    To use a custom domain, add a <code className="bg-white/10 rounded px-1">CNAME</code> record pointing{' '}
                    <code className="bg-white/10 rounded px-1">{customDomain || 'your-domain.com'}</code> to{' '}
                    <code className="bg-white/10 rounded px-1">portal.webshield.io</code>, then save your settings.
                    DNS propagation may take up to 48 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
