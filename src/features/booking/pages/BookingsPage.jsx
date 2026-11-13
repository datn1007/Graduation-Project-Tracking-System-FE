import React from 'react'
import { Link } from 'react-router-dom'
import { CalendarPlus } from 'lucide-react'
import { useAuth } from '../../../hooks/useAuth'
import { PERMISSIONS as P } from '../../../constants/enums'
import { PageHeader } from '../../../components/ui/Misc'
import BookingsList from '../components/BookingsList'

const BookingsPage = () => {
  const { can } = useAuth()
  return (
    <>
      <PageHeader
        title="Lịch hẹn"
        description="Lịch sử đặt lịch, biên bản buổi gặp và trạng thái đồng bộ Google Calendar."
        actions={
          <>
            {can(P.BOOKING_CREATE) && (
              <Link className="btn btn--primary" to="/booking">
                <CalendarPlus aria-hidden="true" /> Đặt lịch mới
              </Link>
            )}
            {can(P.AVAILABILITY_MANAGE) && (
              <Link className="btn btn--secondary" to="/availability">
                Quản lý lịch rảnh
              </Link>
            )}
          </>
        }
      />
      <BookingsList />
    </>
  )
}

export default BookingsPage
