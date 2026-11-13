// Central place for reading Vite environment variables.
// Only VITE_* variables are exposed to the browser — never put secrets here.
const raw = import.meta.env

const trimSlash = (value) => (value || '').replace(/\/+$/, '')

export const ENV = {
  // Backend base URL incl. prefix. Default '/api/v1' = same origin, forwarded to the Backend by the
  // Vite dev proxy (VITE_DEV_PROXY_TARGET), which avoids CORS in development.
  apiUrl: trimSlash(raw.VITE_API_URL) || '/api/v1',
  // Optional override; normally the client id comes from GET /meta/config.
  googleClientId: raw.VITE_GOOGLE_CLIENT_ID || '',
  requestTimeoutMs: Number(raw.VITE_API_TIMEOUT_MS) || 15000,
  // Fallback only — the real value comes from GET /meta/config (timeZone).
  displayTimeZone: 'Asia/Ho_Chi_Minh',
}
