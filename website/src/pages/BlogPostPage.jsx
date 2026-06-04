import React from 'react'
import { Link, useParams, Navigate } from 'react-router-dom'
import {
  AlertTriangle, Info, CheckCircle, XCircle,
  Clock, ArrowLeft, ArrowRight, Share2,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { POSTS, ARTICLE_CONTENT } from '../data/blogData'

// ─── Inline markup renderer (**bold**, `code`) ────────────────────────────────
function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="text-crimson-400 font-mono text-[13px] bg-white/6 px-1.5 py-0.5 rounded">{part.slice(1, -1)}</code>
        }
        return part
      })}
    </>
  )
}

// ─── Callout box ─────────────────────────────────────────────────────────────
const CALLOUT = {
  warning: { bg: 'bg-amber-500/10 border-amber-500/30', Icon: AlertTriangle, ic: 'text-amber-400', tc: 'text-amber-300' },
  danger:  { bg: 'bg-red-500/10 border-red-500/30',     Icon: XCircle,       ic: 'text-red-400',   tc: 'text-red-300'   },
  tip:     { bg: 'bg-green-500/10 border-green-500/30', Icon: CheckCircle,   ic: 'text-green-400', tc: 'text-green-300' },
  info:    { bg: 'bg-blue-500/10 border-blue-500/30',   Icon: Info,          ic: 'text-blue-400',  tc: 'text-blue-300'  },
}

// ─── Block renderer ───────────────────────────────────────────────────────────
function Block({ block }) {
  switch (block.type) {
    case 'h2':
      return <h2 className="text-xl font-bold text-white mt-10 mb-4 pb-2 border-b border-white/10">{block.text}</h2>
    case 'h3':
      return <h3 className="text-base font-bold text-white mt-6 mb-2">{block.text}</h3>
    case 'p':
      return <p className="text-gray-300 leading-relaxed mb-4 text-[15px]"><Inline text={block.text} /></p>
    case 'callout': {
      const s = CALLOUT[block.variant] || CALLOUT.info
      return (
        <div className={`flex gap-3 rounded-xl border px-4 py-3 mb-5 ${s.bg}`}>
          <s.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${s.ic}`} />
          <div>
            {block.title && <p className={`text-sm font-semibold mb-1 ${s.tc}`}>{block.title}</p>}
            <p className="text-sm text-gray-300 leading-relaxed"><Inline text={block.text} /></p>
          </div>
        </div>
      )
    }
    case 'steps':
      return (
        <ol className="space-y-2.5 mb-5">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-crimson-500/20 border border-crimson-500/40 text-crimson-400 text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              <span className="text-gray-300 text-sm leading-relaxed pt-0.5"><Inline text={item} /></span>
            </li>
          ))}
        </ol>
      )
    case 'bullets':
      return (
        <ul className="space-y-2 mb-5 ml-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-gray-300 text-sm leading-relaxed">
              <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-crimson-500 mt-2" />
              <span><Inline text={item} /></span>
            </li>
          ))}
        </ul>
      )
    case 'code':
      return (
        <div className="mb-5 rounded-xl overflow-hidden border border-white/10">
          <div className="flex items-center justify-between bg-white/4 px-4 py-2 border-b border-white/10">
            <span className="text-xs font-semibold text-gray-300">{block.label || block.lang}</span>
            <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">{block.lang}</span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-sm text-gray-300 leading-relaxed bg-[#080d18] font-mono whitespace-pre">{block.code}</pre>
        </div>
      )
    default:
      return null
  }
}

// ─── Share buttons ────────────────────────────────────────────────────────────
function ShareButtons({ title }) {
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5" />Share</span>
      <a href={tweet} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        X / Twitter
      </a>
      <a href={linkedin} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        LinkedIn
      </a>
    </div>
  )
}

// ─── Category color map ───────────────────────────────────────────────────────
const CAT_COLORS = {
  'How-To':                 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  'Vulnerability Deep-Dive':'text-orange-400 bg-orange-500/10 border-orange-500/20',
  'Security Research':      'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'DevSecOps':              'text-green-400 bg-green-500/10 border-green-500/20',
}

export default function BlogPostPage() {
  const { slug } = useParams()

  const post = POSTS.find((p) => p.slug === slug)
  const content = ARTICLE_CONTENT[slug]

  if (!post || !content) return <Navigate to="/blog" replace />

  // Related posts: same category first, then anything, max 3
  const related = POSTS
    .filter((p) => p.slug !== slug)
    .sort((a, b) => (a.category === post.category ? -1 : 0) - (b.category === post.category ? -1 : 0))
    .slice(0, 3)

  return (
    <div className="min-h-screen flex flex-col page-bg">
      <Navbar />

      {/* Hero */}
      <div className="pt-24 pb-10 border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />Back to blog
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CAT_COLORS[post.category] || 'text-gray-400 bg-white/5 border-white/10'}`}>
              {post.category}
            </span>
            {post.featured && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-crimson-500/20 border border-crimson-500/30 text-crimson-400">
                Featured
              </span>
            )}
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {post.readTime}
              <span className="mx-1">·</span>
              {new Date(post.date).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4">{post.title}</h1>
          <p className="text-gray-400 text-base leading-relaxed mb-6">{post.excerpt}</p>

          <ShareButtons title={post.title} />
        </div>
      </div>

      {/* Article body */}
      <article className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10">
        {content.blocks.map((block, i) => <Block key={i} block={block} />)}

        {/* Bottom share */}
        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-gray-500">Written by {post.author} · {new Date(post.date).toLocaleDateString('en', { month: 'long', year: 'numeric' })}</p>
          <ShareButtons title={post.title} />
        </div>
      </article>

      {/* CTA */}
      <div className="border-t border-white/10 bg-white/2">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-1">
            <p className="text-white font-bold text-lg mb-1">Check your site for these vulnerabilities</p>
            <p className="text-gray-400 text-sm">Run a free scan and get a full security report in under 60 seconds.</p>
          </div>
          <Link
            to="/scanner"
            className="shrink-0 bg-crimson-500 hover:bg-crimson-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm text-center"
          >
            Run a Free Scan
          </Link>
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="border-t border-white/10">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
            <h2 className="text-base font-bold text-white mb-5">Related Articles</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group bg-white/3 hover:bg-white/5 border border-white/10 hover:border-crimson-500/30 rounded-xl p-4 transition-all"
                >
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CAT_COLORS[p.category] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                    {p.category}
                  </span>
                  <p className="text-sm font-semibold text-white mt-2 mb-1 leading-snug group-hover:text-crimson-300 transition-colors line-clamp-2">{p.title}</p>
                  <p className="text-xs text-gray-500">{p.readTime}</p>
                  <span className="inline-flex items-center gap-1 text-xs text-crimson-500 mt-2 font-semibold">
                    Read <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
