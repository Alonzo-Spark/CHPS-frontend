import api from '../api/axios'

export const authService = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  setPassword: (data) => api.post('/auth/set-password', data),
}

export const healthService = {
  checkHealth: () => api.get('/health'),
}

export const userService = {
  getUsers: (params) => api.get('/api/users', { params }),
  runAutoAssignment: () => api.post('/api/users/run-auto-assignment'),
  assignProfessional: (userId, professionalId) => 
    api.put(`/api/users/${userId}/assign-professional`, { professional_id: professionalId }),
}

export const professionalService = {
  getProfessionalUsers: (id, params) => api.get(`/api/professionals/${id}/users`, { params }),
}

export const dashboardService = {
  getSummary: () => api.get('/staff/dashboard-summary'),
  getAssignments: (params) => api.get('/staff/assignments', { params }),
}

export const noticeService = {
  getNotices: () => api.get('/staff/notices'),
  getNoticeById: (id) => api.get(`/staff/notices/${id}`),
  getProceedings: () => api.get('/staff/proceedings'),
}

export const clientService = {
  getClients: () => api.get('/clients'),
  createClient: (data) => api.post('/clients', data),
}

