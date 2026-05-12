import apiClient from '../api/axiosInstance'
import { normalizePaginatedResponse } from './responseMappers'
import { buildListParams, normalizeStatusParam } from './paramHelpers'

export const taskService = {
  getStats: async () => {
    const response = await apiClient.get('/dashboard/summary')
    const data = response.data?.data || response.data || {}
    return {
      total_assigned: data.total_assigned ?? 0,
      pending: data.pending_tasks ?? 0,
      overdue: data.overdue_tasks ?? 0,
      completed_today: data.completed_today ?? 0,
    }
  },

  getTasks: async (params = {}) => {
    const response = await apiClient.get('/tasks/', {
      params: buildListParams(params),
    })
    return normalizePaginatedResponse(response.data)
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.post('/tasks/update-status/', { task_id: id, status: normalizeStatusParam(status) })
    return response.data?.data || response.data
  },

  addRemark: async (id, remark) => {
    const response = await apiClient.post('/tasks/add-remark/', { task_id: id, remark })
    return response.data?.data || response.data
  },

  upload: async (id, formData) => {
    const response = await apiClient.post('/tasks/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { task_id: id },
    })
    return response.data?.data || response.data
  },
}
