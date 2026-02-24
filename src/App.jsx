import React, { useState, useEffect } from 'react'
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Home from './pages/Home'
import SplashScreen from './components/SplashScreen'
import { supabase } from './config/supabase'

// Limpiar sesion corrupta al iniciar
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    localStorage.clear()
  }
})

export default function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    //  CAMBIADO: 4 segundos para cargar dashboard y BD
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 4000)  // ← Cambié de 2000 a 4000

    return () => clearTimeout(timer)
  }, [])

  if (showSplash) {
    return <SplashScreen />
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/home/*"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}