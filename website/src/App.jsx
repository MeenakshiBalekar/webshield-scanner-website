import React from 'react'
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

export default function App() {
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
