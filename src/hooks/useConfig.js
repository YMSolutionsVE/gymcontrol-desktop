import { useState, useEffect } from 'react'
import { getConfig, updateTasaBcv } from '../services/configService'
import { useAuth } from '../context/AuthContext'

export function useConfig() {
  const { gymId, gymNombre } = useAuth()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = async () => {
    setLoading(true)
    const result = await getConfig(gymId)
    if (result.success && result.data) {
      setConfig(result.data)
    } else {
      // Fallback con nombre del gym del contexto
      setConfig({ nombre_gimnasio: gymNombre })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (gymId) {
      loadConfig()
    }
  }, [gymId])

  const updateTasa = async (nuevaTasa) => {
    const result = await updateTasaBcv(nuevaTasa, gymId)
    if (result.success) {
      setConfig(result.data)
    }
    return result
  }

  return {
    config,
    loading,
    updateTasa,
    reload: loadConfig,
    nombreGimnasio: config?.nombre_gimnasio || gymNombre || 'GymControl'
  }
}