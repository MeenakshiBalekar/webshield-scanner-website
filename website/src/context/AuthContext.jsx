import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API     = import.meta.env.VITE_API_URL ?? ''
const BACKEND = API || 'https://webshield-backend-api.onrender.com'
if (API) axios.defaults.baseURL = API

const AuthContext = createContext(null)

async function fetchMe(token) {
  try {
    const res = await fetch(`${BACKEND}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ws_token')
    if (!token) { setLoading(false); return }

    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser({ token })   // treat as logged-in immediately; enrich below
    setLoading(false)

    fetchMe(token).then((profile) => {
      if (profile) setUser({ token, ...profile })
    })
  }, [])

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/api/auth/login`, { email, password })
    const token = data.token
    localStorage.setItem('ws_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser({ token, email })
    fetchMe(token).then((p) => { if (p) setUser({ token, ...p }) })
    return data
  }

  const register = async (email, password) => {
    const { data } = await axios.post(`${API}/api/auth/register`, { email, password })
    const token = data.token
    localStorage.setItem('ws_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser({ token, email })
    fetchMe(token).then((p) => { if (p) setUser({ token, ...p }) })
    return data
  }

  const logout = () => {
    localStorage.removeItem('ws_token')
    localStorage.removeItem('ws_name')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }))

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
