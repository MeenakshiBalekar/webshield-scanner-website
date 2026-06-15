const BASE = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

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
export const startScan = (url, opts = {}) =>
  request('/api/scan/headers', { method: 'POST', body: JSON.stringify({ url, ...opts }) })

export const getRiskHeatmap = (url) =>
  request('/api/scan/risk-heatmap', { method: 'POST', body: JSON.stringify({ url }) })

export const getRemediation = (checkName) =>
  request(`/api/scan/remediation?checkName=${encodeURIComponent(checkName)}`)

export const fleetScan = (urls) =>
  request('/api/scan/fleet-scan', { method: 'POST', body: JSON.stringify({ urls }) })

// History & stats
export const getScans = () => request('/api/scan/history')
export const getScanDetail = (id) => request(`/api/scan/history/${encodeURIComponent(id)}`)
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
export const getExecutiveDashboard = () => request('/api/dashboard/executive')
export const getDashboardTrends = () => request('/api/dashboard/trends')

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
  blobRequest('/api/report/generate-slim', { method: 'POST', body: JSON.stringify(payload) })

export const emailReport = (payload) =>
  request('/api/report/email-slim', { method: 'POST', body: JSON.stringify(payload) })

// Authenticated scan
export const startAuthenticatedScan = (payload) =>
  request('/api/scan/authenticated', { method: 'POST', body: JSON.stringify(payload) })

// DNS scan
export const startDnsScan = (domain) =>
  request('/api/dnsscan', { method: 'POST', body: JSON.stringify({ domain }) })

// Network / port scan
export const startNetworkScan = (payload) =>
  request('/api/networkscan', { method: 'POST', body: JSON.stringify(payload) })

// Host scan
export const startHostScan = (payload) =>
  request('/api/hostscan', { method: 'POST', body: JSON.stringify(payload) })
export const getHostChecks = () => request('/api/hostscan/checks')

// Cloud scan
export const startCloudScanAws   = (payload) => request('/api/cloudscan/aws',   { method: 'POST', body: JSON.stringify(payload) })
export const getCloudChecksAws   = ()         => request('/api/cloudscan/checks/aws')
export const startCloudScanAzure = (payload) => request('/api/cloudscan/azure', { method: 'POST', body: JSON.stringify(payload) })
export const startCloudScanGcp   = (payload) => request('/api/cloudscan/gcp',   { method: 'POST', body: JSON.stringify(payload) })
export const startCloudScanOci   = (payload) => request('/api/cloudscan/oci',   { method: 'POST', body: JSON.stringify(payload) })

// Container / Dockerfile scan
export const startContainerScan = (payload) => request('/api/containerscan', { method: 'POST', body: JSON.stringify(payload) })

// Web crawler scan
export const startCrawlScan = (payload) => request('/api/crawlscan', { method: 'POST', body: JSON.stringify(payload) })

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

// Integrations
export const getIntegrations = () => request('/api/integrations')
export const createIntegration = (data) =>
  request('/api/integrations', { method: 'POST', body: JSON.stringify(data) })
export const deleteIntegration = (id) =>
  request(`/api/integrations/${id}`, { method: 'DELETE' })
export const testIntegration = (id) =>
  request(`/api/integrations/${id}/test`, { method: 'POST' })
export const getIntegrationEvents = () => request('/api/integrations/events')

// Trust
export const getTrustData = (domain) => request(`/api/trust/${encodeURIComponent(domain)}`)

// Threat intel
export const getThreatFeed = () => request('/api/threatintel/feed')
export const getThreatCve = (cveId) => request(`/api/threatintel/cve/${encodeURIComponent(cveId)}`)
export const enrichThreat = (checkName) =>
  request(`/api/threatintel/enrich?checkName=${encodeURIComponent(checkName)}`)

// Scheduled reports
export const getScheduledReports = () => request('/api/scheduledreports')
export const createScheduledReport = (data) =>
  request('/api/scheduledreports', { method: 'POST', body: JSON.stringify(data) })
export const updateScheduledReport = (id, data) =>
  request(`/api/scheduledreports/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteScheduledReport = (id) =>
  request(`/api/scheduledreports/${id}`, { method: 'DELETE' })
export const sendReportNow = (id) =>
  request(`/api/scheduledreports/${id}/send-now`, { method: 'POST' })

// Compliance
export const getCompliance         = ()           => request('/api/compliance/posture')
export const getComplianceControls = (framework)  => request(`/api/compliance/controls/${framework}`)

// Monitoring
export const getMonitoringTimeline = (url) =>
  request(`/api/monitoring/timeline?url=${encodeURIComponent(url)}`)
export const getMonitoringRegressions = () => request('/api/monitoring/regressions')

// API scanner
export const startApiScan = (url) =>
  request('/api/scan/api', { method: 'POST', body: JSON.stringify({ url }) })
export const startApiSpecScan = (payload) =>
  request('/api/apiscan/spec', { method: 'POST', body: JSON.stringify(payload) })

// Jira issue creation from remediation task
export const createJiraIssue = (taskId) =>
  request(`/api/remediationtasks/${encodeURIComponent(taskId)}/jira`, { method: 'POST' })

// ServiceNow ticket creation from remediation task
export const createServiceNowTicket = (taskId) =>
  request(`/api/remediationtasks/${encodeURIComponent(taskId)}/servicenow`, { method: 'POST' })

// PagerDuty alert from remediation task
export const alertPagerDuty = (taskId) =>
  request(`/api/remediationtasks/${encodeURIComponent(taskId)}/pagerduty`, { method: 'POST' })

// Azure DevOps work item from remediation task
export const createAdoWorkItem = (taskId) =>
  request(`/api/remediationtasks/${encodeURIComponent(taskId)}/azure-devops`, { method: 'POST' })

// Server monitor
export const getServerMonitors = () => request('/api/servermonitor')
export const registerServer = (data) =>
  request('/api/servermonitor', { method: 'POST', body: JSON.stringify(data) })
export const getServerMetrics = (id, hours = 24) =>
  request(`/api/servermonitor/${id}/metrics?hours=${hours}`)
export const updateServerThresholds = (id, data) =>
  request(`/api/servermonitor/${id}/thresholds`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteServer = (id) =>
  request(`/api/servermonitor/${id}`, { method: 'DELETE' })

// Agent scan reports
export const getAgentScans = () => request('/api/agentscan')
export const getAgentScan = (id) => request(`/api/agentscan/${id}`)
export const uploadAgentScan = (data) =>
  request('/api/agentscan/upload', { method: 'POST', body: JSON.stringify(data) })
export const deleteAgentScan = (id) =>
  request(`/api/agentscan/${id}`, { method: 'DELETE' })

// Attack surface discovery
export const discoverSubdomains = (domain) =>
  request(`/api/discover?domain=${encodeURIComponent(domain)}`)
export const saveDiscoveredAssets = (data) =>
  request('/api/discover/save-assets', { method: 'POST', body: JSON.stringify(data) })

// User profile
export const getMe = () => request('/api/auth/me')
export const updateProfile = (data) =>
  request('/api/user/profile', { method: 'PUT', body: JSON.stringify(data) })
export const changePassword = (data) =>
  request('/api/user/password', { method: 'PUT', body: JSON.stringify(data) })
export const deleteAccount = () =>
  request('/api/user/account', { method: 'DELETE' })
// Remediation task actions
export const markFalsePositive = (id) =>
  request(`/api/remediationtasks/${encodeURIComponent(id)}/false-positive`, { method: 'PATCH' })
export const reopenTask = (id) =>
  request(`/api/remediationtasks/${encodeURIComponent(id)}/reopen`, { method: 'PATCH' })

// Asset exposure
export const getAssetExposure = (id) => request(`/api/asset/${id}/exposure`)

export const uploadProfilePicture = (formData) => {
  const token = localStorage.getItem('ws_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return fetch(`${BASE}/api/user/profile/picture`, { method: 'POST', headers, body: formData })
    .then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const b = await res.json(); msg = b.error || b.message || msg } catch {}
        throw new Error(msg)
      }
      return res.json()
    })
}

// Organizations
export const getOrgs                = ()              => request('/api/org')
export const createOrg              = (data)          => request('/api/org', { method: 'POST', body: JSON.stringify(data) })
export const getOrg                 = (id)            => request(`/api/org/${id}`)
export const updateOrg              = (id, data)      => request(`/api/org/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteOrg              = (id)            => request(`/api/org/${id}`, { method: 'DELETE' })
export const getOrgMembers          = (id)            => request(`/api/org/${id}/members`)
export const inviteOrgMember        = (id, data)      => request(`/api/org/${id}/members`, { method: 'POST', body: JSON.stringify(data) })
export const removeOrgMember        = (id, userId)    => request(`/api/org/${id}/members/${userId}`, { method: 'DELETE' })
export const updateMemberRole       = (id, userId, r) => request(`/api/org/${id}/members/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role: r }) })

// API Keys
export const getApiKeys    = (orgId)        => request(`/api/org/${orgId}/apikeys`)
export const createApiKey  = (orgId, data)  => request(`/api/org/${orgId}/apikeys`, { method: 'POST', body: JSON.stringify(data) })
export const revokeApiKey  = (orgId, keyId) => request(`/api/org/${orgId}/apikeys/${keyId}`, { method: 'DELETE' })
export const rotateApiKey  = (orgId, keyId) => request(`/api/org/${orgId}/apikeys/${keyId}/rotate`, { method: 'PATCH' })

// Audit Log
export const getAuditLog = (params = {}) => {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v && q.set(k, v))
  return request(`/api/audit?${q}`)
}
export const getAuditSummary = () => request('/api/audit/summary')
export const exportAuditCsv  = () => blobRequest('/api/audit/export?format=csv')

// SSPM
export const startSspmScan = (data) => request('/api/sspmscan', { method: 'POST', body: JSON.stringify(data) })

// Patch Management
export const lookupCves        = (cveIds)   => request('/api/patch/cve-lookup', { method: 'POST', body: JSON.stringify({ cveIds }) })
export const auditSoftware     = (payload)  => request('/api/patch/software-audit', { method: 'POST', body: JSON.stringify(payload) })
export const getPatchBulletins = (days = 7) => request(`/api/patch/bulletins?days=${days}`)
