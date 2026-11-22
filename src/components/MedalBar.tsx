import type { Stats } from '../lib/types'

/** Thin stacked bar showing a player's gold / silver / bronze mix. */
export function MedalBar({ stats, className = 'w-24' }: { stats: Stats; className?: string }) {
  const pct = (n: number) => `${stats.total ? (n / stats.total) * 100 : 0}%`
  return (
    <div className={`flex h-1.5 overflow-hidden rounded-full bg-ink/10 ${className}`} aria-hidden="true">
      <span className="bg-gold" style={{ width: pct(stats.Gold) }} />
      <span className="bg-slate-300" style={{ width: pct(stats.Silver) }} />
      <span className="bg-amber-700" style={{ width: pct(stats.Bronze) }} />
    </div>
  )
}
