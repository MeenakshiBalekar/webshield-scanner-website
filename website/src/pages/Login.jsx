import React, { useState } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, Eye, EyeOff, Github } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const BACKEND = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

const SSO_ERROR_MESSAGES = {
  access_denied: 'You cancelled the login.',
  no_email:      'Your GitHub/LinkedIn email is private — make it public and try again.',
}

function LinkedInIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#0A66C2">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect  = searchParams.get('redirect') || '/dashboard'
  const ssoError  = searchParams.get('sso_error')

  const [mode, setMode]               = useState('login')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      navigate(redirect)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed')
    }
    setLoading(false)
  }

  const ssoErrorMsg = ssoError ? (SSO_ERROR_MESSAGES[ssoError] ?? 'SSO login failed, please try again.') : null

  return (
    <div className="min-h-screen page-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <img src="/udyo360-icon-only.svg" alt="Udyo360" className="w-9 h-9" />
          <span className="text-white font-bold text-2xl tracking-tight">
            Udy◎<span className="text-crimson-500">360</span>
          </span>
        </Link>

        <div className="bg-white/3 border border-white/10 rounded-2xl p-8">
          {/* Mode toggle */}
          <div className="flex rounded-xl overflow-hidden border border-white/10 mb-7">
            <button
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === 'login' ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('register'); setError(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === 'register' ? 'bg-crimson-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <h1 className="text-xl font-bold text-white mb-6">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>

          {/* SSO error from OAuth redirect */}
          {ssoErrorMsg && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{ssoErrorMsg}</span>
            </div>
          )}

          {/* Form error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm mb-5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SSO buttons */}
          <div className="space-y-2.5 mb-6">
            <a
              href={`${BACKEND}/api/auth/github/login`}
              className="flex items-center justify-center gap-2.5 w-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-gray-200 font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              <Github className="w-4 h-4" />
              Continue with GitHub
            </a>
            <a
              href={`${BACKEND}/api/auth/linkedin/login`}
              className="flex items-center justify-center gap-2.5 w-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 text-gray-200 font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              <LinkedInIcon />
              Continue with LinkedIn
            </a>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-gray-600">or continue with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 rounded-xl text-sm outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/15 focus:border-crimson-500 text-white placeholder-gray-600 px-4 py-2.5 pr-10 rounded-xl text-sm outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-crimson-500 hover:bg-crimson-600 disabled:bg-crimson-500/50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-xs text-gray-500 text-center mt-5">
              Test account: <span className="text-gray-400">test@udyo360.com / Test1234!</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
