import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig,
  interpolate, spring, Easing,
} from 'remotion'
import React from 'react'

/* ─── Brand ─────────────────────────────────────────────────────────────── */
const C = {
  bg:       '#06091A',
  navy:     '#0D1330',
  navyCard: '#111827',
  crimson:  '#E31837',
  crimsonD: '#B8122B',
  white:    '#FFFFFF',
  gray:     '#9CA3AF',
  grayD:    '#4B5563',
  border:   'rgba(255,255,255,0.10)',
  cardBg:   'rgba(255,255,255,0.04)',
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const ease = Easing.bezier(0.16, 1, 0.3, 1)

function fadeUp(frame, delay = 0, dur = 25) {
  const f = Math.max(0, frame - delay)
  return {
    opacity:    interpolate(f, [0, dur], [0, 1], { extrapolateRight: 'clamp' }),
    transform: `translateY(${interpolate(f, [0, dur], [28, 0], { extrapolateRight: 'clamp', easing: ease })}px)`,
  }
}

function scaleIn(frame, delay = 0, dur = 20) {
  const f = Math.max(0, frame - delay)
  return {
    opacity:    interpolate(f, [0, dur], [0, 1], { extrapolateRight: 'clamp' }),
    transform: `scale(${interpolate(f, [0, dur], [0.7, 1], { extrapolateRight: 'clamp', easing: ease })})`,
  }
}

function Counter({ end, frame, delay = 0, suffix = '', color = C.white }) {
  const f = Math.max(0, frame - delay)
  const pct = interpolate(f, [0, 60], [0, 1], { extrapolateRight: 'clamp', easing: ease })
  const val = Math.round(end * pct)
  return (
    <span style={{ color, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
      {val.toLocaleString()}{suffix}
    </span>
  )
}

/* ─── Shared layout pieces ───────────────────────────────────────────────── */
function Background() {
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 30% 40%, #1A0A1E 0%, ${C.bg} 60%)` }}>
      {/* grid lines */}
      <AbsoluteFill style={{
        backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
        opacity: 0.3,
      }} />
    </AbsoluteFill>
  )
}

function Logo({ frame, delay = 0, size = 52 }) {
  const st = fadeUp(frame, delay)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, ...st }}>
      <div style={{
        width: size, height: size, borderRadius: 14,
        background: `linear-gradient(135deg, ${C.crimson}, ${C.crimsonD})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 30px ${C.crimson}55`,
        flexShrink: 0,
      }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
            fill="white" fillOpacity="0.9" />
        </svg>
      </div>
      <span style={{ fontSize: size * 0.65, fontWeight: 900, color: C.white, letterSpacing: -1 }}>
        Udy<span style={{ color: C.gray }}>◎</span>
        <span style={{ color: C.crimson }}>360</span>
      </span>
    </div>
  )
}

function Pill({ text, color = C.crimson, frame, delay = 0 }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 99, padding: '8px 20px',
      ...fadeUp(frame, delay),
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      <span style={{ color, fontWeight: 700, fontSize: 15, letterSpacing: 1, textTransform: 'uppercase' }}>{text}</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 1 — Logo reveal (0–90f / 0–3 s)
═══════════════════════════════════════════════════════════════════════════ */
function Scene1Intro({ frame }) {
  const pulse = Math.sin(frame * 0.08) * 0.12 + 1
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Background />
      {/* glow */}
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.crimson}22, transparent 70%)`,
        transform: `scale(${pulse})`,
      }} />
      <Logo frame={frame} delay={5} size={80} />
      <div style={{ marginTop: 24, ...fadeUp(frame, 20) }}>
        <span style={{ color: C.gray, fontSize: 22, fontWeight: 400, letterSpacing: 2 }}>
          Web Security Scanner
        </span>
      </div>
    </AbsoluteFill>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 2 — Problem / hook (90–360f / 3–12 s)
═══════════════════════════════════════════════════════════════════════════ */
const STATS = [
  { val: 30000,  suffix: '+', label: 'websites hacked per day',   color: C.crimson },
  { val: 94,     suffix: '%', label: 'breaches are preventable',  color: '#FB923C' },
  { val: 5,      suffix: ' min', label: 'to find your first bug', color: '#34D399' },
]

function Scene2Problem({ frame }) {
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 140px' }}>
      <Background />
      <div style={{ textAlign: 'center', marginBottom: 60, ...fadeUp(frame, 0) }}>
        <span style={{ color: C.crimson, fontWeight: 800, fontSize: 18, letterSpacing: 3, textTransform: 'uppercase' }}>
          The reality
        </span>
      </div>
      <h1 style={{
        textAlign: 'center', color: C.white, fontWeight: 900,
        fontSize: 72, lineHeight: 1.1, marginBottom: 80,
        ...fadeUp(frame, 8),
      }}>
        Most hacks happen because<br />
        <span style={{ color: C.crimson }}>nobody checked.</span>
      </h1>
      <div style={{ display: 'flex', gap: 48, ...fadeUp(frame, 25) }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            textAlign: 'center', padding: '32px 48px',
            background: C.cardBg, border: `1px solid ${C.border}`,
            borderRadius: 20,
          }}>
            <div style={{ fontSize: 56, fontWeight: 900, marginBottom: 8 }}>
              <Counter end={s.val} frame={frame} delay={40} suffix={s.suffix} color={s.color} />
            </div>
            <div style={{ color: C.gray, fontSize: 16, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 3 — Live scan demo (360–960f / 12–32 s)
═══════════════════════════════════════════════════════════════════════════ */
const LOG_ENTRIES = [
  { tag: 'CRITICAL', color: '#F87171', msg: 'SQL Injection found at /api/users?id=' },
  { tag: 'HIGH',     color: '#FB923C', msg: 'Reflected XSS detected at /search' },
  { tag: 'HIGH',     color: '#FB923C', msg: 'Missing HSTS header on 3 endpoints' },
  { tag: 'MEDIUM',   color: '#FBBF24', msg: 'Missing CSP header on 12 pages' },
  { tag: 'MEDIUM',   color: '#FBBF24', msg: 'Directory listing enabled at /uploads' },
  { tag: 'INFO',     color: '#60A5FA', msg: 'Scanning /api/v2/products...' },
]

function ScanWidget({ frame }) {
  const progress = interpolate(frame, [0, 500], [3, 91], { extrapolateRight: 'clamp', easing: ease })
  const requests = Math.round(interpolate(frame, [0, 500], [0, 1247], { extrapolateRight: 'clamp' }))
  const visibleLogs = Math.min(LOG_ENTRIES.length, Math.floor(frame / 70))

  return (
    <div style={{
      width: 760, borderRadius: 20, overflow: 'hidden',
      background: '#0D1117', border: `1px solid ${C.border}`,
      boxShadow: `0 40px 100px rgba(0,0,0,0.6), 0 0 60px ${C.crimson}18`,
      ...scaleIn(frame, 0, 30),
    }}>
      {/* Window bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '14px 20px', background: 'rgba(255,255,255,0.04)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {[C.crimson, '#F59E0B', '#10B981'].map((c, i) => (
          <div key={i} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
        ))}
        <div style={{
          marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8,
          background: '#1A2035', borderRadius: 8, padding: '5px 14px', flex: 1,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill={C.crimson} />
          </svg>
          <span style={{ fontSize: 12, color: C.gray, fontFamily: 'monospace' }}>
            https://target-app.example.com
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981', letterSpacing: 1 }}>SCANNING</span>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: C.gray }}>Scan Progress</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: C.white }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${C.crimson}, #FF6B6B)`,
            borderRadius: 8, transition: 'width 0.1s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 11, color: C.grayD }}>Crawling pages...</span>
          <span style={{ fontSize: 11, color: C.grayD }}>{requests.toLocaleString()} requests sent</span>
        </div>
      </div>

      {/* Vuln counts */}
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.grayD, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
          Vulnerabilities Found
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'CRITICAL', val: 3,  color: '#F87171' },
            { label: 'HIGH',     val: 7,  color: '#FB923C' },
            { label: 'MEDIUM',   val: 14, color: '#FBBF24' },
            { label: 'LOW',      val: 22, color: '#60A5FA' },
          ].map((s) => (
            <div key={s.label} style={{
              background: '#1A2035', borderRadius: 12, padding: '12px 8px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: s.color, marginBottom: 4 }}>
                {s.val}
              </div>
              <div style={{ fontSize: 9, fontWeight: 700, color: s.color, letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live log */}
      <div style={{ padding: '14px 20px', minHeight: 140 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.grayD, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
          Live Log
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'monospace', fontSize: 11 }}>
          {LOG_ENTRIES.slice(0, visibleLogs).map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, opacity: i === visibleLogs - 1 ? (Math.sin(frame * 0.15) * 0.3 + 0.7) : 1 }}>
              <span style={{ color: e.color, fontWeight: 700, minWidth: 70 }}>[{e.tag}]</span>
              <span style={{ color: '#D1D5DB' }}>{e.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Scene3Scan({ frame }) {
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 100px' }}>
      <Background />
      <div style={{ flex: 1, paddingRight: 60 }}>
        <Pill text="Live Demo" frame={frame} delay={0} />
        <h2 style={{ color: C.white, fontSize: 60, fontWeight: 900, lineHeight: 1.1, marginTop: 24, ...fadeUp(frame, 10) }}>
          Scan your site in<br />
          <span style={{ color: C.crimson }}>under 60 seconds.</span>
        </h2>
        <p style={{ color: C.gray, fontSize: 22, marginTop: 24, lineHeight: 1.6, maxWidth: 480, ...fadeUp(frame, 25) }}>
          Type a URL. Hit scan. Udyo360 crawls every endpoint, tests for SQL injection, XSS, OWASP Top 10, and more — automatically.
        </p>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14, ...fadeUp(frame, 40) }}>
          {['No account required', 'Results in under 60 seconds', '200+ security checks'].map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#10B98122', border: '1px solid #10B98140', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ color: C.gray, fontSize: 18 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
        <ScanWidget frame={frame} />
      </div>
    </AbsoluteFill>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 4 — Results deep dive (960–1500f / 32–50 s)
═══════════════════════════════════════════════════════════════════════════ */
const FINDINGS = [
  {
    sev: 'Critical', color: '#F87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)',
    title: 'SQL Injection',
    desc: 'User-controlled input reaches SQL query without sanitisation. Attacker can dump or delete your entire database.',
    fix: 'Use parameterised queries. Never concatenate user input into SQL strings.',
  },
  {
    sev: 'High', color: '#FB923C', bg: 'rgba(251,146,60,0.08)', border: 'rgba(251,146,60,0.25)',
    title: 'Reflected XSS',
    desc: 'The /search endpoint reflects unsanitised query parameters directly into the page HTML.',
    fix: 'Encode output with htmlspecialchars(). Add Content-Security-Policy header.',
  },
  {
    sev: 'Medium', color: '#FBBF24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.25)',
    title: 'Missing CSP Header',
    desc: 'Content Security Policy is absent, allowing unsafe inline scripts and arbitrary resource loading.',
    fix: "Add Content-Security-Policy: default-src 'self'; script-src 'self' to all responses.",
  },
]

function FindingCard({ f, frame, delay }) {
  const visible = frame >= delay
  const localF = Math.max(0, frame - delay)
  return (
    <div style={{
      border: `1px solid ${f.border}`, borderRadius: 16,
      background: f.bg, padding: '20px 24px',
      opacity: interpolate(localF, [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
      transform: `translateX(${interpolate(localF, [0, 20], [40, 0], { extrapolateRight: 'clamp', easing: ease })}px)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 99,
          background: f.color + '22', color: f.color, letterSpacing: 1, textTransform: 'uppercase',
        }}>{f.sev}</span>
        <span style={{ color: C.white, fontWeight: 700, fontSize: 16 }}>{f.title}</span>
      </div>
      <p style={{ color: C.gray, fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>{f.desc}</p>
      <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 14px' }}>
        <span style={{ color: '#34D399', fontSize: 11, fontWeight: 700 }}>FIX: </span>
        <span style={{ color: '#9CA3AF', fontSize: 12 }}>{f.fix}</span>
      </div>
    </div>
  )
}

function Scene4Results({ frame }) {
  return (
    <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 100px' }}>
      <Background />

      {/* Grade ring */}
      <div style={{ flex: '0 0 340px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%',
          border: '6px solid rgba(251,146,60,0.4)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(251,146,60,0.06)',
          boxShadow: '0 0 60px rgba(251,146,60,0.15)',
          ...scaleIn(frame, 0, 25),
        }}>
          <span style={{ fontSize: 96, fontWeight: 900, color: '#FB923C', lineHeight: 1 }}>C</span>
          <span style={{ fontSize: 16, color: C.grayD }}>48 / 100</span>
        </div>

        <div style={{ width: '100%', ...fadeUp(frame, 30) }}>
          {[
            { label: 'Critical', count: 3, color: '#F87171', w: '15%' },
            { label: 'High',     count: 7, color: '#FB923C', w: '35%' },
            { label: 'Medium',   count: 14, color: '#FBBF24', w: '60%' },
            { label: 'Low',      count: 22, color: '#60A5FA', w: '90%' },
          ].map((s) => (
            <div key={s.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ color: s.color, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
                <span style={{ color: C.gray, fontSize: 12 }}>{s.count}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6, background: s.color,
                  width: interpolate(frame, [20, 60], ['0%', s.w], { extrapolateRight: 'clamp' }),
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Findings list */}
      <div style={{ flex: 1, paddingLeft: 60, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ ...fadeUp(frame, 5) }}>
          <Pill text="Instant findings" frame={frame} delay={5} color="#FB923C" />
          <h2 style={{ color: C.white, fontSize: 48, fontWeight: 900, marginTop: 16, marginBottom: 8, lineHeight: 1.1 }}>
            Every bug explained.<br /><span style={{ color: '#34D399' }}>Every fix included.</span>
          </h2>
        </div>
        {FINDINGS.map((f, i) => (
          <FindingCard key={i} f={f} frame={frame} delay={20 + i * 20} />
        ))}
      </div>
    </AbsoluteFill>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 5 — Dashboard + features (1500–1860f / 50–62 s)
═══════════════════════════════════════════════════════════════════════════ */
const FEATURE_CARDS = [
  { icon: '📊', title: 'Security Dashboard',  desc: 'Track score trends, risk history, and asset health in one place.' },
  { icon: '🕐', title: 'Scheduled Scans',     desc: 'Set it once. Udyo360 watches your site 24/7 and alerts you instantly.' },
  { icon: '🛠️', title: 'Remediation Tasks',   desc: 'Assign, track, and close every vulnerability with your team.' },
  { icon: '🔌', title: 'API Security',         desc: 'Test REST APIs, GraphQL endpoints, and authentication flows.' },
  { icon: '💻', title: 'Agent Scanner',        desc: 'Scan internal servers. Ports, OS hardening, web config — offline.' },
  { icon: '🎯', title: 'OWASP Top 10 2024',    desc: 'Full coverage of the latest OWASP standard out of the box.' },
]

function Scene5Dashboard({ frame }) {
  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 100px' }}>
      <Background />
      <Pill text="Full Platform" frame={frame} delay={0} color="#818CF8" />
      <h2 style={{ color: C.white, fontSize: 62, fontWeight: 900, textAlign: 'center', marginTop: 20, marginBottom: 16, ...fadeUp(frame, 10) }}>
        Everything you need to stay secure.
      </h2>
      <p style={{ color: C.gray, fontSize: 20, textAlign: 'center', maxWidth: 640, marginBottom: 56, ...fadeUp(frame, 20) }}>
        One platform for scanning, monitoring, remediating, and tracking your security posture over time.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, width: '100%', maxWidth: 1100 }}>
        {FEATURE_CARDS.map((c, i) => (
          <div key={i} style={{
            background: C.cardBg, border: `1px solid ${C.border}`,
            borderRadius: 18, padding: '24px 26px',
            opacity: interpolate(Math.max(0, frame - (25 + i * 8)), [0, 20], [0, 1], { extrapolateRight: 'clamp' }),
            transform: `translateY(${interpolate(Math.max(0, frame - (25 + i * 8)), [0, 20], [20, 0], { extrapolateRight: 'clamp', easing: ease })}px)`,
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ color: C.white, fontWeight: 700, fontSize: 17, marginBottom: 8 }}>{c.title}</div>
            <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.6 }}>{c.desc}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   SCENE 6 — CTA (1860–2250f / 62–75 s)
═══════════════════════════════════════════════════════════════════════════ */
function Scene6CTA({ frame }) {
  const pulse = Math.sin(frame * 0.06) * 0.08 + 1
  const glow  = Math.sin(frame * 0.06) * 20 + 60

  return (
    <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <Background />
      <div style={{
        position: 'absolute', width: 800, height: 800, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.crimson}${Math.round(glow * 0.4).toString(16).padStart(2, '0')}, transparent 70%)`,
        transform: `scale(${pulse})`,
      }} />

      <Logo frame={frame} delay={0} size={64} />

      <h1 style={{
        color: C.white, fontSize: 82, fontWeight: 900, textAlign: 'center',
        lineHeight: 1.05, marginTop: 40, maxWidth: 900,
        ...fadeUp(frame, 12),
      }}>
        Start finding bugs<br />
        <span style={{ color: C.crimson }}>in the next 5 minutes.</span>
      </h1>

      <p style={{ color: C.gray, fontSize: 22, textAlign: 'center', marginTop: 24, ...fadeUp(frame, 22) }}>
        Free scan &nbsp;·&nbsp; No credit card &nbsp;·&nbsp; No account required
      </p>

      <div style={{ marginTop: 50, ...scaleIn(frame, 30, 20) }}>
        <div style={{
          background: `linear-gradient(135deg, ${C.crimson}, ${C.crimsonD})`,
          borderRadius: 16, padding: '20px 60px',
          fontSize: 24, fontWeight: 800, color: C.white,
          boxShadow: `0 20px 60px ${C.crimson}50`,
          letterSpacing: 0.5,
        }}>
          udyo360.com →
        </div>
      </div>

      <div style={{ marginTop: 48, display: 'flex', gap: 60, ...fadeUp(frame, 45) }}>
        {[
          { val: '50K+', label: 'Scans Run' },
          { val: '2.4M+', label: 'Bugs Found' },
          { val: '99.7%', label: 'Accuracy' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ color: C.white, fontSize: 36, fontWeight: 900 }}>{s.val}</div>
            <div style={{ color: C.grayD, fontSize: 15, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   ROOT COMPOSITION
═══════════════════════════════════════════════════════════════════════════ */
export function UdyoPromo() {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif", background: C.bg }}>
      <Sequence from={0}   durationInFrames={95}>
        <Scene1Intro frame={frame} />
      </Sequence>
      <Sequence from={85}  durationInFrames={280}>
        <Scene2Problem frame={frame - 85} />
      </Sequence>
      <Sequence from={355} durationInFrames={610}>
        <Scene3Scan frame={frame - 355} />
      </Sequence>
      <Sequence from={955} durationInFrames={550}>
        <Scene4Results frame={frame - 955} />
      </Sequence>
      <Sequence from={1495} durationInFrames={370}>
        <Scene5Dashboard frame={frame - 1495} />
      </Sequence>
      <Sequence from={1855} durationInFrames={395}>
        <Scene6CTA frame={frame - 1855} />
      </Sequence>
    </AbsoluteFill>
  )
}
