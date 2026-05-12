import apiClient from '../api/axiosInstance'
import { resolveUuid } from './paramHelpers'

export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get('/assignment-notifications/')
    return response.data
  },

  markAsRead: async (id) => {
    const notificationId = resolveUuid(id)
    const response = await apiClient.put(`/assignment-notifications/${notificationId}/read/`)
    return response.data
  },
}
