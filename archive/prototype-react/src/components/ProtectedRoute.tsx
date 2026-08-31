import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../utils/mockAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' ? '/dashboard' : '/citizen'} replace />
  }

  return <>{children}</>
}
