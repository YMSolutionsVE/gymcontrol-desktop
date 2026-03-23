import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../config/supabase'
import { getSessionProfile } from '../services/sessionProfileService'
import { buildDisplayGymProfile, getCommercialNotice, getGymAccessState } from '../lib/gymAccess'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [gym, setGym] = useState(null)
  const [linkedGym, setLinkedGym] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilCargado, setPerfilCargado] = useState(false)

  const clearProfileState = useCallback(() => {
    setUser(null)
    setSession(null)
    setRole(null)
    setGym(null)
    setLinkedGym(null)
    setPerfilCargado(false)
  }, [])

  const cargarPerfilCompleto = useCallback(async (userId) => {
    try {
      const { role: perfil, gym: gimnasio } = await getSessionProfile(userId)

      if (!perfil) {
        console.warn('No se encontro un perfil activo para el usuario actual')
        setPerfilCargado(true)
        return
      }

      const accessState = getGymAccessState(perfil, gimnasio)
      if (!accessState.allowed) {
        console.warn(accessState.message)
        await supabase.auth.signOut()
        clearProfileState()
        setLoading(false)
        return
      }

      const gymToShow = buildDisplayGymProfile(perfil, gimnasio)

      setRole(perfil)
      setLinkedGym(gimnasio || null)
      setGym(gymToShow || null)
      setPerfilCargado(true)
    } catch (error) {
      console.error('Error en cargarPerfilCompleto:', error)
      setPerfilCargado(true)
    }
  }, [clearProfileState])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_OUT') {
          clearProfileState()
          setLoading(false)
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          setSession(currentSession)
          return
        }

        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)

          if (!perfilCargado) {
            await cargarPerfilCompleto(currentSession.user.id)
          }
        }

        setLoading(false)
      }
    )

    supabase.auth.getSession().then(async ({ data: { session: storedSession } }) => {
      if (!storedSession) {
        setLoading(false)
        return
      }

      setSession(storedSession)
      setUser(storedSession.user)

      if (!perfilCargado) {
        await cargarPerfilCompleto(storedSession.user.id)
      }

      setLoading(false)
    })

    return () => subscription?.unsubscribe()
  }, [cargarPerfilCompleto, clearProfileState, perfilCargado])

  const logout = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      clearProfileState()
    } catch (error) {
      console.error('Error cerrando sesion:', error)
    }
  }, [clearProfileState])

  const value = useMemo(() => ({
    user,
    session,
    role,
    gym,
    linkedGym,
    loading,
    isAuthenticated: !!session,
    isSuperAdmin: role?.rol === 'superadmin',
    isAdmin: role?.rol === 'admin' || role?.rol === 'superadmin',
    gymId: role?.gym_id || null,
    gymNombre: gym?.nombre || 'GymControl',
    enTrial: linkedGym?.en_trial || gym?.en_trial || false,
    trialEnd: linkedGym?.trial_end || gym?.trial_end || null,
    commercialNotice: getCommercialNotice(role, linkedGym || gym),
    logout,
  }), [user, session, role, gym, linkedGym, loading, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
