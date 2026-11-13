import apiClient from '../../services/apiClient'

const data = (res) => res.data

// Users (USER_MANAGE)
// params: { q?, role?, departmentId?, active?, page, size, sort }
export const getUsers = (params = {}) => apiClient.get('/users', { params }).then(data)
// { email, fullName, userCode?, role, departmentId?, password } — password REQUIRED since BE v1.1.0
export const createUser = (body) => apiClient.post('/users', body).then(data)
// { fullName, userCode?, role, departmentId?, active } — full replacement
export const updateUser = (id, body) => apiClient.put(`/users/${id}`, body).then(data)
// PUT /users/{id}/password { newPassword } — grant / reset; the user is signed out of every session.
export const setUserPassword = (id, newPassword) => apiClient.put(`/users/${id}/password`, { newPassword }).then(data)

// Departments (list: any user; write: DEPARTMENT_MANAGE)
export const getDepartments = () => apiClient.get('/departments').then(data)
export const createDepartment = (body) => apiClient.post('/departments', body).then(data)
export const updateDepartment = (id, body) => apiClient.put(`/departments/${id}`, body).then(data)

// Terms (list: any user; write: TERM_MANAGE)
export const getTerms = () => apiClient.get('/terms').then(data)
// { code, name, startDate, endDate }
export const createTerm = (body) => apiClient.post('/terms', body).then(data)
export const updateTerm = (id, body) => apiClient.put(`/terms/${id}`, body).then(data)
export const activateTerm = (id) => apiClient.post(`/terms/${id}/activate`).then(data)
export const archiveTerm = (id) => apiClient.post(`/terms/${id}/archive`).then(data)
