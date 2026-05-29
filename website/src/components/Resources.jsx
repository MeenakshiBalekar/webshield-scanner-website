import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Video, FileText, ArrowRight, Calendar } from 'lucide-react'

const resources = [
  {
    type: 'Guide',
    icon: BookOpen,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    tag: 'OWASP',
    title: 'The Complete OWASP Top 10 Testing Guide for 2024',
    excerpt:
      'A practical walkthrough of all 10 OWASP categories with real-world payloads, detection techniques, and remediation strategies for modern web apps.',
    date: 'May 14, 2024',
    readTime: '18 min read',
  },
  {
    type: 'Research',
    icon: FileText,
    iconBg: 'bg-crimson-50',
    iconColor: 'text-crimson-500',
    tag: 'Research',
    title: 'State of Web Application Security 2024: Key Trends and Statistics',
    excerpt:
      'Our annual analysis of 1.2 million scans reveals which vulnerabilities are most prevalent, hardest to fix, and most frequently exploited by attackers.',
    date: 'April 28, 2024',
    readTime: '12 min read',
  },
  {
    type: 'Webinar',
    icon: Video,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    tag: 'Webinar',
    title: 'Live Hack: Finding and Exploiting SQL Injection in Modern APIs',
    excerpt:
      'Watch our security researchers demonstrate real-world SQL injection techniques against REST APIs and show how WebShield detects each one automatically.',
    date: 'May 21, 2024',
    readTime: '45 min watch',
  },
  {
    type: 'Guide',
    icon: BookOpen,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    tag: 'DevSecOps',
    title: 'Integrating WebShield into GitHub Actions: Step-by-Step',
    excerpt:
      'Learn how to add automated security scanning to every pull request, configure severity thresholds, and post inline findings as PR review comments.',
    date: 'May 8, 2024',
    readTime: '10 min read',
  },
]

export default function Resources() {
  return (
    <section id="resources" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="section-tag">Resources</span>
            <h2 className="section-heading">Security Knowledge Hub</h2>
          </div>
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 hover:text-crimson-500 transition-colors shrink-0"
          >
            View all resources <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {resources.map((r) => {
            const Icon = r.icon
            return (
              <article
                key={r.title}
                className="group border border-gray-100 rounded-2xl overflow-hidden hover:border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-9 h-9 ${r.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4.5 h-4.5 ${r.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded-full">
                      {r.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-navy-900 leading-snug mb-2 group-hover:text-crimson-500 transition-colors">
                    {r.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed flex-1">{r.excerpt}</p>
                </div>
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Calendar className="w-3 h-3" />
                    {r.date}
                  </div>
                  <span className="text-[10px] text-gray-400">{r.readTime}</span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
