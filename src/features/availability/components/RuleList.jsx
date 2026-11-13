import React, { useState } from 'react'
import { CalendarClock, Power, Repeat } from 'lucide-react'
import { useToast } from '../../../hooks/useToast'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import Button from '../../../components/ui/Button'
import Modal from '../../../components/ui/Modal'
import { formatDate } from '../../../utils/format'
import { WEEKDAY_LABELS } from '../availability.constants'
import { deactivateRule } from '../availability.service'

const dateOnly = (value) => formatDate(`${value}T00:00:00+07:00`)

// Weekly rules of the signed-in advisor; deactivating cancels the rule's future OPEN slots.
const RuleList = ({ rules, onChanged }) => {
  const toast = useToast()
  const [target, setTarget] = useState(null)
  const [busy, setBusy] = useState(false)

  const deactivate = async () => {
    setBusy(true)
    try {
      await deactivateRule(target.id)
      toast.success('Đã tắt lịch rảnh. Các slot trống trong tương lai đã bị huỷ.')
      setTarget(null)
      onChanged()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader icon={Repeat} title="Lịch rảnh đã cấu hình" />
      <CardBody flush>
        <AsyncContent {...rules} onRetry={rules.reload} empty={<EmptyState icon={CalendarClock} title="Chưa có lịch rảnh" />}>
          {(list) => (
            <div className="list">
              {list.map((r) => (
                <div key={r.id} className="list-item">
                  <div className="list-item__body">
                    <div className="row-between">
                      <span className="list-item__title">
                        {WEEKDAY_LABELS[r.dayOfWeek] || r.dayOfWeek} · {r.startTime}–{r.endTime}
                      </span>
                      {r.active ? <Badge tone="success">Đang áp dụng</Badge> : <Badge>Đã tắt</Badge>}
                    </div>
                    <div className="list-item__meta">
                      <span>
                        {r.slotDurationMinutes} phút/slot{r.bufferMinutes ? ` · nghỉ ${r.bufferMinutes} phút` : ''}
                      </span>
                      <span>
                        {dateOnly(r.effectiveFrom)} → {dateOnly(r.effectiveTo)}
                      </span>
                      {r.location && <span>{r.location}</span>}
                      {r.meetingUrl && <span>Online</span>}
                    </div>
                  </div>
                  {r.active && (
                    <Button variant="ghost" size="sm" icon={Power} onClick={() => setTarget(r)}>
                      Tắt
                    </Button>
                  )}
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
        title="Tắt lịch rảnh?"
        description={target ? `${WEEKDAY_LABELS[target.dayOfWeek]} · ${target.startTime}–${target.endTime}` : ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Giữ lại
            </Button>
            <Button variant="danger" loading={busy} onClick={deactivate}>
              Tắt lịch rảnh
            </Button>
          </>
        }
      >
        <p>Các slot còn trống trong tương lai sẽ bị huỷ. Slot đã có nhóm đặt vẫn được giữ nguyên.</p>
      </Modal>
    </Card>
  )
}

export default RuleList
