import apiClient, { tokenStore } from '../../services/apiClient'

const data = (res) => res.data

// All login endpoints return AuthResponse { accessToken, refreshToken, …, user }.
// POST /auth/login { email, password } — never auto-creates an account (401 AUTH_INVALID_CREDENTIALS).
export const loginWithPassword = (email, password) => apiClient.post('/auth/login', { email, password }).then(data)

// POST /auth/google with the authorization code from Google Identity Services.
export const loginWithGoogle = (code) => apiClient.post('/auth/google', { code }).then(data)

// POST /auth/change-password → a NEW AuthResponse; other sessions are signed out.
export const changePassword = (currentPassword, newPassword) =>
  apiClient.post('/auth/change-password', { currentPassword, newPassword }).then(data)

// GET /auth/me → MeResponse (permissions, hasPassword…). Used to restore the session on reload.
export const getMe = () => apiClient.get('/auth/me').then(data)

// POST /auth/logout { refreshToken } → 204. Tokens are cleared even if the call fails.
export async function logout() {
  const refreshToken = tokenStore.refresh
  try {
    if (refreshToken) await apiClient.post('/auth/logout', { refreshToken })
  } finally {
    tokenStore.clear()
  }
}

// Public metadata, loaded once at start-up.
export const getEnums = () => apiClient.get('/meta/enums').then(data)
export const getConfig = () => apiClient.get('/meta/config').then(data)
