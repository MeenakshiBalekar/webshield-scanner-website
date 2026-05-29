import React, { useEffect, useRef } from 'react'
import { Shield, ArrowRight, Play, CheckCircle, Zap } from 'lucide-react'

const badges = ['SOC 2 Certified', 'OWASP Aligned', 'GDPR Ready', 'CVE Coverage']

const scanResults = [
  { severity: 'CRITICAL', count: 3, color: 'bg-red-500' },
  { severity: 'HIGH', count: 7, color: 'bg-orange-500' },
  { severity: 'MEDIUM', count: 14, color: 'bg-yellow-500' },
  { severity: 'LOW', count: 22, color: 'bg-blue-400' },
]

export default function Hero({ onWatchDemo, onStartFreeScan }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    let animId
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(163, 190, 230, ${p.opacity})`
        ctx.fill()
      })
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(163, 190, 230, ${0.08 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <section className="relative min-h-screen bg-navy-900 overflow-hidden flex items-center">
      {/* Animated particle network background */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 opacity-80" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent" />

      {/* Red accent glow */}
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-crimson-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2/3 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-crimson-500/10 border border-crimson-500/30 text-crimson-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Zap className="w-3.5 h-3.5" />
              NEW — OWASP Top 10 2024 Coverage
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
              Find & Fix{' '}
              <span className="text-crimson-500">Web Vulnerabilities</span>{' '}
              Before Attackers Do
            </h1>

            <p className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl">
              WebShield's intelligent scanner detects SQL injection, XSS, OWASP Top 10, and API security flaws in minutes — giving your team actionable insights to secure your web applications at scale.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mb-10">
              {onStartFreeScan ? (
                <button
                  onClick={onStartFreeScan}
                  className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-crimson-500/30 hover:shadow-xl text-base"
                >
                  Start Free Scan
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <a
                  href="/products/web"
                  className="inline-flex items-center gap-2 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 shadow-lg hover:shadow-crimson-500/30 hover:shadow-xl text-base"
                >
                  Start Free Scan
                  <ArrowRight className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onWatchDemo}
                className="inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/10 font-semibold px-7 py-3.5 rounded-lg transition-all duration-200 text-base"
              >
                <Play className="w-4 h-4 fill-white" />
                Watch Demo
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {badges.map((b) => (
                <span
                  key={b}
                  className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Animated Scan Widget */}
          <div className="hidden lg:block">
            <div className="relative">
              {/* Outer glow */}
              <div className="absolute -inset-4 bg-crimson-500/5 rounded-3xl blur-xl" />

              <div className="relative bg-navy-950/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
                {/* Window bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border-b border-white/10">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-3 text-xs text-gray-400 font-mono">webshield — scan in progress</span>
                </div>

                {/* URL Bar */}
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2 bg-navy-900 rounded-lg px-3 py-2">
                    <Shield className="w-4 h-4 text-crimson-500" />
                    <span className="text-xs text-gray-300 font-mono">https://target-app.example.com</span>
                    <span className="ml-auto text-xs text-green-400 font-semibold animate-pulse">● SCANNING</span>
                  </div>
                </div>

                {/* Scan Progress */}
                <div className="px-4 py-3 border-b border-white/10">
                  <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                    <span>Scan Progress</span>
                    <span className="text-white font-semibold">73%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-[73%] bg-gradient-to-r from-crimson-500 to-crimson-400 rounded-full" style={{animation: 'none'}} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                    <span>Crawling pages...</span>
                    <span>847 requests sent</span>
                  </div>
                </div>

                {/* Results */}
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Vulnerabilities Found</p>
                  <div className="grid grid-cols-4 gap-2">
                    {scanResults.map((r) => (
                      <div key={r.severity} className="bg-navy-900/80 rounded-lg p-2 text-center">
                        <div className={`text-lg font-bold text-white`}>{r.count}</div>
                        <div className={`text-[9px] font-bold ${
                          r.severity === 'CRITICAL' ? 'text-red-400' :
                          r.severity === 'HIGH' ? 'text-orange-400' :
                          r.severity === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>{r.severity}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Log */}
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">Live Log</p>
                  <div className="space-y-1.5 font-mono text-[10px]">
                    <div className="flex gap-2">
                      <span className="text-red-400 shrink-0">[CRITICAL]</span>
                      <span className="text-gray-300">SQL Injection found at /api/users?id=</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-orange-400 shrink-0">[HIGH]</span>
                      <span className="text-gray-300">Reflected XSS detected at /search</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-yellow-400 shrink-0">[MEDIUM]</span>
                      <span className="text-gray-300">Missing CSP header on 12 pages</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-blue-400 shrink-0">[INFO]</span>
                      <span className="text-gray-400 animate-pulse">Scanning /api/v2/products...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-16 pt-10 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '50,000+', label: 'Scans Completed' },
            { value: '2.4M+', label: 'Vulnerabilities Found' },
            { value: '99.7%', label: 'Detection Accuracy' },
            { value: '<5 min', label: 'Avg. Scan Time' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-sm text-gray-400 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
