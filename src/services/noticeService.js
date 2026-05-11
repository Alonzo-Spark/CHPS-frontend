import apiClient from '../api/axiosInstance'

export const noticeService = {
  getNotices: async (params = {}) => {
    const response = await apiClient.get('/notices', { params })
    return response.data
  },

  getNoticeById: async (id) => {
    const response = await apiClient.get(`/notices/${id}`)
    return response.data
  },

  createNotice: async (data) => {
    const response = await apiClient.post('/notices', data)
    return response.data
  },
}
