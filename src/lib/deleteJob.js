import useStore from '../store/useStore'
import useToast from '../store/useToast'
import { confirm } from '../store/useConfirm'

// Shared by the jobs page and the project board: confirm, delete, offer Undo.
export async function deleteJobWithConfirm(id) {
  const { tasks, comments, deleteTask } = useStore.getState()
  const t = tasks.find(x => x.id === id)
  if (!t) return false
  const nComments = comments.filter(c => c.taskId === id && c.type === 'comment').length
  const nFiles = t.attachments?.length || 0
  const details = []
  if (nComments) details.push(`${nComments} comment${nComments > 1 ? 's' : ''} will be deleted with it.`)
  if (nFiles) details.push(`${nFiles} attachment${nFiles > 1 ? 's' : ''} will be removed.`)
  const ok = await confirm({ title: 'Delete this job?', message: `“${t.title}” will be removed from the project.`, details, confirmLabel: 'Delete job', tone: 'danger' })
  if (!ok) return false
  const snapshot = deleteTask(id)
  if (snapshot) {
    useToast.getState().show({
      tone: 'danger', title: 'Job deleted', detail: snapshot.task.title,
      actions: [{ label: 'Undo', onClick: () => useStore.getState().restoreTask(snapshot) }],
    })
  }
  return true
}
