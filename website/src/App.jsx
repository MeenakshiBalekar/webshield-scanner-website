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
          <Route path="/cve"               element={<CveDatabasePage />} />
          <Route path="/agent"             element={<AgentPage />} />
          <Route path="/autoscan"            element={<AutoScanPage />} />
          <Route path="/remediation-tasks"  element={<RemediationTasksPage />} />
          <Route path="/servermonitor"      element={<ServerMonitorPage />} />

          {/* Auth */}
          <Route path="/login"             element={<Login />} />

          {/* App */}
          <Route path="/dashboard"         element={<DashboardPage />} />
          <Route path="/products/:type"    element={<PrivateRoute><ProductPage /></PrivateRoute>} />
          <Route path="/scanner/history"   element={<HistoryPage />} />
          <Route path="/schedule"          element={<SchedulePage />} />

          {/* Scanners — new */}
          <Route path="/scanner"           element={<ScannerHubPage />} />
          <Route path="/scanner/network"   element={<NetworkScanPage />} />
          <Route path="/scanner/host"      element={<HostScanPage />} />
          <Route path="/scanner/cloud"     element={<CloudScanPage />} />
          <Route path="/scanner/code"      element={<CodeScanPage />} />
          <Route path="/scanner/cicd"      element={<CiCdPage />} />

          {/* Fleet & Remediation — new */}
          <Route path="/assets"            element={<AssetsPage />} />
          <Route path="/remediation"       element={<RemediationPage />} />

          {/* Billing */}
          <Route path="/billing"           element={<BillingPage />} />
          <Route path="/billing/success"   element={<CheckoutSuccessPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
