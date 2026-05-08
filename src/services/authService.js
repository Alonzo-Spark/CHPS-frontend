import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/auth'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Axios interceptor for request - attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Axios interceptor for response - handle token refresh on 401
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const refreshTokenValue = localStorage.getItem('refreshToken')
        if (!refreshTokenValue) {
          throw new Error('No refresh token')
        }

        const response = await axios.post(
          `${API_BASE_URL}/refresh-token`,
          { refreshToken: refreshTokenValue },
          { headers: { 'Content-Type': 'application/json' } }
        )

        const { accessToken } = response.data
        localStorage.setItem('accessToken', accessToken)
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        isRefreshing = false

        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
        isRefreshing = false
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  registerUser: async (data) => {
    try {
      const response = await api.post('/register', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed')
    }
  },

  loginUser: async (data) => {
    try {
      const response = await api.post('/login', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed')
    }
  },

  logoutUser: async () => {
    try {
      const token = localStorage.getItem('accessToken')
      await api.post('/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    } catch (error) {
      // For logout, we clear tokens regardless of error
      throw error
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/forgot-password', { email })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send reset link')
    }
  },

  resetPassword: async (data) => {
    try {
      const response = await api.post('/reset-password', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Password reset failed')
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.post('/verify-email', { token })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Email verification failed')
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/refresh-token', { refreshToken })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token refresh failed')
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/me')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user')
    }
  },

  getUserRole: async () => {
    try {
      const response = await api.get('/role')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user role')
    }
  },

  getUserPermissions: async () => {
    try {
      const response = await api.get('/permissions')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch permissions')
    }
  },

  checkAccess: async () => {
    try {
      const response = await api.get('/check-access')
      return response.data
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        window.location.href = '/login'
      }
      throw new Error(error.response?.data?.message || 'Failed to check access')
    }
  },
}