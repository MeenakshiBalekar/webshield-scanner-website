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
import Dashboard from './pages/Dashboard'
import ScanPage from './pages/ScanPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import SchedulePage from './pages/SchedulePage'
import DashboardPage from './pages/DashboardPage'

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/scanner" element={<ScanPage />} />
          <Route path="/scanner/results" element={<ResultsPage />} />
          <Route path="/scanner/history" element={<HistoryPage />} />
          <Route path="/scanner-dashboard" element={<DashboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
