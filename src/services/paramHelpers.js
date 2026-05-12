const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const normalizeStatusParam = (status) => {
  if (!status) return undefined
  return String(status).toUpperCase()
}

export const resolveUuid = (...candidates) => {
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && UUID_PATTERN.test(candidate.trim())) {
      return candidate.trim()
    }
  }
  return null
}

export const buildListParams = (params = {}) => {
  const normalized = { ...params }

  if (normalized.status) {
    normalized.status = normalizeStatusParam(normalized.status)
  }

  if (!normalized.page) normalized.page = 1
  if (!normalized.page_size) normalized.page_size = 10

  return normalized
}
