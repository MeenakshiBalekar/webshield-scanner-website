import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token    = params.get('token')
    const ssoError = params.get('sso_error')

    if (token) {
      localStorage.setItem('ws_token', token)
      const name = params.get('name')
      if (name) localStorage.setItem('ws_name', name)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Hard redirect so AuthContext re-reads localStorage on mount
      window.location.href = '/dashboard'
    } else {
      const err = ssoError || 'token_missing'
      navigate(`/login?sso_error=${encodeURIComponent(err)}`, { replace: true })
    }
  }, [])

  return null
}
