import { useSyncExternalStore } from 'react'
import { seed } from './seed'
import type { Achievement, Database, Player, Submission } from './types'

/**
 * Data layer. Everything is kept in the browser's localStorage so the app runs
 * with no backend. To move to a real database (Supabase, Firebase, your own
 * API…), replace the functions exported from this file — pages only use these.
 */
const KEY = 'pickle-podium:db:v1'
const listeners = new Set<() => void>()

function load(): Database {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...structuredClone(seed), ...JSON.parse(raw) }
  } catch {
    /* fall through to seed */
  }
  return structuredClone(seed)
}

let db: Database = load()

function commit(next: Database) {
  db = next
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* storage unavailable: keep the in-memory copy */
  }
  listeners.forEach((l) => l())
}

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    db = load()
    listeners.forEach((l) => l())
  }
})

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useDb = () => useSyncExternalStore(subscribe, () => db)
export const getDb = () => db

export const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('')

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]
}

export function savePlayer(player: Omit<Player, 'id'> & { id?: string }): Player {
  const saved = { ...player, id: player.id ?? newId() }
  commit({ ...db, players: upsert(db.players, saved) })
  return saved
}

/** Deletes the player and every podium finish recorded for them. */
export function deletePlayer(id: string) {
  commit({
    ...db,
    players: db.players.filter((p) => p.id !== id),
    achievements: db.achievements.filter((a) => a.player_id !== id),
  })
}

export function saveAchievement(a: Omit<Achievement, 'id'> & { id?: string }): Achievement {
  const saved = { ...a, id: a.id ?? newId() }
  commit({ ...db, achievements: upsert(db.achievements, saved) })
  return saved
}

export function deleteAchievement(id: string) {
  commit({ ...db, achievements: db.achievements.filter((a) => a.id !== id) })
}

export function createSubmission(s: Omit<Submission, 'id' | 'status' | 'admin_note' | 'created_at'>) {
  const saved: Submission = { ...s, id: newId(), status: 'pending', admin_note: '', created_at: new Date().toISOString() }
  commit({ ...db, submissions: [...db.submissions, saved] })
}

export function updateSubmission(s: Submission) {
  commit({ ...db, submissions: upsert(db.submissions, s) })
}

export const findPlayerByName = (name: string) =>
  db.players.find((p) => p.full_name.trim().toLowerCase() === name.trim().toLowerCase())

/**
 * Approving adds the finish to the database. The player is matched by name, or
 * added if they aren't on file yet. Passing `replaceId` updates that existing
 * record instead of creating a second copy (used for corrections).
 */
export function approveSubmission(s: Submission, replaceId?: string) {
  const player =
    findPlayerByName(s.player_name) ??
    savePlayer({
      full_name: s.player_name.trim(), nickname: '', city: '', home_club: '', bio: '', photo_url: '',
      is_published: true, fictional_example: false,
    })
  saveAchievement({
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
  updateSubmission({ ...s, status: 'approved' })
}

export function resetToSampleData() {
  commit(structuredClone(seed))
}

// ---- Admin session -------------------------------------------------------
// A passcode check in the browser only keeps casual visitors out of the admin
// screens. It is NOT real security: use a backend with proper auth before
// relying on it. Set VITE_ADMIN_PASSCODE in .env to change the passcode.
const SESSION_KEY = 'pickle-podium:admin'
const PASSCODE: string = import.meta.env.VITE_ADMIN_PASSCODE ?? 'admin'

export const isAdmin = () => sessionStorage.getItem(SESSION_KEY) === '1'
export function signIn(passcode: string) {
  if (passcode !== PASSCODE) return false
  sessionStorage.setItem(SESSION_KEY, '1')
  return true
}
export const signOut = () => sessionStorage.removeItem(SESSION_KEY)
