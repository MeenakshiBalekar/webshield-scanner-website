import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, X, History, ChevronLeft, Send, Code2, Loader2, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const BACKEND = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'
const STORAGE_KEY = 'ws_copilot_sessions'

function newSession() {
  return { id: Date.now().toString(), title: 'New conversation', messages: [], ts: Date.now() }
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveSessions(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, 20))) } catch {}
}

/* Renders message text, converting ```code``` blocks to styled pre elements */
function renderMessage(text) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3)
      const nlIdx = inner.indexOf('\n')
      const lang  = nlIdx > 0 ? inner.slice(0, nlIdx).trim() : ''
      const code  = nlIdx > 0 ? inner.slice(nlIdx + 1) : inner
      return (
        <pre key={i} className="my-1.5 bg-black/40 border border-white/10 rounded-lg px-3 py-2 overflow-x-auto text-[11px] font-mono text-green-300 whitespace-pre-wrap">
          {lang && <span className="text-[9px] text-gray-500 block mb-1">{lang}</span>}
          {code}
        </pre>
      )
    }
    return <span key={i} className="whitespace-pre-wrap">{part}</span>
  })
}

export default function SecurityCopilot() {
  const { user } = useAuth()
  const [open, setOpen]           = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [sessions, setSessions]   = useState(loadSessions)
  const [activeId, setActiveId]   = useState(null)
  const [input, setInput]         = useState('')
  const [codeMode, setCodeMode]   = useState(false)
  const [streaming, setStreaming] = useState(false)
  const messagesEndRef = useRef(null)
  const abortRef       = useRef(null)

  const activeSession = sessions.find(s => s.id === activeId) ?? null

  useEffect(() => {
    if (open && !activeId) {
      const s = newSession()
      setSessions(prev => { const n = [s, ...prev]; saveSessions(n); return n })
      setActiveId(s.id)
    }
  }, [open, activeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSession?.messages?.length, streaming])

  const updateSession = useCallback((id, updater) => {
    setSessions(prev => {
      const next = prev.map(s => s.id === id ? updater(s) : s)
      saveSessions(next)
      return next
    })
  }, [])

  const send = async () => {
    const text = input.trim()
    if (!text || streaming || !activeId) return

    const userMsg = { role: 'user', content: codeMode ? '```\n' + text + '\n```' : text }
    updateSession(activeId, s => ({
      ...s,
      title: s.messages.length === 0 ? text.slice(0, 40) : s.title,
      messages: [...s.messages, userMsg],
    }))
    setInput('')

    const assistantMsg = { role: 'assistant', content: '' }
    updateSession(activeId, s => ({ ...s, messages: [...s.messages, userMsg, assistantMsg] }))

    setStreaming(true)
    abortRef.current = new AbortController()

    try {
      const token = localStorage.getItem('ws_token')
      const history = (activeSession?.messages ?? []).concat(userMsg)
      const res = await fetch(`${BACKEND}/api/copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, history }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const chunk = line.slice(6)
            if (chunk === '[DONE]') break
            try {
              const parsed = JSON.parse(chunk)
              const delta  = parsed?.choices?.[0]?.delta?.content ?? parsed?.content ?? parsed?.text ?? chunk
              updateSession(activeId, s => {
                const msgs = [...s.messages]
                const last = msgs[msgs.length - 1]
                if (last?.role === 'assistant') msgs[msgs.length - 1] = { ...last, content: last.content + delta }
                return { ...s, messages: msgs }
              })
            } catch {
              // plain-text chunk fallback
              updateSession(activeId, s => {
                const msgs = [...s.messages]
                const last = msgs[msgs.length - 1]
                if (last?.role === 'assistant') msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
                return { ...s, messages: msgs }
              })
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        updateSession(activeId, s => {
          const msgs = [...s.messages]
          const last = msgs[msgs.length - 1]
          if (last?.role === 'assistant') msgs[msgs.length - 1] = { ...last, content: `Error: ${err.message}` }
          return { ...s, messages: msgs }
        })
      }
    } finally {
      setStreaming(false)
    }
  }

  const startNewSession = () => {
    const s = newSession()
    setSessions(prev => { const n = [s, ...prev]; saveSessions(n); return n })
    setActiveId(s.id)
    setShowHistory(false)
    setInput('')
  }

  const deleteSession = (id, e) => {
    e.stopPropagation()
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      saveSessions(next)
      if (activeId === id) {
        const fallback = next[0]
        if (fallback) setActiveId(fallback.id)
        else { const s = newSession(); saveSessions([s, ...next]); setSessions([s, ...next]); setActiveId(s.id) }
      }
      return next
    })
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !codeMode) { e.preventDefault(); send() }
  }

  if (!user) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      {open && (
        <div
          className="w-96 flex flex-col rounded-2xl border border-white/10 overflow-hidden"
          style={{
            height: 520,
            background: 'rgba(10,10,18,0.97)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 shrink-0">
            <div className="w-6 h-6 rounded-md bg-red-500/20 border border-red-500/30 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-red-400" />
            </div>
            <span className="text-sm font-bold text-white flex-1">Security Copilot</span>
            <button
              onClick={() => setShowHistory(v => !v)}
              className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-gray-300 transition-colors"
              title="History"
            >
              <History className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/8 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-1 min-h-0">
            {/* History sidebar */}
            {showHistory && (
              <div className="w-44 border-r border-white/8 flex flex-col shrink-0">
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/8">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Sessions</span>
                  <button onClick={startNewSession} className="p-1 rounded hover:bg-white/8 text-gray-500 hover:text-gray-300 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                  {sessions.map(s => (
                    <div
                      key={s.id}
                      onClick={() => { setActiveId(s.id); setShowHistory(false) }}
                      className={`group flex items-start gap-1 px-3 py-2 cursor-pointer transition-colors text-xs ${
                        s.id === activeId ? 'bg-white/8 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                      }`}
                    >
                      <span className="flex-1 truncate leading-tight">{s.title}</span>
                      <button
                        onClick={e => deleteSession(s.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition-all shrink-0 mt-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {!activeSession || activeSession.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-8">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">Security Copilot</p>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                        Ask about vulnerabilities, get remediation advice, or paste code for analysis.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1.5 w-full mt-2">
                      {[
                        'Explain SQL injection risks',
                        'How to fix an SSRF vulnerability?',
                        'Review this code for XSS issues',
                      ].map(hint => (
                        <button
                          key={hint}
                          onClick={() => { setInput(hint); }}
                          className="text-left text-[11px] text-gray-400 bg-white/5 hover:bg-white/8 border border-white/8 rounded-lg px-3 py-2 transition-colors"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  activeSession.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-red-500/20 border border-red-500/30 text-white'
                            : 'bg-white/5 border border-white/8 text-gray-200'
                        }`}
                      >
                        {msg.role === 'assistant' && msg.content === '' && streaming ? (
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Loader2 className="w-3 h-3 animate-spin" /> Thinking…
                          </span>
                        ) : (
                          renderMessage(msg.content)
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-white/8 px-3 py-3 shrink-0">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    {codeMode ? (
                      <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Paste code here…"
                        rows={4}
                        className="w-full bg-black/40 border border-violet-500/30 rounded-xl px-3 py-2 text-xs font-mono text-green-300 placeholder:text-gray-600 resize-none outline-none focus:border-violet-500/60 transition-colors"
                      />
                    ) : (
                      <textarea
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKey}
                        placeholder="Ask about security…"
                        rows={1}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-gray-600 resize-none outline-none focus:border-white/20 transition-colors"
                        style={{ maxHeight: 80 }}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setCodeMode(v => !v)}
                      title="Code mode"
                      className={`p-2 rounded-lg border transition-colors ${
                        codeMode
                          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                          : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300 hover:bg-white/8'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={send}
                      disabled={!input.trim() || streaming}
                      className="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {streaming
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                {codeMode && (
                  <p className="text-[10px] text-violet-400/60 mt-1.5">
                    Code mode — press Send to submit. Shift+Enter for new line.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          background: open ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.85)',
          border: '1px solid rgba(239,68,68,0.5)',
          boxShadow: '0 4px 20px rgba(239,68,68,0.35)',
        }}
        title="Security Copilot"
      >
        {open ? <X className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
      </button>
    </div>
  )
}
