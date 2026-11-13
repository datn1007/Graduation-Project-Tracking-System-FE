import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, CalendarDays, CalendarPlus, ChartColumn, FolderKanban, UserCog } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAsync } from '../../../hooks/useAsync'
import { PERMISSIONS as P } from '../../../constants/enums'
import { PageHeader, Alert } from '../../../components/ui/Misc'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { EnumBadge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import { formatDate } from '../../../utils/format'
import { getActiveTerm, getMyProjects, getSummary, getUpcomingBookings } from '../dashboard.service'
import UpcomingMeetings from '../components/UpcomingMeetings'
import { NO_GROUP_MESSAGE } from '../dashboard.constants'
import SummaryCards from '../components/SummaryCards'

const skip = () => Promise.resolve(undefined)

// Landing page for every role; each block appears only if the user has the matching permission.
const HomePage = () => {
  const { user, can } = useAuth()
  const term = useAsync(() => getActiveTerm(), [])
  const projects = useAsync(() => (can(P.PROJECT_VIEW) ? getMyProjects() : skip()), [])
  const bookings = useAsync(
    () => (can(P.BOOKING_VIEW) ? getUpcomingBookings(5) : skip()),
    [],
  )
  // A user who can book but has no group yet (README BE §8 rule 20): show a notice instead of booking.
  const noGroup = can(P.BOOKING_CREATE) && Array.isArray(projects.data) && projects.data.length === 0
  const summary = useAsync(() => (can(P.DASHBOARD_VIEW) ? getSummary() : skip()), [])

  return (
    <>
      <PageHeader
        title={`Xin chào, ${user.fullName}`}
        description={`${user.roleLabel}${user.department ? ` · ${user.department.name}` : ''}`}
        actions={
          <>
            {can(P.BOOKING_CREATE) && !noGroup && (
              <Link className="btn btn--primary" to="/booking">
                <CalendarPlus aria-hidden="true" /> Đặt lịch hẹn
              </Link>
            )}
            {can(P.AVAILABILITY_MANAGE) && (
              <Link className="btn btn--primary" to="/availability">
                <CalendarClock aria-hidden="true" /> Lịch rảnh
              </Link>
            )}
            {can(P.USER_MANAGE) && (
              <Link className="btn btn--secondary" to="/admin/users">
                <UserCog aria-hidden="true" /> Quản trị người dùng
              </Link>
            )}
          </>
        }
      />

      <div className="stack">
        {noGroup && (
          <Alert tone="warning" title={NO_GROUP_MESSAGE}>
            Chức năng đặt lịch hẹn, Kanban và nộp bài sẽ khả dụng sau khi Quản trị viên xếp bạn vào một nhóm đồ án.
          </Alert>
        )}
        {term.data && (
          <Alert tone="info">
            Học kỳ <strong>{term.data.name} ({term.data.code})</strong>: {formatDate(`${term.data.startDate}T00:00:00+07:00`)} → {formatDate(`${term.data.endDate}T00:00:00+07:00`)}
          </Alert>
        )}
        {term.error && <Alert tone={term.error.code === 'NO_ACTIVE_TERM' ? 'warning' : 'danger'}>{term.error.message}</Alert>}

        {summary.data && (
          <>
            <SummaryCards summary={summary.data} />
            <div>
              <Link to="/dashboard" className="btn btn--secondary btn--sm">
                <ChartColumn aria-hidden="true" /> Xem dashboard chi tiết
              </Link>
            </div>
          </>
        )}

        <div className="grid grid-2">
          {can(P.PROJECT_VIEW) && (projects.loading || projects.error || projects.data?.length > 0) && (
            <Card>
              <CardHeader icon={FolderKanban} title="Đồ án của tôi" actions={<Link to="/projects" className="text-small">Xem tất cả</Link>} />
              <CardBody flush>
                <AsyncContent {...projects} onRetry={projects.reload} compact empty={<EmptyState compact title="Chưa có đồ án" />}>
                  {(list) => (
                    <div className="list">
                      {list.map((p) => (
                        <Link key={p.id} to={`/projects/${p.id}`} className="list-item list-item--link">
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
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </AsyncContent>
              </CardBody>
            </Card>
          )}

          {can(P.BOOKING_VIEW) && (
            <Card>
              <CardHeader icon={CalendarDays} title="Lịch hẹn sắp tới" actions={<Link to="/bookings" className="text-small">Xem tất cả</Link>} />
              <CardBody flush>
                <AsyncContent {...bookings} onRetry={bookings.reload} compact empty={<EmptyState compact icon={CalendarDays} title="Không có lịch hẹn sắp tới" />}>
                  {(page) => <UpcomingMeetings bookings={page.content} />}
                </AsyncContent>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

export default HomePage
