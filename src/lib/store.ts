import { useSyncExternalStore } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Achievement, Database, Player, Submission } from './types'

/**
 * Data layer — the only file that knows where records are kept.
 *
 * - With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set, records live in a
 *   shared Supabase database and admins sign in with email and password.
 * - Without them, records stay in this browser's localStorage behind a
 *   passcode. That mode is for trying the app locally, not for a public site.
 *
 * Either way the records are held in memory, so searching and filtering are instant.
 */
const SUPABASE_URL: string | undefined = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY: string | undefined = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null
export const usingSupabase = !!supabase

const LOCAL_KEY = 'pickle-podium:db:v2'
const LOCAL_SESSION = 'pickle-podium:admin'
const PASSCODE: string = import.meta.env.VITE_ADMIN_PASSCODE ?? 'admin'

interface State {
  db: Database
  /** False until the first load has finished. */
  ready: boolean
  admin: boolean
  /** Set when the database could not be reached. */
  error: string
}

const empty = (): Database => ({ players: [], achievements: [], submissions: [] })
let state: State = { db: empty(), ready: false, admin: false, error: '' }
const listeners = new Set<() => void>()

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  if (!supabase && patch.db) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state.db))
    } catch {
      /* storage unavailable: keep the in-memory copy */
    }
  }
  listeners.forEach((l) => l())
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useDb = () => useSyncExternalStore(subscribe, () => state.db)
export const useStatus = () => useSyncExternalStore(subscribe, () => state)
export const getDb = () => state.db
export const newId = () => crypto.randomUUID()

// ---- Loading -------------------------------------------------------------
function loadLocal(): Database {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) return { ...empty(), ...JSON.parse(raw) }
  } catch {
    /* fall through to an empty database */
  }
  return empty()
}

/** Reads a whole table, paging past Supabase's 1,000-row response limit. */
async function fetchAll<T>(table: string): Promise<T[]> {
  const PAGE = 1000
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase!.from(table).select('*').order('id').range(from, from + PAGE - 1)
    if (error) throw new Error(error.message)
    rows.push(...(data as T[]))
    if (data.length < PAGE) return rows
  }
}

async function refresh() {
  if (!supabase) return
  try {
    const { data: admin } = await supabase.rpc('is_admin')
    // Row-level security decides what comes back: visitors get published records only.
    const [players, achievements, submissions] = await Promise.all([
      fetchAll<Player>('players'),
      fetchAll<Achievement>('achievements'),
      admin ? fetchAll<Submission>('submissions') : Promise.resolve([]),
    ])
    set({ db: { players, achievements, submissions }, admin: !!admin, ready: true, error: '' })
  } catch (e) {
    set({ ready: true, error: e instanceof Error ? e.message : 'The database could not be reached.' })
  }
}

if (supabase) {
  // Fires once on startup with the stored session, then on every sign-in and sign-out.
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(refresh, 0)
  })
} else {
  state = { db: loadLocal(), ready: true, admin: sessionStorage.getItem(LOCAL_SESSION) === '1', error: '' }
  window.addEventListener('storage', (e) => e.key === LOCAL_KEY && set({ db: loadLocal() }))
}

// ---- Sign-in -------------------------------------------------------------
/** Returns an error message, or '' on success. `email` is ignored in local mode. */
export async function signIn(email: string, password: string): Promise<string> {
  if (!supabase) {
    if (password !== PASSCODE) return 'That passcode isn’t right.'
    sessionStorage.setItem(LOCAL_SESSION, '1')
    set({ admin: true })
    return ''
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return error.message
  await refresh()
  if (state.admin) return ''
  await supabase.auth.signOut()
  return 'This account isn’t an administrator.'
}

export async function signOut() {
  if (supabase) await supabase.auth.signOut()
  else sessionStorage.removeItem(LOCAL_SESSION)
  set({ admin: false, db: { ...state.db, submissions: supabase ? [] : state.db.submissions } })
}

// ---- Writes --------------------------------------------------------------
type Table = keyof Database

const merge = <T extends { id: string }>(list: T[], items: T[]): T[] => {
  const incoming = new Map(items.map((i) => [i.id, i]))
  return [...list.filter((x) => !incoming.has(x.id)), ...items]
}

/** Saves rows remotely (when configured), then mirrors them into memory. */
async function upsert<K extends Table>(table: K, rows: Database[K]) {
  if (!rows.length) return
  if (supabase) {
    const { error } = await supabase.from(table as string).upsert(rows as object[])
    if (error) throw new Error(error.message)
  }
  set({ db: { ...state.db, [table]: merge<{ id: string }>(state.db[table], rows) } })
}

async function remove(table: Table, id: string) {
  if (supabase) {
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) throw new Error(error.message)
  }
}

export async function savePlayer(player: Omit<Player, 'id'> & { id?: string }): Promise<Player> {
  const saved: Player = { ...player, id: player.id ?? newId() }
  await upsert('players', [saved])
  return saved
}

/** Deletes the player and every podium finish recorded for them. */
export async function deletePlayer(id: string) {
  await remove('players', id) // the database cascades to their achievements
  set({
    db: {
      ...state.db,
      players: state.db.players.filter((p) => p.id !== id),
      achievements: state.db.achievements.filter((a) => a.player_id !== id),
    },
  })
}

export async function saveAchievement(a: Omit<Achievement, 'id'> & { id?: string }) {
  await upsert('achievements', [{ ...a, id: a.id ?? newId() }])
}

export async function deleteAchievement(id: string) {
  await remove('achievements', id)
  set({ db: { ...state.db, achievements: state.db.achievements.filter((a) => a.id !== id) } })
}

/** Used by bulk import: players first, because finishes point at them. */
export async function importRecords(players: Player[], achievements: Achievement[]) {
  await upsert('players', players)
  await upsert('achievements', achievements)
}

export async function createSubmission(s: Omit<Submission, 'id' | 'status' | 'admin_note' | 'created_at'>) {
  const row: Submission = { ...s, id: newId(), status: 'pending', admin_note: '', created_at: new Date().toISOString() }
  if (supabase) {
    // Visitors may insert but not read submissions, so nothing is selected back.
    const { error } = await supabase.from('submissions').insert(row)
    if (error) throw new Error(error.message)
    if (!state.admin) return
  }
  set({ db: { ...state.db, submissions: [...state.db.submissions, row] } })
}

export const updateSubmission = (s: Submission) => upsert('submissions', [s])

export const findPlayerByName = (name: string) =>
  state.db.players.find((p) => p.full_name.trim().toLowerCase() === name.trim().toLowerCase())

/**
 * Approving adds the finish to the database. The player is matched by name, or
 * added if they aren't on file yet. Passing `replaceId` updates that existing
 * record instead of creating a second copy (used for corrections).
 */
export async function approveSubmission(s: Submission, replaceId?: string) {
  const player =
    findPlayerByName(s.player_name) ??
    (await savePlayer({
      full_name: s.player_name.trim(), nickname: '', city: '', home_club: '', bio: '', photo_url: '',
      is_published: true, fictional_example: false,
    }))
  await saveAchievement({
    id: replaceId,
    player_id: player.id,
    tournament_name: s.tournament_name,
    event_date: s.event_date,
    placement: s.placement,
    skill_level: s.skill_level,
    division: s.division,
    partner_name: s.partner_name,
    proof_url: s.proof_url,
    notes: s.notes,
    is_published: true,
    fictional_example: false,
  })
  await updateSubmission({ ...s, status: 'approved' })
}
