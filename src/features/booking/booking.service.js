import apiClient from '../../services/apiClient'

const data = (res) => res.data

// GET /slots → SlotResponse[]. Students automatically get only their advisor's slots.
// params: { advisorId?, from?, to? (ISO), status?: 'OPEN' | ['OPEN','BOOKED'] }
export const getSlots = (params = {}) => apiClient.get('/slots', { params }).then(data)

// POST /bookings { slotId, agenda? } → 201 BookingResponse (CONFIRMED immediately)
export const createBooking = (slotId, agenda) => apiClient.post('/bookings', { slotId, agenda: agenda || undefined }).then(data)

// GET /bookings → PageResponse<BookingResponse>. params: { status?, projectId?, from?, to?, page, size, sort }
export const getBookings = (params = {}) => apiClient.get('/bookings', { params }).then(data)

// GET /bookings/{id} → { booking, history[] }
export const getBooking = (id) => apiClient.get(`/bookings/${id}`).then(data)

// Reason is required; only before the start time.
export const cancelBooking = (id, reason) => apiClient.post(`/bookings/${id}/cancel`, { reason }).then(data)

// Advisor only, after the start time.
export const completeBooking = (id, meetingNotes) =>
  apiClient.post(`/bookings/${id}/complete`, { meetingNotes: meetingNotes || undefined }).then(data)
export const markNoShow = (id, note) => apiClient.post(`/bookings/${id}/no-show`, { note: note || undefined }).then(data)
export const updateMeetingNotes = (id, meetingNotes) => apiClient.put(`/bookings/${id}/notes`, { meetingNotes }).then(data)

// GET /projects/mine → the student's group (header + read-only state of the booking page).
export const getMyProjects = () => apiClient.get('/projects/mine').then(data)
