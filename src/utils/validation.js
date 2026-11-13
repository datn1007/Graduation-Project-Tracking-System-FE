// Client-side checks are for UX only — the Backend re-validates everything.

export function isHttpUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Format check only. Since BE v1.2.0 any domain may sign in if the account exists — the Backend
// decides (AUTH_ACCOUNT_NOT_REGISTERED / AUTH_INVALID_CREDENTIALS); the FE must not filter by domain.
export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((value || '').trim())
}

// New-password rule (README BE §5.4a): ≥ passwordMinLength, letters AND digits, no whitespace.
// Length and message come from GET /meta/config; the Backend re-checks (PASSWORD_POLICY_VIOLATION).
// Not applied to the login form — existing accounts still use the legacy password `12345`.
export function checkNewPassword(value, config) {
  const min = config?.passwordMinLength || 8
  const message = config?.passwordRule || `Mật khẩu phải có ít nhất ${min} ký tự, gồm cả chữ và số, không chứa khoảng trắng`
  if (!value) return 'Vui lòng nhập mật khẩu.'
  if (value.length < min || !/\p{L}/u.test(value) || !/\d/.test(value) || /\s/.test(value)) return message
  return null
}

// Recognised link kinds for submissions (GitHub, Google Drive/Docs, Figma, other).
export function detectLinkType(url) {
  let host = ''
  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return 'OTHER'
  }
  if (host === 'github.com' || host.endsWith('.github.com') || host === 'gitlab.com') return 'REPOSITORY'
  if (host.endsWith('drive.google.com') || host.endsWith('docs.google.com')) return 'DRIVE'
  if (host.endsWith('figma.com')) return 'FIGMA'
  return 'OTHER'
}

export const LINK_TYPE_LABELS = {
  REPOSITORY: 'Mã nguồn',
  DRIVE: 'Google Drive',
  FIGMA: 'Figma',
  OTHER: 'Liên kết',
}
