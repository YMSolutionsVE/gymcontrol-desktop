import { useState, useEffect } from 'react'
import { getConfig, updateTasasCambio } from '../services/configService'
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
      setConfig({ nombre_gimnasio: gymNombre })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (gymId) {
      loadConfig()
    }
  }, [gymId])

  const updateRates = async (tasas) => {
    const result = await updateTasasCambio(tasas, gymId)
    if (result.success) {
      setConfig(result.data)
    }
    return result
  }

  return {
    config,
    loading,
    updateRates,
    reload: loadConfig,
    nombreGimnasio: config?.nombre_gimnasio || gymNombre || 'GymControl'
  }
}
