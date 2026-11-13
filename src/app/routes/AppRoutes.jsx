import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AppLayout from '../../layouts/AppLayout'
import { RequireAuth, RequirePermission } from './guards'
import { PERMISSIONS as P } from '../../constants/enums'
import LoginPage from '../../features/auth/pages/LoginPage'
import ChangePasswordPage from '../../features/auth/pages/ChangePasswordPage'
import HomePage from '../../features/dashboard/pages/HomePage'
import DashboardPage from '../../features/dashboard/pages/DashboardPage'
import BookSlotPage from '../../features/booking/pages/BookSlotPage'
import BookingsPage from '../../features/booking/pages/BookingsPage'
import ProjectBookingsPage from '../../features/booking/pages/ProjectBookingsPage'
import AvailabilityPage from '../../features/availability/pages/AvailabilityPage'
import ProjectsPage from '../../features/project/pages/ProjectsPage'
import ProjectLayout from '../../features/project/pages/ProjectLayout'
import ProjectMembersPage from '../../features/project/pages/ProjectMembersPage'
import GroupingPage from '../../features/project/pages/GroupingPage'
import ProjectKanbanPage from '../../features/kanban/pages/ProjectKanbanPage'
import ProjectSubmissionsPage from '../../features/submission/pages/ProjectSubmissionsPage'
import TaskSubmissions from '../../features/submission/components/TaskSubmissions'
import UsersPage from '../../features/admin/pages/UsersPage'
import DepartmentsPage from '../../features/admin/pages/DepartmentsPage'
import TermsPage from '../../features/admin/pages/TermsPage'
import ForbiddenPage from './errors/ForbiddenPage'
import NotFoundPage from './errors/NotFoundPage'

// The app layer is the only place that composes features (FE guideline: features never import each
// other). Routes are guarded by permission from GET /auth/me, never by role.
const renderTaskSubmissions = (props) => <TaskSubmissions {...props} />

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="account/password" element={<ChangePasswordPage />} />

        <Route element={<RequirePermission permission={P.BOOKING_CREATE} />}>
          <Route path="booking" element={<BookSlotPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.BOOKING_VIEW} />}>
          <Route path="bookings" element={<BookingsPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.AVAILABILITY_MANAGE} />}>
          <Route path="availability" element={<AvailabilityPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.PROJECT_VIEW} />}>
          <Route path="projects" element={<ProjectsPage />} />
          {/* Project detail: tabs are child routes owned by different features. */}
          <Route path="projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<ProjectKanbanPage renderTaskSubmissions={renderTaskSubmissions} />} />
            <Route path="submissions" element={<ProjectSubmissionsPage />} />
            <Route element={<RequirePermission permission={P.BOOKING_VIEW} />}>
              <Route path="bookings" element={<ProjectBookingsPage />} />
            </Route>
            <Route path="members" element={<ProjectMembersPage />} />
          </Route>
        </Route>
        <Route element={<RequirePermission permission={P.DASHBOARD_VIEW} />}>
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>

        <Route element={<RequirePermission permission={P.USER_MANAGE} />}>
          <Route path="admin/users" element={<UsersPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.PROJECT_MANAGE} />}>
          <Route path="admin/grouping" element={<GroupingPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.DEPARTMENT_MANAGE} />}>
          <Route path="admin/departments" element={<DepartmentsPage />} />
        </Route>
        <Route element={<RequirePermission permission={P.TERM_MANAGE} />}>
          <Route path="admin/terms" element={<TermsPage />} />
        </Route>

        <Route path="403" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default AppRoutes
