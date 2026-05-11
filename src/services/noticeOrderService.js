import apiClient from '../api/axiosInstance'

export const noticeOrderService = {
  getOrders: async (proceedingId, params = {}) => {
    const response = await apiClient.get(`/notices/${proceedingId}/orders`, { params })
    return response.data
  },

  getProceeding: async (proceedingId) => {
    const response = await apiClient.get(`/notices/${proceedingId}`)
    return response.data
  },
}
