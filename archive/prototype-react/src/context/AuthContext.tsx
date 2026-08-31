import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import {
  AUTH_STORAGE_KEY,
  validateCredentials,
  type AuthUser,
  type UserRole,
} from '../utils/mockAuth'

interface AuthContextValue {
  user: AuthUser | null
  role: UserRole | null
  isAuthenticated: boolean
  login: (username: string, password: string) => { ok: true } | { ok: false; error: string }
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadStoredUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadStoredUser)

  const login = useCallback((username: string, password: string) => {
    const result = validateCredentials(username, password)
    if (!result) {
      return { ok: false as const, error: 'Invalid credentials, please try again' }
    }
    setUser(result)
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result))
    return { ok: true as const }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: user !== null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
