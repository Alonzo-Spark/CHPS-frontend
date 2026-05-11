import { useState, useEffect, useCallback } from 'react'

const useApi = (apiFunc, params = null, deps = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (overrideParams) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFunc(overrideParams ?? params)
      setData(result)
      return result
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'An error occurred')
      return null
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (params !== null || deps.length === 0) {
      execute()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute])

  return { data, loading, error, refetch: execute }
}

export default useApi
