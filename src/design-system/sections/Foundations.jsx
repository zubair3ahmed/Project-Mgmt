import { useEffect, useState } from 'react'
import {
  AlertTriangle, BarChart3, Bell, CheckCircle2, ChevronDown, Clock, Download, FileText, FolderKanban, LayoutDashboard,
  ListTodo, LogOut, MessageSquare, Milestone, Paperclip, Pencil, Plus, Search, Settings, Sparkles, Trash2, Upload, Users, X,
} from 'lucide-react'
import { Section, Sub, CodeBlock, useCopy } from './Primitives'
import { Button } from '@/components/FormField'
import { COLOR_GROUPS, ICONS, RADIUS, SHADOWS, SPACING, TYPE_SCALE } from '../tokens'

const ICON_MAP = { AlertTriangle, BarChart3, Bell, CheckCircle2, ChevronDown, Clock, Download, FileText, FolderKanban, LayoutDashboard, ListTodo, LogOut, MessageSquare, Milestone, Paperclip, Pencil, Plus, Search, Settings, Sparkles, Trash2, Upload, Users, X }

const cssVar = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function readTokens() {
  const color = {}
  COLOR_GROUPS.forEach(([, , names]) => names.forEach(n => { color[n] = cssVar(`--color-${n}`) }))
  const radius = Object.fromEntries(RADIUS.filter(r => r[0] !== 'full').map(([k]) => [k, cssVar(`--radius-${k}`)]))
  const shadow = Object.fromEntries(SHADOWS.map(([k]) => [k, cssVar(`--shadow-${k}`)]))
  return { color, radius, shadow }
}

function download(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Foundations() {
  const { copy, done } = useCopy()
  const [tokens, setTokens] = useState(null)
  useEffect(() => { setTokens(readTokens()) }, [])

  const tokensJson = () => JSON.stringify({
    $description: 'StructFlow design tokens. Generated from the live theme.',
    color: tokens.color,
    spacing: Object.fromEntries(SPACING.map(([k, px]) => [k, px])),
    radius: { ...tokens.radius, full: '9999px' },
    shadow: tokens.shadow,
    font: { sans: "'Plus Jakarta Sans', system-ui, sans-serif", mono: "'JetBrains Mono', monospace" },
    fontSize: Object.fromEntries(TYPE_SCALE.map(([k, v]) => [k, v.split(' / ')[1]])),
  }, null, 2)

  const cssBlock = () => ':root {\n' + Object.entries(tokens.color).map(([k, v]) => `  --color-${k}: ${v};`).join('\n') + '\n' + Object.entries(tokens.radius).map(([k, v]) => `  --radius-${k}: ${v};`).join('\n') + '\n}'

  return (
    <>
      <Section id="colors" title="Colors" description="Core UI palette. Brand blue for action, a cool gray ramp for structure, and four status hues. Click any swatch to copy its hex.">
        {COLOR_GROUPS.map(([title, desc, names]) => (
          <Sub key={title} title={title} hint={desc}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {names.map(n => {
                const hex = tokens?.color[n] || ''
                return (
                  <button key={n} type="button" onClick={() => copy(hex, n)} className="text-left rounded-lg border border-surface-300 bg-surface-0 overflow-hidden hover:border-surface-400 transition-colors">
                    <span className="block h-14 border-b border-surface-200" style={{ background: `var(--color-${n})` }} />
                    <span className="block px-3 py-2">
                      <span className="block text-xs font-semibold text-surface-800">{n}</span>
                      <span className="block text-xs font-mono text-surface-500">{done === n ? 'Copied' : hex}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </Sub>
        ))}
        <p className="text-sm text-surface-600">Usage: <code className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface-100">bg-brand-600</code>, <code className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface-100">text-surface-700</code>, <code className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface-100">border-surface-300</code>. Card borders are always <code className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface-100">border-surface-300</code>. Page background is <code className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface-100">surface-50</code>.</p>
      </Section>

      <Section id="typography" title="Typography" description="Plus Jakarta Sans for UI text and JetBrains Mono for numbers in tables. Sizes follow a 12 / 14 / 16 / 20 / 24 / 30 scale.">
        <div className="rounded-xl border border-surface-300 bg-surface-0 overflow-hidden">
          {TYPE_SCALE.map(([cls, size, weight, use]) => (
            <div key={cls} className="grid grid-cols-[120px_1fr_1.2fr] items-center gap-4 px-6 py-4 border-b border-surface-200 last:border-0">
              <code className="text-xs font-mono text-brand-700">{cls}</code>
              <p className={`${cls} ${weight} text-surface-900 truncate`}>Structural design</p>
              <p className="text-xs text-surface-500">{size} · {weight} · {use}</p>
            </div>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-surface-300 bg-surface-0 p-5"><p className="text-xs text-surface-500 mb-2">Sans (UI)</p><p className="text-2xl font-semibold">Aa Bb Cc 0123456789</p></div>
          <div className="rounded-lg border border-surface-300 bg-surface-0 p-5"><p className="text-xs text-surface-500 mb-2">Mono (numbers in tables)</p><p className="text-2xl font-mono font-medium">₹25.0L 62% 18h</p></div>
        </div>
      </Section>

      <Section id="spacing" title="Spacing" description="Everything sits on a 4px grid, with 8px as the main step. Prefer these values for padding, gaps and sizes.">
        <div className="rounded-xl border border-surface-300 bg-surface-0 p-6 flex flex-col gap-3">
          {SPACING.map(([k, px, use]) => (
            <div key={k} className="grid grid-cols-[48px_64px_1fr_220px] items-center gap-4">
              <code className="text-xs font-mono text-brand-700">{k}</code>
              <span className="text-xs text-surface-600">{px}</span>
              <span className="h-4 rounded-xs bg-brand-500" style={{ width: px }} />
              <span className="text-xs text-surface-500">{use}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="radius" title="Radius" description="Small controls use 8px, cards 12px, modals 16px, and pills are fully rounded.">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {RADIUS.map(([k, px, cls, use]) => (
            <div key={k} className="flex flex-col gap-2">
              <div className="h-20 border-2 border-brand-600 bg-brand-50" style={{ borderRadius: k === 'full' ? 40 : px }} />
              <p className="text-sm font-semibold text-surface-800">{k} <span className="font-normal text-surface-500">{px}</span></p>
              <p className="text-xs font-mono text-surface-500">{cls}</p>
              <p className="text-xs text-surface-500">{use}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="shadows" title="Shadows" description="Neutral, low-opacity shadows only. No colored glow. Cards rest on a 1px border plus shadow-sm.">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 p-6 rounded-xl bg-surface-100">
          {SHADOWS.map(([k, cls, use]) => (
            <div key={k} className="flex flex-col gap-2">
              <div className={`h-20 rounded-lg bg-surface-0 border border-surface-200 ${cls}`} />
              <p className="text-sm font-semibold text-surface-800">{k}</p>
              <p className="text-xs font-mono text-surface-500">{cls}</p>
              <p className="text-xs text-surface-500">{use}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="icons" title="Icons" description="Lucide line icons at 16, 18 or 20px with the default 2px stroke. Icons never sit in colored boxes except avatars and the brand mark.">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {ICONS.map(name => {
            const Icon = ICON_MAP[name]
            return (
              <div key={name} className="flex flex-col items-center gap-2 rounded-lg border border-surface-300 bg-surface-0 py-4 px-2">
                <Icon size={20} className="text-surface-700" />
                <span className="text-[11px] text-surface-500 truncate max-w-full">{name}</span>
              </div>
            )
          })}
        </div>
        <CodeBlock code={"import { Plus } from 'lucide-react'\n\n<Button><Plus size={16} /> New Task</Button>"} />
      </Section>

      <Section id="tokens-export" title="Export tokens" description="Hand these to engineers or import them into Figma Tokens / Style Dictionary. Values are read live from the running theme.">
        <div className="flex flex-wrap gap-3">
          <Button disabled={!tokens} onClick={() => download('structflow-tokens.json', tokensJson())}><Download size={16} /> Download tokens.json</Button>
          <Button variant="secondary" disabled={!tokens} onClick={() => download('structflow-tokens.css', cssBlock(), 'text/css')}><Download size={16} /> Download tokens.css</Button>
          <Button variant="secondary" disabled={!tokens} onClick={() => copy(cssBlock(), 'css')}>{done === 'css' ? 'Copied' : 'Copy CSS variables'}</Button>
        </div>
        {tokens && <CodeBlock code={cssBlock().split('\n').slice(0, 14).join('\n') + '\n  ...'} />}
        <p className="text-sm text-surface-600">Source of truth: the <code className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface-100">@theme static</code> block in <code className="font-mono text-xs px-1.5 py-0.5 rounded-sm bg-surface-100">src/index.css</code> (Tailwind CSS v4). Change a value there and the whole app and this page update.</p>
      </Section>
    </>
  )
}
