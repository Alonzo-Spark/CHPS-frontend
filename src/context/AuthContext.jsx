import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token') || localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedRole = localStorage.getItem('role')
    const storedUsername = localStorage.getItem('username')

    if (storedToken) {
      setToken(storedToken)

      if (storedUser) {
        setUser(JSON.parse(storedUser))
      } else if (storedRole || storedUsername) {
        setUser({
          role: storedRole || 'staff',
          username: storedUsername || 'User',
        })
      }
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    const data = await authService.login(credentials)
    const username = data?.username || data?.user?.full_name || data?.user?.username || credentials.email_or_username || 'User'
    const role = data?.role || data?.user?.role || 'staff'
    const userData = {
      ...(data?.user || {}),
      username,
      role,
    }

    localStorage.setItem('access_token', data?.access_token || '')
    localStorage.setItem('token', data?.access_token || '')
    localStorage.setItem('role', role)
    localStorage.setItem('username', username)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(data?.access_token || null)
    setUser(userData)
    
    return { ...data, user: userData, role, username }
  }

  const logout = () => {
    authService.logout()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}