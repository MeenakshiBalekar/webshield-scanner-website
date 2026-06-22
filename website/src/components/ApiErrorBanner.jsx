import React from 'react'
import { AlertCircle, Wrench } from 'lucide-react'

/**
 * Renders an API error, including optional structured fields:
 *   - error.azureErrorCode  → shown as a monospace badge
 *   - error.howToFix        → shown as a numbered "How to Fix" section
 *   - error.details         → shown as supplementary text
 *
 * Accepts: Error object | string | null
 */
export default function ApiErrorBanner({ error, className = '' }) {
  if (!error) return null

  const message      = typeof error === 'string' ? error : (error.message || 'An error occurred')
  const howToFix     = error?.howToFix     ?? null
  const azureCode    = error?.azureErrorCode ?? null
  const details      = error?.details      ?? null

  const steps = howToFix
    ? howToFix
        .split(/\r?\n|(?=\d+[\.\)])\s*/)
        .map(s => s.replace(/^\d+[\.\)]\s*/, '').trim())
        .filter(Boolean)
    : null

  return (
    <div className={`bg-red-500/10 border border-red-500/30 rounded-xl overflow-hidden ${className}`}>
      {/* Main error row */}
      <div className="flex items-start gap-2 px-4 py-3 text-sm text-red-400">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0 space-y-0.5">
          <p>{message}</p>
          {azureCode && (
            <span className="inline-block text-[10px] font-bold font-mono bg-red-500/20 border border-red-500/30 text-red-300 px-2 py-0.5 rounded">
              {azureCode}
            </span>
          )}
          {details && details !== message && !howToFix && (
            <p className="text-xs text-red-300/70 leading-relaxed">{details}</p>
          )}
        </div>
      </div>

      {/* How to fix */}
      {steps && steps.length > 0 && (
        <div className="border-t border-red-500/20 bg-orange-950/30 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-2">
            <Wrench className="w-3 h-3" /> How to Fix
          </p>
          <ol className="space-y-1.5 list-decimal list-inside">
            {steps.map((step, i) => (
              <li key={i} className="text-xs text-gray-300 leading-relaxed">{step}</li>
            ))}
          </ol>
          {details && details !== message && (
            <p className="mt-2 text-xs text-gray-500 leading-relaxed border-t border-white/5 pt-2">{details}</p>
          )}
        </div>
      )}
    </div>
  )
}
