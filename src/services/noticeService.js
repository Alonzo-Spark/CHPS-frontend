import apiClient from '../api/axiosInstance'
import { normalizePaginatedResponse } from './responseMappers'
import { buildListParams } from './paramHelpers'

export const noticeService = {
  getNotices: async (params = {}) => {
    const response = await apiClient.get('/notices/', {
      params: buildListParams(params),
    })
    return normalizePaginatedResponse(response.data)
  },

  getNoticeById: async (id) => {
    const response = await apiClient.get(`/notices/${id}/`)
    return normalizePaginatedResponse(response.data)
  },

  createNotice: async (data) => {
    const response = await apiClient.post('/notices/', data)
    return response.data
  },
}
