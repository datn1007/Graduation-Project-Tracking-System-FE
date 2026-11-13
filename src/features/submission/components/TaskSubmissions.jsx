import React from 'react'
import { useAsync } from '../../../hooks/useAsync'
import { useAuth } from '../../../hooks/useAuth'
import { PERMISSIONS as P } from '../../../constants/enums'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import { getTaskSubmissions } from '../submission.service'
import SubmissionForm from './SubmissionForm'
import SubmissionItem from './SubmissionItem'
import '../submission.scss'

// Submissions of one task (newest first, with feedbacks) + the submit form. Rendered inside the
// kanban task modal through the `renderSubmissions` slot wired in app/routes.
const TaskSubmissions = ({ task, readOnly, onSubmitted }) => {
  const { can } = useAuth()
  const submissions = useAsync(() => getTaskSubmissions(task.id), [task.id])

  const addFeedback = (submissionId, feedback) =>
    submissions.setData((list) => list.map((s) => (s.id === submissionId ? { ...s, feedbacks: [...(s.feedbacks || []), feedback] } : s)))

  return (
    <>
      {can(P.SUBMISSION_CREATE) && !readOnly && (
        <SubmissionForm
          taskId={task.id}
          onSubmitted={(submission) => {
            submissions.setData((list) => [submission, ...(list || [])])
            onSubmitted?.(submission)
          }}
        />
      )}
      <AsyncContent {...submissions} onRetry={submissions.reload} compact empty={<EmptyState compact title="Chưa có bài nộp" />}>
        {(list) => list.map((s) => <SubmissionItem key={s.id} submission={s} canFeedback={can(P.FEEDBACK_CREATE) && !readOnly} onFeedback={addFeedback} />)}
      </AsyncContent>
    </>
  )
}

export default TaskSubmissions
