import { motion } from 'framer-motion'
import { Play, RotateCcw, Sparkles } from 'lucide-react'

const panel = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { type: 'spring' as const, stiffness: 320, damping: 28 },
}

const primaryButton =
  'font-display inline-flex h-12 items-center gap-2 rounded-full bg-[#ACC6E9] px-7 text-base font-bold text-[#10213f] shadow-[0_0_28px_rgba(94,231,255,0.35)] transition-transform active:scale-95'

export function StartOverlay({ onPlay }: { onPlay: () => void }) {
  return (
    <motion.div
      {...panel}
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#05070f]/55 px-4 text-center backdrop-blur-[2px]"
    >
      <h1 className="font-display text-balance text-4xl font-bold tracking-[-0.04em] text-white drop-shadow-[0_0_18px_rgba(94,231,255,0.6)] sm:text-6xl">
        Arc Runner
      </h1>
      <p className="text-pretty text-sm text-slate-300 sm:text-base">Collect Arc Energy. Dodge the obstacles and gaps.</p>
      <button type="button" onClick={onPlay} className={`${primaryButton} mt-1`}>
        <Play size={18} fill="currentColor" />
        Play
      </button>
    </motion.div>
  )
}

interface GameOverOverlayProps {
  score: number
  best: number
  newBest: boolean
  unlockedName: string | null
  onRestart: () => void
  onMenu: () => void
}

export function GameOverOverlay({ score, best, newBest, unlockedName, onRestart, onMenu }: GameOverOverlayProps) {
  return (
    <motion.div
      {...panel}
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#05070f]/70 px-4 text-center backdrop-blur-sm"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-pink-300">Game over</p>
      <p className="font-display text-5xl font-bold leading-none tracking-[-0.04em] text-white tabular-nums sm:text-6xl">
        {score}
      </p>
      <p className="text-sm text-slate-300 tabular-nums">
        {newBest ? 'New best score!' : `Best ${best}`}
      </p>
      {unlockedName && (
        <p className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
          <Sparkles size={12} />
          {unlockedName} unlocked
        </p>
      )}
      <div className="mt-2 flex items-center gap-2">
        <button type="button" onClick={onRestart} className={primaryButton}>
          <RotateCcw size={18} />
          Restart Game
        </button>
        <button
          type="button"
          onClick={onMenu}
          className="h-12 rounded-full px-4 text-sm font-medium text-slate-300 transition-colors hover:text-white"
        >
          Menu
        </button>
      </div>
    </motion.div>
  )
}
