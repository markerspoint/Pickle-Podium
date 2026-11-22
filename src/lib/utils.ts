import type { Achievement, Stats } from './types'

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

export const EMPTY_STATS: Stats = { total: 0, Gold: 0, Silver: 0, Bronze: 0 }

/** Medal counts per player id for the given finishes. */
export function statsByPlayer(achievements: Achievement[]): Record<string, Stats> {
  const out: Record<string, Stats> = {}
  for (const a of achievements) {
    const s = (out[a.player_id] ??= { ...EMPTY_STATS })
    s[a.placement] += 1
    s.total += 1
  }
  return out
}

export function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(`${iso}T00:00:00`)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

export function isHttpUrl(value = '') {
  try {
    const u = new URL(value.trim())
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export const byDateDesc = (a: Achievement, b: Achievement) => b.event_date.localeCompare(a.event_date)

/** Facebook's own search page for a name. Opens on Facebook; nothing is read back into this app. */
export const facebookSearchUrl = (name: string) => `https://www.facebook.com/search/top/?q=${encodeURIComponent(name.trim())}`

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong. Please try again.')
