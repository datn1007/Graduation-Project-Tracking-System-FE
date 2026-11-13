// Sort keys accepted by GET /dashboard/projects (README BE §7.7).
export const PROJECT_SORTS = [
  { value: 'overdueMilestones,desc', label: 'Nhiều milestone quá hạn nhất' },
  { value: 'completionPercent,asc', label: 'Hoàn thành thấp nhất' },
  { value: 'completionPercent,desc', label: 'Hoàn thành cao nhất' },
  { value: 'lateSubmissions,desc', label: 'Nhiều bài nộp trễ nhất' },
  { value: 'projectCode,asc', label: 'Mã đồ án' },
]

// Student without a group (GET /projects/mine → []) — README BE §8 rule 20.
export const NO_GROUP_MESSAGE = 'Bạn chưa được xếp nhóm, vui lòng liên hệ admin.'
