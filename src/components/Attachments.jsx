import { useEffect, useRef, useState } from 'react'
import { Download, File as FileIcon, FileImage, FileSpreadsheet, FileText, Paperclip, Upload, X } from 'lucide-react'
import clsx from 'clsx'
import useAuth from '../store/useAuth'
import { ACCEPT, MAX_FILES, extOf, formatSize, isImage, makeAttachments } from '../lib/attachments'

function iconFor(a) {
  const ext = extOf(a.name)
  if (isImage(a)) return FileImage
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet
  if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText
  return FileIcon
}

export function DropZone({ onAdd, count = 0, compact = false }) {
  const user = useAuth(s => s.user)
  const inputRef = useRef(null)
  const [over, setOver] = useState(false)
  const [errors, setErrors] = useState([])

  function handle(files) {
    if (!files?.length) return
    const { accepted, rejected } = makeAttachments(files, user, count)
    setErrors(rejected)
    if (accepted.length) onAdd(accepted)
  }

  useEffect(() => {
    const onPaste = e => {
      if (e.clipboardData?.files?.length) { e.preventDefault(); handle(e.clipboardData.files) }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, user])

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files) }}
        className={clsx(
          'flex items-center gap-3 rounded-lg border border-dashed px-4 transition-colors',
          compact ? 'py-3' : 'py-4',
          over ? 'border-brand-600 bg-brand-50' : 'border-surface-300 bg-surface-50'
        )}
      >
        <Upload size={20} className={over ? 'text-brand-600' : 'text-surface-400'} />
        <p className="flex-1 text-sm text-surface-600">
          Drop files here, paste a screenshot, or{' '}
          <button type="button" onClick={() => inputRef.current?.click()} className="font-semibold text-brand-700 hover:underline">browse</button>
          <span className="block text-xs text-surface-500">Up to {MAX_FILES} files, 10 MB each: images, PDF, DWG, Excel, Word</span>
        </p>
        <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden" onChange={e => { handle(e.target.files); e.target.value = '' }} />
      </div>
      {errors.map(er => <p key={er} className="text-xs text-danger-dark">{er}</p>)}
    </div>
  )
}

export function AttachmentList({ items, onRemove, canRemove = () => true }) {
  if (!items.length) return null
  return (
    <ul className="grid grid-cols-2 gap-3">
      {items.map(a => {
        const Icon = iconFor(a)
        return (
          <li key={a.id} className="group relative flex flex-col rounded-lg border border-surface-300 bg-surface-0 overflow-hidden">
            <a href={a.url} target="_blank" rel="noreferrer" className="h-20 bg-surface-50 flex items-center justify-center overflow-hidden" title={`Open ${a.name}`}>
              {isImage(a) ? <img src={a.url} alt={a.name} className="w-full h-full object-cover" /> : <Icon size={28} className="text-surface-400" />}
            </a>
            <div className="px-3 py-2 min-w-0">
              <p className="text-sm font-medium text-surface-800 truncate">{a.name}</p>
              <p className="text-xs text-surface-500 truncate">{formatSize(a.size)}{a.addedBy ? ` · ${a.addedBy.split(' ')[0]}` : ''}</p>
            </div>
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
              <a href={a.url} download={a.name} aria-label={`Download ${a.name}`} className="w-7 h-7 flex items-center justify-center rounded-md bg-surface-0/90 border border-surface-200 text-surface-600 hover:text-surface-900">
                <Download size={14} />
              </a>
              {canRemove(a) && (
                <button type="button" onClick={() => onRemove(a)} aria-label={`Remove ${a.name}`} className="w-7 h-7 flex items-center justify-center rounded-md bg-surface-0/90 border border-surface-200 text-surface-600 hover:text-danger">
                  <X size={14} />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function AttachmentCount({ count }) {
  if (!count) return null
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-surface-500">
      <Paperclip size={14} /> {count}
    </span>
  )
}
