const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    let msg = `HTTP ${res.status}`
    try {
      const body = await res.json()
      msg = body.message || body.error || body.title || msg
    } catch {}
    throw new Error(msg)
  }
  return res.json()
}

export const startScan = (url) =>
  request('/api/scan', { method: 'POST', body: JSON.stringify({ url }) })

export const getScan = (id) => request(`/api/scan/${id}`)

export const getScans = () => request('/api/scans')
