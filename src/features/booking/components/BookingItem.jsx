import React from 'react'
import { CalendarSync, Clock, MapPin, NotebookPen, Users, Video } from 'lucide-react'
import { EnumBadge } from '../../../components/ui/Badge'
import { ENV } from '../../../constants/env'
import { formatTimeRange, formatWeekday } from '../../../utils/format'
import '../booking.scss'

const monthFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: ENV.displayTimeZone, month: 'short' })
const dayFmt = new Intl.DateTimeFormat('vi-VN', { timeZone: ENV.displayTimeZone, day: '2-digit' })

export const DateChip = ({ value }) => (
  <div className="date-chip" aria-hidden="true">
    <div className="date-chip__month">{monthFmt.format(new Date(value))}</div>
    <div className="date-chip__day">{dayFmt.format(new Date(value))}</div>
  </div>
)

// One BookingResponse row. Calendar/email run in the background on the Backend; we only show calendarSyncStatus.
const BookingItem = ({ booking, onOpen, compact = false }) => {
  const { slot } = booking
  const content = (
    <>
      <DateChip value={slot.startAt} />
      <div className="list-item__body">
        <div className="row-between">
          <div className="list-item__title">
            {booking.project?.code} · {booking.advisor?.fullName}
          </div>
          <EnumBadge name="bookingStatus" value={booking.status} />
        </div>
        <div className="list-item__meta">
          <span>
            <Clock aria-hidden="true" /> {formatWeekday(slot.startAt)}, {formatTimeRange(slot.startAt, slot.endAt)}
          </span>
          {slot.location && (
            <span>
              <MapPin aria-hidden="true" /> {slot.location}
            </span>
          )}
          {slot.meetingUrl && booking.status === 'CONFIRMED' && (
            <span>
              <Video aria-hidden="true" />
              <a href={slot.meetingUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                Link họp
              </a>
            </span>
          )}
          {!compact && booking.bookedBy && (
            <span>
              <Users aria-hidden="true" /> Đặt bởi {booking.bookedBy.fullName}
            </span>
          )}
        </div>
        {!compact && booking.agenda && <p className="meeting-item__agenda">{booking.agenda}</p>}
        {!compact && (
          <div className="row meeting-item__footer" style={{ gap: 6 }}>
            {booking.status !== 'CANCELLED' && booking.calendarSyncStatus && (
              <EnumBadge name="calendarSyncStatus" value={booking.calendarSyncStatus} icon={CalendarSync} prefix="Lịch: " />
            )}
            {booking.meetingNotes && (
              <span className="badge badge--primary">
                <NotebookPen aria-hidden="true" /> Có biên bản
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )

  if (!onOpen) return <div className="list-item meeting-item">{content}</div>
  return (
    <button type="button" className="list-item meeting-item list-item--button" onClick={() => onOpen(booking)}>
      {content}
    </button>
  )
}

export default BookingItem
