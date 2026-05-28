import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import TrustLogos from './components/TrustLogos'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Solutions from './components/Solutions'
import Testimonials from './components/Testimonials'
import Pricing from './components/Pricing'
import Resources from './components/Resources'
import CTA from './components/CTA'
import Footer from './components/Footer'
import Login from './pages/Login'
import ProductPage from './pages/ProductPage'
import HistoryPage from './pages/HistoryPage'
import SchedulePage from './pages/SchedulePage'
import DashboardPage from './pages/DashboardPage'
import CveDatabasePage from './pages/CveDatabasePage'
import CompanyPage from './pages/CompanyPage'
import SolutionsPage from './pages/SolutionsPage'
import SolutionDetailPage from './pages/SolutionDetailPage'
import PricingPage from './pages/PricingPage'
import BlogPage from './pages/BlogPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/login" replace />
}

function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <TrustLogos />
        <Features />
        <HowItWorks />
        <Solutions />
        <Testimonials />
        <Pricing />
        <Resources />
        <CTA />
      </main>
      <Footer />
    </div>
  )
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
          <Route path="/blog"              element={<BlogPage />} />
          <Route path="/cve"               element={<CveDatabasePage />} />

          {/* App */}
          <Route path="/login"             element={<Login />} />
          <Route path="/dashboard"         element={<DashboardPage />} />
          <Route path="/products/:type"    element={<PrivateRoute><ProductPage /></PrivateRoute>} />
          <Route path="/scanner/history"   element={<HistoryPage />} />
          <Route path="/schedule"          element={<SchedulePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
