import { useEffect, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function useMounted(delay = 50) {
  const [on, setOn] = useState(reduced())
  useEffect(() => {
    if (on) return
    const t = setTimeout(() => setOn(true), delay)
    return () => clearTimeout(t)
  }, [on, delay])
  return on
}

export function useCountUp(target, duration = 900) {
  const [v, setV] = useState(reduced() ? target : 0)
  useEffect(() => {
    if (reduced()) { setV(target); return }
    let raf
    const start = performance.now()
    const tick = now => {
      const p = Math.min((now - start) / duration, 1)
      setV(target * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return v
}

export function AnimatedNumber({ value, format = n => Math.round(n).toLocaleString('en-IN') }) {
  const v = useCountUp(value)
  return <>{format(v)}</>
}

export function Donut({ data, size = 168, stroke = 20, centerValue, centerLabel }) {
  const on = useMounted()
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-100)" strokeWidth={stroke} />
        {data.filter(d => d.value > 0).map((d, i) => {
          const len = (d.value / total) * c
          const seg = (
            <circle
              key={d.label}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={d.color} strokeWidth={stroke}
              strokeDasharray={`${on ? Math.max(len - 2, 0) : 0} ${c}`}
              strokeDashoffset={-offset}
              style={{ transition: `stroke-dasharray 900ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 120}ms` }}
            >
              <title>{d.label}: {d.value}</title>
            </circle>
          )
          offset += len
          return seg
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-surface-900">{centerValue}</span>
        <span className="text-xs text-surface-500">{centerLabel}</span>
      </div>
    </div>
  )
}

export function BarChart({ data, height = 160, unit = 'h' }) {
  const on = useMounted()
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full min-w-0 group">
          <span className="text-xs font-medium text-surface-600 opacity-0 group-hover:opacity-100 transition-opacity">{d.value}{unit}</span>
          <div className="w-full flex-1 flex items-end">
            <div
              className="w-full rounded-t-md bg-brand-600 group-hover:bg-brand-700"
              style={{
                height: on ? `${(d.value / max) * 100}%` : '0%',
                minHeight: d.value > 0 && on ? 4 : 0,
                transition: `height 700ms cubic-bezier(0.22, 1, 0.36, 1) ${i * 70}ms, background-color 150ms`,
              }}
              title={`${d.label}: ${d.value}${unit}`}
            />
          </div>
          <span className="text-xs text-surface-500 truncate">{d.label}</span>
        </div>
      ))}
    </div>
  )
}
