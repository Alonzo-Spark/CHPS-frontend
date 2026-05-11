import apiClient from '../api/axiosInstance'

export const taskService = {
  getStats: async () => {
    const response = await apiClient.get('/tasks/stats')
    return response.data
  },

  getTasks: async (params = {}) => {
    const response = await apiClient.get('/tasks', { params })
    return response.data
  },

  updateStatus: async (id, status) => {
    const response = await apiClient.post('/tasks/update-status', { task_id: id, status })
    return response.data
  },

  addRemark: async (id, remark) => {
    const response = await apiClient.post('/tasks/add-remark', { task_id: id, remark })
    return response.data
  },

  upload: async (id, formData) => {
    const response = await apiClient.post('/tasks/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: { task_id: id },
    })
    return response.data
  },
}
