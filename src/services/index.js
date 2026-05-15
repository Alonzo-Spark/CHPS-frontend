import api from '../api/axios'

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const pickFirst = (...values) => values.find(v => v !== undefined && v !== null)

const normalizeDashboardSummary = (payload) => {
  const source = payload?.summary || payload?.data || payload || {}

  return {
    total_users: toNumber(
      pickFirst(source.total_users, source.totalUsers, source.users_total, source.totalUsersCount, source.total)
    ),
    pending_notices: toNumber(
      pickFirst(source.pending_notices, source.pendingNotices, source.pending_tasks, source.pendingTasks, source.pending)
    ),
    active_users: toNumber(
      pickFirst(source.active_users, source.activeUsers, source.users_active, source.activeUsersCount, source.active)
    ),
    total_notices: toNumber(
      pickFirst(source.total_notices, source.totalNotices, source.notices_total, source.noticeCount, source.total_cases)
    ),
    // New backend fields requested
    total_assigned: toNumber(
      pickFirst(source.total_assigned, source.totalAssigned, source.assigned_total)
    ),
    pending_tasks: toNumber(
      pickFirst(source.pending_tasks, source.pendingTasks, source.pending_tasks_count)
    ),
    recently_updated: toNumber(
      pickFirst(source.recently_updated, source.recentlyUpdated, source.recent_updates)
    ),
  }
}

export const authService = {
  login: (data) => {
    const payload = {
      username: data.username,
      password: data.password
    }
    return api.post('/api/auth/login', payload, {
      headers: { 'Content-Type': 'application/json' }
    })
  },
  register: (data) => api.post('/auth/register', data),
  setPassword: (data) => api.post('/auth/set-password', data),
}

export const dashboardService = {
  getSummary: () => api.get('/api/dashboard/summary').then((res) => ({
    ...res,
    data: normalizeDashboardSummary(res.data),
  })),
  getRecentNotices: ({ limit = 20, offset = 0, since } = {}) => {
    const params = { limit, offset }
    if (since) params.since = since
    return api.get('/api/dashboard/recent-notices', { params })
  },
  markNoticeRead: (id) => api.post(`/api/notices/${id}/mark-read`),
  markAllNoticesRead: () => api.post('/api/notices/mark-all-read'),
}

export const noticeService = {
  // Get all notices/proceedings list
  getNotices: () => api.get('/api/notices'),

  // Get single notice detail
  getNoticeById: (id) => api.get(`/api/dashboard/view-notice/${id}`),

  // Get notice orders/timeline/proceedings history
  getProceedings: (id) => api.get(`/api/notices/${id}/orders`),

  // Download/Open PDF
  downloadNoticePdf: (id) =>
    window.open(`http://localhost:8000/api/notices/${id}/download`, '_blank'),
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


