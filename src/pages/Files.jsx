import EmptyState from '../components/EmptyState'
import { useState } from 'react'
import { Upload, FileText, FileSpreadsheet, FileImage, Download, FolderOpen, Trash2 } from 'lucide-react'
import Header from '../components/Header'
import Avatar from '../components/Avatar'
import { CountBadge } from '../components/Badge'
import Modal from '../components/Modal'
import { FormField, Input, Select, Button } from '../components/FormField'
import useStore from '../store/useStore'
import { confirm } from '../store/useConfirm'
import useToast from '../store/useToast'
import { useAccess } from '../lib/access'

const FILE_ICONS = {
  pdf: FileText,
  dwg: FileImage,
  xlsx: FileSpreadsheet,
  doc: FileText,
}

const FILE_TYPES = ['pdf', 'dwg', 'xlsx', 'doc', 'dxf', 'rvt', 'png', 'jpg']
const FOLDERS = ['Drawings', 'Reports', 'Estimates', 'Contracts', 'Site Photos', 'Correspondence', 'Specifications']

const emptyForm = { name: '', projectId: '', folder: '', type: 'pdf', size: '', uploadedBy: '' }

export default function FilesPage() {
  const allFiles = useStore(s => s.files)
  const allProjects = useStore(s => s.projects)
  const { isAdmin, staffId, myProjects, myProjectIds } = useAccess()
  const projects = isAdmin ? allProjects : myProjects
  const files = isAdmin ? allFiles : allFiles.filter(f => myProjectIds.has(f.projectId))
  const staff = useStore(s => s.staff)
  const addFile = useStore(s => s.addFile)
  const deleteFile = useStore(s => s.deleteFile)

  const [filterProject, setFilterProject] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const filtered = filterProject === 'all' ? files : files.filter(f => f.projectId === filterProject)
  const folders = [...new Set(filtered.map(f => f.folder))]

  async function handleDelete(f) {
    const project = projects.find(p => p.id === f.projectId)
    const ok = await confirm({
      title: 'Delete this file?',
      message: `“${f.name}” will be removed from ${project?.name || 'the project'}.`,
      confirmLabel: 'Delete file',
      tone: 'danger',
    })
    if (!ok) return
    const snapshot = deleteFile(f.id)
    if (snapshot) {
      useToast.getState().show({
        tone: 'danger',
        title: 'File deleted',
        detail: f.name,
        actions: [{ label: 'Undo', onClick: () => useStore.getState().restoreFile(snapshot) }],
      })
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    addFile({ ...form, uploadedBy: isAdmin ? form.uploadedBy : staffId })
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Files"
        subtitle={`${files.length} files across ${projects.length} projects`}
        actions={<Button onClick={() => setShowForm(true)}><Upload size={14} /> Upload</Button>}
      />

      <div className="px-6 py-3 border-b border-surface-100 bg-surface-0 flex flex-wrap items-center gap-3">
        <Select size="sm" className="w-auto min-w-40"
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <span className="flex items-center gap-2 text-sm text-surface-500"><CountBadge count={filtered.length} tone="brand" /> files <CountBadge count={folders.length} /> folders</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {folders.map(folder => {
          const folderFiles = filtered.filter(f => f.folder === folder)
          return (
            <div key={folder} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <FolderOpen size={16} className="text-brand-500" />
                <h3 className="text-sm font-semibold text-surface-800">{folder}</h3>
                <CountBadge count={folderFiles.length} />
              </div>
              <div className="bg-surface-0 border border-surface-300 rounded-lg shadow-sm overflow-hidden">
                <table className="data-table w-full text-sm">
                  <tbody>
                    {folderFiles.map(f => {
                      const Icon = FILE_ICONS[f.type] || FileText
                      const uploader = staff.find(s => s.id === f.uploadedBy)
                      const project = projects.find(p => p.id === f.projectId)
                      return (
                        <tr key={f.id} className="">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon size={16} className="text-surface-400 shrink-0" />
                              <div>
                                <p className="text-sm font-medium text-surface-800">{f.name}</p>
                                <p className="text-2xs text-surface-400">{project?.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {uploader && <Avatar name={uploader.name} size="sm" />}
                              <span className="text-xs text-surface-500">{uploader?.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-surface-500">{f.date}</td>
                          <td className="px-4 py-3 text-xs font-mono text-surface-500">{f.size}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {f.url ? <a href={f.url} download={f.name} aria-label={`Download ${f.name}`} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-500"><Download size={14} /></a> : <span className="w-8 h-8 flex items-center justify-center rounded-md text-surface-300" title="Demo file, no download"><Download size={14} /></span>}
                              {(isAdmin || f.uploadedBy === staffId) && (
                                <button onClick={() => handleDelete(f)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 text-surface-400 hover:text-danger"><Trash2 size={13} /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
        {folders.length === 0 && (
          <EmptyState icon={FolderOpen} title={files.length === 0 ? 'No files yet' : 'No files match'}
            description={files.length === 0 ? 'Drawings, calculations and reports are filed under a project and folder. Upload the first one to start the library.' : 'Try another project, or clear the search.'}
            action={files.length === 0 ? { label: 'Upload a file', icon: Upload, onClick: () => setShowForm(true) } : undefined} />
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Upload File">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="File Name" required>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Foundation-Layout-Block-A.dwg" required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Project" required>
              <Select value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))} required>
                <option value="">Select project…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Folder" required>
              <Select value={form.folder} onChange={e => setForm(f => ({ ...f, folder: e.target.value }))} required>
                <option value="">Select folder…</option>
                {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
              </Select>
            </FormField>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="File Type" required>
              <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} required>
                {FILE_TYPES.map(t => <option key={t} value={t}>.{t}</option>)}
              </Select>
            </FormField>
            <FormField label="File Size">
              <Input value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))} placeholder="2.4 MB" />
            </FormField>
            {isAdmin && (
            <FormField label="Uploaded By" required>
              <Select value={form.uploadedBy} onChange={e => setForm(f => ({ ...f, uploadedBy: e.target.value }))} required>
                <option value="">Select…</option>
                {staff.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </FormField>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit">Upload File</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
