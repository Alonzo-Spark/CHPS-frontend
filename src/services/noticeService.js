import apiClient from './api'
import { buildListParams } from './paramHelpers'

const extractData = (response) => response?.data?.data || response?.data || {}

export const noticeService = {
  getNotices: async (params = {}) => {
    const response = await apiClient.get('/notices', {
      params: buildListParams(params),
    })
    return extractData(response)
  },

  getNoticeById: async (id) => {
    const response = await apiClient.get(`/notices/${id}`)
    return extractData(response)
  },

  getNoticeOrders: async (id, params = {}) => {
    const response = await apiClient.get(`/notices/${id}/orders`, {
      params: buildListParams(params),
    })
    return extractData(response)
  },

  createNotice: async (data) => {
    const response = await apiClient.post('/notices', data)
    return response.data
  },
}
