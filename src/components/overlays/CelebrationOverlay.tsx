import { Confetti } from './Confetti'
import { renderAchievementIcon } from '@/lib/icons'
import type { Celebration } from '@/hooks/useCelebration'

interface Props {
  celebration: Celebration
}

export function CelebrationOverlay({ celebration }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] pointer-events-none flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {celebration.type === 'achievement' && <Confetti />}
      <div className="w-full max-w-sm animate-float-up bg-white/95 backdrop-blur-xl px-5 py-4 sm:px-6 sm:py-5 rounded-t-3xl rounded-b-2xl shadow-2xl shadow-amber-500/15 border border-white/80 flex flex-col items-center gap-3 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-inner border border-white ${
          celebration.type === 'achievement'
            ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600'
            : 'bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600'
        }`}>
          {renderAchievementIcon(celebration.icon, 'w-8 h-8 drop-shadow-sm')}
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-800 tracking-tight whitespace-pre-line leading-tight">
          {celebration.message}
        </h2>
      </div>
    </div>
  )
}
