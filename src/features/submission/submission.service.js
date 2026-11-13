import apiClient from '../../services/apiClient'

const data = (res) => res.data

// GET /tasks/{taskId}/submissions → SubmissionResponse[] (newest first, with feedbacks[])
export const getTaskSubmissions = (taskId) => apiClient.get(`/tasks/${taskId}/submissions`).then(data)

// POST /tasks/{taskId}/submissions { url, description? } → SubmissionResponse (`late` computed by BE).
// Moves the task from TODO / IN_PROGRESS to REVIEW automatically.
export const submitWork = (taskId, url, description) =>
  apiClient.post(`/tasks/${taskId}/submissions`, { url, description: description || undefined }).then(data)

// GET /projects/{projectId}/submissions → PageResponse<SubmissionResponse>
export const getProjectSubmissions = (projectId, params = {}) => apiClient.get(`/projects/${projectId}/submissions`, { params }).then(data)

// POST /submissions/{id}/feedbacks { content, score? 0–10 } → FeedbackResponse
export const createFeedback = (submissionId, content, score) =>
  apiClient.post(`/submissions/${submissionId}/feedbacks`, { content, score: score ?? undefined }).then(data)
