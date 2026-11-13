import React from 'react'
import { useOutletContext } from 'react-router-dom'
import BookingsList from '../components/BookingsList'

// Child route of /projects/:projectId (tab "Lịch hẹn"). The project comes from the parent route's
// outlet context ({ project, readOnly }), so this feature never imports the project feature.
const ProjectBookingsPage = () => {
  const { project } = useOutletContext()
  return <BookingsList projectId={project.id} />
}

export default ProjectBookingsPage
