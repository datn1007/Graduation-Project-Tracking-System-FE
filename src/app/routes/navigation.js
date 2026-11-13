import { Building2, CalendarClock, CalendarDays, CalendarPlus, CalendarRange, ChartColumn, LayoutDashboard, SquareKanban, UserCog, UsersRound } from 'lucide-react'
import { PERMISSIONS as P } from '../../constants/enums'

// Sidebar entries. An entry is shown when the user has `permission` (none = every signed-in user).
// Visibility is UX only — the Backend checks the same permissions on every request.
export const NAV_SECTIONS = [
  {
    title: null,
    items: [
      { to: '/', label: 'Tổng quan', icon: LayoutDashboard, end: true },
      { to: '/booking', label: 'Đặt lịch hẹn', icon: CalendarPlus, permission: P.BOOKING_CREATE },
      { to: '/bookings', label: 'Lịch hẹn', icon: CalendarDays, permission: P.BOOKING_VIEW },
      { to: '/availability', label: 'Lịch rảnh & slot', icon: CalendarClock, permission: P.AVAILABILITY_MANAGE },
      { to: '/projects', label: 'Đồ án & tiến độ', icon: SquareKanban, permission: P.PROJECT_VIEW },
      { to: '/dashboard', label: 'Dashboard tiến độ', icon: ChartColumn, permission: P.DASHBOARD_VIEW },
    ],
  },
  {
    title: 'Quản trị',
    items: [
      { to: '/admin/users', label: 'Người dùng', icon: UserCog, permission: P.USER_MANAGE },
      { to: '/admin/grouping', label: 'Xếp nhóm', icon: UsersRound, permission: P.PROJECT_MANAGE },
      { to: '/admin/departments', label: 'Bộ môn', icon: Building2, permission: P.DEPARTMENT_MANAGE },
      { to: '/admin/terms', label: 'Học kỳ', icon: CalendarRange, permission: P.TERM_MANAGE },
    ],
  },
]
