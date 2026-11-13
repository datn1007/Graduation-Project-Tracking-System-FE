import { ENV } from '../constants/env'

// All timestamps from the API are ISO 8601 (UTC or with offset). They are displayed in Vietnam time.
const tz = ENV.displayTimeZone
const locale = 'vi-VN'

const fmt = (options) => new Intl.DateTimeFormat(locale, { timeZone: tz, ...options })
const dateFmt = fmt({ day: '2-digit', month: '2-digit', year: 'numeric' })
const timeFmt = fmt({ hour: '2-digit', minute: '2-digit', hour12: false })
const weekdayFmt = fmt({ weekday: 'long', day: '2-digit', month: '2-digit' })
const shortDayFmt = fmt({ weekday: 'short', day: '2-digit', month: '2-digit' })
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })

const toDate = (value) => (value instanceof Date ? value : new Date(value))
const valid = (value) => value != null && value !== '' && !Number.isNaN(toDate(value).getTime())

export const formatDate = (value) => (valid(value) ? dateFmt.format(toDate(value)) : '—')
export const formatTime = (value) => (valid(value) ? timeFmt.format(toDate(value)) : '—')
export const formatDateTime = (value) => (valid(value) ? `${formatTime(value)} ${formatDate(value)}` : '—')
export const formatWeekday = (value) => (valid(value) ? weekdayFmt.format(toDate(value)) : '—')
export const formatShortDay = (value) => (valid(value) ? shortDayFmt.format(toDate(value)) : '—')
export const formatTimeRange = (start, end) => `${formatTime(start)} – ${formatTime(end)}`

// YYYY-MM-DD in Vietnam time — used to group slots by day.
export const dayKey = (value) => keyFmt.format(toDate(value))
export const todayKey = () => dayKey(new Date())

export function formatRelative(value) {
  if (!valid(value)) return '—'
  const diffSec = Math.round((toDate(value).getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const abs = Math.abs(diffSec)
  if (abs < 60) return rtf.format(diffSec, 'second')
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day')
  return formatDate(value)
}

// Vietnam has no DST, so a fixed +07:00 offset is exact.
export const vnDateTimeToIso = (date, time) => new Date(`${date}T${time}:00+07:00`).toISOString()

export const initials = (name = '') =>
  name
    .replace(/^(TS|ThS|PGS|GS)\.\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

export const formatScore = (score) => (score === null || score === undefined ? '—' : Number(score).toFixed(1).replace(/\.0$/, ''))

// "HH:mm" → minutes since midnight (for comparing time-of-day inputs).
export const toMinutes = (time = '') => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
