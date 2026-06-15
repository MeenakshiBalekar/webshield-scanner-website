import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import ProductPage from './pages/ProductPage'
import HistoryPage from './pages/HistoryPage'
import SchedulePage from './pages/SchedulePage'
import DashboardPage from './pages/DashboardPage'
import CveDatabasePage from './pages/CveDatabasePage'
import CompanyPage from './pages/CompanyPage'
import ContactPage from './pages/ContactPage'
import SolutionsPage from './pages/SolutionsPage'
import SolutionDetailPage from './pages/SolutionDetailPage'
import PricingPage from './pages/PricingPage'
import BlogPage from './pages/BlogPage'
import BlogPostPage from './pages/BlogPostPage'
import AssetsPage from './pages/AssetsPage'
import RemediationPage from './pages/RemediationPage'
import BillingPage from './pages/BillingPage'
import CheckoutSuccessPage from './pages/CheckoutSuccessPage'
import ScannerHubPage from './pages/ScannerHubPage'
import NetworkScanPage from './pages/NetworkScanPage'
import HostScanPage from './pages/HostScanPage'
import CloudScanPage from './pages/CloudScanPage'
import CodeScanPage from './pages/CodeScanPage'
import CiCdPage from './pages/CiCdPage'
import AgentPage from './pages/AgentPage'
import AutoScanPage from './pages/AutoScanPage'
import RemediationTasksPage from './pages/RemediationTasksPage'
import ServerMonitorPage from './pages/ServerMonitorPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import CookiePolicyPage from './pages/CookiePolicyPage'
import ResponsibleDisclosurePage from './pages/ResponsibleDisclosurePage'
import HelpPage from './pages/HelpPage'
import AiReportPage from './pages/AiReportPage'
import AlertTriagePage from './pages/AlertTriagePage'
import SharedScanPage from './pages/SharedScanPage'
import ShadowAiPage from './pages/ShadowAiPage'
import IntegrationsPage from './pages/IntegrationsPage'
import TrustPage from './pages/TrustPage'
import ThreatFeedPage from './pages/ThreatFeedPage'
import ScheduledReportsPage from './pages/ScheduledReportsPage'
import CompliancePage from './pages/CompliancePage'
import PortfolioPage from './pages/PortfolioPage'
import MonitoringPage from './pages/MonitoringPage'
import ApiScanPage from './pages/ApiScanPage'
import DiscoverPage from './pages/DiscoverPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import SettingsProfilePage from './pages/SettingsProfilePage'
import ContainerScanPage from './pages/ContainerScanPage'
import CrawlScanPage from './pages/CrawlScanPage'
import DnsScanPage from './pages/DnsScanPage'
import SubdomainScanPage from './pages/SubdomainScanPage'
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage'
import TrendsPage from './pages/TrendsPage'
import OrganizationPage from './pages/OrganizationPage'
import ApiKeysPage from './pages/ApiKeysPage'
import AuditLogPage from './pages/AuditLogPage'
import SspmPage from './pages/SspmPage'
import PatchManagementPage from './pages/PatchManagementPage'
import AgentManagementPage from './pages/AgentManagementPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Marketing */}
          <Route path="/"          element={<LandingPage />} />
          <Route path="/solutions"         element={<SolutionsPage />} />
          <Route path="/solutions/:type"   element={<SolutionDetailPage />} />
          <Route path="/pricing"           element={<PricingPage />} />
          <Route path="/company"           element={<CompanyPage />} />
          <Route path="/contact"           element={<ContactPage />} />
          <Route path="/blog"              element={<BlogPage />} />
          <Route path="/blog/:slug"        element={<BlogPostPage />} />
          <Route path="/cve"                            element={<Navigate to="/cve-database" replace />} />
          <Route path="/cve-database"                   element={<CveDatabasePage />} />
          <Route path="/cve-database/:checkId"          element={<CveDatabasePage />} />
          <Route path="/agent"             element={<AgentPage />} />
          <Route path="/privacy-policy"         element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service"       element={<TermsOfServicePage />} />
          <Route path="/cookie-policy"          element={<CookiePolicyPage />} />
          <Route path="/responsible-disclosure" element={<ResponsibleDisclosurePage />} />
          <Route path="/help"                   element={<HelpPage />} />
          <Route path="/autoscan"            element={<AutoScanPage />} />
          <Route path="/remediation-tasks"  element={<RemediationTasksPage />} />
          <Route path="/servermonitor"      element={<ServerMonitorPage />} />

          {/* Auth */}
          <Route path="/login"             element={<Login />} />
          <Route path="/auth/callback"     element={<AuthCallbackPage />} />

          {/* App */}
          <Route path="/settings/profile"  element={<PrivateRoute><SettingsProfilePage /></PrivateRoute>} />
          <Route path="/dashboard"         element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/products/:type"    element={<PrivateRoute><ProductPage /></PrivateRoute>} />
          <Route path="/scanner/history"   element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/history"           element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
          <Route path="/schedule"          element={<PrivateRoute><SchedulePage /></PrivateRoute>} />

          {/* Scanners — new */}
          <Route path="/scanner"           element={<ScannerHubPage />} />
          <Route path="/scanner/network"   element={<NetworkScanPage />} />
          <Route path="/scanner/host"      element={<HostScanPage />} />
          <Route path="/scanner/cloud"     element={<CloudScanPage />} />
          <Route path="/scanner/code"      element={<CodeScanPage />} />
          <Route path="/scanner/cicd"      element={<CiCdPage />} />
          <Route path="/scanner/shadow-ai" element={<ShadowAiPage />} />
          <Route path="/scanner/sspm"      element={<SspmPage />} />
          <Route path="/patch"             element={<PatchManagementPage />} />
          <Route path="/agents"            element={<PrivateRoute><AgentManagementPage /></PrivateRoute>} />
          <Route path="/scanner/agent"    element={<PrivateRoute><ServerMonitorPage /></PrivateRoute>} />

          {/* Shareable scan — public */}
          <Route path="/shared/:token"     element={<SharedScanPage />} />

          {/* Fleet & Remediation — new */}
          <Route path="/assets"            element={<PrivateRoute><AssetsPage /></PrivateRoute>} />
          <Route path="/remediation"       element={<RemediationPage />} />

          {/* Billing */}
          <Route path="/billing"           element={<PrivateRoute><BillingPage /></PrivateRoute>} />
          <Route path="/billing/success"   element={<PrivateRoute><CheckoutSuccessPage /></PrivateRoute>} />

          {/* Phase 1 — AI features (auth required) */}
          <Route path="/ai-report"         element={<PrivateRoute><AiReportPage /></PrivateRoute>} />
          <Route path="/alert-triage"      element={<PrivateRoute><AlertTriagePage /></PrivateRoute>} />

          {/* Phase 3 — public */}
          <Route path="/trust"             element={<TrustPage />} />
          <Route path="/trust/:domain"     element={<TrustPage />} />

          {/* Phase 3 — auth required */}
          <Route path="/integrations"      element={<PrivateRoute><IntegrationsPage /></PrivateRoute>} />
          <Route path="/threat-feed"       element={<PrivateRoute><ThreatFeedPage /></PrivateRoute>} />
          <Route path="/threat-intel"      element={<Navigate to="/threat-feed" replace />} />
          <Route path="/reports/schedule"  element={<PrivateRoute><ScheduledReportsPage /></PrivateRoute>} />
          <Route path="/reports/scheduled" element={<Navigate to="/reports/schedule" replace />} />

          {/* Phase 2 — auth required */}
          <Route path="/compliance"        element={<PrivateRoute><CompliancePage /></PrivateRoute>} />
          <Route path="/portfolio"         element={<PrivateRoute><PortfolioPage /></PrivateRoute>} />
          <Route path="/monitoring"        element={<PrivateRoute><MonitoringPage /></PrivateRoute>} />
          <Route path="/scanner/api"       element={<ApiScanPage />} />
          <Route path="/discover"          element={<PrivateRoute><DiscoverPage /></PrivateRoute>} />
          <Route path="/container-scan"    element={<ContainerScanPage />} />
          <Route path="/crawl-scan"        element={<CrawlScanPage />} />
          <Route path="/dns-scan"          element={<DnsScanPage />} />
          <Route path="/subdomain-scan"    element={<SubdomainScanPage />} />
          <Route path="/executive-dashboard" element={<PrivateRoute><ExecutiveDashboardPage /></PrivateRoute>} />
          <Route path="/trends"            element={<PrivateRoute><TrendsPage /></PrivateRoute>} />
          <Route path="/org"               element={<PrivateRoute><OrganizationPage /></PrivateRoute>} />
          <Route path="/org/:id/apikeys"   element={<PrivateRoute><ApiKeysPage /></PrivateRoute>} />
          <Route path="/audit"             element={<PrivateRoute><AuditLogPage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
