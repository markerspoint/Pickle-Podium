import { initials } from '../lib/utils'

const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-12 w-12 text-sm', lg: 'h-20 w-20 text-xl' }

export function Avatar({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string; size?: keyof typeof sizes }) {
  const cls = sizes[size]
  return photoUrl ? (
    <img src={photoUrl} alt={name || 'Player'} className={`${cls} shrink-0 rounded-full object-cover ring-1 ring-ink/10`} />
  ) : (
    <span className={`${cls} flex shrink-0 items-center justify-center rounded-full bg-court font-heading font-extrabold text-ink ring-1 ring-court-deep/30`}>
      {initials(name)}
    </span>
  )
}
