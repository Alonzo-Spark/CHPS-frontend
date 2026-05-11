import axios from 'axios'
import toast from 'react-hot-toast'

const DEFAULT_ORIGIN = 'http://127.0.0.1:8000'
const API_PREFIX = '/api'
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/send-verification',
  '/auth/verify-email',
  '/auth/complete-registration',
]

export const authPayloads = {
  login: ({ emailOrUsername, password }) => ({
    email_or_username: emailOrUsername,
    password,
  }),
  register: ({ full_name, email, phone_number, role }) => ({
    full_name,
    email,
    phone_number,
    role,
  }),
  sendVerification: ({ email }) => ({
    email,
  }),
  verifyEmail: ({ token }) => ({
    token,
  }),
  completeRegistration: ({ token, password, confirm_password }) => ({
    token,
    password,
    confirm_password,
  }),
}

function normalizeBaseUrl(rawUrl) {
  const trimmed = (rawUrl || DEFAULT_ORIGIN).trim().replace(/\/+$/, '')
  return trimmed.endsWith(API_PREFIX) ? trimmed : `${trimmed}${API_PREFIX}`
}

function normalizeErrorMessage(error) {
  const status = error.response?.status
  const detail = error.response?.data?.detail

  if (!error.response) {
    return 'Network error. Please check your connection and try again.'
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => `${item.loc?.[item.loc.length - 1] || 'field'}: ${item.msg}`).join(', ')
  }

  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (status === 404) return 'Requested endpoint was not found.'
  if (status === 409) return 'An account with this email already exists.'
  if (status === 400 || status === 422) return 'Please correct the highlighted fields and try again.'
  if (status === 500) return 'The server could not complete the request. Please try again.'

  return error.message || 'An unexpected error occurred.'
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL,
)

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('audit_token')
  const requestUrl = String(config.url || '')
  const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((path) => requestUrl.includes(path))

  if (token && !isPublicAuthCall) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = normalizeErrorMessage(error)

    error.normalizedMessage = message
    error.status = error.response?.status

    console.error('[api] request failed', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message,
    })

    toast.error(message)
    return Promise.reject(error)
  },
)

async function postJson(path, payload, label) {
  console.debug(`[api] ${label} request`, {
    url: `${API_BASE_URL}${path}`,
    payload,
  })

  const { data } = await axiosInstance.post(path, payload)

  console.debug(`[api] ${label} response`, data)
  return data
}

export const api = {
  login: async (emailOrUsername, password) => {
    return postJson('/auth/login', authPayloads.login({ emailOrUsername, password }), 'login')
  },
  register: async (payload) => {
    return postJson('/auth/register', authPayloads.register(payload), 'register')
  },
  sendVerification: async ({ email }) => {
    return postJson('/auth/send-verification', authPayloads.sendVerification({ email }), 'send-verification')
  },
  verifyEmail: async ({ token, email }) => {
    console.debug(`[api] verify-email request`, {
      url: `${API_BASE_URL}/auth/verify-email/${encodeURIComponent(token)}`,
      token,
      email,
    })

    const { data } = await axiosInstance.get(`/auth/verify-email/${encodeURIComponent(token)}`, {
      params: email ? { email } : undefined,
    })

    console.debug('[api] verify-email response', data)
    return data
  },
  completeRegistration: async ({ token, password, confirm_password }) => {
    return postJson(
      '/auth/complete-registration',
      authPayloads.completeRegistration({ token, password, confirm_password }),
      'complete-registration',
    )
  },
  getUsers: async () => {
    const { data } = await axiosInstance.get('/users')
    return data
  },
  logout: async () => {
    return Promise.resolve()
  },
  getEProceedings: async (tab = 'action') => [],
  getNotices: async () => [],
  getStaffList: async () => [],
  getGlobalAudit: async () => [],
}

export default api
