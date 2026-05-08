import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/users'

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

export const userService = {
  createUser: async (data) => {
    try {
      const response = await api.post('/', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create user')
    }
  },

  getAllUsers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString()
      const url = queryString ? `/?${queryString}` : '/'
      const response = await api.get(url)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users')
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch user')
    }
  },

  updateUser: async (id, data) => {
    try {
      const response = await api.put(`/${id}`, data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user')
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/${id}`)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete user')
    }
  },

  getUserProfile: async () => {
    try {
      const response = await api.get('/profile')
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch profile')
    }
  },

  updateUserProfile: async (data) => {
    try {
      const response = await api.put('/profile', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update profile')
    }
  },

  updateUserStatus: async (id, status) => {
    try {
      const response = await api.patch(`/${id}/status`, { status })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user status')
    }
  },

  updateUserRole: async (id, role) => {
    try {
      const response = await api.patch(`/${id}/role`, { role })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user role')
    }
  },

  updateUserPreferences: async (data) => {
    try {
      const response = await api.put('/preferences', data)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update preferences')
    }
  },
}
