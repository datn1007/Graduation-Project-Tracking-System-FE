// Single HTTP client for the whole app (FE Structure Guideline: Component → feature.service → apiClient → BE).
// - Adds `Authorization: Bearer <accessToken>`.
// - On 401 refreshes the token pair ONCE (refresh tokens are single-use; reusing one revokes the session).
// - Rejects with a normalised ApiError { status, code, message, fieldErrors, errors }.
import axios from 'axios'
import { ENV } from '../constants/env'

const TOKEN_KEY = 'gt.accessToken'
const REFRESH_KEY = 'gt.refreshToken'

const read = (key) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export const tokenStore = {
  get access() {
    return read(TOKEN_KEY)
  },
  get refresh() {
    return read(REFRESH_KEY)
  },
  save({ accessToken, refreshToken }) {
    try {
      localStorage.setItem(TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_KEY, refreshToken)
    } catch {
      // storage unavailable — the session lasts until reload
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      // ignore
    }
  },
}

export class ApiError extends Error {
  constructor({ status = 0, code = 'NETWORK_ERROR', message, errors = [], body = null }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.errors = errors
    this.fieldErrors = Object.fromEntries(errors.filter((e) => e?.field).map((e) => [e.field, translateFieldMessage(e.message)]))
    this.body = body
  }
}

// Bean Validation defaults are partly English (README BE §4) — translate the common ones.
const FIELD_MESSAGES = [
  [/must not be (blank|null|empty)/i, 'Không được để trống'],
  [/size must be between (\d+) and (\d+)/i, (_, min, max) => (Number(min) > 0 ? `Độ dài từ ${min} đến ${max} ký tự` : `Tối đa ${max} ký tự`)],
  [/must be a well-formed email address/i, 'Email không hợp lệ'],
  [/must be greater than or equal to (\S+)/i, (_, v) => `Phải lớn hơn hoặc bằng ${v}`],
  [/must be less than or equal to (\S+)/i, (_, v) => `Phải nhỏ hơn hoặc bằng ${v}`],
  [/must match "\^https\?/i, 'Phải bắt đầu bằng http:// hoặc https://'],
]

function translateFieldMessage(message = '') {
  for (const [pattern, replacement] of FIELD_MESSAGES) {
    if (pattern.test(message)) return message.replace(pattern, replacement)
  }
  return message
}

// Messages for errors that never reach the server or have no `detail`.
const FALLBACK_MESSAGES = {
  NETWORK_ERROR: 'Không kết nối được máy chủ. Kiểm tra Backend đã chạy và cấu hình VITE_API_URL / VITE_DEV_PROXY_TARGET.',
  TIMEOUT: 'Máy chủ phản hồi quá lâu, vui lòng thử lại.',
  UNKNOWN: 'Đã xảy ra lỗi, vui lòng thử lại.',
}

export function toApiError(error) {
  if (error instanceof ApiError) return error
  const response = error?.response
  if (!response) {
    const code = error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : 'NETWORK_ERROR'
    return new ApiError({ code, message: FALLBACK_MESSAGES[code] })
  }
  const body = response.data && typeof response.data === 'object' ? response.data : {}
  // RFC 7807 body: { status, title, detail, code, errors[] }. Branch on `code`, display `detail`.
  return new ApiError({
    status: response.status,
    code: body.code || `HTTP_${response.status}`,
    message: body.detail || body.message || FALLBACK_MESSAGES.UNKNOWN,
    errors: Array.isArray(body.errors) ? body.errors : [],
    body,
  })
}

const apiClient = axios.create({
  baseURL: ENV.apiUrl,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  timeout: ENV.requestTimeoutMs,
  // Arrays as repeated keys: ?status=OPEN&status=BOOKED
  paramsSerializer: { indexes: null },
})

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.access
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

const sessionListeners = new Set()

// AuthContext subscribes: called when the session is gone (refresh failed / revoked).
export function onSessionExpired(listener) {
  sessionListeners.add(listener)
  return () => sessionListeners.delete(listener)
}

// Only ONE refresh in flight at any time.
let refreshing = null
function refreshTokens() {
  refreshing ??= axios
    .post(`${ENV.apiUrl}/auth/refresh`, { refreshToken: tokenStore.refresh }, { timeout: ENV.requestTimeoutMs })
    .then(({ data }) => {
      tokenStore.save(data)
      return data.accessToken
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// Public auth calls: a 401 here means "wrong credentials / expired session", never "refresh and retry"
// (README BE §6.2). /auth/me and /auth/change-password use the access token like any other API.
const PUBLIC_AUTH = ['/auth/login', '/auth/google', '/auth/refresh', '/auth/logout']

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthCall = PUBLIC_AUTH.some((path) => config?.url?.startsWith(path))
    if (response?.status === 401 && config && !config._retried && !isAuthCall && tokenStore.refresh) {
      config._retried = true
      try {
        const token = await refreshTokens()
        config.headers.Authorization = `Bearer ${token}`
        return apiClient(config)
      } catch (refreshError) {
        tokenStore.clear()
        sessionListeners.forEach((listener) => listener(toApiError(refreshError)))
        return Promise.reject(toApiError(refreshError))
      }
    }
    if (response?.status === 401 && !isAuthCall && !tokenStore.refresh && tokenStore.access) {
      tokenStore.clear()
      sessionListeners.forEach((listener) => listener(toApiError(error)))
    }
    return Promise.reject(toApiError(error))
  },
)

export const getErrorMessage = (error) => toApiError(error).message

export default apiClient
