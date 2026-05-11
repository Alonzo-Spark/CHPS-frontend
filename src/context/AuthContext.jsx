import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

const MOCK_USERS = {
  'staff@test.com':     { role: 'staff',     username: 'Marcus Therne', token: 'mock-staff-token' },
  'admin@test.com':     { role: 'admin',      username: 'Admin User',    token: 'mock-admin-token' },
  'professor@test.com': { role: 'professor',  username: 'Prof. Smith',   token: 'mock-prof-token' },
}
const MOCK_PASSWORD = 'Password123'

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('access_token')
    const storedUser  = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (credentials) => {
    // MOCK — remove when backend is ready
    const mock = MOCK_USERS[credentials.email_or_username]
    if (mock && credentials.password === MOCK_PASSWORD) {
      const data = { access_token: mock.token, role: mock.role, username: mock.username }
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user', JSON.stringify({ username: data.username, role: data.role }))
      setToken(data.access_token)
      setUser({ username: data.username, role: data.role })
      return data
    }
    if (credentials.email_or_username in MOCK_USERS) {
      throw { response: { data: { detail: 'Wrong password. Use: Password123' } } }
    }
    // REAL API — active for any email not in mock list
    const data = await authService.login(credentials)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, role: data.role }))
    setToken(data.access_token)
    setUser({ username: data.username, role: data.role })
    return data
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