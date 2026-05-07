import { Medal, User, UsersRound } from 'lucide-react'
import { getProgressColor } from '@/lib/stats'
import type { LeaderboardEntry } from '@/types/user'

interface Props {
  leaderboard: LeaderboardEntry[]
  onClickUser: (user: LeaderboardEntry) => void
  onClickMe: () => void
}

export function LeaderboardList({ leaderboard, onClickUser, onClickMe }: Props) {
  const hasOthers = leaderboard.some(u => !u.isMe)

  return (
    <div className="bg-white border border-zinc-200/60 rounded-3xl overflow-hidden mt-6 shadow-sm">
      {!hasOthers && (
        <div className="px-6 py-5 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3 text-sm text-zinc-500">
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
              className={`p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 transition-all group cursor-pointer ${isMe ? 'bg-amber-50/30 relative z-10' : 'hover:bg-zinc-50/80'}`}
            >
              <div className="flex items-center justify-center w-10 h-10 flex-shrink-0">
                {index === 0 ? <Medal className="w-10 h-10 text-yellow-500 drop-shadow-md scale-110" strokeWidth={2.5} /> :
                 index === 1 ? <Medal className="w-8 h-8 text-zinc-400 drop-shadow-sm" strokeWidth={2.5} /> :
                 index === 2 ? <Medal className="w-8 h-8 text-amber-700 drop-shadow-sm" strokeWidth={2.5} /> :
                 <span className="font-black text-zinc-300 text-xl group-hover:text-zinc-400 transition-colors">#{index + 1}</span>}
              </div>

              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-sm ${isMe ? 'bg-gradient-to-br from-amber-100 to-amber-50 border-white' : 'bg-zinc-100 border-white'}`}>
                  <User className={`w-6 h-6 ${isMe ? 'text-amber-600' : 'text-zinc-400'}`} />
                </div>
                <div className="min-w-0">
                  <p className={`font-black truncate tracking-tight flex items-center gap-2 ${isMe ? 'text-amber-900 text-xl' : 'text-zinc-800 text-lg'}`}>
                    {user.name}
                    {isMe && <span className="text-[10px] uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold shadow-sm">Tú</span>}
                  </p>
                  <div className="flex items-center gap-3 text-xs sm:text-sm mt-1">
                    <span className="font-medium text-zinc-500"><strong className="text-zinc-900 font-black">{user.completed}</strong> pegadas</span>
                    <span className="text-zinc-300">•</span>
                    <span className="font-medium text-zinc-500"><strong className="text-amber-600 font-black">{user.repeated}</strong> repetidas</span>
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-56 lg:w-72 flex flex-col gap-2 flex-shrink-0 mt-3 sm:mt-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-none border-zinc-100 shadow-sm sm:shadow-none">
                <div className="flex justify-between items-center text-xs uppercase tracking-wider font-bold">
                  <span className="text-zinc-400">Progreso</span>
                  <span className={isMe ? 'text-amber-600' : 'text-zinc-900'}>{percentage}%</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden shadow-inner">
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
