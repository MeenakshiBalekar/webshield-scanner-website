import React from 'react'

const companies = [
  'Accenture', 'Deloitte', 'IBM Security', 'PwC', 'KPMG', 'EY', 'Cisco', 'Palo Alto',
]

export default function TrustLogos() {
  return (
    <section className="bg-gray-50 border-y border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">
          Trusted by security teams at leading organizations
        </p>
        <div className="relative overflow-hidden">
          <div className="flex gap-12 items-center animate-[marquee_20s_linear_infinite]" style={{
            animation: 'marquee 25s linear infinite',
            display: 'flex',
            width: 'max-content',
          }}>
            {[...companies, ...companies].map((company, i) => (
              <div
                key={i}
                className="shrink-0 text-gray-400 font-bold text-lg tracking-tight hover:text-navy-900 transition-colors cursor-default select-none"
              >
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
