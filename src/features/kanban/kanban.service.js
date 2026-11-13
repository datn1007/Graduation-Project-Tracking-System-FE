import apiClient from '../../services/apiClient'

const data = (res) => res.data

// Milestones (one per week)
export const getMilestones = (projectId) => apiClient.get(`/projects/${projectId}/milestones`).then(data)
// { weekNumber, title, description?, startDate 'YYYY-MM-DD', dueAt ISO }
export const createMilestone = (projectId, body) => apiClient.post(`/projects/${projectId}/milestones`, body).then(data)
// { firstWeekStart 'YYYY-MM-DD', weeks 1..20, dueTime? 'HH:mm' } → creates "Tuần 1..N", skips existing weeks
export const generateMilestones = (projectId, body) => apiClient.post(`/projects/${projectId}/milestones/generate`, body).then(data)
export const updateMilestone = (id, body) => apiClient.put(`/milestones/${id}`, body).then(data)
export const deleteMilestone = (id) => apiClient.delete(`/milestones/${id}`)

// Tasks (Kanban board of a milestone, sorted by column then `position`)
export const getTasks = (milestoneId) => apiClient.get(`/milestones/${milestoneId}/tasks`).then(data)
// { title, description?, assigneeId? } → lands in TODO
export const createTask = (milestoneId, body) => apiClient.post(`/milestones/${milestoneId}/tasks`, body).then(data)
export const updateTask = (id, body) => apiClient.put(`/tasks/${id}`, body).then(data)
// Drag & drop: position is 0-based in the target column; omitted = end of column
export const moveTask = (id, status, position) => apiClient.patch(`/tasks/${id}/status`, { status, position }).then(data)
export const deleteTask = (id) => apiClient.delete(`/tasks/${id}`)
export const getTaskHistory = (id) => apiClient.get(`/tasks/${id}/history`).then(data)
