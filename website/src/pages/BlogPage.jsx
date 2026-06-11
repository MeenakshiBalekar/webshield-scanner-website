import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Search, ArrowRight, Tag } from 'lucide-react'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import { POSTS } from '../data/blogData'

const CATEGORIES = ['All', ...new Set(POSTS.map((p) => p.category))]

const CATEGORY_COLORS = {
  'How-To':                 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'Vulnerability Deep-Dive':'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Security Research':      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'DevSecOps':              'text-green-400 bg-green-500/10 border-green-500/20',
}

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = POSTS.filter((p) => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory
    const q = search.toLowerCase()
    const matchSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
    return matchCat && matchSearch
  })

  const featured = filtered.find((p) => p.featured)
  const rest = filtered.filter((p) => !p.featured || filtered.indexOf(p) !== filtered.indexOf(featured))

  return (
    <div className="min-h-screen page-bg flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-12">
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

        {filtered.length === 0 && (
          <p className="text-gray-500 text-center py-16">No articles found.</p>
        )}

        {/* Featured post */}
        {featured && (
          <Link
            to={`/blog/${featured.slug}`}
            className="group block bg-white/3 border border-crimson-500/30 hover:border-crimson-500/60 rounded-2xl p-6 mb-6 transition-all"
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-crimson-500/20 border border-crimson-500/30 text-crimson-400">
                Featured
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[featured.category] || ''}`}>
                {featured.category}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {featured.readTime}
                <span className="mx-1">·</span>
                {new Date(featured.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-crimson-300 transition-colors">
              {featured.title}
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">{featured.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1.5">
                {featured.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                    <Tag className="w-2.5 h-2.5" /> {tag}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-1 text-xs text-crimson-400 font-semibold shrink-0">
                Read article <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </Link>
        )}

        {/* Post grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          {rest.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-white/3 border border-white/10 hover:border-crimson-500/30 rounded-2xl p-5 transition-all flex flex-col"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[post.category] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                  {post.category}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </div>
              </div>
              <h2 className="text-sm font-bold text-white mb-2 leading-snug group-hover:text-crimson-300 transition-colors flex-1">
                {post.title}
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-xs text-gray-600">
                  {new Date(post.date).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className="flex items-center gap-1 text-xs text-crimson-500 font-semibold">
                  Read <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
