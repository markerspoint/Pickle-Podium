import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react'
import { MedalTag } from '../components/AchievementList'
import { Avatar } from '../components/Avatar'
import { Badge, Button, buttonClass, Checkbox, Eyebrow, Field, Input, Modal, SampleBadge, Select, Textarea } from '../components/ui'
import { CSV_COLUMNS, planImport, type ImportPlan } from '../lib/csv'
import {
  approveSubmission, deleteAchievement, deletePlayer, findPlayerByName, importRecords, saveAchievement,
  savePlayer, signIn, signOut, updateSubmission, useDb, usingSupabase, useStatus,
} from '../lib/store'
import { DIVISIONS, PLACEMENTS, SKILL_LEVELS, type Achievement, type Division, type Placement, type Player, type SkillLevel, type Submission } from '../lib/types'
import { byDateDesc, errorMessage, formatDate, isHttpUrl, statsByPlayer } from '../lib/utils'

const th = 'px-3 py-2 text-left font-heading text-[11px] font-bold uppercase tracking-[0.14em] text-athletic'
const StatusBadge = ({ published }: { published: boolean }) => (
  <Badge className={published ? 'border-court-deep/40 bg-court-soft text-ink' : 'border-ink/15 text-athletic'}>{published ? 'Published' : 'Draft'}</Badge>
)

/** Runs a save or delete and shows the reason if the database refuses it. */
const attempt = (action: Promise<unknown>) => action.catch((e) => alert(errorMessage(e)))

// ---- Players -------------------------------------------------------------
const NEW_PLAYER: Omit<Player, 'id'> = {
  full_name: '', nickname: '', city: 'Bacolod City', home_club: '', bio: '', photo_url: '', is_published: true, fictional_example: false,
}

function PlayerForm({ player, onClose }: { player?: Player; onClose: () => void }) {
  const [f, setF] = useState<Omit<Player, 'id'> & { id?: string }>(player ?? NEW_PLAYER)
  const [error, setError] = useState('')
  const set = <K extends keyof Player>(k: K) => (v: Player[K]) => setF((s) => ({ ...s, [k]: v }))
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!f.full_name.trim()) return setError('A player name is required.')
    try {
      await savePlayer({ ...f, full_name: f.full_name.trim() })
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  return (
    <Modal title={player ? 'Edit player' : 'Add a player'} description="Names, club and photo appear on the public players directory and profile page." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name *"><Input value={f.full_name} onChange={(e) => set('full_name')(e.target.value)} placeholder="Juan Dela Cruz" /></Field>
          <Field label="Nickname"><Input value={f.nickname} onChange={(e) => set('nickname')(e.target.value)} /></Field>
          <Field label="Club or home court"><Input value={f.home_club} onChange={(e) => set('home_club')(e.target.value)} /></Field>
          <Field label="City / municipality"><Input value={f.city} onChange={(e) => set('city')(e.target.value)} /></Field>
        </div>
        <Field label="Short note"><Textarea rows={3} value={f.bio} onChange={(e) => set('bio')(e.target.value)} /></Field>
        <Field label="Profile photo link" hint="Paste the web address of an image. Leave blank to show the player’s initials.">
          <Input type="url" value={f.photo_url} onChange={(e) => set('photo_url')(e.target.value)} placeholder="https://…" />
        </Field>
        <Checkbox label="Published" hint="Draft records stay hidden from public visitors." checked={f.is_published} onChange={set('is_published')} />
        <Checkbox label="Mark as a fictional sample" hint="Adds a “Sample” tag so nobody mistakes it for a real result." checked={f.fictional_example} onChange={set('fictional_example')} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{player ? 'Save changes' : 'Add player'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function PlayersTab() {
  const db = useDb()
  const [editing, setEditing] = useState<Player | 'new' | null>(null)
  const [removing, setRemoving] = useState<Player | null>(null)
  const stats = statsByPlayer(db.achievements)
  const players = [...db.players].sort((a, b) => a.full_name.localeCompare(b.full_name))
  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add a player</Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border border-ink/10 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-ink/10 bg-ink/[0.02]">
            <th className={th}>Player</th><th className={th}>Club · City</th><th className={`${th} text-right`}>Podiums</th><th className={th}>Status</th><th className={`${th} text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.id} className="border-b border-ink/10 last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.full_name} photoUrl={p.photo_url} size="sm" />
                    <Link to={`/players/${p.id}`} className="font-semibold text-ink hover:text-court-deep">{p.full_name}</Link>
                    {p.fictional_example && <SampleBadge />}
                  </div>
                </td>
                <td className="p-3 text-athletic">{[p.home_club, p.city].filter(Boolean).join(' · ') || '—'}</td>
                <td className="stat-num p-3 text-right font-semibold">{stats[p.id]?.total ?? 0}</td>
                <td className="p-3"><StatusBadge published={p.is_published} /></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Edit ${p.full_name}`} onClick={() => setEditing(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" aria-label={`Delete ${p.full_name}`} onClick={() => setRemoving(p)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {players.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-athletic">No players yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && <PlayerForm player={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {removing && (
        <Modal title={`Delete ${removing.full_name}?`} description="This also deletes every podium finish recorded for this player. This cannot be undone." onClose={() => setRemoving(null)}>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => { attempt(deletePlayer(removing.id)); setRemoving(null) }}>Delete player</Button>
          </div>
        </Modal>
      )}
    </>
  )
}

// ---- Podium finishes -----------------------------------------------------
const NEW_FINISH: Omit<Achievement, 'id'> = {
  player_id: '', tournament_name: '', event_date: '', placement: 'Gold', skill_level: 'Intermediate', division: "Men's Doubles",
  partner_name: '', proof_url: '', notes: '', is_published: true, fictional_example: false,
}

function FinishForm({ finish, players, onClose }: { finish?: Achievement; players: Player[]; onClose: () => void }) {
  const [f, setF] = useState<Omit<Achievement, 'id'> & { id?: string }>(finish ?? NEW_FINISH)
  const [error, setError] = useState('')
  const set = <K extends keyof Achievement>(k: K) => (v: Achievement[K]) => setF((s) => ({ ...s, [k]: v }))
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!f.player_id) return setError('Choose the player this finish belongs to.')
    if (!f.tournament_name.trim() || !f.event_date) return setError('A tournament name and event date are required.')
    if (f.proof_url.trim() && !isHttpUrl(f.proof_url)) return setError('The proof link must start with http:// or https://')
    try {
      await saveAchievement({ ...f, tournament_name: f.tournament_name.trim(), proof_url: f.proof_url.trim() })
      onClose()
    } catch (err) {
      setError(errorMessage(err))
    }
  }
  return (
    <Modal title={finish ? 'Edit podium finish' : 'Add a podium finish'} description="Record the placement exactly as it appears in the official result." onClose={onClose}>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Player *">
            <Select value={f.player_id} onChange={(e) => set('player_id')(e.target.value)}>
              <option value="">Choose a player</option>
              {players.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </Select>
          </Field>
          <Field label="Tournament *"><Input value={f.tournament_name} onChange={(e) => set('tournament_name')(e.target.value)} /></Field>
          <Field label="Event date *"><Input type="date" value={f.event_date} onChange={(e) => set('event_date')(e.target.value)} /></Field>
          <Field label="Placement *">
            <Select value={f.placement} onChange={(e) => set('placement')(e.target.value as Placement)}>{PLACEMENTS.map((p) => <option key={p}>{p}</option>)}</Select>
          </Field>
          <Field label="Skill level">
            <Select value={f.skill_level} onChange={(e) => set('skill_level')(e.target.value as SkillLevel)}>{SKILL_LEVELS.map((s) => <option key={s}>{s}</option>)}</Select>
          </Field>
          <Field label="Division">
            <Select value={f.division} onChange={(e) => set('division')(e.target.value as Division)}>{DIVISIONS.map((d) => <option key={d}>{d}</option>)}</Select>
          </Field>
          <Field label="Partner"><Input value={f.partner_name} onChange={(e) => set('partner_name')(e.target.value)} /></Field>
          <Field label="Proof link" hint="Paste the link to the results post (e.g. on Facebook).">
            <Input type="url" value={f.proof_url} onChange={(e) => set('proof_url')(e.target.value)} placeholder="https://www.facebook.com/…" />
          </Field>
        </div>
        <Field label="Notes"><Textarea rows={2} value={f.notes} onChange={(e) => set('notes')(e.target.value)} /></Field>
        <Checkbox label="Published" hint="Drafts are hidden from public visitors." checked={f.is_published} onChange={set('is_published')} />
        <Checkbox label="Mark as a fictional sample" hint="Adds a “Sample” tag to this finish." checked={f.fictional_example} onChange={set('fictional_example')} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{finish ? 'Save changes' : 'Add finish'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function FinishesTab() {
  const db = useDb()
  const [editing, setEditing] = useState<Achievement | 'new' | null>(null)
  const players = [...db.players].sort((a, b) => a.full_name.localeCompare(b.full_name))
  const names = Object.fromEntries(db.players.map((p) => [p.id, p.full_name]))
  const finishes = [...db.achievements].sort(byDateDesc)
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-athletic">{players.length === 0 && 'Add a player first, then record their podium finishes.'}</p>
        <Button disabled={players.length === 0} onClick={() => setEditing('new')}><Plus className="h-4 w-4" />Add a podium finish</Button>
      </div>
      <div className="mt-4 overflow-x-auto rounded-md border border-ink/10 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead><tr className="border-b border-ink/10 bg-ink/[0.02]">
            <th className={th}>Player</th><th className={th}>Tournament</th><th className={th}>Date</th><th className={th}>Medal</th><th className={th}>Division · Level</th><th className={th}>Proof</th><th className={th}>Status</th><th className={`${th} text-right`}>Actions</th>
          </tr></thead>
          <tbody>
            {finishes.map((a) => (
              <tr key={a.id} className="border-b border-ink/10 last:border-0">
                <td className="p-3 font-semibold">{names[a.player_id] ?? '—'}</td>
                <td className="p-3">{a.tournament_name}</td>
                <td className="whitespace-nowrap p-3 text-athletic">{formatDate(a.event_date)}</td>
                <td className="p-3"><MedalTag placement={a.placement} /></td>
                <td className="p-3 text-athletic">{a.division} · {a.skill_level}</td>
                <td className="p-3">
                  {a.proof_url ? <a href={a.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink underline">Open<ExternalLink className="h-3 w-3" /></a> : <span className="text-athletic">—</span>}
                </td>
                <td className="p-3"><StatusBadge published={a.is_published} /></td>
                <td className="p-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="sm" aria-label="Edit finish" onClick={() => setEditing(a)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="sm" aria-label="Delete finish" onClick={() => confirm('Delete this podium finish?') && attempt(deleteAchievement(a.id))}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {finishes.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-athletic">No podium finishes yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && <FinishForm finish={editing === 'new' ? undefined : editing} players={players} onClose={() => setEditing(null)} />}
    </>
  )
}

// ---- Submissions ---------------------------------------------------------
function SubmissionCard({ s }: { s: Submission }) {
  const db = useDb()
  const [replaceId, setReplaceId] = useState('')
  const isCorrection = s.submission_type === 'Correction to Existing Record'
  const player = findPlayerByName(s.player_name)
  const existing = player ? db.achievements.filter((a) => a.player_id === player.id).sort(byDateDesc) : []
  const reject = () => {
    const note = prompt('Reject this submission? Nothing is added to the database. Reason (optional):')
    if (note !== null) attempt(updateSubmission({ ...s, status: 'rejected', admin_note: note }))
  }
  return (
    <li className="rounded-md border border-ink/10 bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        <MedalTag placement={s.placement} />
        <Badge className={isCorrection ? 'border-royal/30 bg-royal-soft text-royal' : 'border-ink/15 text-athletic'}>{s.submission_type}</Badge>
        <Badge className="border-ink/15 capitalize text-athletic">{s.status}</Badge>
        <span className="ml-auto text-xs text-athletic">{new Date(s.created_at).toLocaleString()}</span>
      </div>
      <p className="mt-3 font-heading text-base font-bold text-ink">{s.tournament_name}</p>
      <p className="mt-1 text-sm text-athletic">{formatDate(s.event_date)} · {s.division} · {s.skill_level}</p>
      <p className="mt-1 text-sm text-athletic">
        <span className="font-medium text-ink">{s.player_name}</span> with <span className="font-medium text-ink">{s.partner_name || '—'}</span>
        {!player && <span className="ml-2 text-xs">(new player — will be added on approval)</span>}
      </p>
      {s.notes && <p className="mt-2 text-sm text-athletic">Submitted notes: {s.notes}</p>}
      {s.admin_note && <p className="mt-2 text-sm text-athletic">Admin note: {s.admin_note}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isHttpUrl(s.proof_url) ? (
          <a href={s.proof_url} target="_blank" rel="noreferrer" className={buttonClass('outline', 'sm')}>Open proof link<ExternalLink className="h-3 w-3" /></a>
        ) : (
          <span className="text-xs text-destructive">Not a valid web address — treat with care.</span>
        )}
        {s.status === 'pending' && (
          <>
            {isCorrection && existing.length > 0 && (
              <Select value={replaceId} onChange={(e) => setReplaceId(e.target.value)} className="h-8 w-auto max-w-xs text-xs" aria-label="Correct which record?">
                <option value="">Correct which record? (add as new)</option>
                {existing.map((a) => <option key={a.id} value={a.id}>{a.tournament_name} · {a.placement} · {a.division}</option>)}
              </Select>
            )}
            <Button size="sm" onClick={() => attempt(approveSubmission(s, replaceId || undefined))}>{replaceId ? 'Update the existing record' : 'Approve & publish'}</Button>
            <Button size="sm" variant="ghost" className="text-destructive" onClick={reject}>Reject</Button>
          </>
        )}
      </div>
    </li>
  )
}

function SubmissionsTab() {
  const { submissions } = useDb()
  const sorted = [...submissions].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || b.created_at.localeCompare(a.created_at))
  return (
    <>
      <p className="max-w-3xl text-sm leading-relaxed text-athletic">
        Public submissions arrive here first. Open the proof link, then approve to add the finish to the database — the player is
        matched by name, or added if they aren’t on file yet. Corrections can update the existing record instead of creating a second copy.
      </p>
      {sorted.length === 0 ? (
        <p className="mt-4 rounded-md border border-dashed border-ink/15 bg-white p-8 text-center text-sm text-athletic">No submissions yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">{sorted.map((s) => <SubmissionCard key={s.id} s={s} />)}</ul>
      )}
    </>
  )
}

// ---- Bulk import ---------------------------------------------------------
function ImportTab() {
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [done, setDone] = useState('')
  const problems = plan?.rows.filter((r) => r.problems.length).length ?? 0
  const onFile = async (file?: File) => {
    setDone('')
    setPlan(file ? planImport(await file.text()) : null)
  }
  const confirmImport = async () => {
    if (!plan) return
    try {
      await importRecords(plan.players, plan.achievements)
      setDone(`Imported ${plan.players.length} new players and ${plan.achievements.length} podium finishes.`)
      setPlan(null)
    } catch (err) {
      alert(errorMessage(err))
    }
  }
  return (
    <div className="max-w-4xl">
      <p className="font-heading text-sm font-bold text-ink">Spreadsheet format</p>
      <p className="mt-2 text-sm leading-relaxed text-athletic">
        One row per podium finish, saved as CSV. Repeat a player’s name to attach more finishes to them, and leave the tournament
        columns blank for a row that only adds a player. Nothing is saved until you review the preview and confirm.
      </p>
      <code className="mt-3 block overflow-x-auto rounded-md border border-ink/10 bg-white p-3 text-xs text-ink">{CSV_COLUMNS.join(',')}</code>
      <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="mt-4 block text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-ink file:px-3 file:py-2 file:text-white" />
      {done && <p className="mt-4 rounded-md border border-court-deep/40 bg-court-soft p-3 text-sm text-ink">{done}</p>}
      {plan && (
        <>
          <div className="mt-4 overflow-x-auto rounded-md border border-ink/10 bg-white">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-ink/10 bg-ink/[0.02]"><th className={th}>Row</th><th className={th}>Player</th><th className={th}>Tournament</th><th className={th}>Status &amp; notes</th></tr></thead>
              <tbody>
                {plan.rows.map((r) => (
                  <tr key={r.line} className="border-b border-ink/10 last:border-0">
                    <td className="p-3 text-athletic">{r.line}</td>
                    <td className="p-3">{r.name || '—'}{r.newPlayer && <span className="ml-2 text-xs text-athletic">New player</span>}</td>
                    <td className="p-3 text-athletic">{r.tournament || '— player only —'}</td>
                    <td className={`p-3 ${r.problems.length ? 'text-destructive' : 'text-ink'}`}>{r.problems.join('; ') || 'Ready'}</td>
                  </tr>
                ))}
                {plan.rows.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-athletic">No data rows found in this file.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button disabled={plan.players.length + plan.achievements.length === 0} onClick={confirmImport}>
              Import {plan.achievements.length} finishes and {plan.players.length} new players
            </Button>
            {problems > 0 && <p className="text-xs text-destructive">{problems} row{problems === 1 ? '' : 's'} with problems will be skipped.</p>}
          </div>
        </>
      )}
    </div>
  )
}

// ---- Page ----------------------------------------------------------------
function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(await signIn(email.trim(), password))
    setBusy(false)
  }
  return (
    <div className="mx-auto max-w-sm px-5 py-24">
      <Eyebrow>Admin workspace</Eyebrow>
      <h1 className="mt-3 font-heading text-2xl font-extrabold text-ink">Admin sign-in</h1>
      <p className="mt-3 text-sm text-athletic">Sign in to add, edit or review records.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {usingSupabase && (
          <Field label="Email">
            <Input type="email" value={email} autoFocus autoComplete="username" onChange={(e) => setEmail(e.target.value)} />
          </Field>
        )}
        <Field label={usingSupabase ? 'Password' : 'Passcode'} error={error || undefined}>
          <Input type="password" value={password} autoFocus={!usingSupabase} autoComplete="current-password" onChange={(e) => { setPassword(e.target.value); setError('') }} />
        </Field>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      </form>
      {!usingSupabase && (
        <p className="mt-6 text-xs leading-relaxed text-athletic">
          No shared database is connected, so records are saved in this browser only. See the README to connect Supabase.
        </p>
      )}
    </div>
  )
}

const TABS = ['Players', 'Podium finishes', 'Submissions', 'Bulk import'] as const

export default function Admin() {
  const db = useDb()
  const { admin } = useStatus()
  const [tab, setTab] = useState<(typeof TABS)[number]>('Players')
  if (!admin) return <SignIn />
  const pending = db.submissions.filter((s) => s.status === 'pending').length
  return (
    <div className="mx-auto max-w-[120rem] px-5 py-12 lg:px-10 lg:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <header className="max-w-3xl">
          <Eyebrow>Admin workspace</Eyebrow>
          <h1 className="mt-3 font-heading text-3xl font-extrabold leading-tight text-ink sm:text-4xl">Podium database</h1>
          <p className="mt-4 text-base leading-relaxed text-athletic">
            Add, edit or delete player records and their tournament achievements. Anything you leave unpublished stays hidden from public visitors.
          </p>
        </header>
        <Button variant="outline" size="sm" onClick={() => signOut()}>Sign out</Button>
      </div>
      <div className="mt-8 flex gap-1 overflow-x-auto border-b border-ink/10" role="tablist">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 font-heading text-xs font-bold uppercase tracking-[0.14em] ${tab === t ? 'border-ink text-ink' : 'border-transparent text-athletic hover:text-ink'}`}
          >
            {t}
            {t === 'Submissions' && pending > 0 && <span className="ml-2 rounded-full bg-royal px-1.5 py-0.5 text-[10px] text-white">{pending}</span>}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === 'Players' && <PlayersTab />}
        {tab === 'Podium finishes' && <FinishesTab />}
        {tab === 'Submissions' && <SubmissionsTab />}
        {tab === 'Bulk import' && <ImportTab />}
      </div>
    </div>
  )
}
