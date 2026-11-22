import { getDb, newId } from './store'
import { DIVISIONS, PLACEMENTS, SKILL_LEVELS, type Achievement, type Division, type Placement, type Player, type SkillLevel } from './types'
import { isHttpUrl } from './utils'

export const CSV_COLUMNS = [
  'full_name', 'nickname', 'home_club', 'city',
  'tournament_name', 'event_date', 'placement', 'skill_level', 'division', 'partner_name', 'proof_url',
] as const

/** Minimal RFC 4180 parser: quoted fields, escaped quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (c === '"') quoted = false
      else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(cell); cell = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(cell); cell = ''
      rows.push(row); row = []
    } else cell += c
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows.filter((r) => r.some((c) => c.trim()))
}

export interface ImportRow {
  line: number
  name: string
  tournament: string
  newPlayer: boolean
  problems: string[]
}

export interface ImportPlan {
  rows: ImportRow[]
  players: Player[]
  achievements: Achievement[]
}

const match = <T extends string>(options: readonly T[], value: string) =>
  options.find((o) => o.toLowerCase() === value.toLowerCase())

/** Turns CSV text into the records it would create, without saving anything. */
export function planImport(text: string): ImportPlan {
  const [header, ...body] = parseCsv(text)
  const plan: ImportPlan = { rows: [], players: [], achievements: [] }
  if (!header) return plan
  const cols = header.map((h) => h.trim().toLowerCase())
  const known = new Map(getDb().players.map((p) => [p.full_name.trim().toLowerCase(), p]))

  body.forEach((cells, i) => {
    const get = (k: (typeof CSV_COLUMNS)[number]) => (cells[cols.indexOf(k)] ?? '').trim()
    const problems: string[] = []
    const name = get('full_name')
    const tournament = get('tournament_name')
    if (!name) problems.push('full_name is required')

    let player = known.get(name.toLowerCase())
    const newPlayer = !!name && !player
    if (newPlayer) {
      player = {
        id: newId(), full_name: name, nickname: get('nickname'), home_club: get('home_club'), city: get('city'),
        bio: '', photo_url: '', is_published: true, fictional_example: false,
      }
    }

    let achievement: Achievement | undefined
    if (tournament) {
      const date = get('event_date')
      const placement = match<Placement>(PLACEMENTS, get('placement'))
      const skill = match<SkillLevel>(SKILL_LEVELS, get('skill_level') || 'Intermediate')
      const division = match<Division>(DIVISIONS, get('division') || "Men's Doubles")
      const proof = get('proof_url')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) problems.push('event_date must be YYYY-MM-DD')
      if (!placement) problems.push('placement must be Gold, Silver or Bronze')
      if (!skill) problems.push(`skill_level must be one of ${SKILL_LEVELS.join(', ')}`)
      if (!division) problems.push(`division must be one of ${DIVISIONS.join(', ')}`)
      if (proof && !isHttpUrl(proof)) problems.push('proof_url must start with http:// or https://')
      if (player && placement && skill && division && !problems.length) {
        achievement = {
          id: newId(), player_id: player.id, tournament_name: tournament, event_date: date, placement,
          skill_level: skill, division, partner_name: get('partner_name'), proof_url: proof, notes: '',
          is_published: true, fictional_example: false,
        }
      }
    }

    if (!problems.length && player) {
      if (newPlayer) {
        known.set(name.toLowerCase(), player)
        plan.players.push(player)
      }
      if (achievement) plan.achievements.push(achievement)
    }
    plan.rows.push({ line: i + 2, name, tournament, newPlayer, problems })
  })
  return plan
}
