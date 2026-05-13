import apiClient from './api'

// API endpoints
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_SET_PASSWORD: '/auth/set-password',
  AUTH_VERIFY_EMAIL: '/auth/verify-email',
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
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('username')
    localStorage.removeItem('user')
  },
}
