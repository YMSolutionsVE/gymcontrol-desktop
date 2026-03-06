import { useEffect, useState, useCallback } from 'react'
import { getSocios, getSociosByEstado } from '../services/sociosService'

export const useSocios = (gymId) => {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [estado, setEstado] = useState('todos')

  const loadSocios = useCallback(async () => {
    if (!gymId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let result
      if (estado === 'todos') {
        result = await getSocios(gymId)
      } else {
        result = await getSociosByEstado(gymId, estado)
      }

      if (result.success) {
        setSocios(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error('useSocios: error inesperado:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [gymId, estado])

  useEffect(() => {
    loadSocios()
  }, [loadSocios])

  return {
    socios,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    reload: loadSocios,
    setEstado
  }
}
