import { AnimatePresence } from 'framer-motion'
import { DifficultyPicker } from '@/components/DifficultyPicker'
import { GameCanvas } from '@/components/GameCanvas'
import { GameOverOverlay, StartOverlay } from '@/components/GameOverlays'
import { Hud } from '@/components/Hud'
import { useArcRunner } from '@/hooks/useArcRunner'

export default function App() {
  const r = useArcRunner()

  return (
    <main className="min-h-dvh bg-[#05070f] px-4 pb-20 pt-5 text-white">
      <div className="mx-auto flex min-h-[calc(100dvh-6.25rem)] w-full max-w-2xl flex-col justify-center gap-3">
        <Hud score={r.score} best={r.best} soundOn={r.soundOn} onToggleSound={r.toggleSound} />

        <div
          className="relative aspect-[16/10] w-full touch-none overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#060914] shadow-[0_0_40px_rgba(139,123,255,0.18)]"
        >
          <GameCanvas onReady={r.setCanvas} />
          <AnimatePresence>
            {r.phase === 'menu' && <StartOverlay key="start" onPlay={r.play} />}
            {r.phase === 'over' && (
              <GameOverOverlay
                key="over"
                score={r.score}
                best={r.best}
                newBest={r.newBest}
                unlockedName={r.unlockedName}
                onRestart={r.play}
                onMenu={r.toMenu}
              />
            )}
          </AnimatePresence>
        </div>

        {r.phase === 'playing' ? (
          <p className="h-14 pt-4 text-center text-sm text-slate-400">Tap anywhere or press Space to jump</p>
        ) : (
          <DifficultyPicker selected={r.difficultyId} best={r.best} onSelect={r.selectDifficulty} />
        )}
      </div>
    </main>
  )
}
