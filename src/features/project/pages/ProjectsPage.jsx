import React, { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { FolderKanban, Plus, Search } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAsync } from '../../../hooks/useAsync'
import { useMeta } from '../../../hooks/useMeta'
import { useDebounce } from '../../../hooks/useDebounce'
import { PERMISSIONS as P } from '../../../constants/enums'
import { PageHeader, Pagination } from '../../../components/ui/Misc'
import { Card, CardBody } from '../../../components/ui/Card'
import { EnumBadge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import { getProjects, getTerms } from '../project.service'
import ProjectFormModal from '../components/ProjectFormModal'
import { NO_GROUP_MESSAGE } from '../project.constants'

// GET /projects is scoped by the Backend: students see their group, advisors their groups,
// department managers their department, admins everything.
const ProjectsPage = () => {
  const { can } = useAuth()
  const { options } = useMeta()
  const [q, setQ] = useState('')
  const query = useDebounce(q)
  const [status, setStatus] = useState('')
  const [termId, setTermId] = useState('')
  const [page, setPage] = useState(0)
  const [creating, setCreating] = useState(false)
  const terms = useAsync(() => getTerms(), [])
  const projects = useAsync(
    () => getProjects({ q: query.trim() || undefined, status: status || undefined, termId: termId || undefined, page, size: 12, sort: 'code,asc' }),
    [query, status, termId, page],
  )

  // A user who can only see their own group goes straight to it.
  // Users who only ever see their own group (students): 1 group → open it; 0 → "not grouped yet" (rule 20).
  const ownGroupOnly = !can(P.PROJECT_MANAGE) && !can(P.DASHBOARD_VIEW)
  const single = projects.data && !q && !status && !termId && projects.data.totalElements === 1 && ownGroupOnly
  if (single) return <Navigate to={`/projects/${projects.data.content[0].id}`} replace />

  const resetPage = (setter) => (e) => {
    setter(e.target.value)
    setPage(0)
  }

  return (
    <>
      <PageHeader
        title="Đồ án & tiến độ"
        description="Chọn một đồ án để xem milestone, bảng Kanban, bài nộp và lịch hẹn."
        actions={
          can(P.PROJECT_MANAGE) && (
            <Button icon={Plus} onClick={() => setCreating(true)}>
              Tạo đồ án
            </Button>
          )
        }
      />
      <Card>
        <div className="card__header">
          <div className="toolbar" style={{ width: '100%' }}>
            <div className="input-icon">
              <Search aria-hidden="true" />
              <input className="input" type="search" placeholder="Tìm theo mã, tên đề tài…" aria-label="Tìm đồ án" value={q} onChange={resetPage(setQ)} />
            </div>
            <select className="select" aria-label="Học kỳ" value={termId} onChange={resetPage(setTermId)}>
              <option value="">Mọi học kỳ</option>
              {(terms.data || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code} — {t.name}
                </option>
              ))}
            </select>
            <select className="select" aria-label="Trạng thái" value={status} onChange={resetPage(setStatus)}>
              <option value="">Mọi trạng thái</option>
              {options('projectStatus').map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <CardBody flush>
          <AsyncContent {...projects} onRetry={projects.reload} empty={
              ownGroupOnly && !q && !status && !termId ? (
                <EmptyState icon={FolderKanban} title={NO_GROUP_MESSAGE} text="Bảng Kanban, bài nộp và lịch hẹn sẽ hiện khi bạn thuộc một nhóm đồ án." />
              ) : (
                <EmptyState icon={FolderKanban} title="Không có đồ án nào" text="Không có đồ án nào phù hợp bộ lọc." />
              )
            }>
            {(data) => (
              <>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th scope="col">Mã</th>
                        <th scope="col">Đề tài</th>
                        <th scope="col">GVHD</th>
                        <th scope="col">Thành viên</th>
                        <th scope="col">Học kỳ</th>
                        <th scope="col">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.content.map((p) => (
                        <tr key={p.id}>
                          <td className="table__primary">
                            <Link to={`/projects/${p.id}`}>{p.code}</Link>
                          </td>
                          <td style={{ minWidth: 240 }}>
                            <Link to={`/projects/${p.id}`} style={{ color: 'inherit' }}>
                              {p.title}
                            </Link>
                            <div className="table__secondary">{p.department?.name}</div>
                          </td>
                          <td>{p.advisor?.fullName}</td>
                          <td>{p.members?.length ?? 0}</td>
                          <td>
                            {p.term?.code} <EnumBadge name="termStatus" value={p.term?.status} />
                          </td>
                          <td>
                            <EnumBadge name="projectStatus" value={p.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination pageData={data} onPageChange={setPage} />
              </>
            )}
          </AsyncContent>
        </CardBody>
      </Card>
      {creating && <ProjectFormModal onClose={() => setCreating(false)} onSaved={projects.reload} />}
    </>
  )
}

export default ProjectsPage
