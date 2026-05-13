import { useEffect, useState, useCallback } from 'react'
import { X, User, RefreshCcw, Trophy, Lock, AlertCircle, MessageCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { getTradeMatch } from '@/services/trades.service'
import { TradeStickerGroup } from '@/features/intercambios/TradeStickerGroup'
import { TradeBalanceBar } from '@/features/intercambios/TradeBalanceBar'
import { describeStickerCode, getStickerByCanonicalCode } from '@/lib/album'
import type { LeaderboardEntry } from '@/types/user'
import type { TradeMatch } from '@/types/trade'

interface Props {
  user: LeaderboardEntry
  onClose: () => void
  onStartChat: (otherUserId: string, otherUsername: string, prefill?: string) => void
}

type MatchState =
  | { status: 'loading' }
  | { status: 'not_accessible' }
  | { status: 'error'; message: string }
  | { status: 'ok'; match: TradeMatch }

function buildPrefill(match: TradeMatch, theirUsername: string): string {
  const lines = [`Hola @${theirUsername}! Vi que tenemos cruce de figuritas.`]
  if (match.theyOfferCount > 0) {
    const sample = Object.keys(match.theyOffer).slice(0, 5).map(describeStickerCode)
    lines.push(`Me interesan: ${sample.join(', ')}${match.theyOfferCount > 5 ? '...' : ''}`)
  }
  if (match.iOfferCount > 0) {
    const sample = Object.keys(match.iOffer).slice(0, 5).map(describeStickerCode)
    lines.push(`Te entrego: ${sample.join(', ')}${match.iOfferCount > 5 ? '...' : ''}`)
  }
  lines.push('Lo coordinamos?')
  return lines.join('\n')
}

function groupBySubsection(stickers: Record<string, number>): Record<string, Record<string, number>> {
  return Object.entries(stickers).reduce<Record<string, Record<string, number>>>((acc, [code, count]) => {
    const sticker = getStickerByCanonicalCode(code)
    const section = sticker?.subseccion ?? 'Otras figuritas'
    acc[section] = { ...(acc[section] ?? {}), [code]: count }
    return acc
  }, {})
}

export function PublicProfileDrawer({ user, onClose, onStartChat }: Props) {
  const completed = user.completed ?? 0
  const needed = user.needed ?? 0
  const repeated = user.repeated ?? 0
  const percentage = needed > 0 ? Math.round((completed / needed) * 100) : 0
  const [matchState, setMatchState] = useState<MatchState>({ status: 'loading' })

  const loadMatch = useCallback(() => {
    setMatchState({ status: 'loading' })
    getTradeMatch(String(user.id)).then(result => {
      if (!result.ok) {
        setMatchState(
          result.reason === 'not_accessible'
            ? { status: 'not_accessible' }
            : { status: 'error', message: result.message }
        )
      } else {
        setMatchState({ status: 'ok', match: result.match })
      }
    })
  }, [user.id])

  useEffect(() => { loadMatch() }, [loadMatch])

  const noMatch = matchState.status === 'ok' &&
    matchState.match.theyOfferCount === 0 && matchState.match.iOfferCount === 0

  const groupedTheyOffer = matchState.status === 'ok' ? groupBySubsection(matchState.match.theyOffer) : {}
  const groupedIOffer = matchState.status === 'ok' ? groupBySubsection(matchState.match.iOffer) : {}

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full md:w-[400px] bg-zinc-50 h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right-8 duration-300 rounded-l-[2rem] md:rounded-l-none overflow-hidden">
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="w-10 h-10 rounded-full bg-zinc-100 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-zinc-400" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="text-base font-black text-zinc-900 tracking-tight truncate">@{user.name || 'usuario'}</p>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Coleccionista</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-90 flex-shrink-0">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-shrink-0 bg-zinc-100/60 p-4 border-b border-zinc-200/60">
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: `${percentage}%`, label: 'Avance', color: 'text-amber-600' },
              { value: completed, label: 'Pegadas', color: 'text-emerald-600' },
              { value: needed - completed, label: 'Faltan', color: 'text-blue-600' },
              { value: repeated, label: 'Repes', color: 'text-purple-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-2.5 border border-zinc-200/60 text-center shadow-sm flex flex-col items-center justify-center">
                <p className={`text-xl font-black ${stat.color} tracking-tight`}>{stat.value}</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide bg-white">
          {matchState.status === 'loading' && (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-zinc-100 rounded-xl animate-pulse" />)}
            </div>
          )}

          {matchState.status === 'not_accessible' && (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full gap-3">
              <Lock className="w-8 h-8 text-zinc-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-500 max-w-[260px]">Este coleccionista mantiene su perfil privado. Solo es visible si compartis un grupo con el.</p>
            </div>
          )}

          {matchState.status === 'error' && (
            <div className="p-5">
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700">No pudimos cargar las figuritas para intercambiar.</p>
                  <button onClick={loadMatch} className="text-xs font-bold text-red-600 underline mt-1 hover:text-red-800 transition-colors">Intenta de nuevo</button>
                </div>
              </div>
            </div>
          )}

          {matchState.status === 'ok' && noMatch && (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <Trophy className="w-10 h-10 mb-3 text-zinc-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-500">No hay cruce de figuritas con este coleccionista por ahora.</p>
            </div>
          )}

          {matchState.status === 'ok' && !noMatch && (
            <div className="p-4 space-y-4">
              <TradeBalanceBar theyCount={matchState.match.theyOfferCount} iCount={matchState.match.iOfferCount} />

              {matchState.match.theyOfferCount > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-amber-600" strokeWidth={2.5} />
                      <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider">Recibís</h3>
                    </div>
                    <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      {matchState.match.theyOfferCount} {matchState.match.theyOfferCount === 1 ? 'figurita' : 'figuritas'}
                    </span>
                  </div>
                  <div className="space-y-1.5 bg-amber-50/40 border border-amber-100 rounded-2xl p-1.5">
                    {Object.entries(groupedTheyOffer).sort(([a], [b]) => a.localeCompare(b)).map(([section, stickers]) => (
                      <TradeStickerGroup key={section} sectionName={section} stickers={stickers} variant="theyOffer" />
                    ))}
                  </div>
                </section>
              )}

              {matchState.match.iOfferCount > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-blue-600" strokeWidth={2.5} />
                      <h3 className="text-xs font-black text-blue-900 uppercase tracking-wider">Entregás</h3>
                    </div>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      {matchState.match.iOfferCount} {matchState.match.iOfferCount === 1 ? 'figurita' : 'figuritas'}
                    </span>
                  </div>
                  <div className="space-y-1.5 bg-blue-50/40 border border-blue-100 rounded-2xl p-1.5">
                    {Object.entries(groupedIOffer).sort(([a], [b]) => a.localeCompare(b)).map(([section, stickers]) => (
                      <TradeStickerGroup key={section} sectionName={section} stickers={stickers} variant="iOffer" />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 bg-white border-t border-zinc-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const username = user.name || 'usuario'
                onStartChat(String(user.id), username)
                onClose()
              }}
              className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 hover:border-zinc-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" strokeWidth={2.5} />
              <span>Chatear</span>
            </button>

            <button
              onClick={() => {
                const username = user.name || 'usuario'
                let prefill = `Hola @${username}!`
                if (matchState.status === 'ok' && (matchState.match.theyOfferCount > 0 || matchState.match.iOfferCount > 0)) {
                  prefill = buildPrefill(matchState.match, username)
                }
                onStartChat(String(user.id), username, prefill)
                onClose()
              }}
              disabled={matchState.status === 'ok' && matchState.match.theyOfferCount === 0 && matchState.match.iOfferCount === 0}
              className="flex-[2] bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400 disabled:hover:transform-none disabled:hover:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-5 h-5" strokeWidth={2.5} />
              <span>Proponer Intercambio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
