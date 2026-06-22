import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const BACKEND = import.meta.env.VITE_API_URL || 'https://webshield-backend-api.onrender.com'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search)
    const token    = params.get('token')
    const ssoError = params.get('sso_error')
    const code     = params.get('code')
    const state    = params.get('state')

    if (token) {
      // Legacy flow: backend already exchanged token and redirected here with ?token=
      localStorage.setItem('ws_token', token)
      const name = params.get('name')
      if (name) localStorage.setItem('ws_name', name)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      window.location.href = '/'
    } else if (code) {
      // SSO flow: IdP redirected here with code+state; exchange via POST /api/sso/callback
      fetch(`${BACKEND}/api/sso/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state }),
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data) => {
          const jwt  = data?.token ?? data?.Token ?? data?.accessToken ?? data?.AccessToken
          const name = data?.name  ?? data?.Name  ?? data?.displayName ?? null
          if (jwt) {
            localStorage.setItem('ws_token', jwt)
            if (name) localStorage.setItem('ws_name', name)
            axios.defaults.headers.common['Authorization'] = `Bearer ${jwt}`
            window.location.href = '/'
          } else {
            navigate('/login?sso_error=token_missing', { replace: true })
          }
        })
        .catch(() => navigate('/login?sso_error=callback_failed', { replace: true }))
    } else {
      const err = ssoError || 'token_missing'
      navigate(`/login?sso_error=${encodeURIComponent(err)}`, { replace: true })
    }
  }, [])

  return null
}
