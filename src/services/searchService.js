import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

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

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const searchService = {
  search: async (query, type = 'notices') => {
    try {
      if (!query || query.trim().length === 0) {
        throw new Error('Search query is required')
      }

      const params = new URLSearchParams()
      params.append('query', query)
      if (type) params.append('type', type)

      const response = await api.get(`/search?${params.toString()}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Search query is required')
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied')
      }
      throw new Error(error.response?.data?.message || 'Search failed')
    }
  },
}
