export const normalizeAssignedProfessional = (item) => {
  if (!item || typeof item !== 'object') {
    return item
  }

  return {
    ...item,
    assigned_professional: item.assigned_professional || item.professional_name || item.assigned_by || null,
  }
}

export const normalizeItemList = (items = []) => {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map(normalizeAssignedProfessional)
}

export const normalizePaginatedResponse = (responseData = {}) => {
  if (!responseData || typeof responseData !== 'object') {
    return responseData
  }

  const data = responseData.data || responseData
  const items = normalizeItemList(data.items || [])

  return {
    ...responseData,
    data: {
      ...data,
      items,
    },
  }
}
