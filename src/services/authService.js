import apiClient from '../api/axiosInstance'

// API endpoints
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_SET_PASSWORD: '/api/auth/set-password',
  AUTH_VERIFY_EMAIL: '/api/auth/verify-email',
}

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_LOGIN, credentials)
    return response.data
  },

  register: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_REGISTER, userData)
    return response.data
  },

  setPassword: async (payload) => {
    const response = await apiClient.post(API_ENDPOINTS.AUTH_SET_PASSWORD, payload)
    return response.data
  },

  verifyEmail: async (token) => {
    const response = await apiClient.get(`${API_ENDPOINTS.AUTH_VERIFY_EMAIL}/${token}`)
    return response.data
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  },
}
