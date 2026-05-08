// ─────────────────────────────────────────────────────────────────────────────
// API service layer
// Set VITE_API_URL in your .env to point at your real backend.
// The MOCK block at the top of each function can be deleted once the backend
// is live – every function returns the same shape as the real endpoint.
// ─────────────────────────────────────────────────────────────────────────────

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

// Helper – throws if !response.ok
async function req(path, options = {}) {
  const token = localStorage.getItem('accessToken')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const api = {
  login: async (email, password) => {
    // ── MOCK – remove this block when backend is ready ──────────────────────
    if (email === 'admin@test.com' && password === 'admin123') {
      return {
        token: 'mock-admin-token',
        user: { id: 1, name: 'Marcus Thorne', email, role: 'admin' },
      }
    }
    if (email === 'staff@test.com' && password === 'staff123') {
      return {
        token: 'mock-staff-token',
        user: { id: 2, name: 'Tanu Sharma', email, role: 'staff' },
      }
    }
    // ── END MOCK ─────────────────────────────────────────────────────────────

    // Real call:
    return req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    // Expected response shape: { token: string, user: { id, name, email, role } }
  },

  register: async (data) => {
    // ── MOCK – remove this block when backend is ready ──────────────────────
    return {
      token: 'mock-new-token',
      user: { id: Date.now(), name: data.username, email: data.email, role: 'staff' },
    }
    // ── END MOCK ─────────────────────────────────────────────────────────────

    // Real call:
    // return req('/auth/register', {
    //   method: 'POST',
    //   body: JSON.stringify(data),
    // })
  },

  logout: async () => {
    // Real call (optional server-side token invalidation):
    // return req('/auth/logout', { method: 'POST' })
    return Promise.resolve()
  },

  // ── e-Proceedings ──────────────────────────────────────────────────────────
  getEProceedings: async (tab = 'action') => {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    return []
    // ── END MOCK ─────────────────────────────────────────────────────────────

    // Real call:
    // return req(`/eproceedings?tab=${tab}`)
  },

  // ── Notices ────────────────────────────────────────────────────────────────
  getNotices: async () => {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    return []
    // ── END MOCK ─────────────────────────────────────────────────────────────

    // Real call:
    // return req('/notices')
  },

  // ── Admin staff list ───────────────────────────────────────────────────────
  getStaffList: async () => {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    return []
    // ── END MOCK ─────────────────────────────────────────────────────────────

    // Real call:
    // return req('/admin/staff')
  },

  // ── Admin global audit overview ────────────────────────────────────────────
  getGlobalAudit: async () => {
    // ── MOCK ─────────────────────────────────────────────────────────────────
    return []
    // ── END MOCK ─────────────────────────────────────────────────────────────

    // Real call:
    // return req('/admin/global-audit')
  },
}

export default api
