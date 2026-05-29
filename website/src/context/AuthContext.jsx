import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL ?? ''
if (API) axios.defaults.baseURL = API

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ws_token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser({ token })
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/api/auth/login`, { email, password })
    const token = data.token
    localStorage.setItem('ws_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser({ token, email })
    return data
  }

  const register = async (email, password) => {
    const { data } = await axios.post(`${API}/api/auth/register`, { email, password })
    const token = data.token
    localStorage.setItem('ws_token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser({ token, email })
    return data
  }

  const logout = () => {
    localStorage.removeItem('ws_token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
