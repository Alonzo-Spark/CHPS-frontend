import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Initialize from localStorage synchronously
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user')
    return storedUser ? JSON.parse(storedUser) : null
  })
  const [token, setToken] = useState(() => localStorage.getItem('token') || localStorage.getItem('access_token'))
  const [role, setRole] = useState(() => localStorage.getItem('role')?.toLowerCase() || null)

  // Set loading to true initially if there is a token to verify
  const [loading, setLoading] = useState(() => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token')
    return !!(storedToken && storedToken !== 'undefined' && storedToken !== 'null')
  })

  useEffect(() => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('access_token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
      // All tokens verified via backend API
      authService.verifyToken()
        .then(() => {
          if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            setUser({
              ...parsedUser,
              role: parsedUser?.role?.toLowerCase() || 'staff'
            })
          }
        })
        .catch(err => {
          console.warn("Error verifying token:", err)
          // Only logout if token is explicitly invalid (401/403)
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            console.warn("Token expired or invalid, logging out")
            logout()
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      // No token — just stop loading; ProtectedRoute handles redirect
      setLoading(false)
    }
  }, [])

  /*
    Backend Login Response Expected:

    {
      "access_token": "...",
      "token_type": "bearer",
      "role": "staff",
      "username": "Midde Puja"
    }
  */

  const login = (data) => {
    try {
      if (!data || !data.access_token) {
        return {
          success: false,
          message: 'Invalid authentication response'
        }
      }

      const authToken = data.access_token
      const normalizedRole = (data.role || data.user?.role)?.toLowerCase() || 'staff'

      const userObj = {
        username: data.username || data.user?.username || '',
        role: normalizedRole
      }

      // Set state
      setToken(authToken)
      setRole(normalizedRole)
      setUser(userObj)

      // Store in localStorage
      localStorage.setItem('token', authToken)
      localStorage.setItem('access_token', authToken)
      localStorage.setItem('role', normalizedRole)
      localStorage.setItem('user', JSON.stringify(userObj))

      return {
        success: true
      }

    } catch (error) {
      console.error('Login context error:', error)

      return {
        success: false,
        message: 'Authentication failed'
      }
    }
  }

  const logout = () => {
    setToken(null)
    setRole(null)
    setUser(null)

    localStorage.removeItem('token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        loading,
        setLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
