import { DIFFICULTIES, type DifficultyId } from './config'

const BEST_KEY = 'arc-runner:best'
const SOUND_KEY = 'arc-runner:sound'
const DIFFICULTY_KEY = 'arc-runner:difficulty'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Storage can be unavailable (private mode); the game still works.
  }
}

export function loadBest(): number {
  const n = Number(read(BEST_KEY))
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export function saveBest(score: number): void {
  write(BEST_KEY, String(score))
}

export function loadSound(): boolean {
  return read(SOUND_KEY) !== 'off'
}

export function saveSound(on: boolean): void {
  write(SOUND_KEY, on ? 'on' : 'off')
}

export function loadDifficulty(): DifficultyId {
  const id = read(DIFFICULTY_KEY)
  return DIFFICULTIES.find((d) => d.id === id)?.id ?? 'spark'
}

export function saveDifficulty(id: DifficultyId): void {
  write(DIFFICULTY_KEY, id)
}
