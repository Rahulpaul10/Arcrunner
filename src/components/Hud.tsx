import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'

interface HudProps {
  score: number
  best: number
  soundOn: boolean
  onToggleSound: () => void
}

export function Hud({ score, best, soundOn, onToggleSound }: HudProps) {
  return (
    <div className="flex items-end justify-between">
      <div className="flex items-end gap-6">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">Energy</p>
          <motion.p
            key={score}
            initial={{ scale: 1.25 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            className="font-display origin-left text-4xl font-bold leading-none tracking-[-0.03em] text-white tabular-nums"
          >
            {score}
          </motion.p>
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">Best</p>
          <p className="font-display text-2xl font-bold leading-none tracking-[-0.02em] text-cyan-200 tabular-nums">
            {best}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onToggleSound}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Turn sound off' : 'Turn sound on'}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition-colors hover:bg-white/10 active:scale-95"
      >
        {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  )
}
