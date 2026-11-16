// Tiny WebAudio synth. No audio files, no network.

import type { Sfx } from './engine'

let ac: AudioContext | null = null

function getContext(): AudioContext | null {
  if (!ac) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ac = new Ctor()
  }
  return ac
}

/** Call from a user gesture so browsers allow audio. */
export function unlockAudio(): void {
  const c = getContext()
  if (c && c.state === 'suspended') void c.resume()
}

function tone(freq: number, endFreq: number, duration: number, type: OscillatorType, volume: number, delay = 0): void {
  const c = getContext()
  if (!c) return
  const start = c.currentTime + delay
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), start + duration)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(c.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export function playSfx(kind: Sfx, enabled: boolean, step = 0): void {
  if (!enabled) return
  switch (kind) {
    case 'jump':
      tone(340, 620, 0.14, 'square', 0.05)
      break
    case 'land':
      tone(140, 90, 0.06, 'sine', 0.06)
      break
    case 'collect': {
      const base = 760 + (step % 8) * 70
      tone(base, base * 1.5, 0.12, 'triangle', 0.09)
      break
    }
    case 'crash':
      tone(240, 50, 0.4, 'sawtooth', 0.08)
      tone(120, 40, 0.45, 'square', 0.05, 0.03)
      break
    case 'start':
      tone(440, 660, 0.1, 'triangle', 0.07)
      tone(660, 990, 0.14, 'triangle', 0.07, 0.09)
      break
  }
}
