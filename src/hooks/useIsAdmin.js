import { useAuth } from '../context/AuthContext'

export function useIsAdmin() {
  const { role, user } = useAuth()

  const isAdmin = role?.rol === 'admin' || role?.rol === 'superadmin'

  return { isAdmin, user }
}