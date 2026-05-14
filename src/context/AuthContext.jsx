import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [role, setRole] = useState(() => localStorage.getItem('role'))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) setUser(JSON.parse(storedUser))
  }, [])

  // ✅ Login helper supports both credential pairs and auth objects
  const login = (usernameOrData, password) => {
    const isObjectAuth = typeof usernameOrData === 'object' && usernameOrData !== null

    if (isObjectAuth) {
      const data = usernameOrData
      const authToken = data.access_token || data.token || data.auth_token || 'dummy-token-123456'
      const userRole = data.role || 'staff'
      const username = data.username || data.email || 'staff123'

      setToken(authToken)
      setRole(userRole)
      setUser({ username, role: userRole })

      localStorage.setItem('token', authToken)
      localStorage.setItem('role', userRole)
      localStorage.setItem('user', JSON.stringify({ username, role: userRole }))

      return { success: true }
    }

    // 🔥 Hardcoded staff credentials fallback
    const dummyStaff = {
      username: "staff123",
      password: "123456",
      role: "staff"
    }

    if (usernameOrData === dummyStaff.username && password === dummyStaff.password) {
      const fakeToken = "dummy-token-123456"

      setToken(fakeToken)
      setRole(dummyStaff.role)
      setUser({ username: dummyStaff.username, role: dummyStaff.role })

      localStorage.setItem('token', fakeToken)
      localStorage.setItem('role', dummyStaff.role)
      localStorage.setItem(
        'user',
        JSON.stringify({ username: dummyStaff.username, role: dummyStaff.role })
      )

      return { success: true }
    } else {
      return { success: false, message: "Invalid credentials" }
    }
  }

  const logout = () => {
    setToken(null)
    setRole(null)
    setUser(null)
    localStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, token, role, loading, setLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)