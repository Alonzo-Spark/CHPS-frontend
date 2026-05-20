import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('access_token')
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    // On 429/5xx, you might want to show a notification/toast here
    return Promise.reject(err)
  }
)

export default api

