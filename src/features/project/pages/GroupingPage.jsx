import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useMeta } from '../../../hooks/useMeta'
import { PageHeader, Alert } from '../../../components/ui/Misc'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { EnumBadge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import { getProjects, getTerms } from '../project.service'
import UnassignedStudents from '../components/UnassignedStudents'
import '../project.scss'

// Admin "Xếp nhóm" (README BE §8 rules 18–20): only admins put students into groups; a student belongs
// to one group per term. Left: students without a group in the term; right: the term's groups.
const GroupingPage = () => {
  const { label } = useMeta()
  const terms = useAsync(() => getTerms(), [])
  const [pickedTermId, setPickedTermId] = useState('')
  const termList = (terms.data || []).filter((t) => t.status !== 'ARCHIVED')
  const termId = pickedTermId || termList.find((t) => t.status === 'ACTIVE')?.id || termList[0]?.id || ''
  const projects = useAsync(
    () => (termId ? getProjects({ termId, status: 'IN_PROGRESS', size: 100, sort: 'code,asc' }) : Promise.resolve(undefined)),
    [termId],
  )
  const projectList = projects.data?.content || []

  // Keep member counts in sync after an assignment without refetching the whole list.
  const replaceProject = (updated) => projects.setData((page) => ({ ...page, content: page.content.map((p) => (p.id === updated.id ? updated : p)) }))

  return (
    <>
      <PageHeader
        title="Xếp nhóm"
        description="Xếp sinh viên chưa có nhóm vào nhóm đồ án. Mỗi sinh viên chỉ thuộc một nhóm trong một học kỳ; thành viên đầu tiên tự thành trưởng nhóm."
        actions={
          <select className="select" aria-label="Học kỳ" value={termId} onChange={(e) => setPickedTermId(e.target.value)} disabled={!termList.length}>
            {termList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name} ({label('termStatus', t.status)})
              </option>
            ))}
          </select>
        }
      />

      {terms.data && !termList.length && <Alert tone="warning">Chưa có học kỳ nào đang mở để xếp nhóm.</Alert>}

      {termId && (
        <div className="grid grouping-layout">
          <UnassignedStudents key={termId} termId={termId} projects={projectList} onAssigned={replaceProject} />

          <Card>
            <CardHeader icon={FolderKanban} title="Nhóm đồ án trong học kỳ" subtitle="Chỉ nhóm đang thực hiện" />
            <CardBody flush>
              <AsyncContent
                {...projects}
                onRetry={projects.reload}
                empty={<EmptyState compact icon={FolderKanban} title="Chưa có nhóm đồ án" text="Tạo đồ án ở trang Đồ án & tiến độ trước." />}
              >
                {() => (
                  <div className="list">
                    {projectList.map((p) => (
                      <Link key={p.id} to={`/projects/${p.id}/members`} className="list-item list-item--link">
                        <div className="list-item__body">
                          <div className="row-between">
                            <span className="list-item__title">
                              {p.code} · {p.title}
                            </span>
                            <EnumBadge name="projectStatus" value={p.status} />
                          </div>
                          <div className="list-item__meta">
                            <span>GVHD {p.advisor?.fullName}</span>
                            <span>{p.members?.length || 0} thành viên</span>
                            {p.members?.find((m) => m.leader) && <span>Trưởng nhóm: {p.members.find((m) => m.leader).student.fullName}</span>}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </AsyncContent>
            </CardBody>
          </Card>
        </div>
      )}
    </>
  )
}

export default GroupingPage
