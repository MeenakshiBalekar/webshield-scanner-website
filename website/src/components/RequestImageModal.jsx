import React, { useState, useEffect } from 'react'
import { X, Loader2, AlertCircle, CheckCircle2, Send } from 'lucide-react'
import { submitImageRequest } from '../services/api'

const URGENCIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'priority', label: 'Priority' },
  { value: 'urgent',   label: 'Urgent'   },
]

const inputCls =
  'w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors'

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">
        {label}{required && <span className="text-crimson-400"> *</span>}
      </label>
      {children}
    </div>
  )
}

export default function RequestImageModal({ open, onClose, defaultImage = '' }) {
  const [form, setForm] = useState({
    name: '', email: '', company: '',
    imageName: defaultImage, baseImage: '', packages: '',
    description: '', needsFips: false, urgency: 'standard',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState(null)
  const [requestId, setRequestId]   = useState(null)

  /* Seed "image needed" with the current image when opening from a detail page */
  useEffect(() => {
    if (open && defaultImage) {
      setForm((f) => (f.imageName ? f : { ...f, imageName: defaultImage }))
    }
  }, [open, defaultImage])

  if (!open) return null

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await submitImageRequest({
        ...form,
        packages: form.packages.split(',').map((s) => s.trim()).filter(Boolean),
      })
      setRequestId(res?.id ?? res?.Id ?? res?.requestId ?? res?.RequestId ?? 'submitted')
    } catch (err) {
      setError(err?.message || 'Could not submit request — please try again.')
    }
    setSubmitting(false)
  }

  const handleClose = () => {
    setRequestId(null)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg bg-navy-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-navy-900 flex items-center justify-between px-6 py-4 border-b border-white/10 z-10">
          <h2 className="text-lg font-bold text-white">Request a Custom Image</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {requestId ? (
          <div className="px-6 py-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-400" />
            </div>
            <p className="text-white font-semibold mb-1.5">Request submitted</p>
            <p className="text-sm text-gray-400 mb-1">
              Our team will get back to you at <span className="text-gray-200">{form.email}</span>.
            </p>
            {requestId !== 'submitted' && (
              <p className="text-xs text-gray-500 mb-6">
                Reference: <span className="font-mono text-gray-300">{requestId}</span>
              </p>
            )}
            <button
              onClick={handleClose}
              className="bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Your name" required>
                <input required value={form.name} onChange={set('name')} placeholder="Jane Doe" className={inputCls} />
              </Field>
              <Field label="Email" required>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="you@company.com" className={inputCls} />
              </Field>
            </div>

            <Field label="Company">
              <input value={form.company} onChange={set('company')} placeholder="Acme Corp" className={inputCls} />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Image name" required>
                <input required value={form.imageName} onChange={set('imageName')} placeholder="e.g. nginx with custom modules" className={inputCls} />
              </Field>
              <Field label="Base preference">
                <input value={form.baseImage} onChange={set('baseImage')} placeholder="e.g. alpine, distroless" className={inputCls} />
              </Field>
            </div>

            <Field label="Packages (comma-separated)">
              <input value={form.packages} onChange={set('packages')} placeholder="curl, openssl, ca-certificates" className={inputCls} />
            </Field>

            <Field label="Description">
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                placeholder="What will this image be used for? Any special hardening or compliance requirements?"
                className={`${inputCls} resize-none`}
              />
            </Field>

            <div className="flex items-center justify-between gap-4">
              <label className="flex items-center gap-2.5 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.needsFips}
                  onChange={set('needsFips')}
                  className="w-4 h-4 rounded accent-crimson-500"
                />
                FIPS build needed
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Urgency</span>
                <select value={form.urgency} onChange={set('urgency')} className="bg-white/5 border border-white/15 focus:border-crimson-500 text-white px-2.5 py-1.5 rounded-lg text-xs outline-none transition-colors cursor-pointer">
                  {URGENCIES.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Submit Request
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
