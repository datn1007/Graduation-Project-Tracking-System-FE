import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarSync, CalendarX, RefreshCw, Users } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../hooks/useToast'
import { PageHeader, Alert } from '../../../components/ui/Misc'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { EnumBadge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import FormField from '../../../components/ui/FormField'
import { formatTimeRange, formatWeekday } from '../../../utils/format'
import { createBooking, getBookings, getMyProjects, getSlots } from '../booking.service'
import { NO_GROUP_MESSAGE, SLOT_RELOAD_CODES, SLOT_WINDOW_DAYS } from '../booking.constants'
import SlotPicker from '../components/SlotPicker'
import BookingItem from '../components/BookingItem'


const SlotSummary = ({ slot }) => (
  <dl className="booking-summary">
    <dt>Giảng viên</dt>
    <dd>{slot.advisor?.fullName}</dd>
    <dt>Thời gian</dt>
    <dd>
      {formatWeekday(slot.startAt)}, {formatTimeRange(slot.startAt, slot.endAt)}
    </dd>
    <dt>Địa điểm</dt>
    <dd>{slot.location || (slot.meetingUrl ? 'Trực tuyến' : '—')}</dd>
  </dl>
)

// Group booking: one slot per project; any member can book. Students only see their advisor's slots.
const BookSlotPage = () => {
  const toast = useToast()
  const projects = useAsync(() => getMyProjects(), [])
  const project = projects.data?.[0]
  // Slots / bookings are only loaded once the student is known to be in a group: without one the
  // Backend answers 403 NOT_PROJECT_MEMBER (README BE §8 rule 20).
  const slots = useAsync(() => {
    if (!project) return Promise.resolve(undefined)
    const from = new Date().toISOString()
    const to = new Date(Date.now() + SLOT_WINDOW_DAYS * 86400000).toISOString()
    return getSlots({ from, to, status: 'OPEN' })
  }, [project?.id])
  const upcoming = useAsync(
    () => (project ? getBookings({ status: 'CONFIRMED', from: new Date().toISOString(), sort: 'slot.startAt,asc', size: 5 }) : Promise.resolve(undefined)),
    [project?.id],
  )
  const [selected, setSelected] = useState(null)
  const [agenda, setAgenda] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [conflict, setConflict] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const submittingRef = useRef(false)

  const readOnly = project && (project.term?.status !== 'ACTIVE' || project.status !== 'IN_PROGRESS')

  const handleBook = async () => {
    // Prevents double submits; atomic locking is done by the Backend (row lock).
    if (submittingRef.current || !selected) return
    submittingRef.current = true
    setSubmitting(true)
    setConflict(null)
    try {
      const booking = await createBooking(selected.id, agenda.trim())
      setConfirmed(booking)
      setSelected(null)
      setAgenda('')
      toast.success('Đặt lịch thành công, lịch hẹn đã được xác nhận.')
      slots.reload()
      upcoming.reload()
    } catch (err) {
      if (SLOT_RELOAD_CODES.includes(err.code)) {
        setSelected(null)
        setConflict(err)
        slots.reload()
      }
      toast.error(err.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (projects.loading && !projects.data) return <LoadingState />
  if (projects.error) return <ErrorState error={projects.error} onRetry={projects.reload} />
  if (!project) {
    return (
      <>
        <PageHeader title="Đặt lịch hẹn" />
        <Card>
          <EmptyState icon={Users} title={NO_GROUP_MESSAGE} text="Chức năng đặt lịch hẹn chỉ dành cho sinh viên đã thuộc một nhóm đồ án trong học kỳ đang hoạt động." />
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Đặt lịch hẹn"
        description={`Nhóm ${project.code} · GVHD ${project.advisor?.fullName}. Mỗi slot dành cho một nhóm và được xác nhận ngay khi đặt thành công.`}
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={slots.reload} loading={slots.loading}>
            Làm mới
          </Button>
        }
      />

      <div className="stack">
        {readOnly && <Alert tone="warning">Học kỳ hoặc đồ án không còn hoạt động — chỉ được xem, không thể đặt lịch.</Alert>}
        {conflict && (
          <Alert tone="danger" title="Không thể đặt khung giờ này">
            {conflict.message} Danh sách khung giờ đã được tải lại.
          </Alert>
        )}

        <div className="grid grid-sidebar">
          <Card>
            <CardHeader icon={CalendarCheck} title="Khung giờ còn trống" subtitle={`${SLOT_WINDOW_DAYS} ngày tới · giờ Việt Nam`} />
            <CardBody>
              <AsyncContent
                {...slots}
                data={slots.loading ? undefined : slots.data}
                onRetry={slots.reload}
                loadingLabel="Đang tải khung giờ…"
                empty={<EmptyState icon={CalendarX} title="Không còn khung giờ trống" text="Giảng viên chưa mở thêm lịch rảnh. Vui lòng quay lại sau." />}
              >
                {(list) => (
                  <SlotPicker
                    slots={list}
                    selectedId={selected?.id}
                    disabled={submitting || readOnly}
                    onSelect={(slot) => {
                      setConflict(null)
                      setSelected(slot)
                    }}
                  />
                )}
              </AsyncContent>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={CalendarCheck} title="Lịch hẹn sắp tới của nhóm" actions={<Link to="/bookings" className="text-small">Xem tất cả</Link>} />
            <CardBody flush>
              <AsyncContent {...upcoming} onRetry={upcoming.reload} compact empty={<EmptyState compact title="Chưa có lịch hẹn sắp tới" />}>
                {(page) => (
                  <div className="list">
                    {page.content.map((b) => (
                      <BookingItem key={b.id} booking={b} compact />
                    ))}
                  </div>
                )}
              </AsyncContent>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal
        open={!!selected}
        onClose={() => !submitting && setSelected(null)}
        busy={submitting}
        title="Xác nhận đặt lịch"
        description={`Đặt cho nhóm ${project.code}. Slot sẽ được khoá ngay khi đặt thành công.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)} disabled={submitting}>
              Huỷ
            </Button>
            <Button icon={CalendarCheck} loading={submitting} onClick={handleBook}>
              Xác nhận đặt lịch
            </Button>
          </>
        }
      >
        {selected && (
          <div className="stack">
            <SlotSummary slot={selected} />
            <FormField label="Nội dung muốn trao đổi (tuỳ chọn)">
              <textarea className="textarea" value={agenda} maxLength={5000} onChange={(e) => setAgenda(e.target.value)} placeholder="VD: Báo cáo tiến độ tuần 5, hỏi về thiết kế CSDL…" data-autofocus />
            </FormField>
          </div>
        )}
      </Modal>

      <Modal
        open={!!confirmed}
        onClose={() => setConfirmed(null)}
        title="Đặt lịch thành công"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmed(null)}>
              Đóng
            </Button>
            <Link className="btn btn--primary" to="/bookings">
              Xem lịch hẹn
            </Link>
          </>
        }
      >
        {confirmed && (
          <div className="stack">
            <Alert tone="success">Lịch hẹn đã được xác nhận tự động.</Alert>
            <SlotSummary slot={{ ...confirmed.slot, advisor: confirmed.advisor }} />
            <div className="row" style={{ gap: 6 }}>
              <span className="text-small text-muted">Email & Google Calendar xử lý nền:</span>
              <EnumBadge name="calendarSyncStatus" value={confirmed.calendarSyncStatus} icon={CalendarSync} prefix="Lịch: " />
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

export default BookSlotPage
