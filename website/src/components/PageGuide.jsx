import React, { useState } from 'react'
import { Info, X } from 'lucide-react'

export default function PageGuide({ id, text }) {
  const key = `pg_v1_${id}`
  const [visible, setVisible] = useState(() => {
    try { return !localStorage.getItem(key) } catch { return true }
  })

  if (!visible) return null

  const dismiss = () => {
    try { localStorage.setItem(key, '1') } catch {}
    setVisible(false)
  }

  return (
    <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 mb-4">
      <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-400 opacity-70" />
      <p className="flex-1 text-sm text-gray-400 leading-relaxed">{text}</p>
      <button
        onClick={dismiss}
        className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-lg transition-colors ml-2 whitespace-nowrap"
      >
        <X className="w-3 h-3" /> Got it
      </button>
    </div>
  )
}
