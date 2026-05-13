import apiClient from './api'
import { buildListParams } from './paramHelpers'

const extractData = (response) => response?.data?.data || response?.data || {}

export const dashboardService = {
  getStats: async () => {
    try {
      const response = await apiClient.get('/dashboard/summary')
      const data = extractData(response)
      return {
        total_assigned: data.total_assigned ?? 0,
        pending_tasks: data.pending_tasks ?? 0,
        recently_updated: data.recently_updated ?? 0,
        completed_today: data.completed_today ?? 0,
        overdue: data.overdue ?? data.overdue_tasks ?? 0,
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('dashboardService.getStats error', err)
      return {
        total_assigned: 0,
        pending_tasks: 0,
        recently_updated: 0,
        completed_today: 0,
        overdue: 0,
      }
    }
  },

  getRecentNotices: async (params = {}) => {
    try {
      const response = await apiClient.get('/dashboard/recent-notices', {
        params: buildListParams(params),
      })
      return extractData(response)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('dashboardService.getRecentNotices error', err)
      return { items: [] }
    }
  },

  getProfessionalStats: async () => {
    try {
      const response = await apiClient.get('/assignments/professional-stats')
      return extractData(response)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('dashboardService.getProfessionalStats error', err)
      return []
    }
  },

  getAssignments: async (params = {}) => {
    try {
      const response = await apiClient.get('/assignments/', {
        params: buildListParams(params),
      })
      return extractData(response)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('dashboardService.getAssignments error', err)
      return { items: [], current_page: params.page || 1, page_size: params.page_size || 10, total_pages: 0, total_count: 0 }
    }
  },

  getAssignmentById: async (assignmentId) => {
    try {
      const response = await apiClient.get(`/assignments/${assignmentId}`)
      return extractData(response)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('dashboardService.getAssignmentById error', err)
      return {}
    }
  },
}
