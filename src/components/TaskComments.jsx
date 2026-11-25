import { useMemo, useState } from 'react'
import clsx from 'clsx'
import Avatar from './Avatar'
import Tabs from './Tabs'
import { Button, Textarea } from './FormField'
import useStore from '../store/useStore'
import useAuth from '../store/useAuth'

const QUICK = ['Looks good to me', 'Need more info', 'Blocked, waiting on client']

export function timeAgo(ts) {
  const m = Math.round((Date.now() - new Date(ts)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Body({ text, firstNames }) {
  return (
    <p className="text-sm text-surface-700 whitespace-pre-wrap break-words">
      {text.split(/(@[A-Za-z]+)/g).map((part, i) =>
        part.startsWith('@') && firstNames.has(part.slice(1).toLowerCase())
          ? <span key={i} className="px-1 rounded-xs bg-brand-50 text-brand-700 font-medium">{part}</span>
          : part
      )}
    </p>
  )
}

export default function TaskComments({ taskId }) {
  const all = useStore(s => s.comments)
  const staff = useStore(s => s.staff)
  const addComment = useStore(s => s.addComment)
  const updateComment = useStore(s => s.updateComment)
  const deleteComment = useStore(s => s.deleteComment)
  const user = useAuth(s => s.user)
  const isAdmin = user?.role === 'admin'
  const myId = user?.staffId || 'ADMIN'

  const [tab, setTab] = useState('comment')
  const [text, setText] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')

  const entries = useMemo(() => all.filter(c => c.taskId === taskId).sort((a, b) => b.timestamp.localeCompare(a.timestamp)), [all, taskId])
  const comments = entries.filter(c => c.type === 'comment')
  const history = entries.filter(c => c.type === 'system')
  const shown = tab === 'comment' ? comments : tab === 'history' ? history : entries
  const firstNames = useMemo(() => new Set(staff.map(s => s.name.split(' ')[0].toLowerCase())), [staff])

  const mention = text.match(/(?:^|\s)@([A-Za-z]*)$/)
  const mentionOptions = mention
    ? staff.filter(s => s.status === 'active' && s.name.toLowerCase().startsWith(mention[1].toLowerCase())).slice(0, 4)
    : []

  function post() {
    if (!text.trim()) return
    addComment(taskId, text)
    setText('')
    setTab(t => (t === 'history' ? 'all' : t))
  }

  function pickMention(s) {
    setText(t => t.replace(/@[A-Za-z]*$/, `@${s.name.split(' ')[0]} `))
  }

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-surface-900">Activity</h3>

      <div className="flex gap-3">
        <Avatar name={user?.name} initials={user?.avatar} size="md" interactive={false} />
        <div className="flex-1 flex flex-col gap-2 relative">
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); post() } }}
            placeholder="Add a comment… use @ to mention a teammate"
            rows={text ? 3 : 2}
          />
          {mentionOptions.length > 0 && (
            <ul className="absolute left-0 top-full z-20 mt-1 w-56 bg-surface-0 border border-surface-200 rounded-lg shadow-lg p-1">
              {mentionOptions.map(s => (
                <li key={s.id}>
                  <button type="button" onClick={() => pickMention(s)} className="w-full flex items-center gap-2 h-9 px-2 rounded-md text-sm text-surface-700 hover:bg-surface-50">
                    <Avatar name={s.name} size="sm" interactive={false} /> {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {QUICK.map(q => (
                <button key={q} type="button" onClick={() => setText(q)} className="h-7 px-2 rounded-md border border-surface-300 text-xs font-medium text-surface-600 hover:bg-surface-50">
                  {q}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={post} disabled={!text.trim()}>Comment</Button>
          </div>
        </div>
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'comment', label: 'Comments', count: comments.length, tone: 'brand' },
          { id: 'history', label: 'History', count: history.length, tone: 'gray' },
          { id: 'all', label: 'All', count: entries.length, tone: 'gray' },
        ]}
      />

      <ul className="flex flex-col gap-5">
        {shown.map(c => c.type === 'system' ? (
          <li key={c.id} className="flex items-center gap-3 text-sm text-surface-500">
            <span className="w-8 flex justify-center"><span className="w-2 h-2 rounded-full bg-surface-300" /></span>
            <span><span className="font-medium text-surface-700">{c.authorName}</span> {c.text} · {timeAgo(c.timestamp)}</span>
          </li>
        ) : (
          <li key={c.id} className="flex gap-3">
            <Avatar name={c.authorName} size="md" />
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-surface-900">{c.authorName}</span>
                <span className="text-surface-500">{timeAgo(c.timestamp)}</span>
                {c.edited && <span className="text-xs text-surface-400">(edited)</span>}
              </div>
              {editId === c.id ? (
                <div className="flex flex-col gap-2">
                  <Textarea value={editText} onChange={e => setEditText(e.target.value)} rows={3} autoFocus />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { if (editText.trim()) updateComment(c.id, editText); setEditId(null) }}>Save</Button>
                    <Button size="sm" variant="secondary" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Body text={c.text} firstNames={firstNames} />
              )}
              {editId !== c.id && (c.authorId === myId || isAdmin) && (
                <div className="flex gap-3 text-xs font-medium text-surface-500">
                  {c.authorId === myId && (
                    <button onClick={() => { setEditId(c.id); setEditText(c.text) }} className="hover:text-surface-800">Edit</button>
                  )}
                  <button onClick={() => deleteComment(c.id)} className={clsx('hover:text-danger')}>Delete</button>
                </div>
              )}
            </div>
          </li>
        ))}
        {shown.length === 0 && (
          <li className="text-sm text-surface-500 text-center py-4">
            {tab === 'history' ? 'No changes yet.' : 'No comments yet. Start the conversation.'}
          </li>
        )}
      </ul>
    </section>
  )
}
