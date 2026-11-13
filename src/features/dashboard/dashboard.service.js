import apiClient from '../../services/apiClient'

const data = (res) => res.data

// GET /dashboard/summary?termId=&departmentId= → SummaryResponse (default: ACTIVE term)
export const getSummary = (params = {}) => apiClient.get('/dashboard/summary', { params }).then(data)

// GET /dashboard/projects → PageResponse<ProjectProgressResponse>
// sort: completionPercent | overdueMilestones | lateSubmissions | projectCode | totalTasks (+ ',asc' | ',desc')
export const getProjectProgress = (params = {}) => apiClient.get('/dashboard/projects', { params }).then(data)

// Data for the home overview and the dashboard filters (each feature calls the API it needs itself).
export const getActiveTerm = () => apiClient.get('/terms/active').then(data)
export const getTerms = () => apiClient.get('/terms').then(data)
export const getDepartments = () => apiClient.get('/departments').then(data)
// Student: own group · advisor: supervised groups (ACTIVE term)
export const getMyProjects = () => apiClient.get('/projects/mine').then(data)
// Next confirmed meetings in the user's scope
export const getUpcomingBookings = (size = 5) =>
  apiClient.get('/bookings', { params: { status: 'CONFIRMED', from: new Date().toISOString(), sort: 'slot.startAt,asc', size } }).then(data)
