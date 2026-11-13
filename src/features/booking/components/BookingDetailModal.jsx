import React, { useState } from 'react'
import { CalendarSync, CircleCheck, NotebookPen, UserX, XCircle } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import FormField from '../../../components/ui/FormField'
import { EnumBadge } from '../../../components/ui/Badge'
import { Alert } from '../../../components/ui/Misc'
import { AsyncContent } from '../../../components/ui/States'
import { useAsync } from '../../../hooks/useAsync'
import { useAuth } from '../../../hooks/useAuth'
import { useMeta } from '../../../hooks/useMeta'
import { useToast } from '../../../hooks/useToast'
import { PERMISSIONS as P } from '../../../constants/enums'
import { formatDateTime, formatTimeRange, formatWeekday } from '../../../utils/format'
import { cancelBooking, completeBooking, getBooking, markNoShow, updateMeetingNotes } from '../booking.service'

// Forms per action. `field` is the request field; `required` mirrors the Backend contract.
const ACTIONS = {
  cancel: { title: 'Huỷ lịch hẹn', field: 'reason', label: 'Lý do huỷ', required: true, max: 1000, run: cancelBooking, done: 'Đã huỷ lịch hẹn.' },
  complete: { title: 'Hoàn thành buổi gặp', field: 'meetingNotes', label: 'Biên bản buổi gặp (tuỳ chọn)', max: 20000, run: completeBooking, done: 'Đã đánh dấu hoàn thành.' },
  noShow: { title: 'Đánh dấu vắng mặt', field: 'note', label: 'Ghi chú (tuỳ chọn)', max: 1000, run: markNoShow, done: 'Đã đánh dấu vắng mặt.' },
  notes: { title: 'Biên bản buổi gặp', field: 'meetingNotes', label: 'Biên bản', required: true, max: 20000, run: updateMeetingNotes, done: 'Đã lưu biên bản.' },
}

const BookingDetailModal = ({ bookingId, onClose, onChanged }) => {
  const { can } = useAuth()
  const { label } = useMeta()
  const toast = useToast()
  const detail = useAsync(() => getBooking(bookingId), [bookingId])
  const [action, setAction] = useState(null)
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const booking = detail.data?.booking
  const started = booking ? new Date(booking.slot.startAt).getTime() <= Date.now() : false
  const confirmed = booking?.status === 'CONFIRMED'

  const openAction = (key) => {
    setAction(key)
    setError(null)
    setText(key === 'notes' || key === 'complete' ? booking?.meetingNotes || '' : '')
  }

  const submit = async (event) => {
    event.preventDefault()
    if (saving) return
    const def = ACTIONS[action]
    if (def.required && !text.trim()) return setError(`${def.label} là bắt buộc.`)
    setSaving(true)
    setError(null)
    try {
      const updated = await def.run(booking.id, text.trim())
      toast.success(def.done)
      setAction(null)
      detail.reload()
      onChanged?.(updated)
    } catch (err) {
      setError(err.fieldErrors?.[def.field] || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!bookingId} onClose={onClose} busy={saving} size="lg" title="Chi tiết lịch hẹn">
      <AsyncContent {...detail} onRetry={detail.reload}>
        {({ booking: b, history }) => (
          <div className="stack">
            <div className="row" style={{ gap: 6 }}>
              <EnumBadge name="bookingStatus" value={b.status} />
              {b.calendarSyncStatus && <EnumBadge name="calendarSyncStatus" value={b.calendarSyncStatus} icon={CalendarSync} prefix="Lịch: " />}
            </div>
            <dl className="booking-summary">
              <dt>Thời gian</dt>
              <dd>
                {formatWeekday(b.slot.startAt)}, {formatTimeRange(b.slot.startAt, b.slot.endAt)}
              </dd>
              <dt>Đồ án</dt>
              <dd>
                {b.project?.code} — {b.project?.title}
              </dd>
              <dt>Giảng viên</dt>
              <dd>{b.advisor?.fullName}</dd>
              <dt>Địa điểm</dt>
              <dd>
                {b.slot.location || '—'}
                {b.slot.meetingUrl && (
                  <>
                    {' · '}
                    <a href={b.slot.meetingUrl} target="_blank" rel="noopener noreferrer">
                      Link họp
                    </a>
                  </>
                )}
              </dd>
              <dt>Đặt bởi</dt>
              <dd>
                {b.bookedBy?.fullName} · {formatDateTime(b.createdAt)}
              </dd>
              {b.agenda && (
                <>
                  <dt>Nội dung</dt>
                  <dd style={{ whiteSpace: 'pre-wrap' }}>{b.agenda}</dd>
                </>
              )}
              {b.status === 'CANCELLED' && (
                <>
                  <dt>Đã huỷ</dt>
                  <dd>
                    {b.cancelledBy?.fullName} · {formatDateTime(b.cancelledAt)}
                    {b.cancellationReason ? ` — ${b.cancellationReason}` : ''}
                  </dd>
                </>
              )}
            </dl>

            <section className="stack-sm">
              <h3 className="section-title">Biên bản buổi gặp</h3>
              {b.meetingNotes ? <div className="booking-notes">{b.meetingNotes}</div> : <p className="text-muted text-small">Chưa có biên bản.</p>}
            </section>

            {!action && (
              <div className="row">
                {can(P.BOOKING_CANCEL) && confirmed && !started && (
                  <Button variant="danger-outline" icon={XCircle} onClick={() => openAction('cancel')}>
                    Huỷ lịch
                  </Button>
                )}
                {can(P.BOOKING_MANAGE) && confirmed && started && (
                  <>
                    <Button icon={CircleCheck} onClick={() => openAction('complete')}>
                      Hoàn thành
                    </Button>
                    <Button variant="secondary" icon={UserX} onClick={() => openAction('noShow')}>
                      Vắng mặt
                    </Button>
                  </>
                )}
                {can(P.BOOKING_MANAGE) && b.status !== 'CANCELLED' && (
                  <Button variant="secondary" icon={NotebookPen} onClick={() => openAction('notes')}>
                    {b.meetingNotes ? 'Sửa biên bản' : 'Viết biên bản'}
                  </Button>
                )}
              </div>
            )}

            {action && (
              <form className="inline-form" onSubmit={submit} noValidate>
                <div className="section-title">{ACTIONS[action].title}</div>
                {action === 'cancel' && (
                  <Alert tone="info">
                    {can(P.BOOKING_MANAGE) ? 'Giảng viên huỷ: slot sẽ bị huỷ theo.' : 'Sinh viên huỷ: slot được mở lại cho nhóm khác.'}
                  </Alert>
                )}
                <FormField label={ACTIONS[action].label} required={ACTIONS[action].required} error={error}>
                  <textarea className="textarea" value={text} maxLength={ACTIONS[action].max} onChange={(e) => setText(e.target.value)} data-autofocus />
                </FormField>
                <div className="row">
                  <Button type="submit" loading={saving} variant={action === 'cancel' ? 'danger' : 'primary'}>
                    Xác nhận
                  </Button>
                  <Button variant="secondary" onClick={() => setAction(null)} disabled={saving}>
                    Quay lại
                  </Button>
                </div>
              </form>
            )}

            {history?.length > 0 && (
              <section className="stack-sm">
                <h3 className="section-title">Lịch sử</h3>
                <ul className="timeline">
                  {history.map((h) => (
                    <li key={h.id}>
                      <strong>{label('bookingAction', h.action)}</strong> · {h.actor?.fullName}
                      <span className="text-muted"> · {formatDateTime(h.createdAt)}</span>
                      {h.note && <div className="text-small">{h.note}</div>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </AsyncContent>
    </Modal>
  )
}

export default BookingDetailModal
