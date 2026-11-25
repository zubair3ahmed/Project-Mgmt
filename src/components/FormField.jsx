import { Children, isValidElement } from 'react'
import clsx from 'clsx'
import { Button as UIButton } from '@/components/ui/button'
import { Input as UIInput } from '@/components/ui/input'
import { Textarea as UITextarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox as UICheckbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function FormField({ label, required, children, hint, tag }) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-medium text-surface-700">
        {label}{required && <span className="text-danger ml-1">*</span>}
        {tag && <span className="ml-2">{tag}</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-surface-500">{hint}</p>}
    </div>
  )
}

export function Input(props) {
  return <UIInput {...props} />
}

export function Textarea(props) {
  return <UITextarea rows={3} {...props} />
}

// Native-style <Select onChange={e => e.target.value}><option/></Select> backed by shadcn Select.
export function Select({ value, onChange, children, className, required, disabled, name, size }) {
  const options = []
  let placeholder
  Children.forEach(children, child => {
    if (!isValidElement(child)) return
    const v = String(child.props.value ?? '')
    const text = child.props.children
    if (v === '') placeholder = text
    else options.push({ value: v, label: text })
  })
  return (
    <UISelect
      value={value === '' || value == null ? undefined : String(value)}
      onValueChange={v => onChange?.({ target: { value: v } })}
      required={required}
      disabled={disabled}
      name={name}
    >
      <SelectTrigger size={size} className={clsx('w-full', className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-[60]">
        {options.map(o => <SelectItem key={o.value} value={o.value} className="capitalize">{o.label}</SelectItem>)}
      </SelectContent>
    </UISelect>
  )
}

const VARIANTS = { primary: 'default', secondary: 'secondary', tertiary: 'ghost', ghost: 'ghost', danger: 'destructive' }

export function Button({ variant = 'primary', size = 'md', className, ...props }) {
  const sizes = { sm: 'sm', md: 'default', lg: 'lg' }
  return <UIButton variant={VARIANTS[variant]} size={sizes[size]} className={className} {...props} />
}

export function Checkbox({ checked, onChange, label, supporting }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <UICheckbox checked={checked} onCheckedChange={v => onChange?.({ target: { checked: v === true } })} className="mt-0.5" />
      <span>
        <span className="block text-sm font-medium text-surface-700">{label}</span>
        {supporting && <span className="block text-sm text-surface-500">{supporting}</span>}
      </span>
    </label>
  )
}

export function Toggle({ checked, onChange, label, supporting }) {
  return (
    <label className="flex items-start justify-between gap-6 cursor-pointer">
      <span>
        <span className="block text-sm font-medium text-surface-700">{label}</span>
        {supporting && <span className="block text-sm text-surface-500">{supporting}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={v => onChange?.({ target: { checked: v } })} />
    </label>
  )
}

const ALERT_TONES = {
  info: 'bg-info-light border-brand-200 text-brand-700',
  success: 'bg-success-light border-success-border text-success-dark',
  warning: 'bg-warning-light border-warning-border text-warning-dark',
  error: 'bg-danger-light border-danger-border text-danger-dark',
}

export function Alert({ tone = 'info', icon, action, children }) {
  return (
    <div className={clsx('flex flex-wrap items-center gap-3 p-4 border rounded-lg text-sm', ALERT_TONES[tone])}>
      {icon}
      <div className="flex-1 min-w-[12rem]">{children}</div>
      {action}
    </div>
  )
}
