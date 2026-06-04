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
export const updateAsset = (id, asset) =>
  request(`/api/asset/${id}`, { method: 'PUT', body: JSON.stringify(asset) })
export const deleteAsset = (id) =>
  request(`/api/asset/${id}`, { method: 'DELETE' })
export const scanAsset = (id) =>
  request(`/api/asset/${id}/scan`, { method: 'POST' })
export const getAssetHistory = (id) =>
  request(`/api/asset/${id}/history`)
export const scanAllAssets = () =>
  request('/api/asset/scan-all', { method: 'POST' })

// Risk
export const getRiskScore = (assetId) => request(`/api/risk/score/${assetId}`)
export const getRiskScores = () => request('/api/risk/scores')
export const getRiskSla = () => request('/api/risk/sla')
export const getAttackPath = (assetId) => request(`/api/risk/attack-path/${assetId}`)

// Remediation playbooks
export const getRemediations = () => request('/api/remediation')
export const getRemediationPlaybook = (checkName) =>
  request(`/api/remediation/${encodeURIComponent(checkName)}`)
export const getRemediationDetail = (id) =>
  request(`/api/remediation/${encodeURIComponent(id)}`)
export const getRemediationSummary = () => request('/api/remediation/summary')
export const searchRemediations = (q) =>
  request(`/api/remediation/search?q=${encodeURIComponent(q)}`)
export const getRemediationsBySeverity = (sev) =>
  request(`/api/remediation/severity/${encodeURIComponent(sev)}`)
export const getRemediationsByCategory = (cat) =>
  request(`/api/remediation/category/${encodeURIComponent(cat)}`)

// Dashboard
export const getDashboard = () => request('/api/dashboard')
export const getDashboardStats = () => request('/api/dashboard/stats')

// CVE
export const searchCVE = ({ q = '', severity = '' } = {}) => {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (severity) params.set('severity', severity)
  return request(`/api/cve/search?${params}`)
}
export const getCVE = (id) => request(`/api/cve/${encodeURIComponent(id)}`)
export const getCVECategories = () => request('/api/cve/categories')

// Solutions
export const getSolutions = () => request('/api/solutions')
export const getSolution = (type) => request(`/api/solutions/${type}`)

// Pricing
export const getPricing = () => request('/api/pricing')

// Billing
export const getSubscription    = () => request('/api/billing/subscription')
export const getBillingPortalUrl = () => request('/api/billing/portal', { method: 'POST', body: JSON.stringify({}) })
export const getInvoices        = () => request('/api/billing/invoices')

// Company
export const getCompany = () => request('/api/company')
export const getFaq = () => request('/api/company/faq')
export const submitContact = (data) =>
  request('/api/company/contact', { method: 'POST', body: JSON.stringify(data) })

// Reports
export const downloadReportPdf = (payload) =>
  blobRequest('/api/report/generate', { method: 'POST', body: JSON.stringify(payload) })

export const emailReport = (payload) =>
  request('/api/report/email', { method: 'POST', body: JSON.stringify(payload) })

// Network / port scan
export const startNetworkScan = (payload) =>
  request('/api/networkscan', { method: 'POST', body: JSON.stringify(payload) })

// Host scan
export const startHostScan = (payload) =>
  request('/api/hostscan', { method: 'POST', body: JSON.stringify(payload) })
export const getHostChecks = () => request('/api/hostscan/checks')

// Cloud scan
export const startCloudScanAws = (payload) =>
  request('/api/cloudscan/aws', { method: 'POST', body: JSON.stringify(payload) })
export const getCloudChecksAws = () => request('/api/cloudscan/checks/aws')

// Code scan
export const scanCodeFiles = (formData) => {
  const token = localStorage.getItem('ws_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return fetch(`${BASE}/api/codescan`, { method: 'POST', headers, body: formData })
    .then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const b = await res.json(); msg = b.error || b.message || msg } catch {}
        throw new Error(msg)
      }
      return res.json()
    })
}
export const scanCodeText = (payload) =>
  request('/api/codescan', { method: 'POST', body: JSON.stringify(payload) })

// CI/CD
export const testCicdGate = (payload) =>
  request('/api/cicd/gate', { method: 'POST', body: JSON.stringify(payload) })

// Schedules
export const getSchedules = () => request('/api/schedule')
export const createSchedule = (data) =>
  request('/api/schedule', { method: 'POST', body: JSON.stringify(data) })
export const deleteSchedule = (id) =>
  request(`/api/schedule/${id}`, { method: 'DELETE' })
export const toggleSchedule = (id) =>
  request(`/api/schedule/toggle/${id}`, { method: 'PATCH' })

// AI Insight
export const getAiTriage = () => request('/api/aiinsight/triage')
export const generateAiReport = (scanId) =>
  request('/api/aiinsight/report', { method: 'POST', body: JSON.stringify({ scanId }) })
export const acknowledgeAlert = (id) =>
  request(`/api/aiinsight/triage/${id}/acknowledge`, { method: 'POST' })
export const resolveAlert = (id) =>
  request(`/api/aiinsight/triage/${id}/resolve`, { method: 'POST' })
export const dismissAlert = (id) =>
  request(`/api/aiinsight/triage/${id}/dismiss`, { method: 'POST' })

// Shareable scan links
export const createShareLink = (scanId) =>
  request(`/api/share/scan/${scanId}`, { method: 'POST' })
export const getSharedScan = (token) => request(`/api/share/${token}`)

// Shadow AI Governance
export const scanShadowAi = (url) =>
  request('/api/shadowai/scan', { method: 'POST', body: JSON.stringify({ url }) })
export const getShadowAiTools = () => request('/api/shadowai/tools')
