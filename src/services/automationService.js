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

export const automationService = {
  /**
   * Get automation status
   * GET /api/automation/status
   */
  getAutomationStatus: async () => {
    try {
      const response = await api.get('/automation/status')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch automation status')
    }
  },

  /**
   * Get automation results with pagination
   * GET /api/automation/results?page=1&limit=10&status=success&pan=xxx
   */
  getAutomationResults: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()

      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.status) queryParams.append('status', params.status)
      if (params.pan) queryParams.append('pan', params.pan)

      const queryString = queryParams.toString()
      const url = queryString ? `/automation/results?${queryString}` : '/automation/results'

      const response = await api.get(url)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('No automation results found')
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch automation results')
    }
  },

  /**
   * Trigger automation job
   * POST /api/automation/trigger
   */
  triggerAutomationJob: async (data) => {
    try {
      if (!data.user_pan) {
        throw new Error('PAN is required')
      }

      const response = await api.post('/automation/trigger', data)
      return response.data
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('PAN is required')
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Only admin can trigger automation.')
      }
      throw new Error(error.response?.data?.message || 'Failed to trigger automation job')
    }
  },

  /**
   * Get automation job details
   * GET /api/automation/jobs/:jobId
   */
  getAutomationJob: async (jobId) => {
    try {
      if (!jobId) {
        throw new Error('Job ID is required')
      }

      const response = await api.get(`/automation/jobs/${jobId}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Job not found')
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch job details')
    }
  },

  /**
   * Get automation notices
   * GET /api/automation/notices?is_new=true&assessment_year=2021-22
   */
  getAutomationNotices: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()

      if (params.is_new !== undefined) queryParams.append('is_new', params.is_new)
      if (params.assessment_year) queryParams.append('assessment_year', params.assessment_year)
      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)

      const queryString = queryParams.toString()
      const url = queryString ? `/automation/notices?${queryString}` : '/automation/notices'

      const response = await api.get(url)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('No automation notices found')
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch automation notices')
    }
  },

  /**
   * Get automation health status
   * GET /api/automation/health
   */
  getAutomationHealth: async () => {
    try {
      const response = await api.get('/automation/health')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch automation health status')
    }
  },
}
