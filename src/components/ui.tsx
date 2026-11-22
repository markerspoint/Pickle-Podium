import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/utils'

type Variant = 'default' | 'outline' | 'ghost' | 'destructive' | 'royal'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  default: 'bg-ink text-white hover:bg-ink/90',
  outline: 'border border-ink/15 bg-white text-ink hover:bg-ink/5',
  ghost: 'text-ink hover:bg-ink/5',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  royal: 'bg-royal text-white hover:bg-royal-deep',
}
const sizes: Record<Size, string> = { sm: 'h-8 px-3 text-xs', md: 'h-9 px-4 text-sm', lg: 'h-10 px-6 text-sm' }

/** Class string shared by <Button> and links styled as buttons. */
export const buttonClass = (variant: Variant = 'default', size: Size = 'md', className?: string) =>
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-court-deep disabled:opacity-50',
    variants[variant], sizes[size], className,
  )

export function Button({ variant, size, className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return <button type="button" {...props} className={buttonClass(variant, size, className)} />
}

const field =
  'w-full rounded-md border border-ink/15 bg-white px-3 text-base text-ink shadow-xs placeholder:text-athletic/70 focus-visible:outline-2 focus-visible:outline-court-deep md:text-sm'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(field, 'h-9', className)} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(field, 'min-h-[60px] py-2', className)} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(field, 'h-10 pr-8', className)}>
      {children}
    </select>
  )
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="mt-1.5 block">{children}</span>
      {hint && !error && <span className="mt-1 block text-xs text-athletic">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  )
}

export function Badge({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', className)}>{children}</span>
  )
}

export const SampleBadge = () => (
  <Badge className="border-dashed border-ink/25 text-[10px] uppercase tracking-wider text-athletic">Sample</Badge>
)

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('font-heading text-[11px] font-bold uppercase tracking-[0.24em] text-athletic', className)}>{children}</p>
}

export function Checkbox({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-ink" />
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint && <span className="block text-xs text-athletic">{hint}</span>}
      </span>
    </label>
  )
}

export function Modal({ title, description, onClose, children }: { title: string; description?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-ink">{title}</h2>
            {description && <p className="mt-1 text-sm text-athletic">{description}</p>}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-sm p-1 text-athletic hover:bg-ink/5 hover:text-ink">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}
