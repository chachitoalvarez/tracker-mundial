import { ArrowDownLeft, ArrowUpRight, Medal, User, UsersRound } from 'lucide-react'
import { getProgressColor } from '@/lib/stats'
import type { LeaderboardEntry } from '@/types/user'

interface Props {
  leaderboard: LeaderboardEntry[]
  isLoading: boolean
  emptyMessage?: string
  onClickUser: (user: LeaderboardEntry) => void
  onClickMe: () => void
}

function getTradeSummaryLabel(user: LeaderboardEntry): string {
  const summary = user.tradeSummary
  if (user.isMe) return 'Tu perfil'
  if (!summary) return 'Calculando cruce...'
  if (summary.status === 'not_accessible') return 'Perfil privado'
  if (summary.status === 'error') return 'Cruce no disponible'
  if (summary.theyOfferCount > 0 && summary.iOfferCount > 0) return 'Buen cruce'
  if (summary.theyOfferCount > 0) return 'Te aporta figuritas'
  if (summary.iOfferCount > 0) return 'Podés ayudarle'
  return 'Sin cruce por ahora'
}

export function LeaderboardList({ leaderboard, isLoading, emptyMessage, onClickUser, onClickMe }: Props) {
  if (isLoading) {
    return (
      <div className="bg-white border border-zinc-200/60 rounded-3xl overflow-hidden mt-4 lg:mt-4 shadow-sm">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 sm:p-6 flex items-center gap-6 border-b border-zinc-100 last:border-0 animate-pulse">
            <div className="w-10 h-10 bg-zinc-100 rounded-full flex-shrink-0" />
            <div className="w-14 h-14 bg-zinc-100 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-100 rounded-full w-1/3" />
              <div className="h-3 bg-zinc-100 rounded-full w-1/4" />
            </div>
            <div className="w-56 hidden sm:block space-y-2">
              <div className="h-3 bg-zinc-100 rounded-full w-full" />
              <div className="h-3 bg-zinc-100 rounded-full w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <div className="bg-white border border-zinc-200/60 rounded-3xl mt-4 lg:mt-4 shadow-sm px-6 py-8 flex items-start gap-3 text-sm text-zinc-500">
        <UsersRound className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
        {emptyMessage ?? 'No hay datos disponibles.'}
      </div>
    )
  }

  const hasOthers = leaderboard.some(u => !u.isMe)

  return (
    <div className="bg-white border border-zinc-200/60 rounded-3xl overflow-hidden mt-4 lg:mt-4 shadow-sm">
      {!hasOthers && (
        <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3 text-sm text-zinc-500">
          <UsersRound className="w-4 h-4 text-zinc-400 flex-shrink-0" strokeWidth={2.5} />
          Invita amigos para comparar su progreso. El ranking se actualizará cuando otros usuarios se unan.
        </div>
      )}
      <div className="grid grid-cols-1 divide-y divide-zinc-100">
        {leaderboard.map((user, index) => {
          const percentage = Math.round((user.completed / user.needed) * 100)
          const isMe = !!user.isMe

          return (
            <div
              key={user.id}
              onClick={() => isMe ? onClickMe() : onClickUser(user)}
              className={`p-4 lg:p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-all group cursor-pointer ${isMe ? 'bg-amber-50/30 relative z-10' : 'hover:bg-zinc-50/80'}`}
            >
              <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                {index === 0 ? <Medal className="w-10 h-10 text-yellow-500 drop-shadow-md scale-110" strokeWidth={2.5} /> :
                 index === 1 ? <Medal className="w-8 h-8 text-zinc-400 drop-shadow-sm" strokeWidth={2.5} /> :
                 index === 2 ? <Medal className="w-8 h-8 text-amber-700 drop-shadow-sm" strokeWidth={2.5} /> :
                 <span className="font-black text-zinc-300 text-xl group-hover:text-zinc-400 transition-colors">#{index + 1}</span>}
              </div>

              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-14 h-14 lg:w-12 lg:h-12 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-sm ${isMe ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-white' : 'bg-zinc-100 border-white'}`}>
                  <User className={`w-6 h-6 lg:w-5 lg:h-5 ${isMe ? 'text-amber-600' : 'text-zinc-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`font-black truncate tracking-tight flex items-center gap-2 ${isMe ? 'text-amber-900 text-xl lg:text-lg' : 'text-zinc-800 text-lg lg:text-[17px]'}`}>
                    {user.name}
                    {isMe && <span className="text-[10px] uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">Tú</span>}
                  </p>
                  {!isMe && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                        user.tradeSummary?.status === 'ok' && (user.tradeSummary.theyOfferCount > 0 || user.tradeSummary.iOfferCount > 0)
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                      }`}>
                        {getTradeSummaryLabel(user)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded-full">
                        <ArrowDownLeft className="w-3 h-3" strokeWidth={3} />
                        Recibís {user.tradeSummary?.status === 'ok' ? user.tradeSummary.theyOfferCount : '-'}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-full">
                        <ArrowUpRight className="w-3 h-3" strokeWidth={3} />
                        Entregás {user.tradeSummary?.status === 'ok' ? user.tradeSummary.iOfferCount : '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full sm:w-56 lg:w-64 flex flex-col gap-2 flex-shrink-0 mt-3 sm:mt-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-none border-zinc-100 shadow-sm sm:shadow-none">
                <div className="flex justify-between items-center text-xs uppercase tracking-wider font-bold">
                  <span className="text-zinc-400">Progreso</span>
                  <span className={isMe ? 'text-amber-600' : 'text-zinc-900'}>{percentage}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden shadow-inner">
                  <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(percentage)}`} style={{ width: `${percentage}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
