import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { AchievementList } from '../components/AchievementList'
import { Avatar } from '../components/Avatar'
import { MedalBar } from '../components/MedalBar'
import { Button, buttonClass, Eyebrow, Input } from '../components/ui'
import { useDb } from '../lib/store'
import { byDateDesc, statsByPlayer } from '../lib/utils'

function Hero() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    navigate(term ? `/players?q=${encodeURIComponent(term)}` : '/players')
  }
  return (
    <section className="relative overflow-hidden border-b border-ink/10 bg-mist">
      <div className="court-grid pointer-events-none absolute inset-0 opacity-80" />
      <div className="relative mx-auto grid max-w-[120rem] gap-12 px-5 py-14 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:px-10 lg:py-24">
        <div className="rise-in">
          <Eyebrow>Bacolod City · Negros Occidental</Eyebrow>
          <h1 className="mt-4 font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
            The podium record of Negros pickleball
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-athletic">
            Every verified medal from Bacolod and Negros Occidental tournaments — who placed, in which division, with which partner,
            and the official result behind it.
          </p>
          <form onSubmit={submit} className="mt-8 flex max-w-lg gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-athletic" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a player name" aria-label="Search a player name" className="h-12 pl-9" />
            </div>
            <Button type="submit" size="lg" className="h-12 shrink-0">Search</Button>
          </form>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/players" className={buttonClass('outline', 'lg')}>
              Browse the directory
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-athletic">Free to browse · updated by verified admins</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-ink/10 bg-white px-4 py-3">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-court-deep" />
          <p className="text-xs leading-relaxed text-athletic">
            Recognize previous podium finishers in local pickleball tournaments and promote fair play. This database is meant to
            acknowledge achievements, not humiliate or embarrass players.
          </p>
        </div>
      </div>
    </section>
  )
}

const EMPTY = 'No podium finishes have been published yet.'

export default function Home() {
  const db = useDb()
  const { players, achievements, stats, playersById } = useMemo(() => {
    const players = db.players.filter((p) => p.is_published)
    const playersById = Object.fromEntries(players.map((p) => [p.id, p]))
    const achievements = db.achievements.filter((a) => a.is_published && playersById[a.player_id]).sort(byDateDesc)
    return { players, achievements, stats: statsByPlayer(achievements), playersById }
  }, [db])

  const totals = [
    { label: 'Registered players', value: players.length },
    { label: 'Podium finishes', value: achievements.length },
    { label: 'Gold medals', value: achievements.filter((a) => a.placement === 'Gold').length },
    { label: 'Tournaments', value: new Set(achievements.map((a) => a.tournament_name)).size },
  ]
  const leaders = players
    .filter((p) => stats[p.id])
    .sort((a, b) => stats[b.id].total - stats[a.id].total || stats[b.id].Gold - stats[a.id].Gold)
    .slice(0, 5)

  return (
    <>
      <Hero />
      <section className="border-b border-ink/10 bg-white">
        <div className="mx-auto grid max-w-[120rem] grid-cols-2 px-5 lg:grid-cols-4 lg:px-10">
          {totals.map((t, i) => (
            <div key={t.label} className={`py-7 lg:px-8 ${i % 2 === 0 ? 'border-r border-ink/10' : 'pl-5 lg:pl-8'} ${i < 3 ? 'lg:border-r' : ''} ${i < 2 ? 'border-b border-ink/10 lg:border-b-0' : ''}`}>
              <p className="stat-num font-heading text-3xl font-extrabold text-ink lg:text-4xl">{t.value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-athletic">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[120rem] px-5 py-16 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>Leaderboard</Eyebrow>
            <h2 className="mt-3 font-heading text-2xl font-extrabold text-ink sm:text-3xl">Most podium finishes</h2>
          </div>
          <Link to="/players" className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-court-deep">
            See the full registry
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8">
          {leaders.length === 0 ? (
            <p className="rounded-md border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-athletic">{EMPTY}</p>
          ) : (
            <ol className="divide-y divide-ink/10 overflow-hidden rounded-md border border-ink/10 bg-white">
              {leaders.map((p, i) => (
                <li key={p.id}>
                  <Link to={`/players/${p.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-court-soft/60">
                    <span className="stat-num w-6 shrink-0 font-heading text-lg font-extrabold text-athletic">{i + 1}</span>
                    <Avatar name={p.full_name} photoUrl={p.photo_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{p.full_name}</p>
                      <p className="truncate text-xs text-athletic">{[p.home_club, p.city].filter(Boolean).join(' · ')}</p>
                    </div>
                    <MedalBar stats={stats[p.id]} className="hidden w-28 sm:flex" />
                    <div className="shrink-0 text-right">
                      <p className="stat-num font-heading text-lg font-extrabold text-ink">{stats[p.id].total}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-athletic">podiums</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-white">
        <div className="mx-auto max-w-[120rem] px-5 py-16 lg:px-10 lg:py-20">
          <Eyebrow>Latest results</Eyebrow>
          <h2 className="mt-3 font-heading text-2xl font-extrabold text-ink sm:text-3xl">Recently verified podiums</h2>
          <div className="mt-8">
            {achievements.length === 0 ? (
              <p className="rounded-md border border-dashed border-ink/15 bg-mist p-8 text-center text-sm text-athletic">{EMPTY}</p>
            ) : (
              <AchievementList achievements={achievements.slice(0, 6)} playersById={playersById} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}
