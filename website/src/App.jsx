import React from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
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
import ScanPage from './pages/ScanPage'
import ResultsPage from './pages/ResultsPage'
import HistoryPage from './pages/HistoryPage'
import DashboardPage from './pages/DashboardPage'
import SchedulePage from './pages/SchedulePage'

function MarketingPage() {
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
    <HashRouter>
      <Routes>
        <Route path="/" element={<MarketingPage />} />
        <Route path="/scanner" element={<ScanPage />} />
        <Route path="/scanner/results" element={<ResultsPage />} />
        <Route path="/scanner/history" element={<HistoryPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
      </Routes>
    </HashRouter>
  )
}
