import { useState, useEffect, useCallback } from 'react'
import { getPlanes, getAllPlanes } from '../services/planesService'

export function usePlanes(gymId) {
  const [planes, setPlanes] = useState([])
  const [allPlanes, setAllPlanes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!gymId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [activosRes, todosRes] = await Promise.all([
        getPlanes(gymId),
        getAllPlanes(gymId),
      ])
      if (activosRes.success) setPlanes(activosRes.data)
      else setError(activosRes.error)

      if (todosRes.success) setAllPlanes(todosRes.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gymId])

  useEffect(() => {
    load()
  }, [load])

  return { planes, allPlanes, loading, error, reload: load }
}