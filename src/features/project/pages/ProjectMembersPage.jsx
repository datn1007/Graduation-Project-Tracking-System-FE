import React from 'react'
import { useOutletContext } from 'react-router-dom'
import MembersPanel from '../components/MembersPanel'

// Child route of /projects/:projectId (tab "Thành viên"); project data comes from ProjectLayout.
const ProjectMembersPage = () => {
  const { project, setProject } = useOutletContext()
  return <MembersPanel project={project} onChanged={setProject} />
}

export default ProjectMembersPage
