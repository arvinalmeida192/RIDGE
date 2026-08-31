export type UserRole = 'admin' | 'citizen'

export interface AuthUser {
  role: UserRole
  username: string
}

const CREDENTIALS: Record<string, UserRole> = {
  admin: 'admin',
  user: 'citizen',
}

export function validateCredentials(
  username: string,
  password: string,
): AuthUser | null {
  const role = CREDENTIALS[username.trim().toLowerCase()]
  if (!role || password !== username.trim().toLowerCase()) return null
  return { role, username: username.trim().toLowerCase() }
}

export const AUTH_STORAGE_KEY = 'ridge_auth'
