// dayOfWeek used by availability rules: 1 = Monday … 7 = Sunday (README BE §7.4).
export const WEEKDAYS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 7, label: 'Chủ nhật' },
]

// GET /slots default window is 28 days (max 92).
export const SLOT_WINDOW_DAYS = 28

export const WEEKDAY_LABELS = Object.fromEntries(WEEKDAYS.map((d) => [d.value, d.label]))
