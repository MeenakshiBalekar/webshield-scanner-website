import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Terminal } from 'lucide-react'

function Row({ label, value, color }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex gap-2 text-xs font-mono">
      <span className="text-gray-500 shrink-0 w-24">{label}</span>
      <span className={`break-all ${color}`}>{String(value)}</span>
    </div>
  )
}

export default function EvidencePanel({ evidence }) {
  const [open, setOpen] = useState(false)
  if (!evidence) return null

  let parsed = null
  if (typeof evidence === 'object') {
    parsed = evidence
  } else {
    try { parsed = JSON.parse(evidence) } catch { /* raw string fallback */ }
  }

  const request       = parsed?.request       ?? parsed?.Request       ?? null
  const location      = parsed?.location      ?? parsed?.Location      ?? null
  const observedValue = parsed?.observedValue ?? parsed?.ObservedValue ?? null
  const expectedValue = parsed?.expectedValue ?? parsed?.ExpectedValue ?? null
  const payload       = parsed?.payload       ?? parsed?.Payload       ?? null

  return (
    <div className="mt-2">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 hover:text-white border border-white/10 bg-white/3 hover:bg-white/8 px-2.5 py-1 rounded-lg transition-colors"
      >
        <Terminal className="w-3 h-3" />
        View Evidence
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {open && (
        <div className="mt-2 bg-black/50 border border-white/10 rounded-xl px-4 py-3 space-y-2">
          {parsed ? (
            <>
              <Row label="Request"  value={request}       color="text-gray-300" />
              <Row label="Location" value={location}      color="text-gray-400" />
              <Row label="Observed" value={observedValue} color="text-red-400" />
              <Row label="Expected" value={expectedValue} color="text-green-400" />
              {payload && (
                <Row label="Payload" value={payload} color="text-orange-400" />
              )}
            </>
          ) : (
            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all">{evidence}</pre>
          )}
        </div>
      )}
    </div>
  )
}
