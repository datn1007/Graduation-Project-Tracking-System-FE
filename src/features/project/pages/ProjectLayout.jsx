import React, { useState } from 'react'
import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAsync } from '../../../hooks/useAsync'
import { PERMISSIONS as P } from '../../../constants/enums'
import { PageHeader, Alert } from '../../../components/ui/Misc'
import { EnumBadge } from '../../../components/ui/Badge'
import { ErrorState, LoadingState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import { getProject } from '../project.service'
import ProjectFormModal from '../components/ProjectFormModal'
import '../project.scss'

// Shell of /projects/:projectId. The tabs are child routes (wired in app/routes) owned by other
// features — kanban, submission, booking — so no feature imports another. Each child reads
// `useOutletContext()` → { project, readOnly, setProject }.
const ProjectLayout = () => {
  const { projectId } = useParams()
  const { can } = useAuth()
  const project = useAsync(() => getProject(projectId), [projectId])
  const [editing, setEditing] = useState(false)

  if (project.loading && !project.data) return <LoadingState />
  if (project.error) {
    return (
      <ErrorState
        error={project.error}
        title={project.error.status === 403 ? 'Bạn không có quyền xem đồ án này' : 'Không thể tải đồ án'}
        onRetry={project.error.status === 403 || project.error.status === 404 ? undefined : project.reload}
      />
    )
  }

  const p = project.data
  // README BE §8.10/§8.18: editing only while the term is ACTIVE and the project IN_PROGRESS.
  const archived = p.term?.status === 'ARCHIVED'
  const readOnly = p.term?.status !== 'ACTIVE' || p.status !== 'IN_PROGRESS'

  const tabs = [
    { to: '', label: 'Tiến độ (Kanban)', end: true },
    { to: 'submissions', label: 'Bài nộp & feedback' },
    can(P.BOOKING_VIEW) && { to: 'bookings', label: 'Lịch hẹn' },
    { to: 'members', label: `Thành viên (${p.members?.length || 0})` },
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title={`${p.code} · ${p.title}`}
        description={`GVHD ${p.advisor?.fullName || '—'} · ${p.department?.name || ''} · ${p.term?.code || ''}`}
        actions={
          <>
            <Link className="btn btn--ghost" to="/projects">
              <ArrowLeft aria-hidden="true" /> Danh sách
            </Link>
            {can(P.PROJECT_MANAGE) && (
              <Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>
                Sửa đồ án
              </Button>
            )}
          </>
        }
      />

      <div className="stack">
        <div className="row" style={{ gap: 6 }}>
          <EnumBadge name="projectStatus" value={p.status} />
          <EnumBadge name="termStatus" value={p.term?.status} prefix={`${p.term?.code}: `} />
        </div>
        {p.description && <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>{p.description}</p>}
        {readOnly && (
          <Alert tone="warning">
            {archived ? 'Học kỳ đã được lưu trữ — chỉ được xem.' : 'Học kỳ chưa hoạt động hoặc đồ án đã kết thúc — chỉ được xem.'}
          </Alert>
        )}

        <nav className="tabs project-tabs" aria-label="Nội dung đồ án">
          {tabs.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => `tabs__tab ${isActive ? 'is-active' : ''}`}>
              {t.label}
            </NavLink>
          ))}
        </nav>

        <Outlet context={{ project: p, readOnly, setProject: project.setData }} />
      </div>

      {editing && <ProjectFormModal project={p} onClose={() => setEditing(false)} onSaved={(updated) => project.setData(updated)} />}
    </>
  )
}

export default ProjectLayout
