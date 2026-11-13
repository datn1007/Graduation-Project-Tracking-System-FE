import { useContext } from 'react'
import { AuthContext } from '../app/providers/contexts'

// { user, status, can(permission), canAny(...permissions), signIn, logout, refresh, ... }
// Components decide visibility with can(PERMISSION) — never by comparing roles.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
