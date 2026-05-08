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

export const databaseService = {
  /**
   * Insert record into database
   * POST /api/database/insert
   */
  insertRecord: async (data) => {
    try {
      if (!data || !data.table) {
        throw new Error('Table name and data are required')
      }

      const response = await api.post('/database/insert', {
        table: data.table,
        data: data.data,
      })
      return response.data
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Invalid insert data')
      }
      if (error.response?.status === 409) {
        throw new Error('Duplicate record detected')
      }
      throw new Error(error.response?.data?.message || 'Failed to insert record')
    }
  },

  /**
   * Update record in database
   * PUT /api/database/update/:id
   */
  updateRecord: async (id, data) => {
    try {
      if (!id) {
        throw new Error('Record ID is required')
      }

      const response = await api.put(`/database/update/${id}`, data)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Record not found')
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid update payload')
      }
      throw new Error(error.response?.data?.message || 'Failed to update record')
    }
  },

  /**
   * Delete record from database
   * DELETE /api/database/delete/:id
   */
  deleteRecord: async (id) => {
    try {
      if (!id) {
        throw new Error('Record ID is required')
      }

      const response = await api.delete(`/database/delete/${id}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Record not found')
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Cannot delete this record.')
      }
      throw new Error(error.response?.data?.message || 'Failed to delete record')
    }
  },

  /**
   * Fetch records from database with pagination
   * GET /api/database/fetch?page=1&limit=10&search=...
   */
  fetchRecords: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams()

      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.sortBy) queryParams.append('sortBy', params.sortBy)
      if (params.order) queryParams.append('order', params.order)
      if (params.search) queryParams.append('search', params.search)

      const queryString = queryParams.toString()
      const url = queryString ? `/database/fetch?${queryString}` : '/database/fetch'

      const response = await api.get(url)
      return {
        records: response.data.data || [],
        totalRecords: response.data.totalRecords || 0,
        page: response.data.page || 1,
        limit: response.data.limit || 10,
        totalPages: Math.ceil((response.data.totalRecords || 0) / (response.data.limit || 10)),
      }
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('Invalid request parameters')
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch records')
    }
  },

  /**
   * Fetch single record by ID
   * GET /api/database/fetch/:id
   */
  getRecordById: async (id) => {
    try {
      if (!id) {
        throw new Error('Record ID is required')
      }

      const response = await api.get(`/database/fetch/${id}`)
      return response.data
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Record not found')
      }
      throw new Error(error.response?.data?.message || 'Failed to fetch record')
    }
  },
}
