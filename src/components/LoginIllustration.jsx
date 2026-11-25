import { ClipboardCheck, Clock, FileText, Ruler } from 'lucide-react'

const Line = ({ d, delay, faint, dashed }) => (
  <path
    d={d}
    pathLength="1"
    className="draw"
    style={{ '--d': `${delay}s` }}
    stroke="white"
    strokeOpacity={faint ? 0.45 : 0.95}
    strokeWidth={faint ? 1.5 : 2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    {...(dashed ? { strokeDasharray: undefined } : {})}
  />
)

const FLOATING = [
  { Icon: ClipboardCheck, pos: 'left-[2%] top-[8%]', delay: 1.6 },
  { Icon: Clock, pos: 'right-[2%] top-[14%]', delay: 2.0 },
  { Icon: FileText, pos: 'left-[0%] bottom-[24%]', delay: 2.4 },
  { Icon: Ruler, pos: 'right-[0%] bottom-[30%]', delay: 2.8 },
]

export default function LoginIllustration() {
  return (
    <div className="relative w-full max-w-[460px] aspect-[4/3]" aria-hidden="true">
      <svg viewBox="0 0 480 360" className="absolute inset-0 w-full h-full">
        <Line d="M50 300 H430" delay={0} />
        {/* footings */}
        <Line d="M104 300 v14 h32 v-14" delay={0.2} />
        <Line d="M224 300 v14 h32 v-14" delay={0.3} />
        <Line d="M344 300 v14 h32 v-14" delay={0.4} />
        {/* columns */}
        <Line d="M120 300 V100" delay={0.5} />
        <Line d="M240 300 V100" delay={0.65} />
        <Line d="M360 300 V100" delay={0.8} />
        {/* floors */}
        <Line d="M110 200 H370" delay={1.0} />
        <Line d="M110 100 H370" delay={1.15} />
        {/* bracing */}
        <Line d="M120 300 L240 200 M240 300 L120 200" delay={1.35} faint />
        <Line d="M240 200 L360 100 M360 200 L240 100" delay={1.5} faint />
        {/* roof truss */}
        <Line d="M104 100 L240 44 L376 100" delay={1.7} />
        <Line d="M240 44 V100 M172 72 V100 M308 72 V100" delay={1.9} faint />
        {/* dimension lines */}
        <Line d="M70 100 V300 M62 100 H78 M62 300 H78" delay={2.1} faint />
        <Line d="M120 334 H360 M120 326 V342 M360 326 V342" delay={2.25} faint />
      </svg>
      {FLOATING.map(({ Icon, pos, delay }) => (
        <span key={pos} className={`float-icon absolute ${pos} text-white/85`} style={{ '--d': `${delay}s` }}>
          <Icon size={40} strokeWidth={1.4} />
        </span>
      ))}
    </div>
  )
}
