import { useEffect, useState, useCallback } from 'react'
import { getSocios, getSociosByEstado } from '../services/sociosService'

export const useSocios = () => {
  const [socios, setSocios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [estado, setEstado] = useState('todos')

  const loadSocios = useCallback(async () => {
    setLoading(true)
    setError(null)

    let result

    if (estado === 'todos') {
      result = await getSocios(searchTerm)
    } else {
      result = await getSociosByEstado(estado)
    }

    if (result.success) {
      setSocios(result.data)
    } else {
      setError(result.error)
    }

    setLoading(false)
  }, [searchTerm, estado])

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
