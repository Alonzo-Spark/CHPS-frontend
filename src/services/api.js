import axios from 'axios'

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/api'

const normalizeApiBaseUrl = (value) => {
  const trimmed = (value || '').trim().replace(/\/+$/, '')

  if (!trimmed) {
    return DEFAULT_API_BASE_URL
  }

  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
)

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token')

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('username')
      localStorage.removeItem('user')

      if (typeof window !== 'undefined') {
        window.location.replace('/login')
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient