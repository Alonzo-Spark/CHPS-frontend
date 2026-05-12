import apiClient from '../api/axiosInstance'
import { normalizePaginatedResponse } from './responseMappers'
import { buildListParams } from './paramHelpers'

export const dashboardService = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/summary')
    const data = response.data?.data || response.data || {}
    return {
      ...data,
      overdue: data.overdue ?? data.overdue_tasks ?? 0,
    }
  },

  getRecentNotices: async (params = {}) => {
    const response = await apiClient.get('/dashboard/recent-notices/', {
      params: buildListParams(params),
    })
    return normalizePaginatedResponse(response.data)
  },

  getViewNotice: async (proceedingId) => {
    const response = await apiClient.get(`/dashboard/view-notice/${proceedingId}/`)
    return normalizePaginatedResponse(response.data)
  },

  getAssignments: async (params = {}) => {
    const response = await apiClient.get('/assignments/', {
      params: buildListParams(params),
    })
    return normalizePaginatedResponse(response.data)
  },
}
