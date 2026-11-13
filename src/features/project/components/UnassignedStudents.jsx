import React, { useState } from 'react'
import { Search, UserPlus, UserRoundCheck } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../hooks/useToast'
import { useDebounce } from '../../../hooks/useDebounce'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { Avatar, Pagination } from '../../../components/ui/Misc'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import { addMember, getUnassignedStudents } from '../project.service'
import { UNASSIGNED_PAGE_SIZE } from '../project.constants'

// Students without a group in `termId` (GET /users?unassigned=true). Each row picks a group and calls
// POST /projects/{id}/members. 409 PROJECT_STUDENT_ALREADY_ASSIGNED (another admin was faster) → reload.
const UnassignedStudents = ({ termId, projects, onAssigned }) => {
  const toast = useToast()
  const [q, setQ] = useState('')
  const query = useDebounce(q)
  const [page, setPage] = useState(0)
  const [choice, setChoice] = useState({}) // studentId → projectId
  const [busyId, setBusyId] = useState(null)
  const students = useAsync(
    () => getUnassignedStudents({ termId, q: query.trim() || undefined, page, size: UNASSIGNED_PAGE_SIZE, sort: 'fullName,asc' }),
    [termId, query, page],
  )

  const assign = async (student) => {
    const projectId = choice[student.id]
    if (!projectId) return toast.error('Chọn nhóm cho sinh viên trước.')
    setBusyId(student.id)
    try {
      const project = await addMember(projectId, student.id)
      toast.success(`Đã xếp ${student.fullName} vào nhóm ${project.code}.`)
      onAssigned(project)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
      students.reload()
    }
  }

  return (
    <Card>
      <CardHeader icon={UserRoundCheck} title="Sinh viên chưa có nhóm" subtitle={students.data ? `${students.data.totalElements} sinh viên` : undefined} />
      <div className="card__body" style={{ paddingBottom: 8 }}>
        <div className="input-icon">
          <Search aria-hidden="true" />
          <input
            className="input"
            type="search"
            placeholder="Tìm theo tên, email, mã SV…"
            aria-label="Tìm sinh viên chưa có nhóm"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
          />
        </div>
      </div>
      <CardBody flush>
        <AsyncContent {...students} onRetry={students.reload} empty={<EmptyState icon={UserRoundCheck} title="Mọi sinh viên đều đã có nhóm" />}>
          {(data) => (
            <>
              <div className="list">
                {data.content.map((s) => (
                  <div key={s.id} className="list-item grouping-row">
                    <Avatar name={s.fullName} size="sm" />
                    <div className="list-item__body">
                      <div className="list-item__title">{s.fullName}</div>
                      <div className="list-item__meta">
                        <span>{s.userCode || '—'}</span>
                        <span>{s.email}</span>
                      </div>
                    </div>
                    <div className="grouping-row__actions">
                      <select
                        className="select select--sm"
                        aria-label={`Chọn nhóm cho ${s.fullName}`}
                        value={choice[s.id] || ''}
                        onChange={(e) => setChoice((c) => ({ ...c, [s.id]: e.target.value }))}
                      >
                        <option value="">— Chọn nhóm —</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} ({p.members?.length || 0} SV)
                          </option>
                        ))}
                      </select>
                      <Button size="sm" icon={UserPlus} loading={busyId === s.id} disabled={!choice[s.id] || !!busyId} onClick={() => assign(s)}>
                        Xếp
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination pageData={data} onPageChange={setPage} />
            </>
          )}
        </AsyncContent>
      </CardBody>
    </Card>
  )
}

export default UnassignedStudents
