const DEFAULT_API_BASE_URL = import.meta.env.DEV ? '/api' : 'http://localhost:8000/api'

const normalizeApiBaseUrl = (value) => {
  const trimmed = (value || '').trim().replace(/\/+$/, '')

  if (!trimmed) {
    return DEFAULT_API_BASE_URL
  }

  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL
)
