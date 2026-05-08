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

export const noticeService = {
  getFilteredNotices: async (filters = {}) => {
    try {
      const params = new URLSearchParams()

      if (filters.assessment_year) {
        params.append('assessment_year', filters.assessment_year)
      }
      if (filters.financial_year) {
        params.append('financial_year', filters.financial_year)
      }
      if (filters.is_new !== undefined) {
        params.append('is_new', filters.is_new)
      }
      if (filters.sortBy) {
        params.append('sortBy', filters.sortBy)
      }
      if (filters.order) {
        params.append('order', filters.order)
      }
      if (filters.page) {
        params.append('page', filters.page)
      }
      if (filters.limit) {
        params.append('limit', filters.limit)
      }

      const queryString = params.toString()
      const url = queryString ? `/notices?${queryString}` : '/notices'

      const response = await api.get(url)
      return response.data
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Invalid filter parameters')
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied')
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch notices')
    }
  },

  getNoticeById: async (id) => {
    try {
      const response = await api.get(`/notices/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notice')
    }
  },

  downloadNotice: async (id) => {
    try {
      const response = await api.get(`/notices/${id}/download`, {
        responseType: 'blob',
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to download notice')
    }
  },
}
