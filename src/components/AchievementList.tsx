import { ExternalLink, ShieldCheck } from 'lucide-react'
import type { Achievement, Placement, Player } from '../lib/types'
import { formatDate } from '../lib/utils'
import { buttonClass, SampleBadge } from './ui'

export const MEDAL_CLASS: Record<Placement, string> = {
  Gold: 'bg-gold text-ink',
  Silver: 'bg-slate-200 text-ink',
  Bronze: 'bg-amber-700 text-white',
}

export function MedalTag({ placement }: { placement: Placement }) {
  return (
    <span className={`inline-flex min-w-[72px] justify-center rounded-sm px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-[0.14em] ${MEDAL_CLASS[placement]}`}>
      {placement}
    </span>
  )
}

function Row({ achievement: a, playerName }: { achievement: Achievement; playerName?: string }) {
  return (
    <li className="grid gap-4 rounded-md border border-ink/10 bg-white p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6">
      <div className="flex items-center gap-3 sm:w-24">
        <MedalTag placement={a.placement} />
      </div>
      <div className="min-w-0">
        <p className="font-heading text-base font-bold leading-snug text-ink">{a.tournament_name}</p>
        <p className="mt-1 text-sm text-athletic">
          {[formatDate(a.event_date), a.division, a.skill_level].filter(Boolean).join(' · ')}
        </p>
        <p className="mt-1 text-sm text-athletic">
          {playerName && <span className="text-ink">{playerName}</span>}
          {playerName ? ' with ' : 'Partner: '}
          <span className="font-medium text-ink">{a.partner_name || '—'}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {a.fictional_example && <SampleBadge />}
        {a.proof_url ? (
          // The proof is simply the stored link (usually the organiser's Facebook post), opened in a new tab.
          <a href={a.proof_url} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Proof
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          <span className="text-xs text-athletic">No proof link yet</span>
        )}
      </div>
    </li>
  )
}

export function AchievementList({ achievements, playersById }: { achievements: Achievement[]; playersById?: Record<string, Player> }) {
  return (
    <ol className="space-y-3">
      {achievements.map((a) => (
        <Row key={a.id} achievement={a} playerName={playersById?.[a.player_id]?.full_name} />
      ))}
    </ol>
  )
}
