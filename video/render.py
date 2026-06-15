"""
Udyo360 promo video renderer.
Generates frames as SVG → PNG via CairoSVG → MP4 via imageio-ffmpeg.
Two outputs:
  /tmp/udyo360-promo.mp4   — 75 s 1920×1080 YouTube master
  /tmp/udyo360-short.mp4   — 30 s 1080×1920 Reel (Instagram / Facebook)
"""
import math, os, sys, tempfile, shutil
import cairosvg
import imageio
import numpy as np
from io import BytesIO
from PIL import Image

# ── constants ──────────────────────────────────────────────────────────────
FPS   = 30
BG    = '#06091A'
NAVY  = '#0D1130'
RED   = '#E31837'
REDB  = '#B8122B'
WHITE = '#FFFFFF'
GRAY  = '#9CA3AF'
GRAYD = '#4B5563'
BORD  = 'rgba(255,255,255,0.10)'
CARD  = 'rgba(255,255,255,0.04)'

# ── helpers ────────────────────────────────────────────────────────────────
def clamp(v, lo=0, hi=1): return max(lo, min(hi, v))
def ease(t):
    t = clamp(t)
    return 1 - (1-t)**3

def interp(frame, f0, f1, v0, v1, e=True):
    if frame <= f0: return v0
    if frame >= f1: return v1
    t = (frame-f0)/(f1-f0)
    if e: t = ease(t)
    return v0 + (v1-v0)*t

def fade_y(frame, delay=0, dur=22):
    f = max(0, frame-delay)
    return interp(f, 0, dur, 0, 1), interp(f, 0, dur, 28, 0)

def counter(end, frame, delay=0, dur=60):
    f = max(0, frame-delay)
    pct = interp(f, 0, dur, 0, 1)
    return int(round(end*pct))

# ── SVG building blocks ────────────────────────────────────────────────────

def udyo_icon(cx, cy, size, stroke_color=RED, dot_color=WHITE):
    """Render the real Udyo360 icon: U-stroke + dot. viewBox 0 0 60 60."""
    scale = size / 60
    ox = cx - size / 2
    oy = cy - size / 2
    sw = 10.5 * scale
    return f'''
  <g transform="translate({ox},{oy}) scale({scale})">
    <path d="M13 8 L13 36 A17 17 0 0 0 47 36 L47 8"
          stroke="{stroke_color}" stroke-width="10.5" stroke-linecap="round" fill="none"/>
    <circle cx="30" cy="48" r="5.5" fill="{dot_color}"/>
  </g>'''

def grid_bg():
    return f'''
  <rect width="100%" height="100%" fill="{BG}"/>
  <defs>
    <radialGradient id="bg_glow" cx="30%" cy="40%" r="60%">
      <stop offset="0%"  stop-color="#1A0A1E"/>
      <stop offset="100%" stop-color="{BG}"/>
    </radialGradient>
    <pattern id="grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg_glow)"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>'''

def shield_icon(x, y, size, color=WHITE):
    scale = size/24
    return f'<path transform="translate({x},{y}) scale({scale})" d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="{color}" fill-opacity="0.92"/>'

def logo(cx, cy, size, op=1.0, ty=0):
    """Logo = real Udyo360 U-icon + wordmark side by side."""
    icon_size = size * 0.95
    gap       = size * 0.55
    txt_x     = cx - size * 1.8 + gap
    return f'''
  <g opacity="{op}" transform="translate(0,{ty})">
    {udyo_icon(cx - size * 1.8, cy, icon_size)}
    <text x="{txt_x}" y="{cy}" dominant-baseline="central" font-size="{size*0.75}" font-weight="900" font-family="Inter,Segoe UI,system-ui,sans-serif" fill="{WHITE}" letter-spacing="-1">Udy◎<tspan fill="{RED}">360</tspan></text>
  </g>'''

LOGO_DEFS = f'''
  <defs>
    <linearGradient id="logo_grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="{RED}"/>
      <stop offset="100%" stop-color="{REDB}"/>
    </linearGradient>
    <filter id="logo_glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="card_shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feGaussianBlur stdDeviation="16" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>'''

def pill(x, y, text, color=RED, op=1.0, ty=0):
    return f'''
  <g opacity="{op}" transform="translate(0,{ty})">
    <rect x="{x-10}" y="{y-16}" width="{len(text)*9+44}" height="32" rx="16"
          fill="{color}" fill-opacity="0.12" stroke="{color}" stroke-opacity="0.35" stroke-width="1"/>
    <circle cx="{x+6}" cy="{y}" r="4" fill="{color}"/>
    <text x="{x+18}" y="{y}" dominant-baseline="central" font-size="13" font-weight="700"
          font-family="Inter,Segoe UI,sans-serif" fill="{color}" letter-spacing="1.5"
          text-transform="uppercase">{text.upper()}</text>
  </g>'''

def check_item(x, y, text, op=1.0, ty=0):
    return f'''
  <g opacity="{op}" transform="translate(0,{ty})">
    <circle cx="{x+10}" cy="{y}" r="11" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-opacity="0.3" stroke-width="1"/>
    <path d="M{x+5},{y} l5,5 8,-8" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="{x+28}" y="{y}" dominant-baseline="central" font-size="17" font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}">{text}</text>
  </g>'''

def scan_widget(x, y, w, progress, vis_logs, frame_local, scale_op=1.0, scale_s=1.0):
    h_win  = 56
    h_url  = 62
    h_prog = 74
    h_vuln = 118
    h_log  = 130
    total_h= h_win+h_url+h_prog+h_vuln+h_log

    LOGS = [
        ('CRITICAL','#F87171','SQL Injection found at /api/users?id='),
        ('HIGH','#FB923C','Reflected XSS detected at /search'),
        ('HIGH','#FB923C','Missing HSTS header on 3 endpoints'),
        ('MEDIUM','#FBBF24','Missing CSP header on 12 pages'),
        ('MEDIUM','#FBBF24','Directory listing enabled at /uploads'),
        ('INFO','#60A5FA','Scanning /api/v2/products...'),
    ]
    log_items = LOGS[:min(len(LOGS), vis_logs)]

    reqs = int(interp(frame_local, 0, 500, 0, 1247))
    pr   = min(progress, 99)

    shadow_color = RED

    lines = [f'''
  <g opacity="{scale_op}" transform="translate({x},{y}) scale({scale_s}) translate({-w/2},{-total_h/2})">
    <!-- card bg -->
    <rect width="{w}" height="{total_h}" rx="18" fill="#0D1117" stroke="rgba(255,255,255,0.10)" stroke-width="1"/>

    <!-- window bar -->
    <rect width="{w}" height="{h_win}" rx="18" ry="18" fill="rgba(255,255,255,0.04)"/>
    <rect y="{h_win-1}" width="{w}" height="1" fill="rgba(255,255,255,0.08)"/>
    <circle cx="22" cy="{h_win/2}" r="6" fill="{RED}"/>
    <circle cx="42" cy="{h_win/2}" r="6" fill="#F59E0B"/>
    <circle cx="62" cy="{h_win/2}" r="6" fill="#10B981"/>
    {udyo_icon(89, h_win/2, 18)}
    <text x="106" y="{h_win/2}" dominant-baseline="central" font-size="12"
          font-family="monospace" fill="{GRAY}">udyo360 — scan in progress</text>

    <!-- URL bar -->
    <rect x="16" y="{h_win+10}" width="{w-32}" height="42" rx="10" fill="#1A2035"/>
    {udyo_icon(37, h_win+31, 16)}
    <text x="52" y="{h_win+31}" dominant-baseline="central" font-size="12"
          font-family="monospace" fill="{GRAY}">https://target-app.example.com</text>
    <circle cx="{w-56}" cy="{h_win+31}" r="4" fill="#10B981"/>
    <text x="{w-48}" y="{h_win+31}" dominant-baseline="central" font-size="10" font-weight="700"
          font-family="Inter,sans-serif" fill="#10B981">SCANNING</text>
    <rect y="{h_win+h_url-1}" width="{w}" height="1" fill="rgba(255,255,255,0.08)"/>

    <!-- progress -->
    <text x="16" y="{h_win+h_url+16}" font-size="12" font-family="Inter,sans-serif" fill="{GRAY}">Scan Progress</text>
    <text x="{w-16}" y="{h_win+h_url+16}" font-size="12" font-weight="800" font-family="Inter,sans-serif" fill="{WHITE}" text-anchor="end">{int(pr)}%</text>
    <rect x="16" y="{h_win+h_url+26}" width="{w-32}" height="8" rx="4" fill="rgba(255,255,255,0.08)"/>
    <rect x="16" y="{h_win+h_url+26}" width="{(w-32)*pr/100}" height="8" rx="4" fill="url(#prog_grad)"/>
    <text x="16" y="{h_win+h_url+48}" font-size="10" font-family="Inter,sans-serif" fill="{GRAYD}">Crawling pages...</text>
    <text x="{w-16}" y="{h_win+h_url+48}" font-size="10" font-family="Inter,sans-serif" fill="{GRAYD}" text-anchor="end">{reqs:,} requests sent</text>
    <rect y="{h_win+h_url+h_prog-1}" width="{w}" height="1" fill="rgba(255,255,255,0.08)"/>

    <!-- vuln counts -->
    <text x="16" y="{h_win+h_url+h_prog+16}" font-size="10" font-weight="700" letter-spacing="1.5"
          font-family="Inter,sans-serif" fill="{GRAYD}">VULNERABILITIES FOUND</text>''']

    # 4 severity boxes
    sevs = [('CRITICAL',3,'#F87171'),('HIGH',7,'#FB923C'),('MEDIUM',14,'#FBBF24'),('LOW',22,'#60A5FA')]
    box_w = (w-16*2-8*3) / 4
    bx_y  = h_win+h_url+h_prog+26
    for si,(lbl,cnt,col) in enumerate(sevs):
        bx = 16 + si*(box_w+8)
        lines.append(f'''
    <rect x="{bx}" y="{bx_y}" width="{box_w}" height="70" rx="10" fill="#1A2035"/>
    <text x="{bx+box_w/2}" y="{bx_y+30}" text-anchor="middle" dominant-baseline="central"
          font-size="26" font-weight="900" font-family="Inter,sans-serif" fill="{col}">{cnt}</text>
    <text x="{bx+box_w/2}" y="{bx_y+56}" text-anchor="middle" dominant-baseline="central"
          font-size="8" font-weight="700" letter-spacing="1" font-family="Inter,sans-serif" fill="{col}">{lbl}</text>''')

    log_y = h_win+h_url+h_prog+h_vuln
    lines.append(f'''
    <rect y="{log_y-1}" width="{w}" height="1" fill="rgba(255,255,255,0.08)"/>
    <text x="16" y="{log_y+16}" font-size="10" font-weight="700" letter-spacing="1.5"
          font-family="Inter,sans-serif" fill="{GRAYD}">LIVE LOG</text>''')

    for li,(tag,col,msg) in enumerate(log_items):
        ly = log_y+32+li*20
        blink = 0.6+0.4*math.sin(frame_local*0.15) if li==len(log_items)-1 else 1.0
        lines.append(f'''
    <text x="16" y="{ly}" font-size="11" font-weight="700" font-family="monospace" fill="{col}" opacity="{blink}">[{tag}]</text>
    <text x="{16+len(tag)*8+24}" y="{ly}" font-size="11" font-family="monospace" fill="#D1D5DB">{msg}</text>''')

    lines.append('</g>')
    return ''.join(lines)

PROG_DEFS = f'''
  <defs>
    <linearGradient id="prog_grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="{RED}"/>
      <stop offset="100%" stop-color="#FF6B6B"/>
    </linearGradient>
  </defs>'''

# ══════════════════════════════════════════════════════════════════════════
# SCENE RENDERERS  (each takes local_frame, returns SVG string body)
# ══════════════════════════════════════════════════════════════════════════

# ── Scene 1: Logo intro (0–90f) ──────────────────────────────────────────
def scene1(f, W, H):
    pulse = 1 + math.sin(f*0.08)*0.12
    op, ty = fade_y(f, 5, 22)
    glow_r = int(200*pulse)
    op2,ty2 = fade_y(f,20,22)
    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  <radialGradient id="s1glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="{RED}" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="{RED}" stop-opacity="0"/>
  </radialGradient>
  <ellipse cx="{W//2}" cy="{H//2}" rx="{glow_r}" ry="{glow_r}" fill="url(#s1glow)"/>
  {logo(W//2, H//2-14, 56, op, -ty)}
  <text x="{W//2}" y="{H//2+58}" text-anchor="middle" font-size="22" font-family="Inter,Segoe UI,sans-serif"
        fill="{GRAY}" letter-spacing="3" opacity="{op2}" transform="translate(0,{-ty2})">Web Security Scanner</text>'''

# ── Scene 2: Problem (0–270f) ─────────────────────────────────────────────
STATS = [(30000,'+','websites hacked per day',RED),(94,'%','breaches are preventable','#FB923C'),(5,' min','to find your first bug','#34D399')]

def scene2(f, W, H):
    op_h, ty_h = fade_y(f, 8, 22)
    op_l, ty_l = fade_y(f, 0, 22)
    card_w, card_h, gap = 280, 130, 40
    total_w = 3*card_w+2*gap
    cx = W/2 - total_w/2
    op_c, ty_c = fade_y(f, 25, 22)

    cards = []
    for i,(val,suf,lbl,col) in enumerate(STATS):
        v = counter(val,f,40,60)
        bx = cx + i*(card_w+gap)
        by = H/2+20
        cards.append(f'''
  <g opacity="{op_c}" transform="translate(0,{-ty_c})">
    <rect x="{bx}" y="{by}" width="{card_w}" height="{card_h}" rx="18"
          fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
    <text x="{bx+card_w/2}" y="{by+54}" text-anchor="middle" dominant-baseline="central"
          font-size="52" font-weight="900" font-family="Inter,Segoe UI,sans-serif" fill="{col}">{v:,}{suf}</text>
    <text x="{bx+card_w/2}" y="{by+94}" text-anchor="middle" font-size="14" font-weight="500"
          font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}">{lbl}</text>
  </g>''')

    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  <text x="{W//2}" y="{H//2-230}" text-anchor="middle" font-size="16" font-weight="800"
        letter-spacing="3" font-family="Inter,Segoe UI,sans-serif" fill="{RED}"
        opacity="{op_l}" transform="translate(0,{-ty_l})">THE REALITY</text>
  <text x="{W//2}" y="{H//2-150}" text-anchor="middle" font-size="66" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">Most hacks happen because</text>
  <text x="{W//2}" y="{H//2-68}" text-anchor="middle" font-size="66" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{RED}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">nobody checked.</text>
  {''.join(cards)}'''

# ── Scene 3: Scan demo (0–600f) ───────────────────────────────────────────
def scene3(f, W, H):
    op_p, ty_p = fade_y(f, 0, 22)
    op_h, ty_h = fade_y(f, 10, 22)
    op_t, ty_t = fade_y(f, 25, 22)
    op_c, ty_c = fade_y(f, 40, 22)

    progress = interp(f, 0, 500, 3, 91)
    vis_logs = min(6, max(0, int(f/70)))
    wid_sc   = interp(f, 0, 30, 0.7, 1.0)
    wid_op   = interp(f, 0, 30, 0, 1.0)
    widget = scan_widget(W*0.72, H*0.5, 680, progress, vis_logs, f, wid_op, wid_sc)

    chk = [(op_c, ty_c, 'No account required'), (op_c, ty_c, 'Results in under 60 seconds'), (op_c, ty_c, '200+ security checks')]

    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  {PROG_DEFS}
  {pill(120, H*0.28, 'Live Demo', RED, op_p, -ty_p)}
  <text x="120" y="{H*0.38}" font-size="58" font-weight="900" font-family="Inter,Segoe UI,sans-serif"
        fill="{WHITE}" opacity="{op_h}" transform="translate(0,{-ty_h})">Scan your site in</text>
  <text x="120" y="{H*0.46}" font-size="58" font-weight="900" font-family="Inter,Segoe UI,sans-serif"
        fill="{RED}" opacity="{op_h}" transform="translate(0,{-ty_h})">under 60 seconds.</text>
  <text x="120" y="{H*0.54}" font-size="20" font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}"
        opacity="{op_t}" transform="translate(0,{-ty_t})">Type a URL. Hit scan. Udyo360 crawls every</text>
  <text x="120" y="{H*0.585}" font-size="20" font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}"
        opacity="{op_t}" transform="translate(0,{-ty_t})">endpoint and tests 200+ checks automatically.</text>
  {check_item(120, H*0.66, 'No account required',    *fade_y(f,40,22))}
  {check_item(120, H*0.70, 'Results in under 60 sec',*fade_y(f,48,22))}
  {check_item(120, H*0.74, '200+ security checks',   *fade_y(f,56,22))}
  {widget}'''

# ── Scene 4: Results (0–550f) ─────────────────────────────────────────────
FINDINGS = [
    ('Critical','#F87171','rgba(248,113,113,0.08)','rgba(248,113,113,0.25)',
     'SQL Injection',
     'User-controlled input reaches SQL query without sanitisation.',
     'Use parameterised queries. Never concatenate user input.'),
    ('High','#FB923C','rgba(251,146,60,0.08)','rgba(251,146,60,0.25)',
     'Reflected XSS',
     'The /search endpoint reflects unsanitised params into HTML.',
     'Encode output. Add Content-Security-Policy header.'),
    ('Medium','#FBBF24','rgba(251,191,36,0.08)','rgba(251,191,36,0.25)',
     'Missing CSP Header',
     'No Content Security Policy — allows unsafe inline scripts.',
     "Add CSP: default-src 'self'; script-src 'self' on all responses."),
]

def scene4(f, W, H):
    ring_sc = interp(f, 0, 25, 0.6, 1.0)
    ring_op = interp(f, 0, 25, 0, 1.0)
    op_p, ty_p = fade_y(f, 5, 20)
    op_h, ty_h = fade_y(f, 8, 20)

    bars = [
        ('Critical',3,'#F87171','15%'),
        ('High',7,'#FB923C','35%'),
        ('Medium',14,'#FBBF24','60%'),
        ('Low',22,'#60A5FA','90%'),
    ]
    bar_svgs = []
    cx_ring  = 310
    bar_x    = 140
    bar_y0   = H*0.58
    for i,(lbl,cnt,col,wpct) in enumerate(bars):
        by = bar_y0 + i*38
        bar_w = interp(f, 20, 65, 0, float(wpct[:-1])/100*(W*0.32))
        bar_svgs.append(f'''
  <g opacity="{ring_op}">
    <text x="{bar_x}" y="{by}" font-size="12" font-weight="600" font-family="Inter,sans-serif" fill="{col}">{lbl}</text>
    <text x="{bar_x+260}" y="{by}" font-size="12" font-family="Inter,sans-serif" fill="{GRAY}" text-anchor="end">{cnt}</text>
    <rect x="{bar_x}" y="{by+8}" width="{W*0.32}" height="6" rx="3" fill="rgba(255,255,255,0.08)"/>
    <rect x="{bar_x}" y="{by+8}" width="{bar_w}" height="6" rx="3" fill="{col}"/>
  </g>''')

    fx_svgs = []
    fx_x = W*0.43
    fx_card_w = W*0.53
    for i,(sev,col,bg,bord,title,desc,fix) in enumerate(FINDINGS):
        del_f = 20+i*20
        op_f  = interp(f, del_f, del_f+20, 0, 1.0)
        tx_f  = interp(f, del_f, del_f+20, 40, 0, True)
        fy    = H*0.28 + i*180
        fx_svgs.append(f'''
  <g opacity="{op_f}" transform="translate({tx_f},0)">
    <rect x="{fx_x}" y="{fy}" width="{fx_card_w}" height="165" rx="14"
          fill="{bg}" stroke="{bord}" stroke-width="1"/>
    <rect x="{fx_x+14}" y="{fy+14}" width="{len(sev)*8+20}" height="22" rx="11"
          fill="{col}" fill-opacity="0.2"/>
    <text x="{fx_x+24}" y="{fy+26}" dominant-baseline="central" font-size="10" font-weight="800"
          font-family="Inter,sans-serif" fill="{col}" letter-spacing="1">{sev.upper()}</text>
    <text x="{fx_x+14+len(sev)*8+26}" y="{fy+25}" dominant-baseline="central" font-size="15"
          font-weight="700" font-family="Inter,sans-serif" fill="{WHITE}">{title}</text>
    <text x="{fx_x+14}" y="{fy+54}" font-size="12" font-family="Inter,sans-serif" fill="{GRAY}">{desc}</text>
    <rect x="{fx_x+14}" y="{fy+76}" width="{fx_card_w-28}" height="42" rx="8"
          fill="rgba(16,185,129,0.06)" stroke="rgba(16,185,129,0.2)" stroke-width="1"/>
    <text x="{fx_x+24}" y="{fy+93}" dominant-baseline="central" font-size="10" font-weight="700"
          font-family="monospace" fill="#34D399">FIX: <tspan fill="{GRAY}" font-family="Inter,sans-serif">{fix[:72]}</tspan></text>
    <text x="{fx_x+24}" y="{fy+111}" font-size="10" font-family="Inter,sans-serif" fill="{GRAY}">{fix[72:]}</text>
  </g>''')

    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  <!-- grade ring -->
  <g opacity="{ring_op}" transform="scale({ring_sc}) translate({cx_ring*(1-1/ring_sc) if ring_sc!=1 else 0},{H*0.35*(1-1/ring_sc) if ring_sc!=1 else 0})">
    <circle cx="{cx_ring}" cy="{H*0.35}" r="90" fill="rgba(251,146,60,0.06)" stroke="rgba(251,146,60,0.35)" stroke-width="6"/>
    <text x="{cx_ring}" y="{H*0.35-12}" text-anchor="middle" dominant-baseline="central"
          font-size="90" font-weight="900" font-family="Inter,Segoe UI,sans-serif" fill="#FB923C">C</text>
    <text x="{cx_ring}" y="{H*0.35+60}" text-anchor="middle" font-size="15" font-family="Inter,sans-serif" fill="{GRAYD}">48 / 100</text>
  </g>
  {''.join(bar_svgs)}
  {pill(fx_x, H*0.21, 'Instant Findings', '#FB923C', op_p, -ty_p)}
  <text x="{fx_x}" y="{H*0.265}" font-size="44" font-weight="900" font-family="Inter,Segoe UI,sans-serif"
        fill="{WHITE}" opacity="{op_h}" transform="translate(0,{-ty_h})">Every bug explained. <tspan fill="#34D399">Every fix included.</tspan></text>
  {''.join(fx_svgs)}'''

# ── Scene 5: Features (0–360f) ────────────────────────────────────────────
FEATURES = [
    ('📊','Security Dashboard','Track score trends, risk history, and asset health.'),
    ('🕐','Scheduled Scans','Set it once. Get alerted the moment something breaks.'),
    ('🛠','Remediation Tasks','Assign, track, and close every vulnerability.'),
    ('🔌','API Security','Test REST APIs, GraphQL and auth flows.'),
    ('💻','Agent Scanner','Scan internal servers offline. Ports, OS, web config.'),
    ('🎯','OWASP Top 10 2024','Full coverage of the latest OWASP standard.'),
]

def scene5(f, W, H):
    op_p, ty_p = fade_y(f, 0, 22)
    op_h, ty_h = fade_y(f, 10, 22)
    op_s, ty_s = fade_y(f, 20, 22)

    cols,rows = 3,2
    pad       = 80
    gap       = 24
    cw        = (W - pad*2 - gap*(cols-1)) / cols
    ch        = 140
    top_y     = H*0.55

    cards_svg = []
    for i,(icon,title,desc) in enumerate(FEATURES):
        col_i, row_i = i%cols, i//cols
        del_f = 25 + i*8
        op_c  = interp(f, del_f, del_f+20, 0, 1.0)
        ty_c  = interp(f, del_f, del_f+20, 20, 0, True)
        cx_c  = pad + col_i*(cw+gap)
        cy_c  = top_y + row_i*(ch+gap)
        cards_svg.append(f'''
  <g opacity="{op_c}" transform="translate(0,{ty_c})">
    <rect x="{cx_c}" y="{cy_c}" width="{cw}" height="{ch}" rx="16"
          fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>
    <text x="{cx_c+20}" y="{cy_c+38}" font-size="28">{icon}</text>
    <text x="{cx_c+20}" y="{cy_c+68}" font-size="16" font-weight="700"
          font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}">{title}</text>
    <text x="{cx_c+20}" y="{cy_c+90}" font-size="12" font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}">{desc[:52]}</text>
    <text x="{cx_c+20}" y="{cy_c+108}" font-size="12" font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}">{desc[52:]}</text>
  </g>''')

    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  {pill(W//2, H*0.12, 'Full Platform', '#818CF8', op_p, -ty_p)}
  <text x="{W//2}" y="{H*0.24}" text-anchor="middle" font-size="58" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">Everything you need to stay secure.</text>
  <text x="{W//2}" y="{H*0.33}" text-anchor="middle" font-size="20"
        font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}"
        opacity="{op_s}" transform="translate(0,{-ty_s})">One platform: scan, monitor, remediate, track.</text>
  {''.join(cards_svg)}'''

# ── Scene 6: CTA (0–390f) ────────────────────────────────────────────────
def scene6(f, W, H):
    pulse = 1 + math.sin(f*0.06)*0.08
    op_l, ty_l = fade_y(f, 0, 22)
    op_h, ty_h = fade_y(f, 12, 22)
    op_s, ty_s = fade_y(f, 22, 22)
    btn_op = interp(f, 30, 52, 0, 1.0)
    btn_sc = interp(f, 30, 52, 0.8, 1.0, True)
    op_st, ty_st = fade_y(f, 45, 22)
    glow_r = int(320*pulse)

    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  <radialGradient id="s6glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="{RED}" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="{RED}" stop-opacity="0"/>
  </radialGradient>
  <ellipse cx="{W//2}" cy="{H//2-60}" rx="{glow_r}" ry="{glow_r}" fill="url(#s6glow)"/>
  {logo(W//2, H*0.22, 58, op_l, -ty_l)}
  <text x="{W//2}" y="{H*0.44}" text-anchor="middle" font-size="80" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">Start finding bugs</text>
  <text x="{W//2}" y="{H*0.545}" text-anchor="middle" font-size="80" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{RED}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">in the next 5 minutes.</text>
  <text x="{W//2}" y="{H*0.63}" text-anchor="middle" font-size="22"
        font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}"
        opacity="{op_s}" transform="translate(0,{-ty_s})">Free scan · No credit card · No account required</text>
  <!-- CTA button -->
  <g opacity="{btn_op}" transform="translate({W//2},{H*0.725}) scale({btn_sc})">
    <rect x="-160" y="-36" width="320" height="72" rx="14"
          fill="url(#logo_grad)" filter="url(#cta_glow)"/>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
          font-size="26" font-weight="900" font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}">udyo360.com →</text>
  </g>
  <defs>
    <filter id="cta_glow" x="-20%" y="-40%" width="140%" height="180%">
      <feGaussianBlur stdDeviation="12" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <!-- stats -->
  <g opacity="{op_st}" transform="translate(0,{-ty_st})">
    {"".join(f'<text x="{W//2 + (i-1)*240}" y="{H*0.84}" text-anchor="middle" font-size="36" font-weight="900" font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}">{v}</text><text x="{W//2 + (i-1)*240}" y="{H*0.895}" text-anchor="middle" font-size="15" font-family="Inter,Segoe UI,sans-serif" fill="{GRAYD}">{l}</text>' for i,(v,l) in enumerate([('50K+','Scans Run'),('2.4M+','Bugs Found'),('99.7%','Accuracy')]))}
  </g>'''

# ══════════════════════════════════════════════════════════════════════════
# FRAME DISPATCH
# ══════════════════════════════════════════════════════════════════════════

# YouTube 1920×1080 scene timeline (frames)
SCENES_LND = [
    (0,   95,  scene1),
    (85,  365, scene2),
    (355, 965, scene3),
    (955, 1505,scene4),
    (1495,1865,scene5),
    (1855,2250,scene6),
]

def render_frame_landscape(abs_f, W=1920, H=1080):
    body = ''
    for start, end, fn in SCENES_LND:
        if start <= abs_f < end:
            body = fn(abs_f - start, W, H)
            break
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>'
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=W, output_height=H)
    return np.array(Image.open(BytesIO(png)).convert('RGB'))

# ── Short reel (1080×1920) scenes ──────────────────────────────────────────
def scene_reel_a(f, W, H):
    pulse = 1 + math.sin(f*0.1)*0.1
    op_l, ty_l = fade_y(f, 5, 22)
    op_h, ty_h = fade_y(f, 15, 22)
    op_s, ty_s = fade_y(f, 30, 22)
    glow_r = int(260*pulse)
    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  <radialGradient id="raglow" cx="50%" cy="35%" r="40%">
    <stop offset="0%" stop-color="{RED}" stop-opacity="0.22"/>
    <stop offset="100%" stop-color="{RED}" stop-opacity="0"/>
  </radialGradient>
  <ellipse cx="{W//2}" cy="{H*0.32}" rx="{glow_r}" ry="{glow_r}" fill="url(#raglow)"/>
  {logo(W//2, H*0.18, 62, op_l, -ty_l)}
  <text x="{W//2}" y="{H*0.33}" text-anchor="middle" font-size="72" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">Is your website</text>
  <text x="{W//2}" y="{H*0.41}" text-anchor="middle" font-size="72" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{RED}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">being hacked</text>
  <text x="{W//2}" y="{H*0.49}" text-anchor="middle" font-size="72" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">right now?</text>
  <text x="{W//2}" y="{H*0.58}" text-anchor="middle" font-size="28"
        font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}"
        opacity="{op_s}" transform="translate(0,{-ty_s})">30,000+ sites breached daily.</text>
  <text x="{W//2}" y="{H*0.625}" text-anchor="middle" font-size="28"
        font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}"
        opacity="{op_s}" transform="translate(0,{-ty_s})">Yours could be next.</text>'''

def scene_reel_b(f, W, H):
    progress = interp(f, 0, 360, 0, 87)
    vis_logs = min(4, max(0, int(f/70)))
    op_h, ty_h = fade_y(f, 10, 22)
    op_p, ty_p = fade_y(f, 0, 22)
    widget = scan_widget(W/2, H*0.62, W-80, progress, vis_logs, f, 1.0, 1.0)
    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  {PROG_DEFS}
  <text x="{W//2}" y="{H*0.12}" text-anchor="middle" font-size="24" font-weight="800"
        letter-spacing="3" font-family="Inter,Segoe UI,sans-serif" fill="{RED}"
        opacity="{op_p}" transform="translate(0,{-ty_p})">SCAN IN PROGRESS</text>
  <text x="{W//2}" y="{H*0.195}" text-anchor="middle" font-size="60" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">Finding bugs</text>
  <text x="{W//2}" y="{H*0.26}" text-anchor="middle" font-size="60" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="#10B981"
        opacity="{op_h}" transform="translate(0,{-ty_h})">in real time.</text>
  {widget}'''

def scene_reel_c(f, W, H):
    pulse = 1 + math.sin(f*0.07)*0.08
    op_l, ty_l = fade_y(f, 0, 22)
    op_h, ty_h = fade_y(f, 10, 22)
    op_s, ty_s = fade_y(f, 20, 22)
    btn_op = interp(f, 30, 52, 0, 1.0)
    btn_sc = interp(f, 30, 52, 0.8, 1.0, True)*pulse
    op_st, ty_st = fade_y(f, 45, 22)
    return f'''
  {grid_bg()}
  {LOGO_DEFS}
  <defs>
    <filter id="cta_g2" x="-30%" y="-50%" width="160%" height="200%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="s6rg" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="{RED}" stop-opacity="0.24"/>
      <stop offset="100%" stop-color="{RED}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="{W//2}" cy="{H*0.42}" rx="320" ry="320" fill="url(#s6rg)"/>
  {logo(W//2, H*0.15, 60, op_l, -ty_l)}
  <text x="{W//2}" y="{H*0.32}" text-anchor="middle" font-size="74" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">Find your</text>
  <text x="{W//2}" y="{H*0.40}" text-anchor="middle" font-size="74" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">first bug in</text>
  <text x="{W//2}" y="{H*0.48}" text-anchor="middle" font-size="74" font-weight="900"
        font-family="Inter,Segoe UI,sans-serif" fill="{RED}"
        opacity="{op_h}" transform="translate(0,{-ty_h})">5 minutes.</text>
  <text x="{W//2}" y="{H*0.565}" text-anchor="middle" font-size="26"
        font-family="Inter,Segoe UI,sans-serif" fill="{GRAY}"
        opacity="{op_s}" transform="translate(0,{-ty_s})">Free · No account · No credit card</text>
  <g opacity="{btn_op}" transform="translate({W//2},{H*0.66}) scale({btn_sc})">
    <rect x="-170" y="-38" width="340" height="76" rx="16"
          fill="url(#logo_grad)" filter="url(#cta_g2)"/>
    <text x="0" y="0" text-anchor="middle" dominant-baseline="central"
          font-size="30" font-weight="900" font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}">udyo360.com</text>
  </g>
  <g opacity="{op_st}" transform="translate(0,{-ty_st})">
    {"".join(f'<text x="{W//2+(i-1)*300}" y="{H*0.78}" text-anchor="middle" font-size="38" font-weight="900" font-family="Inter,Segoe UI,sans-serif" fill="{WHITE}">{v}</text><text x="{W//2+(i-1)*300}" y="{H*0.835}" text-anchor="middle" font-size="16" font-family="Inter,Segoe UI,sans-serif" fill="{GRAYD}">{l}</text>' for i,(v,l) in enumerate([('50K+','Scans'),('2.4M+','Bugs'),('99.7%','Accuracy')]))}
  </g>'''

SCENES_REEL = [
    (0,   155, scene_reel_a),
    (145, 555, scene_reel_b),
    (545, 900, scene_reel_c),
]

def render_frame_reel(abs_f, W=1080, H=1920):
    body = ''
    for start, end, fn in SCENES_REEL:
        if start <= abs_f < end:
            body = fn(abs_f - start, W, H)
            break
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">{body}</svg>'
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=W, output_height=H)
    return np.array(Image.open(BytesIO(png)).convert('RGB'))

# ══════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════

def render_video(total_frames, render_fn, out_path, fps=FPS, W=1920, H=1080):
    import imageio.v2 as iio
    # use bundled ffmpeg
    ffmpeg_path = None
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        pass

    writer = iio.get_writer(
        out_path, fps=fps, codec='libx264',
        ffmpeg_log_level='warning',
        output_params=['-crf','18','-preset','fast','-pix_fmt','yuv420p'],
    )
    for i in range(total_frames):
        if i % 30 == 0:
            pct = i/total_frames*100
            print(f'  frame {i}/{total_frames}  ({pct:.0f}%)', flush=True)
        frame = render_fn(i, W, H)
        writer.append_data(frame)
    writer.close()
    size = os.path.getsize(out_path) / 1e6
    print(f'  ✓ {out_path}  ({size:.1f} MB)')

if __name__ == '__main__':
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    if mode in ('promo', 'all'):
        print('Rendering YouTube promo (1920×1080, 75 s)…')
        render_video(2250, render_frame_landscape, '/tmp/udyo360-promo.mp4', W=1920, H=1080)

    if mode in ('short', 'all'):
        print('Rendering Instagram/Facebook Reel (1080×1920, 30 s)…')
        render_video(900, render_frame_reel, '/tmp/udyo360-short.mp4', W=1080, H=1920)

    print('Done!')
