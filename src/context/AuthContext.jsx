import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [role, setRole] = useState({ rol: 'admin' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (currentSession) {
          setSession(currentSession)
          setUser(currentSession.user)
        } else {
          setSession(null)
          setUser(null)
        }

        setLoading(false)
      }
    )

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        setLoading(false)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('Error cerrando sesion:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, role, loading, isAuthenticated: !!session, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}