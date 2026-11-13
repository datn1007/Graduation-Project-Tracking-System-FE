import apiClient from '../../services/apiClient'

const data = (res) => res.data

// GET /projects → PageResponse<ProjectResponse>, already scoped by role on the Backend.
// params: { termId?, departmentId?, advisorId?, status?, q?, page, size, sort }
export const getProjects = (params = {}) => apiClient.get('/projects', { params }).then(data)

// GET /projects/mine → ProjectResponse[] (student: own group; advisor: supervised groups; ACTIVE term)
export const getMyProjects = () => apiClient.get('/projects/mine').then(data)

export const getProject = (id) => apiClient.get(`/projects/${id}`).then(data)

// Admin (PROJECT_MANAGE)
export const createProject = (body) => apiClient.post('/projects', body).then(data)
export const updateProject = (id, body) => apiClient.put(`/projects/${id}`, body).then(data)
export const addMember = (id, studentId, leader) => apiClient.post(`/projects/${id}/members`, { studentId, leader: leader || undefined }).then(data)
export const setLeader = (id, studentId) => apiClient.put(`/projects/${id}/members/${studentId}/leader`).then(data)
export const removeMember = (id, studentId) => apiClient.delete(`/projects/${id}/members/${studentId}`).then(data)

// Lookups for the project form / member picker (the project feature calls these APIs itself).
export const getTerms = () => apiClient.get('/terms').then(data)
export const getDepartments = () => apiClient.get('/departments').then(data)
// Active advisors for the advisor select (USER_MANAGE)
export const getAdvisors = () =>
  apiClient.get('/users', { params: { role: 'ADVISOR', active: true, size: 200, sort: 'fullName,asc' } }).then((res) => res.data.content)
// Students NOT yet in any group of the term (BE v1.3.0: unassigned=true, termId defaults to the ACTIVE
// term). A student belongs to one group per term — others would fail with PROJECT_STUDENT_ALREADY_ASSIGNED.
// params: { q?, termId?, page, size } → PageResponse<UserResponse>   (USER_MANAGE)
export const getUnassignedStudents = (params = {}) =>
  apiClient.get('/users', { params: { unassigned: true, role: 'STUDENT', active: true, ...params } }).then(data)
// Quick search for the members panel of one project
export const searchStudents = (q, termId) => getUnassignedStudents({ q, termId, size: 8 }).then((page) => page.content)
