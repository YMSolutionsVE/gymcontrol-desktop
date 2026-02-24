import { useAuth } from '../context/AuthContext'

export function useIsAdmin() {
  const { role, user } = useAuth()
  
  const isAdmin = role?.rol === 'admin'
  
  return { isAdmin, user }
}