import React, { useState } from 'react'
import { CalendarPlus, Plus } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { useAsync } from '../../../hooks/useAsync'
import { useMeta } from '../../../hooks/useMeta'
import { PageHeader, Tabs } from '../../../components/ui/Misc'
import { Card, CardBody, CardHeader } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'
import { getMySlots, getRules } from '../availability.service'
import { SLOT_WINDOW_DAYS } from '../availability.constants'
import RuleForm from '../components/RuleForm'
import RuleList from '../components/RuleList'
import UpcomingSlots from '../components/UpcomingSlots'
import SingleSlotModal from '../components/SingleSlotModal'
import '../availability.scss'

// Advisor (AVAILABILITY_MANAGE): weekly rules generate slots automatically; one-off slots can be added.
const AvailabilityPage = () => {
  const { user } = useAuth()
  const { config } = useMeta()
  const [tab, setTab] = useState('slots')
  const [adding, setAdding] = useState(false)

  const rules = useAsync(() => getRules(), [])
  const slots = useAsync(() => {
    const from = new Date().toISOString()
    const to = new Date(Date.now() + SLOT_WINDOW_DAYS * 86400000).toISOString()
    return getMySlots({ advisorId: user.id, from, to, status: ['OPEN', 'BOOKED'] })
  }, [user.id])

  const reloadAll = () => {
    rules.reload()
    slots.reload()
  }

  return (
    <>
      <PageHeader
        title="Lịch rảnh & slot"
        description="Cấu hình lịch rảnh lặp hằng tuần — hệ thống tự sinh slot cho sinh viên đặt. Slot trùng giờ sẽ được bỏ qua."
        actions={
          <Button variant="secondary" icon={Plus} onClick={() => setAdding(true)}>
            Thêm slot lẻ
          </Button>
        }
      />

      <div className="stack">
        <Tabs
          label="Chế độ xem"
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'slots', label: `Slot ${SLOT_WINDOW_DAYS} ngày tới`, count: slots.data?.length },
            { value: 'rules', label: 'Lịch rảnh hằng tuần', count: rules.data?.filter((r) => r.active).length },
          ]}
        />

        {tab === 'rules' && (
          <div className="grid availability-layout">
            <Card>
              <CardHeader icon={CalendarPlus} title="Tạo lịch rảnh" subtitle="Giờ Việt Nam" />
              <CardBody>
                <RuleForm config={config} onCreated={reloadAll} />
              </CardBody>
            </Card>
            <RuleList rules={rules} onChanged={reloadAll} />
          </div>
        )}

        {tab === 'slots' && <UpcomingSlots slots={slots} />}
      </div>

      <SingleSlotModal open={adding} onClose={() => setAdding(false)} onCreated={slots.reload} />
    </>
  )
}

export default AvailabilityPage
