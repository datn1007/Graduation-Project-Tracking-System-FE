import React, { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useMeta } from '../../../hooks/useMeta'
import { Pagination, Tabs } from '../../../components/ui/Misc'
import { Card, CardBody } from '../../../components/ui/Card'
import { AsyncContent, EmptyState } from '../../../components/ui/States'
import { getBookings } from '../booking.service'
import BookingItem from './BookingItem'
import BookingDetailModal from './BookingDetailModal'

import { BOOKINGS_PAGE_SIZE } from '../booking.constants'

// Bookings within the user's scope (BE filters: student = own group, advisor = own slots, …).
// Optional `projectId` embeds the list in a project page.
const BookingsList = ({ projectId }) => {
  const { options } = useMeta()
  const [scope, setScope] = useState('upcoming')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [openId, setOpenId] = useState(null)

  const bookings = useAsync(() => {
    const params = { projectId, page, size: BOOKINGS_PAGE_SIZE }
    if (scope === 'upcoming') Object.assign(params, { status: 'CONFIRMED', from: new Date().toISOString(), sort: 'slot.startAt,asc' })
    else Object.assign(params, { status: status || undefined, sort: 'slot.startAt,desc' })
    return getBookings(params)
  }, [scope, status, page, projectId])

  return (
    <Card>
      <div className="card__header">
        <Tabs
          label="Phạm vi"
          value={scope}
          onChange={(value) => {
            setScope(value)
            setPage(0)
          }}
          tabs={[
            { value: 'upcoming', label: 'Sắp tới' },
            { value: 'all', label: 'Tất cả' },
          ]}
        />
        {scope === 'all' && (
          <select
            className="select"
            style={{ width: 'auto' }}
            aria-label="Lọc theo trạng thái"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(0)
            }}
          >
            <option value="">Mọi trạng thái</option>
            {options('bookingStatus').map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>
      <CardBody flush>
        <AsyncContent {...bookings} onRetry={bookings.reload} empty={<EmptyState icon={CalendarDays} title={scope === 'upcoming' ? 'Không có lịch hẹn sắp tới' : 'Chưa có lịch hẹn'} />}>
          {(data) => (
            <>
              <div className="list">
                {data.content.map((b) => (
                  <BookingItem key={b.id} booking={b} onOpen={(item) => setOpenId(item.id)} />
                ))}
              </div>
              <Pagination pageData={data} onPageChange={setPage} />
            </>
          )}
        </AsyncContent>
      </CardBody>
      {openId && <BookingDetailModal bookingId={openId} onClose={() => setOpenId(null)} onChanged={bookings.reload} />}
    </Card>
  )
}

export default BookingsList
