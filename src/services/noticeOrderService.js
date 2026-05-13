import apiClient from './api'
import { buildListParams } from './paramHelpers'

const extractData = (response) => response?.data?.data || response?.data || {}

export const noticeOrderService = {
  getOrders: async (proceedingId, params = {}) => {
    const response = await apiClient.get(`/notices/${proceedingId}/orders`, {
      params: buildListParams(params),
    })
    return extractData(response)
  },

  getProceeding: async (proceedingId) => {
    const response = await apiClient.get(`/notices/${proceedingId}`)
    return extractData(response)
  },
}
