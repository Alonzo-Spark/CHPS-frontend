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
      localStorage.setItem('audit_token', data.access_token)
      // Mocking user object since the login response only returns the access token
      const u = { 
        id: 'mock-uuid', 
        email, 
        username: email.split('@')[0], 
        role: email.includes('admin') ? 'admin' : 'staff' 
      };
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
