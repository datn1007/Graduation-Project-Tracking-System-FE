import React, { useMemo, useState } from 'react'
import { CalendarClock, CalendarX, XCircle } from 'lucide-react'
import { useToast } from '../../../hooks/useToast'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { EnumBadge } from '../../../components/ui/Badge'
import { Alert } from '../../../components/ui/Misc'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import FormField from '../../../components/ui/FormField'
import { dayKey, formatTimeRange, formatWeekday } from '../../../utils/format'
import { cancelSlot } from '../availability.service'

// Upcoming OPEN / BOOKED slots of the advisor, grouped by Vietnam-time day. Cancelling a booked slot
// cancels the group's booking too, so a reason is required (README BE §7.4, §8.5).
const UpcomingSlots = ({ slots }) => {
  const toast = useToast()
  const [target, setTarget] = useState(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  const days = useMemo(() => {
    const map = new Map()
    for (const s of slots.data || []) {
      const key = dayKey(s.startAt)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [slots.data])

  const cancel = async () => {
    if (target.status === 'BOOKED' && !reason.trim()) return toast.error('Slot đã có nhóm đặt — cần nhập lý do huỷ.')
    setBusy(true)
    try {
      await cancelSlot(target.id, reason.trim())
      toast.success('Đã huỷ slot.')
      setTarget(null)
      setReason('')
      slots.reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader icon={CalendarClock} title="Slot sắp tới" subtitle="Slot đã được đặt hiển thị mã nhóm" />
      <CardBody>
        <AsyncContent {...slots} onRetry={slots.reload} empty={<EmptyState icon={CalendarX} title="Chưa có slot nào" text="Tạo lịch rảnh hằng tuần hoặc thêm slot lẻ." />}>
          {() => (
            <div className="stack">
              {days.map(([key, daySlots]) => (
                <div key={key} className="stack-sm">
                  <div className="availability-day__label">{formatWeekday(daySlots[0].startAt)}</div>
                  <div className="my-slot-grid">
                    {daySlots.map((slot) => (
                      <div key={slot.id} className={`my-slot ${slot.status === 'BOOKED' ? 'my-slot--booked' : ''}`}>
                        <div>
                          <div className="my-slot__time">{formatTimeRange(slot.startAt, slot.endAt)}</div>
                          <div className="my-slot__who">{slot.booking?.project ? `Nhóm ${slot.booking.project.code}` : slot.location || (slot.meetingUrl ? 'Online' : '—')}</div>
                        </div>
                        <div className="row" style={{ gap: 4 }}>
                          <EnumBadge name="slotStatus" value={slot.status} />
                          <Button variant="ghost" size="sm" iconOnly icon={XCircle} aria-label={`Huỷ slot ${formatTimeRange(slot.startAt, slot.endAt)}`} onClick={() => setTarget(slot)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AsyncContent>
      </CardBody>

      <Modal
        open={!!target}
        onClose={() => setTarget(null)}
        busy={busy}
        title="Huỷ slot?"
        description={target ? `${formatWeekday(target.startAt)}, ${formatTimeRange(target.startAt, target.endAt)}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Giữ lại
            </Button>
            <Button variant="danger" loading={busy} onClick={cancel}>
              Huỷ slot
            </Button>
          </>
        }
      >
        {target?.status === 'BOOKED' && <Alert tone="warning">Nhóm {target.booking?.project?.code} đã đặt slot này — lịch hẹn của nhóm sẽ bị huỷ.</Alert>}
        <FormField label={`Lý do${target?.status === 'BOOKED' ? '' : ' (tuỳ chọn)'}`} required={target?.status === 'BOOKED'}>
          <textarea className="textarea" maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </FormField>
      </Modal>
    </Card>
  )
}

export default UpcomingSlots
