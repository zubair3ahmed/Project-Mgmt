import { useState } from 'react'
import useQuickAdd from '../store/useQuickAdd'
import TaskFormModal from './TaskFormModal'
import ProjectFormModal from './ProjectFormModal'
import AddClientModal from './AddClientModal'
import LogHoursModal from './LogHoursModal'

export default function GlobalModals() {
  const { job, project, hours, closeJob, closeProject, closeHours } = useQuickAdd()
  const [clientOpen, setClientOpen] = useState(false)
  return (
    <>
      <TaskFormModal open={!!job} onClose={closeJob} presetStatus={job?.status} defaultProjectId={job?.projectId} defaultMilestoneId={job?.milestoneId} />
      <ProjectFormModal open={!!project} project={project?.project} onClose={closeProject} onAddClient={() => setClientOpen(true)} />
      <AddClientModal open={clientOpen} onClose={() => setClientOpen(false)} />
      <LogHoursModal open={!!hours} preset={hours} onClose={closeHours} />
    </>
  )
}
