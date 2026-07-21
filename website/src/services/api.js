import { BACKEND as BASE } from '../utils/backend.js'

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
    let howToFix = null, azureErrorCode = null, details = null
    try {
      const body = await res.json()
      msg = body.error || body.message || body.title || msg
      howToFix      = body.howToFix      ?? body.HowToFix      ?? null
      azureErrorCode = body.azureErrorCode ?? body.AzureErrorCode ?? null
      details        = body.details        ?? body.Details        ?? null
    } catch {}
    const err = new Error(msg)
    if (howToFix)       err.howToFix       = howToFix
    if (azureErrorCode) err.azureErrorCode  = azureErrorCode
    if (details && details !== msg) err.details = details
    throw err
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
export const getExecutiveDashboard = () => request('/api/reports/executive-summary')
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
export const startCrawlScan = (payload) => request('/api/scan/crawl', { method: 'POST', body: JSON.stringify(payload) })

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
export const getSchedules = () => request('/api/schedules')
export const createSchedule = (data) =>
  request('/api/schedules', { method: 'POST', body: JSON.stringify(data) })
export const deleteSchedule = (id) =>
  request(`/api/schedules/${id}`, { method: 'DELETE' })
export const toggleSchedule = (id) =>
  request(`/api/schedules/${id}/toggle`, { method: 'PATCH' })

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
  request('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) })

export const exportUserData = () => blobRequest('/api/user/export')
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

// Agent install token (24-hour, embeds in download URL)
export const createAgentToken = () =>
  request('/api/agent/token', { method: 'POST', body: JSON.stringify({}) })

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

// Threat Intelligence
export const mapAttackTechniques = (payload)    => request('/api/threat/attack/map', { method: 'POST', body: JSON.stringify(payload) })
export const checkIocs           = (indicators) => request('/api/threat/ioc/check',  { method: 'POST', body: JSON.stringify({ indicators }) })
export const getShodanHost       = (ip)         => request(`/api/threat/shodan/${ip}`)

// EDR
export const getEdrAlerts  = (params = {}) => { const q = new URLSearchParams(); Object.entries(params).forEach(([k,v]) => v && q.set(k,v)); return request(`/api/edr/alerts?${q}`) }
export const updateEdrAlert = (id, data)  => request(`/api/edr/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const getEdrRules    = ()          => request('/api/edr/rules')
export const createEdrRule  = (data)      => request('/api/edr/rules', { method: 'POST', body: JSON.stringify(data) })
export const toggleEdrRule  = (id)        => request(`/api/edr/rules/${id}/toggle`, { method: 'PATCH' })
export const deleteEdrRule  = (id)        => request(`/api/edr/rules/${id}`, { method: 'DELETE' })
export const analyzeAgent   = (agentId)   => request(`/api/edr/analyze/${agentId}`, { method: 'POST' })
export const getEdrSummary  = ()          => request('/api/edr/summary')

// Agent Management
export const getAgents            = ()         => request('/api/agent')
export const getAgentDetail       = (id)       => request(`/api/agent/${id}`)
export const decommissionAgent    = (id)       => request(`/api/agent/${id}`, { method: 'DELETE' })
export const generateAgentToken   = ()         => request('/api/agent/token', { method: 'POST' })
export const getAgentInstallScript = (platform) => request(`/api/agent/install/${platform}`)

// EASM (External Attack Surface Management)
export const scanEasm          = (domain) => request('/api/easm/scan', { method: 'POST', body: JSON.stringify({ domain }) })
export const addEasmMonitor    = (domain) => request('/api/easm/monitor', { method: 'POST', body: JSON.stringify({ domain }) })
export const getEasmMonitors   = ()       => request('/api/easm/monitors')
export const removeEasmMonitor = (id)     => request(`/api/easm/monitors/${id}`, { method: 'DELETE' })

// Container image scan
export const scanContainerImage  = (image) => request('/api/container/image-scan', { method: 'POST', body: JSON.stringify({ image }) })
export const getImageScanHistory = ()      => request('/api/container/image-scans')

// VMDR
export const scanVmdr            = (agentId)         => request(`/api/vmdr/scan/${agentId}`, { method: 'POST' })
export const getVmdrFindings     = (agentId)         => request(`/api/vmdr/findings?agentId=${agentId}`)
export const getVmdrSummary      = ()                => request('/api/vmdr/summary')
export const updateFindingStatus = (id, status)      => request(`/api/vmdr/findings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })

// Patch Deployments
export const deployPatch         = (data) => request('/api/patch/deploy', { method: 'POST', body: JSON.stringify(data) })
export const getPatchDeployments = ()     => request('/api/patch/deployments')
export const getPatchDeployment  = (id)   => request(`/api/patch/deployments/${id}`)

// EDR Behavioral Analysis
export const runBehavioralAnalysis = (agentId) => request(`/api/edr/behavioral/${agentId}`, { method: 'POST' })
export const getBehavioralSummary  = ()        => request('/api/edr/behavioral/summary')

// Policy Management
export const getPolicies      = ()         => request('/api/policies')
export const createPolicy     = (data)     => request('/api/policies', { method: 'POST', body: JSON.stringify(data) })
export const updatePolicy     = (id, data) => request(`/api/policies/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const patchPolicy      = (id, data) => request(`/api/policies/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deletePolicy     = (id)       => request(`/api/policies/${id}`, { method: 'DELETE' })

// Exception Requests
export const getExceptions    = ()     => request('/api/exceptions')
export const createException  = (data) => request('/api/exceptions', { method: 'POST', body: JSON.stringify(data) })
export const approveException = (id)   => request(`/api/exceptions/${id}/approve`, { method: 'PATCH' })
export const rejectException  = (id)   => request(`/api/exceptions/${id}/reject`, { method: 'PATCH' })

// Org plan & limits
export const getOrgPlan = (orgId) => request(`/api/org/${orgId}/plan`)

// MSSP Portal
export const getMsspDashboard        = ()         => request('/api/mssp/dashboard')
export const getMsspTenants          = ()         => request('/api/mssp/tenants')
export const getMsspTenant           = (id)       => request(`/api/mssp/tenants/${id}`)
export const getMsspWhiteLabel       = ()         => request('/api/mssp/white-label')
export const updateMsspWhiteLabel    = (data)     => request('/api/mssp/white-label', { method: 'PUT', body: JSON.stringify(data) })
export const updateTenantWhiteLabel  = (id, data) => request(`/api/mssp/tenants/${id}/config`, { method: 'PUT', body: JSON.stringify(data) })
export const createMsspTenant        = (data)     => request('/api/mssp/tenants', { method: 'POST', body: JSON.stringify(data) })

// Asset bulk operations
export const bulkTagAssets = (data) => request('/api/assets/bulk-tag', { method: 'PATCH', body: JSON.stringify(data) })

// AI Narrative Engine
export const generateAiNarrative = (scanId, url) =>
  request(`/api/ai-narrative/generate/${encodeURIComponent(scanId)}`, { method: 'POST', body: JSON.stringify({ url }) })
export const getAiNarrative = (scanId) =>
  request(`/api/ai-narrative/${encodeURIComponent(scanId)}`)

// Notification preferences
export const getNotificationPrefs   = ()     => request('/api/user/notification-preferences')
export const updateNotificationPrefs = (data) =>
  request('/api/user/notification-preferences', { method: 'PATCH', body: JSON.stringify(data) })

// Business Logic Testing
export const runBizLogicScan = (data) =>
  request('/api/bizlogic/scan', { method: 'POST', body: JSON.stringify(data) })

// Adaptive Fuzzer
export const runFuzzScan = (data) =>
  request('/api/fuzz/scan', { method: 'POST', body: JSON.stringify(data) })

// Attack Chains
export const getAttackChains = () => request('/api/attack-chains')

// Exploit Forecast
export const getExploitForecast = () => request('/api/exploit-forecast')

// Pentest Report
export const downloadPentestReport = (payload) =>
  blobRequest('/api/reports/pentest', { method: 'POST', body: JSON.stringify(payload) })

// Compliance Deep Scan
export const deepScanCompliance = (frameworkId, agentId) =>
  request(`/api/compliance/deep-scan/${frameworkId}?agentId=${agentId}`, { method: 'POST' })

// API Security Scanner
export const runApiSecurityScan = (data) =>
  request('/api/scanner/api-security', { method: 'POST', body: JSON.stringify(data) })

// Secrets Detection
export const runSecretsScan = (data) =>
  request('/api/scanner/secrets', { method: 'POST', body: JSON.stringify(data) })

export const getRemediationCode = (checkName) =>
  request(`/api/remediation/code/${encodeURIComponent(checkName)}`)

// IaC Security Scanner
export const runIacScan = (data) =>
  request('/api/scanner/iac', { method: 'POST', body: JSON.stringify(data) })

// Compliance evidence — returns JSON artifacts per control
export const fetchComplianceEvidence = (assessmentId) =>
  request(`/api/compliance/assess/${assessmentId}/evidence`, { method: 'POST' })

// Kubernetes audit scan
export const scanKubernetes = (payload) => request('/api/kubernetes/audit', { method: 'POST', body: JSON.stringify(payload) })

// Package CVE Scanner (agent-based)
export const scanAgentPackages  = (agentId) => request(`/api/agent/${agentId}/packages/scan`, { method: 'POST' })
export const getAgentPackageCves = (agentId) => request(`/api/agent/${agentId}/package-cves`)

// VMDR host vulnerabilities
export const getAgentVulnerabilities = (agentId) => request(`/api/agent/scans/${agentId}/vulnerabilities`)

// EASM history + diff
export const getEasmHistory = (domain) => request(`/api/easm/history/${encodeURIComponent(domain)}`)
export const getEasmDiff    = (domain, fromScanId) => request(`/api/easm/diff/${encodeURIComponent(domain)}?from=${fromScanId}`)

// Compliance
export const getComplianceFrameworks = ()    => request('/api/compliance/frameworks')
export const getFrameworkControls    = (id)  => request(`/api/compliance/frameworks/${id}`)
export const assessCompliance        = (id, targetUrl) =>
  request(`/api/compliance/assess/${id}`, { method: 'POST', body: JSON.stringify({ targetUrl, profile: id }) })
export const exportComplianceReport  = (id)  => blobRequest(`/api/compliance/report/${id}?format=csv`)
export const getComplianceSummary    = ()    => request('/api/compliance/summary')

// Billing plans & checkout
export const getBillingPlans        = ()     => request('/api/billing/plans')
export const createBillingCheckout  = (data) => request('/api/billing/checkout', { method: 'POST', body: JSON.stringify(data) })

// Security score trend
export const getTrend           = (url) => request(`/api/trend?url=${encodeURIComponent(url)}`)
export const getPortfolioTrend  = ()    => request('/api/trend/portfolio')

// Vendor Risk Management
export const assessVendorRisk = (data) => request('/api/vendor-risk/assess', { method: 'POST', body: JSON.stringify(data) })

// Industry benchmark analysis
export const analyzeBenchmark = (data) =>
  request('/api/benchmark/analyze', { method: 'POST', body: JSON.stringify(data) })

// Compliance report from scan findings (returns blob — PDF/document)
export const generateComplianceReport = (data) =>
  blobRequest('/api/compliance/report', { method: 'POST', body: JSON.stringify(data) })

// SSO
export const getSsoProviders = () => request('/api/sso/providers')
export const ssoCallback     = (data) => request('/api/sso/callback', { method: 'POST', body: JSON.stringify(data) })

// White-label (non-MSSP; org-level)
export const getWhiteLabel  = ()     => request('/api/whitelabel')
export const saveWhiteLabel = (data) => request('/api/whitelabel', { method: 'POST', body: JSON.stringify(data) })

// Scan import (multipart — Nessus / Burp / ZAP)
export const importScan = (format, formData) => {
  const token   = localStorage.getItem('ws_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return fetch(`${BASE}/api/import/${encodeURIComponent(format)}`, { method: 'POST', headers, body: formData })
    .then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const b = await res.json(); msg = b.error || b.message || msg } catch {}
        throw new Error(msg)
      }
      return res.json()
    })
}

// Alert config (Slack / Teams webhooks)
export const getAlertConfig   = ()     => request('/api/alerts/config')
export const configSlackAlert = (data) => request('/api/alerts/config/slack', { method: 'POST', body: JSON.stringify(data) })
export const configTeamsAlert = (data) => request('/api/alerts/config/teams', { method: 'POST', body: JSON.stringify(data) })

// SIEM
export const getSiemPlatforms = () => fetch(`${BASE}/api/siem/platforms`).then(r => r.json()).catch(() => null)
export const getSiemConfigs   = ()     => request('/api/siem/configs')
export const createSiemConfig = (data) => request('/api/siem/configs',         { method: 'POST', body: JSON.stringify(data) })
export const updateSiemConfig = (id, data) => request(`/api/siem/configs/${encodeURIComponent(id)}`, { method: 'PUT',  body: JSON.stringify(data) })
export const deleteSiemConfig = (id)   => request(`/api/siem/configs/${encodeURIComponent(id)}`, { method: 'DELETE' })
export const testSiemConfig   = (id)   => request(`/api/siem/configs/${encodeURIComponent(id)}/test`, { method: 'POST' })
export const pushToSiem       = (data) => request('/api/siem/push', { method: 'POST', body: JSON.stringify(data) })

// Container & IaC scan (multipart)
export const scanIacFile = (formData) => {
  const token = localStorage.getItem('ws_token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  return fetch(`${BASE}/api/iac/scan`, { method: 'POST', headers, body: formData })
    .then(async (res) => {
      if (!res.ok) {
        let msg = `HTTP ${res.status}`
        try { const b = await res.json(); msg = b.error || b.message || msg } catch {}
        throw new Error(msg)
      }
      return res.json()
    })
}

// Email security
export const checkEmailSecurity = (domain) => request(`/api/email-security?domain=${encodeURIComponent(domain)}`)

// Dark web breach intelligence
export const checkDarkWeb    = (domain) => request(`/api/dark-web/scan?domain=${encodeURIComponent(domain)}`)
export const getDarkWebStats = ()       => request('/api/dark-web/stats')

// Cloud Marketplace
export const getMarketplaceStatus    = ()     => request('/api/billing/marketplace')
export const connectAwsMarketplace   = (data) => request('/api/billing/marketplace/aws',   { method: 'POST', body: JSON.stringify(data ?? {}) })
export const connectAzureMarketplace = (data) => request('/api/billing/marketplace/azure', { method: 'POST', body: JSON.stringify(data ?? {}) })

// Monitoring — per-domain alert config
export const getDomainAlertConfig  = (domain) => request(`/api/alerts/config?domain=${encodeURIComponent(domain)}`)
export const saveDomainAlertConfig = (domain, data) => request(`/api/alerts/config/${encodeURIComponent(domain)}`, { method: 'POST', body: JSON.stringify(data) })

// Phishing simulation
export const getPhishingCampaigns   = ()     => request('/api/phishing/campaigns')
export const createPhishingCampaign = (data) => request('/api/phishing/campaign', { method: 'POST', body: JSON.stringify(data) })
export const getPhishingResults     = (id)   => request(`/api/phishing/campaigns/${encodeURIComponent(id)}/results`)

// Clean Images — hardened container image catalog (public, no auth)
export const getImageStats      = ()     => request('/api/images/stats')
export const getImageCategories = ()     => request('/api/images/categories')
export const getImages = ({ search = '', category = '', sort = '', page = 1, pageSize } = {}) => {
  const q = new URLSearchParams()
  if (search)   q.set('search', search)
  if (category) q.set('category', category)
  if (sort)     q.set('sort', sort)
  if (page)     q.set('page', page)
  if (pageSize) q.set('pageSize', pageSize)
  const qs = q.toString()
  return request(`/api/images${qs ? `?${qs}` : ''}`)
}
export const getImageDetail = (slug) => request(`/api/images/${encodeURIComponent(slug)}/details`)
export const getImageTags   = (slug) => request(`/api/images/${encodeURIComponent(slug)}/tags`)
export const getImageSbom   = (slug) => request(`/api/images/${encodeURIComponent(slug)}/sbom`)

// Clean Images — custom image builder & requests
export const getBuilderOptions   = ()     => request('/api/images/builder/options')
export const generateDockerfile  = (data) => request('/api/images/builder/generate', { method: 'POST', body: JSON.stringify(data) })
export const downloadDockerfile  = (data) => blobRequest('/api/images/builder/generate?download=true', { method: 'POST', body: JSON.stringify(data) })
export const submitImageRequest  = (data) => request('/api/images/requests', { method: 'POST', body: JSON.stringify(data) })
export const getImageRequests    = ()     => request('/api/images/requests')
export const updateImageRequest  = (id, data) => request(`/api/images/requests/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data) })
