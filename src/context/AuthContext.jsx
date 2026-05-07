import React, { createContext, useContext, useState } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('audit_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })

  const login = async (email, password) => {
    try {
      const { token, user: u } = await api.login(email, password)
      localStorage.setItem('audit_token', token)
      localStorage.setItem('audit_user', JSON.stringify(u))
      setUser(u)
      return { success: true, role: u.role }
    } catch (err) {
      return { success: false, message: err.message || 'Invalid credentials.' }
    }
  }

  const register = async (data) => {
    try {
      const { token, user: u } = await api.register(data)
      localStorage.setItem('audit_token', token)
      localStorage.setItem('audit_user', JSON.stringify(u))
      setUser(u)
      return { success: true, role: u.role }
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed.' }
    }
  }

  const logout = async () => {
    await api.logout().catch(() => {})
    localStorage.removeItem('audit_token')
    localStorage.removeItem('audit_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
