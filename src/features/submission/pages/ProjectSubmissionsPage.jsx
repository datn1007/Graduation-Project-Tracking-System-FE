import React from 'react'
import { useOutletContext } from 'react-router-dom'
import ProjectSubmissions from '../components/ProjectSubmissions'

// Child route of /projects/:projectId (tab "Bài nộp & feedback"); project data comes from ProjectLayout.
const ProjectSubmissionsPage = () => {
  const { project, readOnly } = useOutletContext()
  return <ProjectSubmissions projectId={project.id} readOnly={readOnly} />
}

export default ProjectSubmissionsPage
