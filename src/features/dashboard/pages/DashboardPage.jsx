import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, ChartColumn, CircleCheck, TriangleAlert } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAsync } from '../../../hooks/useAsync'
import { useMeta } from '../../../hooks/useMeta'
import { PERMISSIONS as P, TONES } from '../../../constants/enums'
import { PageHeader, Pagination, ProgressBar, Alert } from '../../../components/ui/Misc'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { Badge, EnumBadge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { getDepartments, getProjectProgress, getSummary, getTerms } from '../dashboard.service'
import { PROJECT_SORTS } from '../dashboard.constants'
import SummaryCards from '../components/SummaryCards'
import '../dashboard.scss'

// Read-only progress dashboard. Scope comes from the Backend (department manager: own department,
// advisor: own groups, admin: all). No write actions here.
const DashboardPage = () => {
  const { can } = useAuth()
  const { label } = useMeta()
  const [termId, setTermId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [atRisk, setAtRisk] = useState('')
  const [sort, setSort] = useState(PROJECT_SORTS[0].value)
  const [page, setPage] = useState(0)

  const terms = useAsync(() => getTerms(), [])
  const departments = useAsync(() => getDepartments(), [])
  const params = { termId: termId || undefined, departmentId: departmentId || undefined }
  const summary = useAsync(() => getSummary(params), [termId, departmentId])
  const projects = useAsync(
    () => getProjectProgress({ ...params, atRisk: atRisk === '' ? undefined : atRisk === 'true', sort, page, size: 10 }),
    [termId, departmentId, atRisk, sort, page],
  )

  const reset = (setter) => (e) => {
    setter(e.target.value)
    setPage(0)
  }
  const bookings = summary.data?.bookings || {}
  const bookingTotal = Object.values(bookings).reduce((a, b) => a + Number(b || 0), 0)

  return (
    <>
      <PageHeader
        title="Dashboard tiến độ"
        description={summary.data?.term ? `${summary.data.term.name} (${summary.data.term.code}) · chỉ xem` : 'Chỉ xem'}
      />
      <div className="stack">
        <div className="toolbar">
          <select className="select" aria-label="Học kỳ" value={termId} onChange={reset(setTermId)}>
            <option value="">Học kỳ đang hoạt động</option>
            {(terms.data || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.name} ({label('termStatus', t.status)})
              </option>
            ))}
          </select>
          {(departments.data?.length || 0) > 1 && (
            <select className="select" aria-label="Bộ môn" value={departmentId} onChange={reset(setDepartmentId)}>
              <option value="">Mọi bộ môn trong phạm vi</option>
              {departments.data.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} — {d.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {summary.loading && !summary.data && <LoadingState />}
        {summary.error && (summary.error.code === 'NO_ACTIVE_TERM' ? <Alert tone="info">{summary.error.message}</Alert> : <ErrorState error={summary.error} onRetry={summary.reload} />)}
        {summary.data && (
          <>
            <SummaryCards summary={summary.data} />
            <Card>
              <CardHeader icon={CalendarDays} title="Lịch hẹn trong học kỳ" subtitle={`${bookingTotal} lịch hẹn`} />
              <CardBody>
                <div className="distribution">
                  <div className="distribution__bar" aria-hidden="true">
                    {Object.entries(bookings).map(([status, count]) =>
                      count > 0 ? <span key={status} className={`distribution__seg distribution__seg--${TONES.bookingStatus[status] || 'neutral'}`} style={{ flexGrow: count }} /> : null,
                    )}
                  </div>
                  <ul className="distribution__legend">
                    {Object.entries(bookings).map(([status, count]) => (
                      <li key={status}>
                        <span className={`distribution__swatch distribution__seg--${TONES.bookingStatus[status] || 'neutral'}`} aria-hidden="true" />
                        <span>{label('bookingStatus', status)}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardBody>
            </Card>
          </>
        )}

        <Card>
          <div className="card__header">
            <h2 className="row" style={{ gap: 8, fontSize: '1rem' }}>
              <ChartColumn aria-hidden="true" style={{ width: 18, color: 'var(--color-primary)' }} /> Tiến độ từng đồ án
            </h2>
            <div className="toolbar">
              <select className="select" aria-label="Lọc nhóm" value={atRisk} onChange={reset(setAtRisk)}>
                <option value="">Tất cả nhóm</option>
                <option value="true">Chỉ nhóm có nguy cơ</option>
                <option value="false">Nhóm đúng tiến độ</option>
              </select>
              <select className="select" aria-label="Sắp xếp" value={sort} onChange={reset(setSort)}>
                {PROJECT_SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <CardBody flush>
            <AsyncContent {...projects} onRetry={projects.reload} empty={<EmptyState icon={CircleCheck} title="Không có đồ án phù hợp" />}>
              {(data) => (
                <>
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th scope="col">Đồ án</th>
                          <th scope="col">GVHD</th>
                          <th scope="col" style={{ minWidth: 160 }}>
                            Hoàn thành
                          </th>
                          <th scope="col">Milestone quá hạn</th>
                          <th scope="col">Nộp trễ</th>
                          <th scope="col">Tình trạng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.content.map((p) => (
                          <tr key={p.projectId}>
                            <td style={{ minWidth: 240 }}>
                              <div className="table__primary">{can(P.PROJECT_VIEW) ? <Link to={`/projects/${p.projectId}`}>{p.projectCode}</Link> : p.projectCode}</div>
                              <div>{p.projectTitle}</div>
                              <div className="table__secondary">
                                {p.department?.code} · {p.memberCount} SV · <EnumBadge name="projectStatus" value={p.projectStatus} />
                              </div>
                            </td>
                            <td>{p.advisor?.fullName}</td>
                            <td>
                              <ProgressBar value={Number(p.completionPercent)} tone={p.atRisk ? 'danger' : 'success'} />
                              <div className="table__secondary">
                                {p.doneTasks}/{p.totalTasks} task xong · {p.reviewTasks} chờ duyệt
                              </div>
                            </td>
                            <td className={p.overdueMilestones ? 'text-danger' : ''}>{p.overdueMilestones}</td>
                            <td className={p.lateSubmissions ? 'text-danger' : ''}>{p.lateSubmissions}</td>
                            <td>{p.atRisk ? <Badge tone="danger" icon={TriangleAlert}>Có nguy cơ</Badge> : <Badge tone="success">Ổn</Badge>}</td>
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
      </div>
    </>
  )
}

export default DashboardPage
