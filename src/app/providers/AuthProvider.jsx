import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './contexts'
import { changePassword as changePasswordRequest, getMe, loginWithGoogle, loginWithPassword, logout as logoutRequest } from '../../features/auth/auth.service'
import { onSessionExpired, tokenStore } from '../../services/apiClient'

// Mirrors the Backend session (JWT access token + rotating refresh token in localStorage).
// The Backend is the security boundary; `can()` only drives what the UI shows.
export const AuthProvider = ({ children }) => {
  const [state, setState] = useState(() => ({
    status: tokenStore.access || tokenStore.refresh ? 'loading' : 'anonymous',
    user: null,
    error: null,
    sessionExpired: false,
  }))

  // Restore the session on reload. A 401 here is refreshed transparently by apiClient.
  const refresh = useCallback(async () => {
    if (!tokenStore.access && !tokenStore.refresh) {
      setState({ status: 'anonymous', user: null, error: null, sessionExpired: false })
      return null
    }
    try {
      const user = await getMe()
      setState({ status: 'authenticated', user, error: null, sessionExpired: false })
      return user
    } catch (error) {
      if (error.status === 401) tokenStore.clear()
      setState({ status: 'anonymous', user: null, error: error.status === 401 ? null : error, sessionExpired: error.status === 401 })
      return null
    }
  }, [])

  useEffect(() => {
    if (tokenStore.access || tokenStore.refresh) refresh()
  }, [refresh])

  useEffect(
    () =>
      onSessionExpired(() => {
        setState((prev) => (prev.status === 'authenticated' ? { status: 'anonymous', user: null, error: null, sessionExpired: true } : prev))
      }),
    [],
  )

  const applyAuthResponse = useCallback((auth) => {
    tokenStore.save(auth)
    setState({ status: 'authenticated', user: auth.user, error: null, sessionExpired: false })
    return auth.user
  }, [])

  const signInPassword = useCallback(async (email, password) => applyAuthResponse(await loginWithPassword(email, password)), [applyAuthResponse])
  const signInGoogle = useCallback(async (code) => applyAuthResponse(await loginWithGoogle(code)), [applyAuthResponse])

  // The Backend returns a NEW token pair (other sessions are revoked) — store it in place of the old one.
  const changePassword = useCallback(
    async (currentPassword, newPassword) => applyAuthResponse(await changePasswordRequest(currentPassword, newPassword)),
    [applyAuthResponse],
  )

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      setState({ status: 'anonymous', user: null, error: null, sessionExpired: false })
    }
  }, [])

  const value = useMemo(() => {
    const permissions = state.user?.permissions || []
    const can = (permission) => permissions.includes(permission)
    return {
      ...state,
      isAuthenticated: state.status === 'authenticated',
      can,
      canAny: (...list) => list.some(can),
      refresh,
      signInPassword,
      signInGoogle,
      changePassword,
      logout,
    }
  }, [state, refresh, signInPassword, signInGoogle, changePassword, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
