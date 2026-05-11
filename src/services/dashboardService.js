import apiClient from '../api/axiosInstance'

export const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats')
    return response.data
  },

  getAssignments: async (params = {}) => {
    const response = await apiClient.get('/dashboard/assignments', { params })
    return response.data
  },
}
