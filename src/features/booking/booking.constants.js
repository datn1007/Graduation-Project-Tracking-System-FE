// GET /slots default window is 28 days (max 92).
export const SLOT_WINDOW_DAYS = 28
export const BOOKINGS_PAGE_SIZE = 10

// After these codes the slot list is stale and must be reloaded (README BE §4, §8).
export const SLOT_RELOAD_CODES = ['SLOT_ALREADY_BOOKED', 'SLOT_NOT_AVAILABLE', 'SLOT_IN_PAST']

// Student without a group (GET /projects/mine → []): booking is hidden (README BE §8 rule 20).
export const NO_GROUP_MESSAGE = 'Bạn chưa được xếp nhóm, vui lòng liên hệ admin.'
