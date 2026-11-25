import clsx from 'clsx'

export default function StatCard({ label, value, sub, trend, className }) {
  return (
    <div className={clsx('bg-surface-0 border border-surface-300 rounded-lg shadow-sm p-5', className)}>
      <p className="text-sm text-surface-500 font-medium mb-2">{label}</p>
      <p className="text-3xl font-bold text-surface-900 tracking-tight">{value}</p>
      {(sub || trend) && (
        <p className="text-sm text-surface-500 mt-2">
          {trend && (
            <span className={trend > 0 ? 'text-success font-medium' : 'text-danger font-medium'}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {trend && sub && ' · '}
          {sub}
        </p>
      )}
    </div>
  )
}
