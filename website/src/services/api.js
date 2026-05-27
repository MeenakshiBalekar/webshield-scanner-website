const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json()
      msg = body.error || body.details || body.message || body.title || msg
    } catch {}
    throw new Error(msg)
  }
  return res.json()
}

// POST /api/scan/headers → returns full ScanSummary synchronously
export const startScan = (url) =>
  request('/api/scan/headers', { method: 'POST', body: JSON.stringify({ url }) })

// GET /api/scan/history → returns ScanHistory[]
export const getScans = () => request('/api/scan/history')
