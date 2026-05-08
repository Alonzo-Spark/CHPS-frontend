import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/admin'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach token from storage
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

export const adminService = {
  getAnalytics: async () => {
    try {
      const response = await api.get('/analytics')
      return response.data
    } catch (error) {
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin or moderator only.')
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch analytics')
    }
  },
}
