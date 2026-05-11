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
      const data = await api.login(email, password)
      const accessToken = data.access_token || data.token

      if (accessToken) {
        localStorage.setItem('audit_token', accessToken)
      }

      const backendUser = data.user || data.account || null
      const role = String(data.role || backendUser?.role || (email.includes('admin') ? 'admin' : 'staff')).toLowerCase() === 'admin' ? 'admin' : 'staff'
      const u = backendUser ? { ...backendUser, role, email: backendUser.email || email } : {
        id: data.user_id || data.id || 'mock-uuid',
        email,
        full_name: email.split('@')[0],
        role,
      }

      localStorage.setItem('audit_user', JSON.stringify(u))
      setUser(u)
      return { success: true, role: u.role }
    } catch (err) {
      let msg = err.response?.data?.detail || 'Invalid credentials.';
      if (Array.isArray(msg)) {
         msg = msg.map(m => `${m.loc[m.loc.length-1]}: ${m.msg}`).join(', ');
      }
      return { success: false, message: msg }
    }
  }

  const logout = async () => {
    await api.logout().catch(() => {})
    localStorage.removeItem('audit_token')
    localStorage.removeItem('audit_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
