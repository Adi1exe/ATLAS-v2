import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('atlas_user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('atlas_user') }
    }
    setLoading(false)
  }, [])

  const loginWithGoogle = async (credentialResponse) => {
    try {
      const { data } = await api.post('/auth/google', {
        credential: credentialResponse.credential
      })
      setUser(data.user)
      localStorage.setItem('atlas_user', JSON.stringify(data.user))
      localStorage.setItem('atlas_token', data.token)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('atlas_user')
    localStorage.removeItem('atlas_token')
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
