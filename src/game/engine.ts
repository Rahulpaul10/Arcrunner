// Arc Runner game logic. Pure TypeScript: no React, no DOM.

import {
  COLORS,
  DIFFICULTIES,
  GRAVITY,
  GROUND_Y,
  JUMP_VELOCITY,
  MENU_SPEED,
  PLAYER_H,
  PLAYER_W,
  PLAYER_X,
  W,
  type Difficulty,
} from './config'

export type Phase = 'menu' | 'playing' | 'over'
export type Sfx = 'jump' | 'land' | 'collect' | 'crash' | 'start'

export interface Orb {
  x: number
  y: number
  phase: number
  taken: boolean
}

export interface Hazard {
  kind: 'block' | 'spike'
  x: number
  w: number
  h: number
}

export interface Gap {
  x: number
  w: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}

export interface GameEvents {
  onScore: (score: number) => void
  onSfx: (kind: Sfx, step?: number) => void
  onOver: (score: number) => void
}

const ORB_BASE_Y = GROUND_Y - 28
const MAX_PARTICLES = 140

const rand = (min: number, max: number) => min + Math.random() * (max - min)

export class Game {
  phase: Phase = 'menu'
  diff: Difficulty = DIFFICULTIES[0]
  score = 0
  speed = MENU_SPEED
  /** Total distance scrolled, used for parallax. */
  scroll = 0

  /** Feet position of the player. */
  y = GROUND_Y
  vy = 0
  grounded = true
  /** Squash and stretch amount, decays to 0. */
  stretch = 0
  runPhase = 0

  orbs: Orb[] = []
  hazards: Hazard[] = []
  gaps: Gap[] = []
  particles: Particle[] = []

  private events: GameEvents
  private cursor = 0
  private coyote = 0
  private buffer = 0
  private dustTimer = 0

  constructor() {
    this.events = { onScore: () => {}, onSfx: () => {}, onOver: () => {} }
  }

  setEvents(events: GameEvents): void {
    this.events = events
  }

  start(diff: Difficulty): void {
    this.resetWorld()
    this.diff = diff
    this.speed = diff.startSpeed
    this.cursor = W + 160
    this.phase = 'playing'
    this.events.onSfx('start')
  }

  toMenu(): void {
    this.resetWorld()
    this.speed = MENU_SPEED
    this.phase = 'menu'
  }

  /** Queue a jump. A short buffer makes taps feel forgiving. */
  jump(): void {
    if (this.phase === 'playing') this.buffer = 0.12
  }

  update(dt: number): void {
    const step = Math.min(dt, 0.033)
    if (this.phase === 'playing') {
      this.updatePlaying(step)
    } else if (this.phase === 'menu') {
      this.scroll += MENU_SPEED * step
      this.runPhase += step * 10
      this.emitDust(step)
    }
    this.updateParticles(step)
    this.stretch -= this.stretch * Math.min(1, step * 9)
  }

  private resetWorld(): void {
    this.score = 0
    this.y = GROUND_Y
    this.vy = 0
    this.grounded = true
    this.stretch = 0
    this.coyote = 0
    this.buffer = 0
    this.orbs = []
    this.hazards = []
    this.gaps = []
    this.particles = []
  }

  private updatePlaying(dt: number): void {
    const d = this.diff
    this.speed = Math.min(d.maxSpeed, this.speed + d.accel * dt)
    const dx = this.speed * dt
    this.scroll += dx
    this.cursor -= dx

    for (const o of this.orbs) o.x -= dx
    for (const h of this.hazards) h.x -= dx
    for (const g of this.gaps) g.x -= dx
    this.orbs = this.orbs.filter((o) => !o.taken && o.x > -40)
    this.hazards = this.hazards.filter((h) => h.x + h.w > -40)
    this.gaps = this.gaps.filter((g) => g.x + g.w > -40)

    while (this.cursor < W + 120) this.spawnChunk()

    // Walking off an edge starts a short coyote window.
    if (this.grounded && this.overGap()) {
      this.grounded = false
      this.coyote = 0.08
    } else if (!this.grounded) {
      this.coyote = Math.max(0, this.coyote - dt)
    }

    this.buffer = Math.max(0, this.buffer - dt)
    if (this.buffer > 0 && (this.grounded || this.coyote > 0)) {
      this.vy = -JUMP_VELOCITY
      this.grounded = false
      this.coyote = 0
      this.buffer = 0
      this.stretch = 0.25
      this.events.onSfx('jump')
    }

    const prevY = this.y
    this.vy += GRAVITY * dt
    this.y += this.vy * dt

    if (this.vy >= 0 && prevY <= GROUND_Y + 0.5 && this.y >= GROUND_Y && !this.overGap()) {
      this.y = GROUND_Y
      this.vy = 0
      if (!this.grounded) {
        this.grounded = true
        this.stretch = -0.2
        this.events.onSfx('land')
        this.burst(PLAYER_X, GROUND_Y, COLORS.cyan, 5, 90, 0.3)
      }
    }

    if (this.grounded) {
      this.runPhase += dt * (this.speed / 24)
      this.emitDust(dt)
    }

    if (this.y > GROUND_Y + 50) {
      this.die()
      return
    }

    this.collide()
  }

  private overGap(): boolean {
    return this.gaps.some((g) => PLAYER_X > g.x + 6 && PLAYER_X < g.x + g.w - 6)
  }

  private collide(): void {
    const left = PLAYER_X - PLAYER_W / 2 + 4
    const right = PLAYER_X + PLAYER_W / 2 - 4
    const top = this.y - PLAYER_H + 5
    const bottom = this.y

    for (const h of this.hazards) {
      const inset = h.kind === 'spike' ? 7 : 3
      const hx1 = h.x + inset
      const hx2 = h.x + h.w - inset
      const hy1 = GROUND_Y - h.h + (h.kind === 'spike' ? 8 : 0)
      if (right > hx1 && left < hx2 && bottom > hy1 && top < GROUND_Y) {
        this.die()
        return
      }
    }

    const cy = this.y - PLAYER_H / 2
    for (const o of this.orbs) {
      if (o.taken) continue
      const dx = o.x - PLAYER_X
      const dy = o.y - cy
      if (dx * dx + dy * dy < 27 * 27) {
        o.taken = true
        this.score += 1
        this.burst(o.x, o.y, COLORS.mint, 10, 170, 0.5)
        this.events.onSfx('collect', this.score)
        this.events.onScore(this.score)
      }
    }
  }

  private die(): void {
    this.phase = 'over'
    this.burst(PLAYER_X, this.y - PLAYER_H / 2, COLORS.pink, 28, 340, 0.8)
    this.burst(PLAYER_X, this.y - PLAYER_H / 2, COLORS.cyan, 14, 260, 0.7)
    this.events.onSfx('crash')
    this.events.onOver(this.score)
  }

  // ---- spawning -----------------------------------------------------------

  private spawnChunk(): void {
    const d = this.diff
    if (Math.random() > d.hazardChance) {
      this.spawnOrbs()
      return
    }
    const t = Math.random()
    if (t < 0.38) this.spawnBlock()
    else if (t < 0.66) this.spawnGap()
    else if (t < 0.84 || d.id === 'spark') this.spawnSpike()
    else this.spawnDouble()
  }

  private arcOrbs(startX: number, endX: number, count: number, peak: number): void {
    for (let i = 0; i < count; i++) {
      const u = count === 1 ? 0.5 : i / (count - 1)
      this.orbs.push({
        x: startX + (endX - startX) * u,
        y: ORB_BASE_Y - Math.sin(Math.PI * u) * peak,
        phase: Math.random() * 6,
        taken: false,
      })
    }
  }

  private spawnOrbs(): void {
    const x0 = this.cursor
    const count = 4 + Math.floor(Math.random() * 3)
    if (Math.random() < 0.5) {
      this.arcOrbs(x0, x0 + (count - 1) * 38, count, 0)
    } else {
      this.arcOrbs(x0, x0 + (count - 1) * 38, count, rand(50, 85))
    }
    this.cursor = x0 + count * 38 + 50 + this.speed * 0.15
  }

  private spawnBlock(): void {
    const x = this.cursor + 70
    const w = rand(28, 40)
    const h = rand(36, 58)
    this.hazards.push({ kind: 'block', x, w, h })
    this.arcOrbs(x - 70, x + w + 70, 6, h + 27)
    this.cursor = x + w + 100 + this.speed * 0.5
  }

  private spawnSpike(): void {
    const x = this.cursor + 70
    this.hazards.push({ kind: 'spike', x, w: 34, h: 34 })
    this.arcOrbs(x - 60, x + 34 + 60, 5, 60)
    this.cursor = x + 34 + 100 + this.speed * 0.5
  }

  private spawnDouble(): void {
    const x = this.cursor + 70
    const h = 40
    this.hazards.push({ kind: 'block', x, w: 30, h })
    this.hazards.push({ kind: 'block', x: x + 90, w: 30, h })
    this.arcOrbs(x - 40, x + 130, 6, h + 30)
    this.cursor = x + 120 + 100 + this.speed * 0.5
  }

  private spawnGap(): void {
    const x = this.cursor + 70
    const w = rand(70, this.diff.maxGap)
    this.gaps.push({ x, w })
    this.arcOrbs(x - 30, x + w + 30, 5, 72)
    this.cursor = x + w + 110 + this.speed * 0.45
  }

  // ---- particles ----------------------------------------------------------

  private burst(x: number, y: number, color: string, count: number, speed: number, life: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2
      const s = speed * (0.35 + Math.random() * 0.65)
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 40,
        life: life * (0.6 + Math.random() * 0.4),
        max: life,
        size: rand(1.5, 3.5),
        color,
      })
    }
    if (this.particles.length > MAX_PARTICLES) {
      this.particles.splice(0, this.particles.length - MAX_PARTICLES)
    }
  }

  private emitDust(dt: number): void {
    this.dustTimer -= dt
    if (this.dustTimer > 0) return
    this.dustTimer = 0.09
    this.particles.push({
      x: PLAYER_X - 10,
      y: GROUND_Y - 1,
      vx: rand(-70, -30),
      vy: rand(-45, -15),
      life: 0.35,
      max: 0.35,
      size: rand(1.2, 2.2),
      color: COLORS.cyan,
    })
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 420 * dt
      p.life -= dt
    }
    this.particles = this.particles.filter((p) => p.life > 0)
  }
}
