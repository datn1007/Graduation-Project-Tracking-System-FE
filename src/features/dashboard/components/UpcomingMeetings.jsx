import React from 'react'
import { Clock, MapPin } from 'lucide-react'
import { EnumBadge } from '../../../components/ui/Badge'
import { formatTimeRange, formatWeekday } from '../../../utils/format'

// Compact list of the next confirmed meetings (BookingResponse[]) for the home overview.
const UpcomingMeetings = ({ bookings }) => (
  <div className="list">
    {bookings.map((b) => (
      <div key={b.id} className="list-item">
        <div className="list-item__body">
          <div className="row-between">
            <span className="list-item__title">
              {b.project?.code} · {b.advisor?.fullName}
            </span>
            <EnumBadge name="bookingStatus" value={b.status} />
          </div>
          <div className="list-item__meta">
            <span>
              <Clock aria-hidden="true" /> {formatWeekday(b.slot.startAt)}, {formatTimeRange(b.slot.startAt, b.slot.endAt)}
            </span>
            {b.slot.location && (
              <span>
                <MapPin aria-hidden="true" /> {b.slot.location}
              </span>
            )}
            {b.slot.meetingUrl && (
              <a href={b.slot.meetingUrl} target="_blank" rel="noopener noreferrer">
                Link họp
              </a>
            )}
          </div>
        </div>
      </div>
    ))}
  </div>
)

export default UpcomingMeetings
