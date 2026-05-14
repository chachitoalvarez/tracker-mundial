import { CheckCircle2 } from 'lucide-react'
import { renderAchievementIcon } from '@/lib/icons'
import type { Achievement } from '@/types/achievement'

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border p-6 lg:p-4 transition-all duration-300 ${
      achievement.unlocked
        ? 'bg-white border-zinc-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transform hover:-translate-y-1 hover:shadow-xl'
        : 'bg-zinc-50/50 border-zinc-200/50 opacity-70 grayscale'
    }`}>
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-20 blur-3xl ${achievement.unlocked ? achievement.bg : 'bg-zinc-400'}`} />

      <div className="flex flex-col h-full relative z-10">
        <div className="flex justify-between items-start mb-5 lg:mb-3.5">
          <div className={`w-14 h-14 lg:w-12 lg:h-12 rounded-2xl flex items-center justify-center shadow-sm border ${
            achievement.unlocked ? `${achievement.bg} border-white/50` : 'bg-zinc-200 border-transparent text-zinc-400'
          }`}>
            {renderAchievementIcon(achievement.icon, `w-7 h-7 lg:w-6 lg:h-6 ${achievement.unlocked ? achievement.color : 'text-zinc-500'}`)}
          </div>
          {achievement.unlocked && (
            <div className="bg-emerald-100/80 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" strokeWidth={3} /> Logrado
            </div>
          )}
        </div>

        <h3 className={`text-xl lg:text-lg font-black tracking-tight ${achievement.unlocked ? 'text-zinc-900' : 'text-zinc-500'}`}>
          {achievement.title}
        </h3>
        <p className={`text-sm lg:text-xs mt-1.5 flex-1 font-medium ${achievement.unlocked ? 'text-zinc-500' : 'text-zinc-400'}`}>
          {achievement.description}
        </p>

        <div className="mt-8 lg:mt-5 pt-5 lg:pt-3.5 border-t border-zinc-100">
          <div className="flex justify-between items-end mb-2.5 text-xs font-bold uppercase tracking-wider">
            <span className="text-zinc-400">Progreso</span>
            <span className={achievement.unlocked ? 'text-zinc-800' : 'text-zinc-400'}>
              {achievement.progress} / {achievement.total}
            </span>
          </div>
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${achievement.unlocked ? 'bg-amber-500' : 'bg-zinc-300'}`}
              style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
