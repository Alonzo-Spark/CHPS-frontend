import api from '../api/axios'

export const authService = {
  login: (data) => {
    const payload = {
      username: data.username,
      password: data.password,
    }
    return api.post('/api/auth/login', payload, {
      headers: { 'Content-Type': 'application/json' }
    })
  },
  register: (data) => api.post('/auth/register', data),
  setPassword: (data) => api.post('/auth/set-password', data),
}

export const dashboardService = {
  getSummary: () => api.get('api/dashboard/summary')  

}

export const noticeService = {
  getNotices: () => api.get('/staff/notices'),
  getNoticeById: (id) => api.get(`/staff/notices/${id}`),
  getProceedings: () => api.get('/staff/proceedings'),
}

export const assignmentService = {
  createAssignment: (data) => api.post('/assignments', data),
  reassignNotice: (id, data) => api.put(`/assignments/${id}`, data),
}

export const clientService = {
  getClients: () => api.get('/clients'),
  createClient: (data) => api.post('/clients', data),
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


