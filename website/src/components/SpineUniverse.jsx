import React, { useEffect, useRef } from 'react'

/* ─────────────────────────────────────────────
   SpineUniverse
   Fixed canvas behind the landing page.
   Draws: deep-space starfield + coloured nebula
   blobs + a glowing crimson vertebral spine with
   anatomical ribs. Scroll-parallax "camera pan"
   travels down the spine as the user scrolls.
───────────────────────────────────────────── */

const CRIMSON   = [227, 24,  55 ]
const CYAN      = [0,   210, 255]
const MAGENTA   = [255, 30,  180]
const PURPLE    = [130, 0,   255]
const ICE_BLUE  = [80,  160, 255]

const rgba = ([r,g,b], a) => `rgba(${r},${g},${b},${a})`

export default function SpineUniverse() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    let W = 0, H = 0, animId
    let scrollY = 0
    let t = 0

    const resize = () => {
      W = canvas.width  = window.innerWidth
      H = canvas.height = window.innerHeight
    }

    /* ── Starfield ── */
    const mkStar = (near) => ({
      x:       Math.random(),
      yBase:   Math.random(),
      r:       near ? Math.random() * 1.3 + 0.4 : Math.random() * 0.7 + 0.1,
      a:       near ? Math.random() * 0.6 + 0.25 : Math.random() * 0.35 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
      plx:     near ? 0.16 : 0.05,
    })
    const stars = [
      ...Array.from({ length: 240 }, () => mkStar(false)),
      ...Array.from({ length: 80  }, () => mkStar(true)),
    ]

    /* ── Floating colour particles (around spine) ── */
    const mkParticle = () => {
      const palettes = [CYAN, MAGENTA, PURPLE, ICE_BLUE, CRIMSON]
      const col = palettes[Math.floor(Math.random() * palettes.length)]
      return {
        // position relative to spine centre (xOff) and page height fraction (yFrac)
        xOff:    (Math.random() - 0.5) * 320,
        yFrac:   Math.random(),
        vx:      (Math.random() - 0.5) * 0.3,
        vy:      (Math.random() - 0.5) * 0.3,
        r:       Math.random() * 2.5 + 0.8,
        a:       Math.random() * 0.7 + 0.3,
        col,
        phase:   Math.random() * Math.PI * 2,
        orbitR:  20 + Math.random() * 80,
        orbitSpd:(Math.random() - 0.5) * 0.008,
      }
    }
    const particles = Array.from({ length: 280 }, mkParticle)

    /* ── Nebula blobs ── */
    const blobs = [
      { xf: 0.28, yf: 0.18, rf: 0.38, col: ICE_BLUE,  a: 0.08 },
      { xf: 0.72, yf: 0.55, rf: 0.32, col: MAGENTA,   a: 0.07 },
      { xf: 0.50, yf: 0.78, rf: 0.44, col: PURPLE,    a: 0.06 },
      { xf: 0.20, yf: 0.65, rf: 0.28, col: CYAN,      a: 0.05 },
      { xf: 0.80, yf: 0.30, rf: 0.30, col: CRIMSON,   a: 0.05 },
    ]

    /* ── Vertebrae ── */
    const NUM_VERTS = 12
    const verts = Array.from({ length: NUM_VERTS }, (_, i) => ({
      frac:      i / (NUM_VERTS - 1),
      bodyW:     22 + Math.random() * 10,
      bodyH:     10 + Math.random() * 5,
      armLen:    45 + Math.random() * 40,
      spikeH:    14 + Math.random() * 12,
      phase:     Math.random() * Math.PI * 2,
    }))

    const onScroll = () => { scrollY = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    resize()
    window.addEventListener('resize', resize)

    /* ── Draw one vertebra ── */
    function drawVert(cx, cy, v, intensity, pulse) {
      const alpha = intensity * pulse
      if (alpha < 0.02) return

      const bW = v.bodyW * pulse
      const bH = v.bodyH * pulse

      /* Vertebral body (central oval) */
      const bodyGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, bW)
      bodyGrad.addColorStop(0,   rgba(CRIMSON, 0.95 * alpha))
      bodyGrad.addColorStop(0.6, rgba(CRIMSON, 0.55 * alpha))
      bodyGrad.addColorStop(1,   rgba(CRIMSON, 0))
      ctx.beginPath()
      ctx.ellipse(cx, cy, bW, bH, 0, 0, Math.PI * 2)
      ctx.fillStyle = bodyGrad
      ctx.fill()

      /* Glow halo */
      const haloR = 55 * pulse
      const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, haloR)
      halo.addColorStop(0, rgba(CRIMSON, 0.3 * intensity))
      halo.addColorStop(1, rgba(CRIMSON, 0))
      ctx.beginPath()
      ctx.arc(cx, cy, haloR, 0, Math.PI * 2)
      ctx.fillStyle = halo
      ctx.fill()

      /* Spinous process (spike upward) */
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(cx - 4 * pulse, cy - v.spikeH * pulse)
      ctx.lineTo(cx + 4 * pulse, cy - v.spikeH * pulse)
      ctx.closePath()
      ctx.fillStyle = rgba(CRIMSON, 0.7 * alpha)
      ctx.fill()

      /* Transverse processes (arms) — 2 pairs */
      ;[-1, 1].forEach(dir => {
        for (let pair = 0; pair < 2; pair++) {
          const yOff = (pair - 0.5) * bH * 1.4
          const len  = v.armLen * pulse * (pair === 0 ? 1 : 0.65)
          const angleY = yOff * 0.4

          // Main arm
          ctx.beginPath()
          ctx.moveTo(cx, cy + yOff)
          ctx.lineTo(cx + dir * len, cy + yOff + angleY)
          ctx.strokeStyle = rgba(CRIMSON, (0.55 - pair * 0.15) * alpha)
          ctx.lineWidth = 1.5 - pair * 0.4
          ctx.stroke()

          // Tip dot
          ctx.beginPath()
          ctx.arc(cx + dir * len, cy + yOff + angleY, 2 * pulse, 0, Math.PI * 2)
          ctx.fillStyle = rgba(ICE_BLUE, 0.7 * alpha)
          ctx.fill()
        }
      })

      /* Intervertebral disc highlight (thin bright line at top/bottom of body) */
      ;[-1, 1].forEach(dir => {
        ctx.beginPath()
        ctx.ellipse(cx, cy + dir * bH * 0.8, bW * 0.7, 2 * pulse, 0, 0, Math.PI)
        ctx.strokeStyle = rgba(ICE_BLUE, 0.4 * alpha)
        ctx.lineWidth = 1
        ctx.stroke()
      })
    }

    /* ── Main draw loop ── */
    const draw = () => {
      animId = requestAnimationFrame(draw)
      t += 0.011

      const pageH     = document.documentElement.scrollHeight
      const maxScroll = Math.max(pageH - H, 1)
      const sf        = scrollY / maxScroll   // 0→1

      ctx.clearRect(0, 0, W, H)

      /* Background */
      ctx.fillStyle = '#010812'
      ctx.fillRect(0, 0, W, H)

      /* Nebula blobs */
      blobs.forEach(({ xf, yf, rf, col, a }) => {
        const cx = xf * W
        const cy = ((yf - sf * 0.22 + 1) % 1) * H
        const r  = rf * Math.min(W, H)
        const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, rgba(col, a))
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      })

      /* Stars */
      stars.forEach(s => {
        const sx = s.x * W
        const sy = ((s.yBase - sf * s.plx + 1) % 1) * H
        const tw = Math.sin(s.twinkle + t * 1.6) * 0.25 + 0.75
        ctx.beginPath()
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,220,255,${s.a * tw})`
        ctx.fill()
      })

      /* ── SPINE ── */
      const spineX = W * 0.5
      const spineTopY = -scrollY * 0.55
      const spineH    = pageH * 0.68

      /* Outer ambient column glow */
      const colGlow = ctx.createLinearGradient(0, 0, 0, H)
      colGlow.addColorStop(0,   rgba(CRIMSON, 0))
      colGlow.addColorStop(0.18,rgba(CRIMSON, 0.11))
      colGlow.addColorStop(0.5, rgba(CRIMSON, 0.18))
      colGlow.addColorStop(0.82,rgba(CRIMSON, 0.11))
      colGlow.addColorStop(1,   rgba(CRIMSON, 0))
      ctx.strokeStyle = colGlow
      ctx.lineWidth = 50
      ctx.lineCap = 'butt'
      ctx.beginPath()
      ctx.moveTo(spineX, 0)
      ctx.lineTo(spineX, H)
      ctx.stroke()

      /* Core spine beam */
      const beam = ctx.createLinearGradient(0, 0, 0, H)
      beam.addColorStop(0,    rgba(CRIMSON, 0))
      beam.addColorStop(0.12, rgba(CRIMSON, 0.7))
      beam.addColorStop(0.5,  rgba(CRIMSON, 1))
      beam.addColorStop(0.88, rgba(CRIMSON, 0.7))
      beam.addColorStop(1,    rgba(CRIMSON, 0))
      ctx.strokeStyle = beam
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(spineX, 0)
      ctx.lineTo(spineX, H)
      ctx.stroke()

      /* Vertebrae */
      verts.forEach(v => {
        const vy = spineTopY + v.frac * spineH
        if (vy < -140 || vy > H + 140) return
        const dist      = Math.abs(vy - H * 0.5) / (H * 0.62)
        const intensity = Math.max(0, 1 - dist)
        const pulse     = (Math.sin(v.phase + t * 1.3) * 0.25 + 0.75)
        drawVert(spineX, vy, v, intensity, pulse)
      })

      /* Floating colour particles */
      particles.forEach(p => {
        // Drift
        p.xOff += p.vx + Math.sin(p.phase + t * 0.4) * 0.4
        p.yFrac += p.vy * 0.0002
        p.yFrac = ((p.yFrac % 1) + 1) % 1
        // Orbit around spine
        const orbitX = Math.sin(p.phase + t * p.orbitSpd * 60) * p.orbitR
        const sx = spineX + orbitX + p.xOff * 0.3
        const sy = ((p.yFrac - sf * 0.08 + 1) % 1) * H
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.r * 4)
        glow.addColorStop(0, rgba(p.col, p.a))
        glow.addColorStop(1, rgba(p.col, 0))
        ctx.beginPath()
        ctx.arc(sx, sy, p.r * 4, 0, Math.PI * 2)
        ctx.fillStyle = glow
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx, sy, p.r, 0, Math.PI * 2)
        ctx.fillStyle = rgba(p.col, 1)
        ctx.fill()
      })

      /* Traveling energy orb */
      const orbFrac = (t * 0.16) % 1
      const orbY    = spineTopY + orbFrac * spineH
      if (orbY > -50 && orbY < H + 50) {
        const trailTop = Math.max(orbY - 90, spineTopY)
        const trail    = ctx.createLinearGradient(0, trailTop, 0, orbY)
        trail.addColorStop(0, rgba(CRIMSON, 0))
        trail.addColorStop(1, rgba(CRIMSON, 0.6))
        ctx.strokeStyle = trail
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(spineX, trailTop)
        ctx.lineTo(spineX, orbY)
        ctx.stroke()

        const og = ctx.createRadialGradient(spineX, orbY, 0, spineX, orbY, 24)
        og.addColorStop(0,    'rgba(255,210,220,1)')
        og.addColorStop(0.35, rgba(CRIMSON, 0.8))
        og.addColorStop(1,    rgba(CRIMSON, 0))
        ctx.beginPath()
        ctx.arc(spineX, orbY, 24, 0, Math.PI * 2)
        ctx.fillStyle = og
        ctx.fill()

        /* Spark burst at orb */
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2 + t * 2
          const d   = 28 + Math.sin(t * 5 + i) * 6
          ctx.beginPath()
          ctx.moveTo(spineX, orbY)
          ctx.lineTo(spineX + Math.cos(ang) * d, orbY + Math.sin(ang) * d)
          const sparkCol = [CYAN, MAGENTA, ICE_BLUE][i % 3]
          ctx.strokeStyle = rgba(sparkCol, 0.5)
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
