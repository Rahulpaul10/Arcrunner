import { useCallback, useEffect, useRef, useState } from 'react'
import { DIFFICULTIES, getDifficulty, isUnlocked, type DifficultyId } from '@/game/config'
import { Game, type Phase } from '@/game/engine'
import { drawScene, prepareCanvas } from '@/game/renderer'
import { playSfx, unlockAudio } from '@/game/audio'
import { loadBest, loadDifficulty, loadSound, saveBest, saveDifficulty, saveSound } from '@/game/storage'

export function useArcRunner() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const [phase, setPhase] = useState<Phase>('menu')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(loadBest)
  const [newBest, setNewBest] = useState(false)
  const [unlockedName, setUnlockedName] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(loadSound)
  const [difficultyId, setDifficultyId] = useState<DifficultyId>(() => {
    const saved = loadDifficulty()
    return isUnlocked(getDifficulty(saved), loadBest()) ? saved : 'spark'
  })

  // Event callbacks run outside React renders, so they read the latest values from refs.
  const soundRef = useRef(soundOn)
  const bestRef = useRef(best)
  useEffect(() => {
    soundRef.current = soundOn
  }, [soundOn])
  useEffect(() => {
    bestRef.current = best
  }, [best])

  const [game] = useState(() => new Game())

  useEffect(() => {
    game.setEvents({
      onScore: (s) => setScore(s),
      onSfx: (kind, step) => playSfx(kind, soundRef.current, step),
      onOver: (finalScore) => {
        setPhase('over')
        const prev = bestRef.current
        if (finalScore > prev) {
          saveBest(finalScore)
          bestRef.current = finalScore
          setBest(finalScore)
          setNewBest(true)
          const fresh = DIFFICULTIES.filter((d) => d.unlockAt > prev && d.unlockAt <= finalScore)
          setUnlockedName(fresh.length ? fresh[fresh.length - 1].name : null)
        }
      },
    })
  }, [game])

  // Render loop.
  useEffect(() => {
    if (!canvas) return
    const ctx = prepareCanvas(canvas)
    if (!ctx) return

    const clock = { raf: 0, last: performance.now() }
    const frame = (now: number) => {
      const dt = (now - clock.last) / 1000
      clock.last = now
      game.update(dt)
      drawScene(ctx, game, now / 1000)
      clock.raf = requestAnimationFrame(frame)
    }
    clock.raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(clock.raf)
  }, [game, canvas])

  // Input: tap anywhere (except buttons) or press Space / Up / W to jump.
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (game.phase !== 'playing') return
      if ((e.target as Element | null)?.closest('button')) return
      unlockAudio()
      game.jump()
    }
    const onKey = (e: KeyboardEvent) => {
      if (game.phase !== 'playing' || e.repeat) return
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        game.jump()
      }
    }
    window.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [game])

  const play = useCallback(() => {
    unlockAudio()
    game.start(getDifficulty(difficultyId))
    setScore(0)
    setNewBest(false)
    setUnlockedName(null)
    setPhase('playing')
  }, [game, difficultyId])

  const toMenu = useCallback(() => {
    game.toMenu()
    setScore(0)
    setPhase('menu')
  }, [game])

  const selectDifficulty = useCallback(
    (id: DifficultyId) => {
      if (!isUnlocked(getDifficulty(id), best)) return
      setDifficultyId(id)
      saveDifficulty(id)
    },
    [best],
  )

  const toggleSound = useCallback(() => {
    const next = !soundRef.current
    soundRef.current = next
    setSoundOn(next)
    saveSound(next)
    if (next) {
      unlockAudio()
      playSfx('collect', true)
    }
  }, [])

  return {
    setCanvas,
    phase,
    score,
    best,
    newBest,
    unlockedName,
    soundOn,
    difficultyId,
    play,
    toMenu,
    selectDifficulty,
    toggleSound,
  }
}

export type ArcRunner = ReturnType<typeof useArcRunner>
