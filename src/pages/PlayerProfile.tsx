import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { AchievementList } from '../components/AchievementList'
import { Avatar } from '../components/Avatar'
import { Badge, buttonClass } from '../components/ui'
import { useDb } from '../lib/store'
import { byDateDesc, EMPTY_STATS, facebookSearchUrl, statsByPlayer } from '../lib/utils'

export default function PlayerProfile() {
  const { id = '' } = useParams()
  const db = useDb()
  const player = db.players.find((p) => p.id === id && p.is_published)

  if (!player) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-24 text-center lg:px-10">
        <p className="font-heading text-2xl font-extrabold text-ink">This player record isn’t available</p>
        <p className="mt-3 text-sm text-athletic">It may have been unpublished or removed by an administrator.</p>
        <Link to="/players" className="mt-6 inline-flex items-center gap-2 font-medium text-court-deep hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to all players
        </Link>
      </div>
    )
  }

  const finishes = db.achievements.filter((a) => a.player_id === id && a.is_published).sort(byDateDesc)
  const stats = statsByPlayer(finishes)[id] ?? EMPTY_STATS
  const partners = [...new Set(finishes.map((a) => a.partner_name).filter(Boolean))]
  const tiles = [
    { label: 'Podium finishes', value: stats.total, medal: '' },
    { label: 'Gold', value: stats.Gold, medal: 'bg-gold' },
    { label: 'Silver', value: stats.Silver, medal: 'bg-slate-300' },
    { label: 'Bronze', value: stats.Bronze, medal: 'bg-amber-700' },
  ]

  return (
    <div className="mx-auto max-w-[120rem] px-5 py-10 lg:px-10 lg:py-14">
      <Link to="/players" className="inline-flex items-center gap-2 text-sm font-medium text-athletic hover:text-ink">
        <ArrowLeft className="h-4 w-4" />
        All players
      </Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(280px,360px)_1fr] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex items-center gap-4">
            <Avatar name={player.full_name} photoUrl={player.photo_url} size="lg" />
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-extrabold leading-tight text-ink">{player.full_name}</h1>
              {player.nickname && <p className="text-sm text-athletic">“{player.nickname}”</p>}
              <p className="mt-1 text-sm text-athletic">{[player.home_club, player.city].filter(Boolean).join(' · ')}</p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge className="gap-1 border-court-deep/40 bg-court-soft text-ink">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified record
            </Badge>
            {player.fictional_example && (
              <Badge className="border-dashed border-ink/25 text-[11px] uppercase tracking-wider text-athletic">Fictional sample</Badge>
            )}
          </div>
          {player.bio && <p className="mt-5 text-sm leading-relaxed text-athletic">{player.bio}</p>}
          {partners.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-athletic">Doubles partners</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {partners.map((p) => (
                  <span key={p} className="rounded-sm border border-ink/10 bg-white px-2.5 py-1 text-xs text-ink">{p}</span>
                ))}
              </div>
            </div>
          )}
          <a href={facebookSearchUrl(player.full_name)} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm', 'mt-6')}>
            Search this name on Facebook
            <ExternalLink className="h-3 w-3" />
          </a>
        </aside>

        <div className="min-w-0">
          <div className="grid grid-cols-2 overflow-hidden rounded-md border border-ink/10 bg-white sm:grid-cols-4">
            {tiles.map((t, i) => (
              <div key={t.label} className={`p-4 ${i < 2 ? 'border-b border-ink/10 sm:border-b-0' : ''} ${i % 2 === 0 ? 'border-r border-ink/10' : ''} ${i < 3 ? 'sm:border-r' : ''}`}>
                <div className="flex items-center gap-2">
                  {t.medal && <span className={`h-2.5 w-2.5 rounded-full ${t.medal}`} />}
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-athletic">{t.label}</p>
                </div>
                <p className={`stat-num mt-2 font-heading font-extrabold text-ink ${t.medal ? 'text-2xl' : 'text-4xl'}`}>{t.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-heading text-xl font-extrabold text-ink">
                Podium finishes<span className="ml-2 text-athletic">{finishes.length}</span>
              </h2>
              <p className="text-xs text-athletic">Newest first</p>
            </div>
            <div className="mt-4">
              {finishes.length === 0 ? (
                <div className="rounded-md border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-athletic">
                  No published podium finishes recorded yet.
                </div>
              ) : (
                <AchievementList achievements={finishes} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
