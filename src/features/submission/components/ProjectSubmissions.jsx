import React, { useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useAuth } from '../../../hooks/useAuth'
import { PERMISSIONS as P } from '../../../constants/enums'
import { Pagination } from '../../../components/ui/Misc'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import { getProjectSubmissions } from '../submission.service'
import { SUBMISSIONS_PAGE_SIZE } from '../submission.constants'
import SubmissionItem from './SubmissionItem'
import '../submission.scss'

// "Xem feedback" screen: every submission of the project with its feedback, newest first.
const ProjectSubmissions = ({ projectId, readOnly }) => {
  const { can } = useAuth()
  const [page, setPage] = useState(0)
  const submissions = useAsync(() => getProjectSubmissions(projectId, { page, size: SUBMISSIONS_PAGE_SIZE }), [projectId, page])

  const addFeedback = (submissionId, feedback) =>
    submissions.setData((data) => ({
      ...data,
      content: data.content.map((s) => (s.id === submissionId ? { ...s, feedbacks: [...(s.feedbacks || []), feedback] } : s)),
    }))

  return (
    <Card>
      <CardHeader icon={MessageSquareText} title="Bài nộp & nhận xét" subtitle="Không sửa / xoá được (lưu vết)" />
      <CardBody>
        <AsyncContent {...submissions} onRetry={submissions.reload} empty={<EmptyState icon={MessageSquareText} title="Chưa có bài nộp" />}>
          {(data) => (
            <div className="stack">
              {data.content.map((s) => (
                <SubmissionItem key={s.id} submission={s} showTask canFeedback={can(P.FEEDBACK_CREATE) && !readOnly} onFeedback={addFeedback} />
              ))}
              <Pagination pageData={data} onPageChange={setPage} />
            </div>
          )}
        </AsyncContent>
      </CardBody>
    </Card>
  )
}

export default ProjectSubmissions
