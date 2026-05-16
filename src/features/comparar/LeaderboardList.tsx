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
  if (user.isMe) return 'Tu posición'
  if (!summary) return 'Calculando cruce...'
  if (summary.status === 'not_accessible') return 'Perfil privado'
  if (summary.status === 'error') return 'Cruce no disponible'
  if (summary.theyOfferCount > 0 && summary.iOfferCount > 0) return 'Buen cruce'
  if (summary.theyOfferCount > 0) return 'Te faltan figus'
  if (summary.iOfferCount > 0) return 'Podés ayudarle'
  return 'Sin cruce por ahora'
}

function RankingMark({ index, compact = false }: { index: number; compact?: boolean }) {
  if (index === 0) return <Medal className={`${compact ? 'h-6 w-6' : 'h-10 w-10 scale-110'} text-yellow-500`} strokeWidth={2.5} />
  if (index === 1) return <Medal className={`${compact ? 'h-5.5 w-5.5' : 'h-8 w-8'} text-zinc-400`} strokeWidth={2.5} />
  if (index === 2) return <Medal className={`${compact ? 'h-5.5 w-5.5' : 'h-8 w-8'} text-amber-700`} strokeWidth={2.5} />
  return <span className={`${compact ? 'text-sm' : 'text-xl'} font-black text-zinc-300`}>#{index + 1}</span>
}

function MobileRankingItem({ user, index, onClickUser, onClickMe }: {
  user: LeaderboardEntry
  index: number
  onClickUser: (user: LeaderboardEntry) => void
  onClickMe: () => void
}) {
  const percentage = user.needed > 0 ? Math.round((user.completed / user.needed) * 100) : 0
  const isMe = !!user.isMe
  const tradeSummary = user.tradeSummary
  const showTrade = !isMe && tradeSummary?.status === 'ok' && (
    tradeSummary.theyOfferCount > 0 || tradeSummary.iOfferCount > 0
  )

  return (
    <button
      type="button"
      onClick={() => isMe ? onClickMe() : onClickUser(user)}
      className={`w-full rounded-2xl border px-3 py-2.5 text-left shadow-sm transition-all active:scale-[0.99] ${
        isMe ? 'border-amber-200 bg-amber-50/40' : 'border-zinc-200/70 bg-white hover:bg-zinc-50'
      }`}
    >
      <div className="grid grid-cols-[32px_36px_minmax(0,1fr)_40px] items-start gap-x-2.5">
        <div className="flex h-9 w-8 items-center justify-center">
          <RankingMark index={index} compact />
        </div>

        <div className={`flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-sm ${
          isMe ? 'border-white bg-gradient-to-br from-amber-100 to-amber-50' : 'border-white bg-zinc-100'
        }`}>
          <User className={`h-4.5 w-4.5 ${isMe ? 'text-amber-600' : 'text-zinc-400'}`} />
        </div>

        <div className="min-w-0">
          <p className={`truncate text-[15px] font-black leading-5 ${isMe ? 'text-amber-900' : 'text-zinc-800'}`}>
            {user.name}
          </p>
          {isMe ? (
            <p className="mt-0.5 text-xs font-semibold text-amber-700">{getTradeSummaryLabel(user)}</p>
          ) : showTrade ? (
            <div className="mt-0.5 space-y-0.5">
              <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black leading-4 text-emerald-700">
                {getTradeSummaryLabel(user)}
              </span>
              <p className="truncate text-[11px] font-semibold leading-4 text-zinc-500">
                Recibís {tradeSummary.theyOfferCount} · Entregás {tradeSummary.iOfferCount}
              </p>
            </div>
          ) : (
            <p className="mt-0.5 truncate text-xs font-semibold text-zinc-500">{getTradeSummaryLabel(user)}</p>
          )}
        </div>

        <div className="w-10 text-right">
          <div className={`text-sm font-black leading-5 ${isMe ? 'text-amber-600' : 'text-zinc-900'}`}>{percentage}%</div>
          <div className="mt-1.5 ml-auto h-1.5 w-10 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(percentage)}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </button>
  )
}

export function LeaderboardList({ leaderboard, isLoading, emptyMessage, onClickUser, onClickMe }: Props) {
  if (isLoading) {
    return (
      <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200/60 bg-white shadow-sm lg:mt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex animate-pulse items-center gap-6 border-b border-zinc-100 p-4 last:border-0 sm:p-6">
            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-100" />
            <div className="h-14 w-14 flex-shrink-0 rounded-full bg-zinc-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded-full bg-zinc-100" />
              <div className="h-3 w-1/4 rounded-full bg-zinc-100" />
            </div>
            <div className="hidden w-56 space-y-2 sm:block">
              <div className="h-3 w-full rounded-full bg-zinc-100" />
              <div className="h-3 w-2/3 rounded-full bg-zinc-100" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (leaderboard.length === 0) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-3xl border border-zinc-200/60 bg-white px-6 py-8 text-sm text-zinc-500 shadow-sm lg:mt-4">
        <UsersRound className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-400" strokeWidth={2.5} />
        {emptyMessage ?? 'No hay datos disponibles.'}
      </div>
    )
  }

  const hasOthers = leaderboard.some(u => !u.isMe)

  return (
    <div className="mt-4 overflow-hidden rounded-3xl border border-zinc-200/60 bg-white shadow-sm lg:mt-4">
      {!hasOthers && (
        <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/50 px-6 py-4 text-sm text-zinc-500">
          <UsersRound className="h-4 w-4 flex-shrink-0 text-zinc-400" strokeWidth={2.5} />
          Invita amigos para comparar su progreso. El ranking se actualizará cuando otros usuarios se unan.
        </div>
      )}

      <div className="divide-y divide-zinc-100">
        <div className="space-y-2 p-2 lg:hidden">
          {leaderboard.map((user, index) => (
            <MobileRankingItem
              key={user.id}
              user={user}
              index={index}
              onClickUser={onClickUser}
              onClickMe={onClickMe}
            />
          ))}
        </div>

        <div className="hidden grid-cols-1 divide-y divide-zinc-100 lg:grid">
          {leaderboard.map((user, index) => {
            const percentage = user.needed > 0 ? Math.round((user.completed / user.needed) * 100) : 0
            const isMe = !!user.isMe

            return (
              <div
                key={user.id}
                onClick={() => isMe ? onClickMe() : onClickUser(user)}
                className={`group flex cursor-pointer flex-col items-start gap-4 p-4 transition-all sm:flex-row sm:items-center sm:gap-6 sm:p-6 lg:p-4 ${isMe ? 'relative z-10 bg-amber-50/30' : 'hover:bg-zinc-50/80'}`}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                  <RankingMark index={index} />
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border-2 shadow-sm lg:h-12 lg:w-12 ${
                    isMe ? 'border-white bg-gradient-to-br from-amber-100 to-amber-50' : 'border-white bg-zinc-100'
                  }`}>
                    <User className={`h-6 w-6 lg:h-5 lg:w-5 ${isMe ? 'text-amber-600' : 'text-zinc-400'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`flex items-center gap-2 truncate font-black tracking-tight ${isMe ? 'text-xl text-amber-900 lg:text-lg' : 'text-lg text-zinc-800 lg:text-[17px]'}`}>
                      {user.name}
                      {isMe && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">Tú</span>}
                    </p>
                    {!isMe && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${
                          user.tradeSummary?.status === 'ok' && (user.tradeSummary.theyOfferCount > 0 || user.tradeSummary.iOfferCount > 0)
                            ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-500'
                        }`}>
                          {getTradeSummaryLabel(user)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                          <ArrowDownLeft className="h-3 w-3" strokeWidth={3} />
                          Recibís {user.tradeSummary?.status === 'ok' ? user.tradeSummary.theyOfferCount : '-'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700">
                          <ArrowUpRight className="h-3 w-3" strokeWidth={3} />
                          Entregás {user.tradeSummary?.status === 'ok' ? user.tradeSummary.iOfferCount : '-'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex w-full flex-shrink-0 flex-col gap-2 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm sm:mt-0 sm:w-56 sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none lg:w-64">
                  <div className="flex items-center justify-end text-sm font-black">
                    <span className={isMe ? 'text-amber-600' : 'text-zinc-900'}>{percentage}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 shadow-inner">
                    <div className={`h-full rounded-full transition-all duration-1000 ease-out ${getProgressColor(percentage)}`} style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
