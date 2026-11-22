export const SKILL_LEVELS = ['Beginner', 'Novice', 'Intermediate', 'Advanced', 'Open'] as const
export const DIVISIONS = ["Men's Doubles", "Women's Doubles", 'Mixed Doubles'] as const
export const PLACEMENTS = ['Gold', 'Silver', 'Bronze'] as const
export const SUBMISSION_TYPES = ['New Achievement', 'Correction to Existing Record'] as const

export type SkillLevel = (typeof SKILL_LEVELS)[number]
export type Division = (typeof DIVISIONS)[number]
export type Placement = (typeof PLACEMENTS)[number]
export type SubmissionType = (typeof SUBMISSION_TYPES)[number]

export const PLACEMENT_LABELS: Record<Placement, string> = {
  Gold: '1st Place / Gold',
  Silver: '2nd Place / Silver',
  Bronze: '3rd Place / Bronze',
}

export interface Player {
  id: string
  full_name: string
  nickname: string
  city: string
  home_club: string
  bio: string
  photo_url: string
  is_published: boolean
  fictional_example: boolean
}

export interface Achievement {
  id: string
  player_id: string
  tournament_name: string
  event_date: string // YYYY-MM-DD
  placement: Placement
  skill_level: SkillLevel
  division: Division
  partner_name: string
  /** Any web address that backs the result — usually the organiser's Facebook post. */
  proof_url: string
  notes: string
  is_published: boolean
  fictional_example: boolean
}

export interface Submission {
  id: string
  submission_type: SubmissionType
  player_name: string
  partner_name: string
  tournament_name: string
  event_date: string
  skill_level: SkillLevel
  placement: Placement
  division: Division
  proof_url: string
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string
  created_at: string
}

export interface Database {
  players: Player[]
  achievements: Achievement[]
  submissions: Submission[]
}

export interface Stats {
  total: number
  Gold: number
  Silver: number
  Bronze: number
}
