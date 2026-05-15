import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('access_token'))
  const [role, setRole] = useState(() => localStorage.getItem('role')?.toLowerCase() || null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      setUser({
        ...parsedUser,
        role: parsedUser?.role?.toLowerCase() || 'staff'
      })
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