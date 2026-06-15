import {
  AbsoluteFill, Sequence, useCurrentFrame,
  interpolate, Easing,
} from 'remotion'
import React from 'react'

const C = {
  bg:       '#06091A',
  crimson:  '#E31837',
  crimsonD: '#B8122B',
  white:    '#FFFFFF',
  gray:     '#9CA3AF',
  grayD:    '#4B5563',
  border:   'rgba(255,255,255,0.10)',
  cardBg:   'rgba(255,255,255,0.04)',
}

const ease = Easing.bezier(0.16, 1, 0.3, 1)

function fadeUp(frame, delay = 0, dur = 20) {
  const f = Math.max(0, frame - delay)
  return {
    opacity:   interpolate(f, [0, dur], [0, 1], { extrapolateRight: 'clamp' }),
    transform: `translateY(${interpolate(f, [0, dur], [24, 0], { extrapolateRight: 'clamp', easing: ease })}px)`,
  }
}

function Bg() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 30%, #1A0A1E 0%, ${C.bg} 70%)` }}>
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: '60px 60px', opacity: 0.25,
      }} />
    </AbsoluteFill>
  )
}

/* Scene A — Logo + hook (0-150f) */
function SceneA({ frame }) {
  const pulse = Math.sin(frame * 0.1) * 0.1 + 1
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px' }}>
      <Bg />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.crimson}20, transparent 70%)`,
        transform: `scale(${pulse})`,
      }} />

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 48, ...fadeUp(frame, 5) }}>
        <div style={{
          width: 70, height: 70, borderRadius: 18,
          background: `linear-gradient(135deg, ${C.crimson}, ${C.crimsonD})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 40px ${C.crimson}55`,
        }}>
          <svg width="38" height="38" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <span style={{ fontSize: 48, fontWeight: 900, color: C.white }}>
          Udy<span style={{ color: C.gray }}>◎</span><span style={{ color: C.crimson }}>360</span>
        </span>
      </div>

      <h1 style={{ fontSize: 72, fontWeight: 900, color: C.white, textAlign: 'center', lineHeight: 1.05, marginBottom: 24, ...fadeUp(frame, 15) }}>
        Is your website<br /><span style={{ color: C.crimson }}>being hacked</span><br />right now?
      </h1>

      <p style={{ fontSize: 28, color: C.gray, textAlign: 'center', lineHeight: 1.5, ...fadeUp(frame, 30) }}>
        30,000+ sites breached daily.<br />Yours could be next.
      </p>
    </AbsoluteFill>
  )
}

/* Scene B — Scan in action (150-550f) */
function SceneB({ frame }) {
  const progress = interpolate(frame, [0, 360], [0, 87], { extrapolateRight: 'clamp', easing: ease })
  const visibleLogs = Math.min(4, Math.floor(frame / 70))
  const LOGS = [
    { tag: 'CRITICAL', color: '#F87171', msg: 'SQL Injection at /api/users?id=' },
    { tag: 'HIGH',     color: '#FB923C', msg: 'Reflected XSS at /search' },
    { tag: 'MEDIUM',   color: '#FBBF24', msg: 'Missing CSP on 12 pages' },
    { tag: 'INFO',     color: '#60A5FA', msg: 'Scanning /api/v2/products...' },
  ]

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 50px' }}>
      <Bg />
      <div style={{ ...fadeUp(frame, 0), marginBottom: 30 }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: C.crimson, letterSpacing: 2, textTransform: 'uppercase' }}>
          Scan in progress
        </span>
      </div>
      <h2 style={{ fontSize: 60, fontWeight: 900, color: C.white, textAlign: 'center', marginBottom: 40, lineHeight: 1.1, ...fadeUp(frame, 10) }}>
        Finding bugs<br /><span style={{ color: '#10B981' }}>in real time.</span>
      </h2>

      <div style={{
        width: '100%', background: '#0D1117', border: `1px solid ${C.border}`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: `0 30px 80px rgba(0,0,0,0.5), 0 0 40px ${C.crimson}18`,
        ...fadeUp(frame, 5),
      }}>
        {/* URL bar */}
        <div style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.04)', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill={C.crimson} />
          </svg>
          <span style={{ fontSize: 13, color: C.gray, fontFamily: 'monospace', flex: 1 }}>target-app.example.com</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>SCANNING</span>
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: C.gray }}>Progress</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${C.crimson}, #FF6B6B)`, borderRadius: 8 }} />
          </div>
        </div>

        {/* Counts */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[{ l: 'CRITICAL', v: 3, c: '#F87171' }, { l: 'HIGH', v: 7, c: '#FB923C' }, { l: 'MEDIUM', v: 14, c: '#FBBF24' }, { l: 'LOW', v: 22, c: '#60A5FA' }].map((s) => (
            <div key={s.l} style={{ background: '#1A2035', borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: s.c }}>{s.v}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: s.c, letterSpacing: 1 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Log */}
        <div style={{ padding: '14px 20px' }}>
          {LOGS.slice(0, visibleLogs).map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontFamily: 'monospace', fontSize: 12 }}>
              <span style={{ color: e.color, fontWeight: 700 }}>[{e.tag}]</span>
              <span style={{ color: '#D1D5DB' }}>{e.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* Scene C — CTA (550-900f) */
function SceneC({ frame }) {
  const pulse = Math.sin(frame * 0.07) * 0.08 + 1
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px' }}>
      <Bg />
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.crimson}28, transparent 70%)`,
        transform: `scale(${pulse})`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40, ...fadeUp(frame, 0) }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg, ${C.crimson}, ${C.crimsonD})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 30px ${C.crimson}55` }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <span style={{ fontSize: 44, fontWeight: 900, color: C.white }}>
          Udy<span style={{ color: C.gray }}>◎</span><span style={{ color: C.crimson }}>360</span>
        </span>
      </div>

      <h1 style={{ fontSize: 76, fontWeight: 900, color: C.white, textAlign: 'center', lineHeight: 1.05, marginBottom: 20, ...fadeUp(frame, 10) }}>
        Find your<br />first bug in<br /><span style={{ color: C.crimson }}>5 minutes.</span>
      </h1>

      <p style={{ fontSize: 26, color: C.gray, textAlign: 'center', marginBottom: 50, ...fadeUp(frame, 20) }}>
        Free · No account needed · No credit card
      </p>

      <div style={{
        background: `linear-gradient(135deg, ${C.crimson}, ${C.crimsonD})`,
        borderRadius: 20, padding: '24px 70px',
        fontSize: 30, fontWeight: 900, color: C.white,
        boxShadow: `0 20px 60px ${C.crimson}55`,
        letterSpacing: 0.5,
        transform: `scale(${pulse})`,
        ...fadeUp(frame, 30),
      }}>
        udyo360.com
      </div>

      <div style={{ marginTop: 50, display: 'flex', gap: 50, ...fadeUp(frame, 40) }}>
        {[{ v: '50K+', l: 'Scans' }, { v: '2.4M+', l: 'Bugs Found' }, { v: '99.7%', l: 'Accuracy' }].map((s) => (
          <div key={s.l} style={{ textAlign: 'center' }}>
            <div style={{ color: C.white, fontSize: 34, fontWeight: 900 }}>{s.v}</div>
            <div style={{ color: C.grayD, fontSize: 15, marginTop: 4 }}>{s.l}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

export function UdyoShort() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: C.bg }}>
      <Sequence from={0}   durationInFrames={155}><SceneA frame={frame} /></Sequence>
      <Sequence from={145} durationInFrames={410}><SceneB frame={frame - 145} /></Sequence>
      <Sequence from={545} durationInFrames={355}><SceneC frame={frame - 545} /></Sequence>
    </AbsoluteFill>
  )
}
