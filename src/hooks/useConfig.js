import { useState, useEffect } from 'react'
import { getConfig, updateTasaBcv } from '../services/configService'

export function useConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadConfig = async () => {
    setLoading(true)
    const result = await getConfig()
    if (result.success) {
      setConfig(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const updateTasa = async (nuevaTasa) => {
    const result = await updateTasaBcv(nuevaTasa)
    if (result.success) {
      setConfig(result.data)
    }
    return result
  }

  return { config, loading, updateTasa, reload: loadConfig }
}