import apiClient from '../../services/apiClient'

const data = (res) => res.data

// GET /availability/rules?termId= → RuleResponse[] (current advisor)
export const getRules = (termId) => apiClient.get('/availability/rules', { params: { termId } }).then(data)

// POST /availability/rules → { rule, generatedSlots, skippedSlots }
// body: { dayOfWeek 1..7 (1 = Monday), startTime 'HH:mm', endTime, slotDurationMinutes?, bufferMinutes?,
//         location?, meetingUrl?, effectiveFrom?, effectiveTo?, termId? }
export const createRule = (body) => apiClient.post('/availability/rules', body).then(data)

// Deactivates the rule and cancels its future OPEN slots (booked slots are kept).
export const deactivateRule = (id) => apiClient.post(`/availability/rules/${id}/deactivate`).then(data)

// POST /slots { startAt, endAt, location?, meetingUrl? } → single ad-hoc slot
export const createSlot = (body) => apiClient.post('/slots', body).then(data)

// POST /slots/{id}/cancel { reason } — reason required when the slot is booked
export const cancelSlot = (id, reason) => apiClient.post(`/slots/${id}/cancel`, { reason: reason || undefined }).then(data)

// GET /slots?advisorId=me&from&to&status=OPEN&status=BOOKED — the advisor's own upcoming slots
// (with `booking.project` when booked).
export const getMySlots = (params) => apiClient.get('/slots', { params }).then(data)
