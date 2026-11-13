// Global constants only: permission keys and badge tones. Display labels come from GET /meta/enums
// (see useMeta().label), so a new Backend value renders with its own label instead of breaking the UI.

// Permission keys returned in user.permissions — UI visibility is decided by these, never by role.
export const PERMISSIONS = Object.freeze({
  USER_MANAGE: 'USER_MANAGE',
  DEPARTMENT_MANAGE: 'DEPARTMENT_MANAGE',
  TERM_MANAGE: 'TERM_MANAGE',
  PROJECT_MANAGE: 'PROJECT_MANAGE',
  PROJECT_VIEW: 'PROJECT_VIEW',
  AVAILABILITY_MANAGE: 'AVAILABILITY_MANAGE',
  SLOT_VIEW: 'SLOT_VIEW',
  BOOKING_VIEW: 'BOOKING_VIEW',
  BOOKING_CREATE: 'BOOKING_CREATE',
  BOOKING_CANCEL: 'BOOKING_CANCEL',
  BOOKING_MANAGE: 'BOOKING_MANAGE',
  MILESTONE_MANAGE: 'MILESTONE_MANAGE',
  TASK_EDIT: 'TASK_EDIT',
  SUBMISSION_CREATE: 'SUBMISSION_CREATE',
  FEEDBACK_CREATE: 'FEEDBACK_CREATE',
  DASHBOARD_VIEW: 'DASHBOARD_VIEW',
})

// Badge tone per enum value (unknown values fall back to 'neutral').
export const TONES = {
  taskStatus: { TODO: 'neutral', IN_PROGRESS: 'info', REVIEW: 'warning', DONE: 'success' },
  slotStatus: { OPEN: 'success', BOOKED: 'info', CANCELLED: 'neutral' },
  bookingStatus: { CONFIRMED: 'success', COMPLETED: 'info', NO_SHOW: 'danger', CANCELLED: 'neutral' },
  calendarSyncStatus: { PENDING: 'warning', SYNCED: 'success', FAILED: 'danger', SKIPPED: 'neutral' },
  projectStatus: { IN_PROGRESS: 'info', COMPLETED: 'success', CANCELLED: 'neutral' },
  termStatus: { UPCOMING: 'info', ACTIVE: 'success', ARCHIVED: 'neutral' },
  role: { STUDENT: 'primary', ADVISOR: 'info', DEPARTMENT_MANAGER: 'warning', ADMIN: 'danger' },
}
