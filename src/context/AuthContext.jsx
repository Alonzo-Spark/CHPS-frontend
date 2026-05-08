import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken')
      if (token && !user) {
        try {
          const userData = await authService.getCurrentUser()
          localStorage.setItem('user', JSON.stringify(userData))
          setUser(userData)
        } catch (error) {
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const { accessToken, refreshToken, user: u } = await authService.loginUser({ email, password })
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
      return { success: true, role: u.role }
    } catch (err) {
      return { success: false, message: err.message || 'Invalid credentials.' }
    }
  }

  const register = async (data) => {
    try {
      const { accessToken, refreshToken, user: u } = await authService.registerUser(data)
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(u))
      setUser(u)
      return { success: true, role: u.role }
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed.' }
    }
  }

  const logout = async () => {
    try {
      await authService.logoutUser()
    } catch (error) {
      // If logout fails (e.g., 401), still clear tokens
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
  }

  const fetchCurrentUser = async () => {
    try {
      const userData = await authService.getCurrentUser()
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      return userData
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, fetchCurrentUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
