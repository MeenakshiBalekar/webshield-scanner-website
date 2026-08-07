import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, Send, Loader2, ExternalLink, Sparkles } from 'lucide-react'
import { askAssistant } from '../services/api'

/* Dual-case field accessor */
function f(obj, ...keys) {
  if (!obj) return undefined
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k]
    const cap = k.charAt(0).toUpperCase() + k.slice(1)
    if (obj[cap] !== undefined && obj[cap] !== null) return obj[cap]
  }
  return undefined
}

const GREETING = {
  role: 'assistant',
  answer: "Hi! I'm the Udyo360 assistant. Ask me about hardened images, libraries, runtime visibility, the agent, scanning, or anything else on the platform.",
  sources: [],
  suggestions: [
    'What is Udyo360 Images?',
    'How do I install the agent?',
    'How does the Custom Image Builder work?',
  ],
}

export default function Udyo360Assistant() {
  const navigate = useNavigate()
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open, loading])

  const send = async (text) => {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')

    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setLoading(true)
    try {
      const res = await askAssistant(q)
      const answer = f(res, 'answer', 'response', 'reply', 'text') ?? "Sorry, I couldn't find an answer to that."
      const sources = (f(res, 'sources', 'links', 'references') ?? []).map((s) => ({
        title: (typeof s === 'string' ? s : f(s, 'title', 'label', 'name', 'url')) ?? 'Source',
        url:   typeof s === 'string' ? s : f(s, 'url', 'href', 'link'),
      })).filter((s) => s.url)
      const suggestions = (f(res, 'suggestions', 'followups', 'followUps', 'chips') ?? []).map((s) =>
        typeof s === 'string' ? s : (f(s, 'text', 'label', 'question') ?? '')
      ).filter(Boolean)
      const poweredBy = f(res, 'poweredBy', 'powered_by')
      setMessages((prev) => [...prev, { role: 'assistant', answer, sources, suggestions, poweredBy }])
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        answer: "Something went wrong reaching the assistant. Please try again in a moment.",
        sources: [],
        suggestions: [],
      }])
    }
    setLoading(false)
  }

  const openSource = (url) => {
    if (!url) return
    if (/^https?:\/\//i.test(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      setOpen(false)
      navigate(url)
    }
  }

  return (
    <>
      {/* Launcher bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close assistant' : 'Open assistant'}
        className="fixed bottom-5 right-5 z-[70] w-14 h-14 rounded-full bg-crimson-500 hover:bg-crimson-600 text-white shadow-2xl shadow-crimson-500/30 flex items-center justify-center transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[70] w-[calc(100vw-2.5rem)] sm:w-[380px] h-[540px] max-h-[calc(100vh-8rem)] bg-navy-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-white/10 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-crimson-500/15 border border-crimson-500/25 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-crimson-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Udyo360 Assistant</p>
              <p className="text-[11px] text-gray-500">Ask about the platform</p>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.map((m, i) => (
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] bg-crimson-500 text-white text-sm rounded-2xl rounded-br-md px-3.5 py-2">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={i} className="space-y-2.5">
                  <div className="max-w-[90%] bg-white/5 border border-white/10 text-gray-200 text-sm rounded-2xl rounded-bl-md px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap">
                    {m.answer}
                  </div>

                  {/* Sources */}
                  {m.sources?.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 px-1">Sources</p>
                      {m.sources.map((s, j) => (
                        <button
                          key={j}
                          onClick={() => openSource(s.url)}
                          className="flex items-center gap-1.5 w-full text-left text-xs text-crimson-400 hover:text-crimson-300 transition-colors px-1 py-0.5 group"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60 group-hover:opacity-100" />
                          <span className="truncate">{s.title}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggestion chips */}
                  {m.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.suggestions.map((s, j) => (
                        <button
                          key={j}
                          onClick={() => send(s)}
                          disabled={loading}
                          className="text-xs text-gray-300 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 rounded-full px-3 py-1 transition-colors disabled:opacity-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Powered-by attribution */}
                  {m.poweredBy && (
                    <p className="text-[10px] text-gray-600 px-1">Powered by {m.poweredBy}</p>
                  )}
                </div>
              )
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-gray-500 text-sm px-1">
                <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => { e.preventDefault(); send() }}
            className="flex items-center gap-2 px-3 py-3 border-t border-white/10 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-10 h-10 shrink-0 rounded-xl bg-crimson-500 hover:bg-crimson-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
