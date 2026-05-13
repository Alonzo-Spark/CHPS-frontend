import apiClient from './api'
import { resolveUuid } from './paramHelpers'

const extractData = (response) => response?.data?.data || response?.data || {}

export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get('/assignment-notifications')
    return extractData(response)
  },

  markAsRead: async (id) => {
    const notificationId = resolveUuid(id)
    const response = await apiClient.put(`/assignment-notifications/${notificationId}/read`)
    return response.data
  },
}
