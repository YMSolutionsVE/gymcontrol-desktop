import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../config/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [gym, setGym] = useState(null)
  const [loading, setLoading] = useState(true)
  const [perfilCargado, setPerfilCargado] = useState(false)

  const cargarPerfilCompleto = useCallback(async (userId) => {
    try {
      const { data: perfil, error: perfilError } = await supabase
        .from('usuarios_roles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (perfilError || !perfil) {
        console.error('Error cargando perfil:', perfilError)
        setPerfilCargado(true)
        return
      }

      if (!perfil.activo) {
        console.warn('Usuario inactivo')
        setPerfilCargado(true)
        return
      }

      setRole(perfil)

      if (!perfil.gym_id) {
        setGym({ nombre: 'YM Solutions', slug: 'ym-demo', en_trial: false })
        setPerfilCargado(true)
        return
      }

      const { data: gimnasio, error: gymError } = await supabase
        .from('gimnasios')
        .select('*')
        .eq('id', perfil.gym_id)
        .single()

      if (gymError || !gimnasio) {
        console.error('Error cargando gimnasio:', gymError)
        setPerfilCargado(true)
        return
      }

      setGym(gimnasio)
      setPerfilCargado(true)
    } catch (error) {
      console.error('Error en cargarPerfilCompleto:', error)
      setPerfilCargado(true)
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setUser(null)
          setRole(null)
          setGym(null)
          setPerfilCargado(false)
          setLoading(false)
          return
        }

        if (event === 'TOKEN_REFRESHED') {
          // Solo actualizar sesión, NO recargar perfil
          setSession(currentSession)
          return
        }

        // INITIAL_SESSION o SIGNED_IN
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)

          // Solo cargar perfil si no se ha cargado ya
          if (!perfilCargado) {
            await cargarPerfilCompleto(currentSession.user.id)
          }
        }

        setLoading(false)
      }
    )

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (!s) {
        setLoading(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [cargarPerfilCompleto, perfilCargado])

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
      setRole(null)
      setGym(null)
      setPerfilCargado(false)
    } catch (error) {
      console.error('Error cerrando sesion:', error)
    }
  }

  // Memoizar el value para evitar re-renders innecesarios
  const value = useMemo(() => ({
    user,
    session,
    role,
    gym,
    loading,
    isAuthenticated: !!session,
    isSuperAdmin: role?.rol === 'superadmin',
    isAdmin: role?.rol === 'admin' || role?.rol === 'superadmin',
    gymId: role?.gym_id || null,
    gymNombre: gym?.nombre || 'GymControl',
    enTrial: gym?.en_trial || false,
    trialEnd: gym?.trial_end || null,
    logout
  }), [user, session, role, gym, loading])

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