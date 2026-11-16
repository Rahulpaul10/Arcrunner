// Shared constants for Arc Runner. Logical canvas units, scaled to fit by CSS.

export const W = 640
export const H = 400
export const GROUND_Y = 318

export const PLAYER_X = 100
export const PLAYER_W = 26
export const PLAYER_H = 32

export const GRAVITY = 2300
export const JUMP_VELOCITY = 800
export const MENU_SPEED = 170

export const COLORS = {
  bgTop: '#060914',
  bgBottom: '#0e1230',
  cyan: '#5ee7ff',
  violet: '#8b7bff',
  mint: '#5cf5c4',
  pink: '#ff4d8d',
  void: '#04050d',
} as const

export type DifficultyId = 'spark' | 'surge' | 'overdrive'

export interface Difficulty {
  id: DifficultyId
  name: string
  /** Highest score needed to unlock this level. */
  unlockAt: number
  startSpeed: number
  maxSpeed: number
  /** Speed gained per second. */
  accel: number
  /** Chance that a spawned chunk contains a hazard. */
  hazardChance: number
  maxGap: number
}

export const DIFFICULTIES: Difficulty[] = [
  { id: 'spark', name: 'Spark', unlockAt: 0, startSpeed: 250, maxSpeed: 400, accel: 6, hazardChance: 0.5, maxGap: 100 },
  { id: 'surge', name: 'Surge', unlockAt: 25, startSpeed: 300, maxSpeed: 480, accel: 8, hazardChance: 0.6, maxGap: 115 },
  { id: 'overdrive', name: 'Overdrive', unlockAt: 70, startSpeed: 350, maxSpeed: 580, accel: 10, hazardChance: 0.7, maxGap: 130 },
]

export function getDifficulty(id: DifficultyId): Difficulty {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0]
}

export function isUnlocked(d: Difficulty, best: number): boolean {
  return best >= d.unlockAt
}
