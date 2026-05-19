import apiService from './api'

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const pickFirst = (...values) => values.find(v => v !== undefined && v !== null)

export const authService = {
  login: (data) => {
    const payload = {
      email: data.username || data.email,
      username: data.username || data.email,
      password: data.password
    }
    return apiService.post('/api/auth/login', payload).then(res => {
      return { data: res };
    });
  },
  verifyToken: () => {
    const token = localStorage.getItem('access_token');
    return apiService.post('/api/auth/verify-token', { token }).then(res => ({ data: res }));
  },
  register: (data) => apiService.post('/api/auth/register', data).then(res => ({ data: res })),
  sendVerification: (data) => apiService.post('/api/auth/send-verification', data).then(res => ({ data: res })),
  verifyEmail: (token) => apiService.get(`/api/auth/verify-email/${token}`).then(res => ({ data: res })),
  setPassword: (data) => apiService.post('/api/auth/set-password', data).then(res => ({ data: res })),
  completeRegistration: (data) => apiService.post('/api/auth/complete-registration', data).then(res => ({ data: res })),
  registrationStatus: (userId) => apiService.get(`/api/auth/registration-status/${userId}`).then(res => ({ data: res }))
}

export const dashboardService = {
  getSummary: () => apiService.get('/api/dashboard/recent-notices/summary').then((res) => {
    const source = res?.summary || res?.data || res || {};
    return {
      data: {
        total_users: toNumber(pickFirst(source.total_users, source.totalUsers, 0)),
        total_notices: toNumber(pickFirst(source.total_notices, source.totalNotices, 0)),
        overdue_count: toNumber(pickFirst(source.overdue_count, source.overdueCount, 0)),
        pending_count: toNumber(pickFirst(source.pending_count, source.pendingCount, 0)),
        completed_count: toNumber(pickFirst(source.completed_count, source.completedCount, 0)),
      }
    };
  }).catch(err => {
    console.warn("Summary API failed, returning zeros", err);
    return {
      data: {
        total_users: 0,
        total_notices: 0,
        overdue_count: 0,
        pending_count: 0,
        completed_count: 0
      }
    };
  }),

  getRecentNotices: ({ limit = 20, offset = 0 } = {}) => 
    apiService.get('/api/dashboard/recent-notices', { params: { limit, offset } })
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("Recent notices API failed, returning empty", err);
        return { data: [] };
      }),

  getAssignments: () => 
    apiService.get('/api/dashboard/recent-notices')
      .then(res => {
        const raw = res?.items || res || [];
        return { data: raw };
      })
      .catch(err => {
        console.warn("Assignments API failed", err);
        return { data: [] };
      }),

  markNoticeRead: (id) => apiService.post(`/api/notices/${id}/mark-read`).then(res => ({ data: res })),
  markAllNoticesRead: () => apiService.post('/api/notices/mark-all-read').then(res => ({ data: res })),
}

export const noticeService = {
  getNotices: () => 
    apiService.get('/api/notices/all')
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("getNotices API failed, returning empty list", err);
        return { data: [] };
      }),

  getNoticeById: (id) => 
    apiService.get(`/api/dashboard/recent-notices/view-notice/${id}`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`getNoticeById API for ${id} failed`, err);
        return { data: null };
      }),

  downloadNoticePdf: (id) => {
    const url = `/api/dashboard/recent-notices/download-pdf/${id}`;
    return apiService.download(url);
  },

  getAdjournment: async (noticeId) => {
    try {
      const res = await apiService.get(`/api/notices/${noticeId}/adjournment`)
      return { data: res }
    } catch (err) {
      console.warn(`getAdjournment API for ${noticeId} failed`, err)
      return { data: null, error: err }
    }
  },

  getResponse: async (noticeId) => {
    try {
      const res = await apiService.get(`/api/notices/${noticeId}/response`)
      return { data: res }
    } catch (err) {
      console.warn(`getResponse API for ${noticeId} failed`, err)
      return { data: null, error: err }
    }
  },

  getProceedingsNotices: (proceedingName) => 
    apiService.get(`/api/proceedings/${encodeURIComponent(proceedingName)}/notices`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`getProceedingsNotices API for ${proceedingName} failed`, err);
        return { data: null };
      }),

  getProceedings: () => 
    apiService.get('/api/proceedings')
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn("getProceedings API failed, returning empty list", err);
        return { data: [] };
      }),
}

export const assignmentService = {
  createAssignment: (data) => apiService.post('/assignments', data).then(res => ({ data: res })),
  reassignNotice: (id, data) => apiService.put(`/assignments/${id}`, data).then(res => ({ data: res })),
}

export const clientService = {
  getClients: () => 
    apiService.get('/api/users')
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("getClients API failed", err);
        return { data: [] };
      }),

  createClient: (data) => 
    apiService.post('/api/users/create-client', data)
      .then(res => ({ data: res })),

  getClientProceedings: async (noticeId) => {
    try {
      const res = await apiService.get(`/api/clients/${noticeId}/proceedings`)
      return { data: res }
    } catch (err) {
      console.warn(`getClientProceedings API for ${noticeId} failed`, err)
      return { data: null, error: err }
    }
  },
}

export const healthService = {
  checkHealth: () => apiService.get('/health').then(res => ({ data: res })),
}

export const userService = {
  getUsers: (params) => 
    apiService.get('/api/users', { params })
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("getUsers API failed", err);
        return { data: [] };
      }),

  runAutoAssignment: () => apiService.post('/api/users/run-auto-assignment').then(res => ({ data: res })),
  assignProfessional: (userId, professionalId) => 
    apiService.put(`/api/users/${userId}/assign-professional`, { professional_id: professionalId }).then(res => ({ data: res })),
}

export const professionalService = {
  getProfessionals: () => 
    apiService.get('/api/professionals')
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("getProfessionals API failed", err);
        return { data: [] };
      }),

  getProfessionalUsers: (id, params) => 
    apiService.get(`/api/professionals/${id}/users`, { params })
      .then(res => ({ data: res })),
}

export const professionalWorkflowService = {
  getWorkflow: async (noticeId) => {
    try {
      const res = await apiService.get(`/api/professional/notice-workflow/${noticeId}`)
      return { data: res }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  updateWorkflow: async (noticeId, payload) => {
    try {
      const res = await apiService.put(`/api/professional/notice-workflow/${noticeId}`, payload)
      return { data: res }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}
