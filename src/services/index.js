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
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    if (!token || token === 'undefined' || token === 'null') {
      return Promise.reject(new Error("No valid token"));
    }
    return apiService.post('/api/auth/verify-token', { token }).then(res => ({ data: res }));
  },
  register: (data) => {
    const roleLower = (data.role || '').toLowerCase();
    const mappedRole = (roleLower === 'professor' || roleLower === 'professional') ? 'professional' : roleLower || 'staff';
    const payload = {
      full_name: data.username || data.full_name || '',
      email: data.email,
      phone_number: data.phone_number,
      role: mappedRole
    };
    return apiService.post('/api/auth/register', payload).then(res => ({ data: res }));
  },
  sendVerification: (data) => apiService.post('/api/auth/send-verification', data).then(res => ({ data: res })),
  verifyEmail: (token) => apiService.get(`/api/auth/verify-email/${token}`).then(res => ({ data: res })),
  setPassword: (data) => apiService.post('/api/auth/set-password', data).then(res => ({ data: res })),
  completeRegistration: (data) => apiService.post('/api/auth/complete-registration', data).then(res => ({ data: res })),
  registrationStatus: (userId) => apiService.get(`/api/auth/registration-status/${userId}`).then(res => ({ data: res })),
  approveRegistration: (token) => apiService.get(`/api/auth/approve-registration/${token}`).then(res => ({ data: res })),
  rejectRegistration: (token) => apiService.get(`/api/auth/reject-registration/${token}`).then(res => ({ data: res }))
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

  getRecentNotices: () =>
    apiService.get('/api/dashboard/recent-notices')
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        return { data: [] };
      }),

  getAssignments: () =>
    apiService.get('/api/dashboard/recent-notices')
      .then(res => {
        const raw = res?.items || res || [];
        return { data: raw };
      })
      .catch(err => {
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
        return { data: [] };
      }),

  getNoticeById: (id) =>
    apiService.get(`/api/dashboard/recent-notices/view-notice/${id}`)
      .then(res => {
        console.log('✅ getNoticeById SUCCESS for ID:', id)
        console.log('✅ Response:', res)
        return { data: res }
      })
      .catch(err => {
        console.error('❌ getNoticeById ERROR for ID:', id)
        console.error('❌ Error status:', err.response?.status)
        console.error('❌ Error message:', err.response?.data?.detail || err.message)
        console.error('❌ Full error:', err)
        return { data: null, error: err };
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

  updateNoticeStatus: async (noticeId, payload) => {
    try {
      const res = await apiService.put(`/api/notices/${noticeId}/status`, payload)
      return { data: res }
    } catch (err) {
      console.warn(`updateNoticeStatus API for ${noticeId} failed`, err)
      return { data: null, error: err }
    }
  },

  getProceedings: () =>
    apiService.get('/api/proceedings')
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn("getProceedings API failed, returning empty list", err);
        return { data: [] };
      }),

  blockYear: (role, assessmentYear) =>
    apiService.post('/api/notices/block-year', {
      role,
      assessment_year: assessmentYear
    })
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`blockYear API failed for ${assessmentYear}`, err);
        return { data: null, error: err };
      }),

  unblockYear: (role, assessmentYear) =>
    apiService.post('/api/notices/unblock-year', {
      role,
      assessment_year: assessmentYear
    })
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`unblockYear API failed for ${assessmentYear}`, err);
        return { data: null, error: err };
      }),

  getBlockedNotices: (role) =>
    apiService.get(`/api/notices/blocked?role=${role}`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`getBlockedNotices API failed for ${role}`, err);
        return { data: [] };
      }),
}

export const assignmentService = {
  createAssignment: (data) => apiService.post('/assignments', data).then(res => ({ data: res })),
  reassignNotice: (id, data) => apiService.put(`/assignments/${id}`, data).then(res => ({ data: res })),
  searchAssignments: (params) => apiService.get('/api/admin/assignments/search', { params }).then(res => ({ data: res })),
}

export const clientService = {
  getClients: () => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const isProfessional = String(parsedUser?.role).toUpperCase() === 'PROFESSIONAL' || String(parsedUser?.user_type).toUpperCase() === 'PROFESSIONAL';
    const profId = isProfessional ? (parsedUser?.id || parsedUser?.professional_id) : null;
    const endpoint = profId ? `/api/professionals/${profId}/users` : '/api/users';

    return apiService.get(endpoint)
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("getClients API failed", err);
        return { data: [] };
      });
  },

  createClient: (data) => {
    const payload = {
      name: data.name,
      pan: data.pan,
      password: data.password,
      email: data.email,
      phone_number: data.phone_number || data.referred_by_phone || '9876543210',
      professional_id: Number(data.professional_id)
    };
    return apiService.post('/api/users/create-client', payload).then(res => ({ data: res }));
  },

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

export const adminService = {
  getProfessionalsCount: () => apiService.get('/api/admin/users/count/professionals').then(res => ({ data: res })),
  getClientsCount: () => apiService.get('/api/admin/users/count/clients').then(res => ({ data: res })),
  getProfessionalClients: (professionalId) => apiService.get(`/api/professional/client/${professionalId}`).then(res => ({ data: res })),
}

export const healthService = {
  checkHealth: () => apiService.get('/health').then(res => ({ data: res })),
}

export const userService = {
  getUsers: (params) => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const isProfessional = String(parsedUser?.role).toUpperCase() === 'PROFESSIONAL' || String(parsedUser?.user_type).toUpperCase() === 'PROFESSIONAL';
    const profId = isProfessional ? (parsedUser?.id || parsedUser?.professional_id) : null;
    const endpoint = profId ? `/api/professionals/${profId}/users` : '/api/users';

    return apiService.get(endpoint, { params })
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("getUsers API failed", err);
        return { data: [] };
      });
  },

  blockUser: (userId) => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const isProfessional = String(parsedUser?.role).toUpperCase() === 'PROFESSIONAL' || String(parsedUser?.user_type).toUpperCase() === 'PROFESSIONAL';
    
    if (isProfessional) {
      return apiService.put(`/api/v1/professional/clients/${userId}/disable`)
        .then(res => ({ data: res }))
        .catch(err => {
          console.warn(`Disable client API failed for ${userId}`, err);
          throw err;
        });
    }
    
    return apiService.put('/api/admin/users/block', { user_id: userId })
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`blockUser API failed for ${userId}`, err);
        throw err;
      });
  },

  unblockUser: (userId) => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const isProfessional = String(parsedUser?.role).toUpperCase() === 'PROFESSIONAL' || String(parsedUser?.user_type).toUpperCase() === 'PROFESSIONAL';
    
    if (isProfessional) {
      return apiService.put(`/api/v1/professional/clients/${userId}/enable`)
        .then(res => ({ data: res }))
        .catch(err => {
          console.warn(`Enable client API failed for ${userId}`, err);
          throw err;
        });
    }

    return apiService.put('/api/admin/users/unblock', { user_id: userId })
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`unblockUser API failed for ${userId}`, err);
        throw err;
      });
  },

  deleteUser: (userId) => {
    const storedUser = localStorage.getItem('user');
    const parsedUser = storedUser ? JSON.parse(storedUser) : null;
    const isProfessional = String(parsedUser?.role).toUpperCase() === 'PROFESSIONAL' || String(parsedUser?.user_type).toUpperCase() === 'PROFESSIONAL';
    
    if (isProfessional) {
      return apiService.delete(`/api/v1/professional/clients/${userId}`)
        .then(res => ({ data: res }))
        .catch(err => {
          console.warn(`Delete client API failed for ${userId}`, err);
          throw err;
        });
    }

    return apiService.delete(`/api/admin/users/${userId}`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`deleteUser API failed for ${userId}`, err);
        throw err;
      });
  },

  runAutoAssignment: () => apiService.post('/api/users/run-auto-assignment').then(res => ({ data: res })),
  assignProfessional: (userId, professionalId) =>
    apiService.put(`/api/users/${userId}/assign-professional`, { professional_id: professionalId }).then(res => ({ data: res })),
}

export const professionalService = {
  getProfessionals: () =>
    apiService.get('/api/clients')
      .then(res => ({ data: res?.items || res || [] }))
      .catch(err => {
        console.warn("getProfessionals API failed", err);
        return { data: [] };
      }),

  getProfessionalUsers: (id, params) =>
    apiService.get(`/api/clients/${id}/users`, { params })
      .then(res => ({ data: res })),

  getProceedingsForAction: (params) =>
    apiService.get('/api/professional/proceedings/for-action', { params })
      .then(res => ({ data: res }))
      .catch(err => {
        console.error('getProceedingsForAction API failed:', err)
        return { data: { data: [] } }
      }),

  getProceedingsForInformation: (params) =>
    apiService.get('/api/professional/proceedings/for-information', { params })
      .then(res => ({ data: res }))
      .catch(err => {
        console.error('getProceedingsForInformation API failed:', err)
        return { data: { data: [] } }
      }),

  // Fetch notices for a professional proceeding by proceeding ID
  getProceedingNoticesById: (proceedingId) =>
    apiService.get(`/api/professional/proceedings/${proceedingId}/notices`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.error(`getProceedingNoticesById API failed for ${proceedingId}:`, err)
        return { data: null, error: err }
      }),
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
  },

  addActivity: async (noticeId, payload) => {
    try {
      const res = await apiService.post(`/api/professional/notice-workflow/${noticeId}/activity`, payload)
      return { data: res }
    } catch (err) {
      return { data: null, error: err }
    }
  }
}

export const professionalDashboardService = {
  getRecentNotices: ({ limit = 20, offset = 0 } = {}) =>
    apiService.get('/api/professional/dashboard/recent-notices', { params: { limit, offset } })
      .then(res => ({ data: res?.recent_notices || res?.items || res || [] }))
      .catch(err => {
        return { data: [] };
      }),

  getNoticeDetail: (noticeId) =>
    apiService.get(`/api/professional/dashboard/view-notice/${noticeId}`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.error(`getNoticeDetail API failed for ${noticeId}:`, err);
        return { data: null, error: err };
      }),
}

export const noticeControlService = {
  getNoticeControl: (clientId) =>
    apiService.get(`/api/notice-control/${clientId}`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`getNoticeControl API for client ${clientId} failed`, err)
        return { data: null, error: err }
      }),

  blockYears: (clientId, years) =>
    apiService.post('/api/notice-control/block', { client_id: clientId, years })
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`blockYears API for client ${clientId} failed`, err)
        return { data: null, error: err }
      }),

  unblockYears: (clientId, years) =>
    apiService.post('/api/notice-control/unblock', { client_id: clientId, years })
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`unblockYears API for client ${clientId} failed`, err)
        return { data: null, error: err }
      }),
}

export const professionalClientService = {
  getClients: () =>
    apiService.get('/api/v1/professional/clients')
      .then(res => ({ data: res?.data || res || [] }))
      .catch(err => {
        console.warn("get professional clients API failed", err)
        return { data: [] }
      }),

  disableClient: (clientId) =>
    apiService.put(`/api/v1/professional/clients/${clientId}/disable`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`disable client API failed for ${clientId}`, err)
        throw err
      }),

  enableClient: (clientId) =>
    apiService.put(`/api/v1/professional/clients/${clientId}/enable`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`enable client API failed for ${clientId}`, err)
        throw err
      }),

  deleteClient: (clientId) =>
    apiService.delete(`/api/v1/professional/clients/${clientId}`)
      .then(res => ({ data: res }))
      .catch(err => {
        console.warn(`delete client API failed for ${clientId}`, err)
        throw err
      }),
}
