const BASE = import.meta.env.VITE_API_URL || ''

function authHeaders() {
  const token = localStorage.getItem('ws_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
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

async function blobRequest(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
}

// Scan
export const startScan = (url) =>
  request('/api/scan/headers', { method: 'POST', body: JSON.stringify({ url }) })

export const getRiskHeatmap = (url) =>
  request('/api/scan/risk-heatmap', { method: 'POST', body: JSON.stringify({ url }) })

export const getRemediation = (checkName) =>
  request(`/api/scan/remediation?checkName=${encodeURIComponent(checkName)}`)

export const fleetScan = (urls) =>
  request('/api/scan/fleet-scan', { method: 'POST', body: JSON.stringify({ urls }) })

// History & stats
export const getScans = () => request('/api/scan/history')
export const getTotalScans = () => request('/api/scan/stats/total-scans')
export const getLatestScans = () => request('/api/scan/stats/latest')

// Assets
export const getAssets = () => request('/api/scan/assets')
export const getAllAssets = () => request('/api/asset')
export const createAsset = (asset) =>
  request('/api/asset', { method: 'POST', body: JSON.stringify(asset) })

// Reports
export const downloadReportPdf = (payload) =>
  blobRequest('/api/report/generate', { method: 'POST', body: JSON.stringify(payload) })

export const emailReport = (payload) =>
  request('/api/report/email', { method: 'POST', body: JSON.stringify(payload) })

// Schedules
export const getSchedules = () => request('/api/schedule')
export const createSchedule = (data) =>
  request('/api/schedule', { method: 'POST', body: JSON.stringify(data) })
export const deleteSchedule = (id) =>
  request(`/api/schedule/${id}`, { method: 'DELETE' })
export const toggleSchedule = (id) =>
  request(`/api/schedule/toggle/${id}`, { method: 'PATCH' })
