import type { Achievement, Database, Player } from './types'

// Fictional sample records so the app has something to show on first run.
// Every one is flagged `fictional_example` and rendered with a "Sample" tag.
const p = (id: string, full_name: string, nickname: string, city: string, home_club: string, bio = ''): Player => ({
  id, full_name, nickname, city, home_club, bio, photo_url: '', is_published: true, fictional_example: true,
})

const players: Player[] = [
  p('6ad472b06f8d721af4836f5f', 'Maria Santos', 'Ria', 'Bacolod City', 'Lacson Picklers', 'Left-handed kitchen specialist who started playing in 2023.'),
  p('6ad472b06f8d721af4836f60', 'Juan Dela Cruz', 'JD', 'Bacolod City', 'Lacson Picklers'),
  p('6ad472b06f8d721af4836f61', 'Carlo Villanueva', '', 'Talisay City', 'The Ruins Pickleball Club'),
  p('6ad472b06f8d721af4836f62', 'Bea Lopez', 'Bea', 'Silay City', 'Silay Dinkers'),
  p('6ad472b06f8d721af4836f63', 'Paolo Jalandoni', '', 'Bacolod City', 'Capitol Lagoon Smashers'),
  p('6ad472b06f8d721af4836f64', 'Trina Montelibano', 'Trin', 'Bago City', 'Bago Paddle Club'),
]

let n = 0
const a = (
  player: number, tournament_name: string, event_date: string, placement: Achievement['placement'],
  skill_level: Achievement['skill_level'], division: Achievement['division'], partner_name: string, proof_url = '',
): Achievement => ({
  id: `7bd583c17f9e832bf5947a${(n++).toString(16).padStart(2, '0')}`,
  player_id: players[player].id, tournament_name, event_date, placement, skill_level, division, partner_name,
  proof_url, notes: '', is_published: true, fictional_example: true,
})

// Sample proof links point at Facebook's home page: real records link to the organiser's results post.
const FB = 'https://www.facebook.com/'

const achievements: Achievement[] = [
  a(0, 'MassKara Pickleball Festival 2025', '2025-10-18', 'Gold', 'Intermediate', 'Mixed Doubles', 'Juan Dela Cruz', FB),
  a(1, 'MassKara Pickleball Festival 2025', '2025-10-18', 'Gold', 'Intermediate', 'Mixed Doubles', 'Maria Santos', FB),
  a(0, 'Negros Open Pickleball Cup 2025', '2025-08-09', 'Silver', 'Intermediate', "Women's Doubles", 'Bea Lopez', FB),
  a(3, 'Negros Open Pickleball Cup 2025', '2025-08-09', 'Silver', 'Intermediate', "Women's Doubles", 'Maria Santos', FB),
  a(0, 'Panaad Pickleball Classic 2025', '2025-04-12', 'Gold', 'Novice', "Women's Doubles", 'Trina Montelibano'),
  a(5, 'Panaad Pickleball Classic 2025', '2025-04-12', 'Gold', 'Novice', "Women's Doubles", 'Maria Santos'),
  a(0, 'Silay Charter Day Open 2024', '2024-06-08', 'Bronze', 'Novice', 'Mixed Doubles', 'Carlo Villanueva', FB),
  a(2, 'Silay Charter Day Open 2024', '2024-06-08', 'Bronze', 'Novice', 'Mixed Doubles', 'Maria Santos', FB),
  a(1, 'Negros Open Pickleball Cup 2025', '2025-08-09', 'Gold', 'Advanced', "Men's Doubles", 'Paolo Jalandoni', FB),
  a(4, 'Negros Open Pickleball Cup 2025', '2025-08-09', 'Gold', 'Advanced', "Men's Doubles", 'Juan Dela Cruz', FB),
  a(1, 'Panaad Pickleball Classic 2025', '2025-04-12', 'Bronze', 'Intermediate', "Men's Doubles", 'Carlo Villanueva'),
  a(2, 'Panaad Pickleball Classic 2025', '2025-04-12', 'Bronze', 'Intermediate', "Men's Doubles", 'Juan Dela Cruz'),
  a(2, 'MassKara Pickleball Festival 2025', '2025-10-18', 'Silver', 'Advanced', "Men's Doubles", 'Paolo Jalandoni', FB),
  a(4, 'MassKara Pickleball Festival 2025', '2025-10-18', 'Silver', 'Advanced', "Men's Doubles", 'Carlo Villanueva', FB),
  a(3, 'Silay Charter Day Open 2024', '2024-06-08', 'Gold', 'Beginner', "Women's Doubles", 'Trina Montelibano', FB),
  a(5, 'Silay Charter Day Open 2024', '2024-06-08', 'Gold', 'Beginner', "Women's Doubles", 'Bea Lopez', FB),
]

export const seed: Database = { players, achievements, submissions: [] }
