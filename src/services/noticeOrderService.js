import apiClient from '../api/axiosInstance'
import { normalizePaginatedResponse } from './responseMappers'
import { buildListParams } from './paramHelpers'

export const noticeOrderService = {
  getOrders: async (proceedingId, params = {}) => {
    const response = await apiClient.get(`/notices/${proceedingId}/orders/`, {
      params: buildListParams(params),
    })
    return normalizePaginatedResponse(response.data)
  },

  getProceeding: async (proceedingId) => {
    const response = await apiClient.get(`/dashboard/view-notice/${proceedingId}/`)
    return normalizePaginatedResponse(response.data)
  },
}
