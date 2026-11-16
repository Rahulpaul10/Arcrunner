// Canvas drawing for Arc Runner. Reads game state, never mutates it.

import { COLORS, GROUND_Y, H, PLAYER_H, PLAYER_W, PLAYER_X, W } from './config'
import type { Game } from './engine'

interface Star {
  x: number
  y: number
  r: number
  depth: number
}

const STARS: Star[] = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 137.5) % W,
  y: (i * 53.3) % (GROUND_Y - 60),
  r: 0.5 + ((i * 7) % 10) / 10,
  depth: 0.02 + ((i * 3) % 5) * 0.015,
}))

const STREAKS = Array.from({ length: 7 }, (_, i) => ({
  x: (i * 211) % W,
  y: 40 + ((i * 67) % (GROUND_Y - 100)),
  len: 30 + ((i * 13) % 40),
}))

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

function drawBackground(ctx: CanvasRenderingContext2D, g: Game): void {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y)
  sky.addColorStop(0, COLORS.bgTop)
  sky.addColorStop(1, COLORS.bgBottom)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#c7d2ff'
  for (const s of STARS) {
    ctx.globalAlpha = 0.25 + s.depth * 8
    ctx.fillRect(mod(s.x - g.scroll * s.depth, W), s.y, s.r, s.r)
  }
  ctx.globalAlpha = 1

  // Concentric arches echo the Arc mark, in two parallax layers.
  const layers = [
    { factor: 0.1, period: 430, radii: [160, 132, 104], color: '139,123,255', alpha: 0.12, width: 2 },
    { factor: 0.24, period: 300, radii: [92, 72, 52], color: '94,231,255', alpha: 0.2, width: 2 },
  ]
  for (const l of layers) {
    const off = mod(g.scroll * l.factor, l.period)
    ctx.strokeStyle = `rgba(${l.color},${l.alpha})`
    ctx.lineWidth = l.width
    for (let cx = -off - l.period * 0.5; cx < W + l.period; cx += l.period) {
      for (const r of l.radii) {
        ctx.beginPath()
        ctx.arc(cx, GROUND_Y, r, Math.PI, 0)
        ctx.stroke()
      }
    }
  }

  // Speed streaks, more visible the faster you run.
  const k = Math.min(1, g.speed / 520)
  ctx.strokeStyle = `rgba(94,231,255,${0.05 + k * 0.12})`
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (const s of STREAKS) {
    const x = mod(s.x - g.scroll * 1.4, W + 80) - 40
    ctx.moveTo(x, s.y)
    ctx.lineTo(x + s.len * (0.6 + k), s.y)
  }
  ctx.stroke()
}

function drawGround(ctx: CanvasRenderingContext2D, g: Game): void {
  const fill = ctx.createLinearGradient(0, GROUND_Y, 0, H)
  fill.addColorStop(0, '#14183f')
  fill.addColorStop(1, '#070a1c')
  ctx.fillStyle = fill
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)

  // Perspective grid.
  ctx.strokeStyle = 'rgba(139,123,255,0.16)'
  ctx.lineWidth = 1
  ctx.beginPath()
  const spacing = 64
  const off = mod(g.scroll, spacing)
  for (let x = -off; x < W + spacing; x += spacing) {
    ctx.moveTo(x, GROUND_Y)
    ctx.lineTo(W / 2 + (x - W / 2) * 2.4, H)
  }
  for (let k = 1; k <= 4; k++) {
    const y = GROUND_Y + (H - GROUND_Y) * Math.pow(k / 4, 1.6)
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
  }
  ctx.stroke()

  // Gaps open into a neon void.
  const abyss = ctx.createLinearGradient(0, GROUND_Y, 0, H)
  abyss.addColorStop(0, COLORS.void)
  abyss.addColorStop(1, 'rgba(255,77,141,0.28)')
  for (const gap of g.gaps) {
    ctx.fillStyle = COLORS.void
    ctx.fillRect(gap.x, GROUND_Y - 1, gap.w, H - GROUND_Y + 1)
    ctx.fillStyle = abyss
    ctx.fillRect(gap.x, GROUND_Y - 1, gap.w, H - GROUND_Y + 1)
  }

  // Glowing path edge, broken at each gap.
  ctx.save()
  ctx.strokeStyle = COLORS.cyan
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.shadowColor = COLORS.cyan
  ctx.shadowBlur = 12
  ctx.beginPath()
  let cur = -20
  for (const gap of g.gaps) {
    if (gap.x > cur) {
      ctx.moveTo(cur, GROUND_Y)
      ctx.lineTo(gap.x, GROUND_Y)
    }
    cur = gap.x + gap.w
  }
  ctx.moveTo(cur, GROUND_Y)
  ctx.lineTo(W + 20, GROUND_Y)
  ctx.stroke()

  ctx.strokeStyle = COLORS.pink
  ctx.shadowColor = COLORS.pink
  ctx.beginPath()
  for (const gap of g.gaps) {
    ctx.moveTo(gap.x, GROUND_Y)
    ctx.lineTo(gap.x, GROUND_Y + 22)
    ctx.moveTo(gap.x + gap.w, GROUND_Y)
    ctx.lineTo(gap.x + gap.w, GROUND_Y + 22)
  }
  ctx.stroke()
  ctx.restore()
}

function drawHazards(ctx: CanvasRenderingContext2D, g: Game): void {
  ctx.save()
  ctx.strokeStyle = COLORS.pink
  ctx.lineWidth = 2
  ctx.shadowColor = COLORS.pink
  ctx.shadowBlur = 12
  ctx.fillStyle = '#2a0f2e'
  for (const h of g.hazards) {
    if (h.x > W + 20) continue
    if (h.kind === 'block') {
      roundRect(ctx, h.x, GROUND_Y - h.h, h.w, h.h, 5)
      ctx.fill()
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(h.x + 7, GROUND_Y - h.h + 9)
      ctx.lineTo(h.x + h.w - 7, GROUND_Y - 9)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(h.x, GROUND_Y)
      ctx.lineTo(h.x + h.w / 2, GROUND_Y - h.h)
      ctx.lineTo(h.x + h.w, GROUND_Y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawOrbs(ctx: CanvasRenderingContext2D, g: Game, t: number): void {
  for (const o of g.orbs) {
    if (o.taken || o.x > W + 30) continue
    const y = o.y + Math.sin(t * 3 + o.phase) * 3
    const r = 7 + Math.sin(t * 6 + o.phase)
    const glow = ctx.createRadialGradient(o.x, y, 0, o.x, y, r * 3)
    glow.addColorStop(0, 'rgba(92,245,196,0.5)')
    glow.addColorStop(1, 'rgba(92,245,196,0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(o.x, y, r * 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = COLORS.mint
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(o.x, y, r, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#eafff8'
    ctx.beginPath()
    ctx.arc(o.x, y, r * 0.45, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, g: Game): void {
  for (const p of g.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawPlayer(ctx: CanvasRenderingContext2D, g: Game): void {
  const airborne = !g.grounded
  const tilt = airborne ? Math.max(-0.3, Math.min(0.3, g.vy / 2400)) : 0
  const swing = airborne ? 6 : Math.sin(g.runPhase) * 6

  ctx.save()
  ctx.translate(PLAYER_X, g.y - PLAYER_H / 2)
  ctx.rotate(tilt)
  ctx.scale(1 - g.stretch * 0.6, 1 + g.stretch)

  // Legs
  ctx.strokeStyle = '#bfe9ff'
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(-5, 8)
  ctx.lineTo(-5 + swing, PLAYER_H / 2)
  ctx.moveTo(5, 8)
  ctx.lineTo(5 - swing, PLAYER_H / 2)
  ctx.stroke()

  // Body
  const body = ctx.createLinearGradient(0, -PLAYER_H / 2, 0, 8)
  body.addColorStop(0, '#e6f8ff')
  body.addColorStop(1, COLORS.cyan)
  ctx.shadowColor = COLORS.cyan
  ctx.shadowBlur = 16
  ctx.fillStyle = body
  roundRect(ctx, -PLAYER_W / 2, -PLAYER_H / 2, PLAYER_W, 24, 8)
  ctx.fill()
  ctx.shadowBlur = 0

  // Visor and eye
  ctx.fillStyle = '#0a1030'
  roundRect(ctx, 0, -PLAYER_H / 2 + 6, 12, 9, 4)
  ctx.fill()
  ctx.fillStyle = COLORS.mint
  ctx.fillRect(6, -PLAYER_H / 2 + 8, 4, 4)
  ctx.restore()
}

/** Sizes the canvas backing store for the device pixel ratio and returns its context. */
export function prepareCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

export function drawScene(ctx: CanvasRenderingContext2D, g: Game, t: number): void {
  drawBackground(ctx, g)
  drawGround(ctx, g)
  drawOrbs(ctx, g, t)
  drawHazards(ctx, g)
  if (g.phase !== 'over') drawPlayer(ctx, g)
  drawParticles(ctx, g)
}
