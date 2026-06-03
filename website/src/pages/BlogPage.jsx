import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Clock, ArrowRight, Tag, Search, ChevronDown, ChevronUp } from 'lucide-react'

const POSTS = [
  {
    id: 1,
    title: 'OWASP Top 10 2024: What Changed and How to Stay Secure',
    excerpt: 'The latest OWASP Top 10 brings updated rankings and new vulnerability categories. We break down each risk and show you how Udyo360 maps to every item on the list.',
    category: 'Security Research',
    readTime: '8 min read',
    date: '2026-05-15',
    author: 'Udyo360 Team',
    tags: ['OWASP', 'Web Security', 'Best Practices'],
  },
  {
    id: 2,
    title: 'Why Security Headers Matter More Than Ever in 2026',
    excerpt: 'Content-Security-Policy, HSTS, X-Frame-Options — these headers are your first line of defense. A deep dive into what each one does and why attackers target misconfigured ones.',
    category: 'How-To',
    readTime: '6 min read',
    date: '2026-05-08',
    author: 'Udyo360 Team',
    tags: ['Headers', 'Hardening', 'CSP'],
  },
  {
    id: 3,
    title: 'Integrating Security Scanning into Your CI/CD Pipeline',
    excerpt: 'Shift security left by running automated vulnerability scans on every pull request. Step-by-step guide for GitHub Actions, GitLab CI, and Jenkins.',
    category: 'DevSecOps',
    readTime: '10 min read',
    date: '2026-04-29',
    author: 'Udyo360 Team',
    tags: ['CI/CD', 'DevSecOps', 'Automation'],
  },
  {
    id: 4,
    title: 'SQL Injection in 2026: Still the #1 Data Breach Vector',
    excerpt: 'Despite being well understood for over two decades, SQLi continues to top breach reports. Here\'s why it persists and how to find it in your apps before attackers do.',
    category: 'Vulnerability Deep-Dive',
    readTime: '7 min read',
    date: '2026-04-18',
    author: 'Udyo360 Team',
    tags: ['SQLi', 'OWASP', 'Injection'],
  },
  {
    id: 5,
    title: 'API Security Checklist: 15 Things to Test Before Going Live',
    excerpt: 'REST and GraphQL APIs are a common attack surface. This checklist covers authentication, rate limiting, data exposure, and more — with actionable tests for each.',
    category: 'How-To',
    readTime: '12 min read',
    date: '2026-04-05',
    author: 'Udyo360 Team',
    tags: ['API Security', 'Checklist', 'Testing'],
  },
  {
    id: 6,
    title: 'Understanding CVSS Scores: A Practical Guide for Developers',
    excerpt: 'CVSS scores tell you how severe a vulnerability is — but do you know how to read them? We explain Base, Temporal, and Environmental metrics with real-world examples.',
    category: 'Security Research',
    readTime: '5 min read',
    date: '2026-03-22',
    author: 'Udyo360 Team',
    tags: ['CVSS', 'CVE', 'Risk Management'],
  },
]

const CATEGORIES = ['All', ...new Set(POSTS.map((p) => p.category))]

const CATEGORY_COLORS = {
  'Security Research':      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'How-To':                 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'DevSecOps':              'text-green-400 bg-green-500/10 border-green-500/20',
  'Vulnerability Deep-Dive':'text-orange-400 bg-orange-500/10 border-orange-500/20',
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState(null)

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id))

  const filtered = POSTS.filter((p) => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9" />
          <span className="text-white font-bold text-xl tracking-tight">
            Udy◎<span className="text-crimson-500">360</span>
          </span>
        </Link>
        <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Back to home</Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">Security Blog</h1>
          <p className="text-gray-400">Practical security guidance, vulnerability research, and product updates.</p>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-500 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-crimson-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Posts */}
        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-16">No articles found.</p>
        )}

        <div className="space-y-4">
          {filtered.map((post) => {
            const isOpen = expandedId === post.id
            return (
              <article
                key={post.id}
                onClick={() => toggle(post.id)}
                className={`bg-white/3 border rounded-2xl p-6 cursor-pointer transition-all ${
                  isOpen ? 'border-crimson-500/40' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[post.category] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                        <span className="mx-1">·</span>
                        {new Date(post.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <h2 className={`text-base font-bold leading-snug transition-colors ${isOpen ? 'text-crimson-300' : 'text-white'}`}>
                      {post.title}
                    </h2>
                  </div>
                  <div className="shrink-0 mt-1">
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-gray-400" />
                      : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-300 leading-relaxed mb-4">{post.excerpt}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                          <Tag className="w-2.5 h-2.5" /> {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}
