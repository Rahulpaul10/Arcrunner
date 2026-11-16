import { Lock } from 'lucide-react'
import { DIFFICULTIES, isUnlocked, type DifficultyId } from '@/game/config'

interface DifficultyPickerProps {
  selected: DifficultyId
  best: number
  onSelect: (id: DifficultyId) => void
}

export function DifficultyPicker({ selected, best, onSelect }: DifficultyPickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Difficulty">
      {DIFFICULTIES.map((d) => {
        const unlocked = isUnlocked(d, best)
        const active = d.id === selected
        return (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={!unlocked}
            onClick={() => onSelect(d.id)}
            className={[
              'flex min-h-14 flex-col items-center justify-center rounded-2xl border px-2 py-2 transition-colors',
              active
                ? 'border-cyan-300/70 bg-cyan-300/10 text-white'
                : 'border-white/10 bg-white/[0.04] text-slate-300',
              unlocked ? 'active:scale-[0.98]' : 'cursor-not-allowed opacity-60',
            ].join(' ')}
          >
            <span className="font-display flex items-center gap-1.5 text-sm font-bold tracking-[-0.01em]">
              {!unlocked && <Lock size={12} />}
              {d.name}
            </span>
            <span className="text-[11px] text-slate-400 tabular-nums">
              {unlocked ? `Top speed ${Math.round(d.maxSpeed / 10)}` : `Best ${d.unlockAt} to unlock`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
