import React from 'react'
import { useOutletContext } from 'react-router-dom'
import MilestoneBoard from '../components/MilestoneBoard'

// Child route of /projects/:projectId (tab "Tiến độ"). `project` / `readOnly` come from the
// parent route's outlet context; `renderTaskSubmissions` is injected by app/routes.
const ProjectKanbanPage = ({ renderTaskSubmissions }) => {
  const { project, readOnly } = useOutletContext()
  return <MilestoneBoard project={project} readOnly={readOnly} renderTaskSubmissions={renderTaskSubmissions} />
}

export default ProjectKanbanPage
