import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight, ExternalLink, Search, X } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { MedalBar } from '../components/MedalBar'
import { Button, buttonClass, Eyebrow, Input, SampleBadge, Select } from '../components/ui'
import { useDb } from '../lib/store'
import { DIVISIONS, PLACEMENTS, SKILL_LEVELS, type Player, type Stats } from '../lib/types'
import { EMPTY_STATS, facebookSearchUrl, statsByPlayer } from '../lib/utils'

const NO_FILTERS = { q: '', tournament: '', year: '', skill: '', division: '', placement: '' }
type Filters = typeof NO_FILTERS
type SortKey = 'name' | keyof Stats
type Sort = { key: SortKey; dir: 'asc' | 'desc' }
type Row = Player & { stats: Stats }

function FilterSelect({ value, onChange, options, allLabel }: { value: string; onChange: (v: string) => void; options: string[]; allLabel: string }) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} aria-label={allLabel}>
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </Select>
  )
}

function SortHead({ label, sortKey, sort, onSort, className = '' }: { label: string; sortKey: SortKey; sort: Sort; onSort: (k: SortKey) => void; className?: string }) {
  const active = sort.key === sortKey
  const Icon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <th className={`h-10 px-3 text-left ${className}`}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1.5 font-heading text-[11px] font-bold uppercase tracking-[0.14em] transition hover:text-ink ${active ? 'text-ink' : 'text-athletic'}`}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? 'text-court-deep' : ''}`} />
      </button>
    </th>
  )
}

const sub = (p: Player) => [p.home_club, p.city].filter(Boolean).join(' · ')

function Table({ rows, sort, onSort }: { rows: Row[]; sort: Sort; onSort: (k: SortKey) => void }) {
  return (
    <div className="hidden overflow-hidden rounded-md border border-ink/10 bg-white md:block">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10 bg-ink/[0.02]">
            <SortHead label="Player" sortKey="name" sort={sort} onSort={onSort} className="w-[34%]" />
            <SortHead label="Podiums" sortKey="total" sort={sort} onSort={onSort} className="text-right" />
            <SortHead label="Gold" sortKey="Gold" sort={sort} onSort={onSort} className="text-right" />
            <SortHead label="Silver" sortKey="Silver" sort={sort} onSort={onSort} className="text-right" />
            <SortHead label="Bronze" sortKey="Bronze" sort={sort} onSort={onSort} className="text-right" />
            <th className="px-3 text-left font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-athletic">Medal mix</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} className="group border-b border-ink/10 transition last:border-0 hover:bg-court-soft/60">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={p.full_name} photoUrl={p.photo_url} size="sm" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link to={`/players/${p.id}`} className="truncate font-semibold text-ink hover:text-court-deep">{p.full_name}</Link>
                      {p.fictional_example && <SampleBadge />}
                    </div>
                    <p className="truncate text-xs text-athletic">{sub(p)}</p>
                  </div>
                </div>
              </td>
              <td className="stat-num p-3 text-right font-heading text-lg font-extrabold text-ink">{p.stats.total}</td>
              <td className="stat-num p-3 text-right font-medium text-ink">{p.stats.Gold}</td>
              <td className="stat-num p-3 text-right font-medium text-athletic">{p.stats.Silver}</td>
              <td className="stat-num p-3 text-right font-medium text-athletic">{p.stats.Bronze}</td>
              <td className="p-3"><MedalBar stats={p.stats} /></td>
              <td className="p-3 text-right">
                <Link to={`/players/${p.id}`} className={buttonClass('outline', 'sm', 'opacity-80 group-hover:opacity-100')}>
                  View
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const CARD_STATS: { key: keyof Stats; label: string }[] = [
  { key: 'total', label: 'Podiums' }, { key: 'Gold', label: 'Gold' }, { key: 'Silver', label: 'Silver' }, { key: 'Bronze', label: 'Bronze' },
]

function Cards({ rows }: { rows: Row[] }) {
  return (
    <div className="space-y-3 md:hidden">
      {rows.map((p) => (
        <Link key={p.id} to={`/players/${p.id}`} className="block rounded-md border border-ink/10 bg-white p-4 transition active:border-court-deep">
          <div className="flex items-center gap-3">
            <Avatar name={p.full_name} photoUrl={p.photo_url} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold text-ink">{p.full_name}</p>
                {p.fictional_example && <SampleBadge />}
              </div>
              <p className="truncate text-xs text-athletic">{sub(p)}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-athletic" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 border-t border-ink/10 pt-3 text-center">
            {CARD_STATS.map((s) => (
              <div key={s.key}>
                <p className={`stat-num font-heading text-base font-extrabold ${s.key === 'total' ? 'text-ink' : 'text-athletic'}`}>{p.stats[s.key]}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-athletic">{s.label}</p>
              </div>
            ))}
          </div>
          <MedalBar stats={p.stats} className="mt-3 w-full" />
        </Link>
      ))}
    </div>
  )
}

export default function Players() {
  const db = useDb()
  const [params] = useSearchParams()
  const [filters, setFilters] = useState<Filters>({ ...NO_FILTERS, q: params.get('q') ?? '' })
  const [sort, setSort] = useState<Sort>({ key: 'total', dir: 'desc' })
  const set = (k: keyof Filters) => (v: string) => setFilters((f) => ({ ...f, [k]: v }))

  const published = useMemo(() => db.achievements.filter((a) => a.is_published), [db])
  const tournaments = useMemo(() => [...new Set(published.map((a) => a.tournament_name))].sort(), [published])
  const years = useMemo(() => [...new Set(published.map((a) => a.event_date.slice(0, 4)))].sort().reverse(), [published])

  const rows = useMemo(() => {
    // The medal filters narrow which finishes are counted, not just which players are listed.
    const stats = statsByPlayer(
      published.filter(
        (a) =>
          (!filters.tournament || a.tournament_name === filters.tournament) &&
          (!filters.year || a.event_date.startsWith(filters.year)) &&
          (!filters.skill || a.skill_level === filters.skill) &&
          (!filters.division || a.division === filters.division) &&
          (!filters.placement || a.placement === filters.placement),
      ),
    )
    const q = filters.q.trim().toLowerCase()
    const narrowed = !!(filters.tournament || filters.year || filters.skill || filters.division || filters.placement)
    const dir = sort.dir === 'asc' ? 1 : -1
    return db.players
      .filter((p) => p.is_published && (!q || p.full_name.toLowerCase().includes(q)))
      .map((p): Row => ({ ...p, stats: stats[p.id] ?? EMPTY_STATS }))
      .filter((p) => !narrowed || p.stats.total > 0)
      .sort((a, b) =>
        sort.key === 'name'
          ? dir * a.full_name.localeCompare(b.full_name)
          : dir * (a.stats[sort.key] - b.stats[sort.key]) || a.full_name.localeCompare(b.full_name),
      )
  }, [db, published, filters, sort])

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  const filtered = Object.values(filters).some(Boolean)

  return (
    <div className="mx-auto max-w-[120rem] px-5 py-12 lg:px-10 lg:py-16">
      <header className="max-w-3xl">
        <Eyebrow>Player registry</Eyebrow>
        <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Players &amp; podium rankings</h1>
        <p className="mt-4 text-base leading-relaxed text-athletic">
          Every player with a verified podium finish in a Bacolod or Negros Occidental tournament. Sort by name or by medal counts,
          then open a profile for the full record.
        </p>
      </header>

      <div className="mt-8 rounded-md border border-ink/10 bg-white p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-athletic" />
          <Input value={filters.q} onChange={(e) => set('q')(e.target.value)} placeholder="Search player name" aria-label="Search player name" className="h-10 pl-9" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <FilterSelect value={filters.tournament} onChange={set('tournament')} options={tournaments} allLabel="All tournaments" />
          <FilterSelect value={filters.year} onChange={set('year')} options={years} allLabel="All years" />
          <FilterSelect value={filters.skill} onChange={set('skill')} options={[...SKILL_LEVELS]} allLabel="All skill levels" />
          <FilterSelect value={filters.division} onChange={set('division')} options={[...DIVISIONS]} allLabel="All divisions" />
          <FilterSelect value={filters.placement} onChange={set('placement')} options={[...PLACEMENTS]} allLabel="Any medal" />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-athletic">Tournament, year, skill, division and medal filters narrow the podium counts shown in the table.</p>
          <Button variant="ghost" size="sm" onClick={() => setFilters(NO_FILTERS)} className="shrink-0 text-athletic">
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-ink">
          {rows.length} {rows.length === 1 ? 'player' : 'players'}
          {filtered && <span className="ml-2 font-medium normal-case tracking-normal text-athletic">matching your filters</span>}
        </p>
        <p className="text-xs text-athletic">Tap a column heading to sort</p>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-ink/15 bg-white p-10 text-center">
          <p className="font-heading text-lg font-bold text-ink">No players match these filters</p>
          <p className="mt-2 text-sm text-athletic">Try clearing a filter or searching a different name.</p>
          {filters.q.trim() && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a href={facebookSearchUrl(filters.q)} target="_blank" rel="noreferrer" className={buttonClass('outline')}>
                Search “{filters.q.trim()}” on Facebook
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <Link to="/submit" className="text-sm font-medium text-ink underline hover:text-court-deep">Submit a missing result</Link>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4">
          <Table rows={rows} sort={sort} onSort={onSort} />
          <Cards rows={rows} />
        </div>
      )}
    </div>
  )
}
