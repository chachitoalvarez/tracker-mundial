import { useEffect, useState, useCallback } from 'react'
import { X, RefreshCcw, Trophy, Lock, AlertCircle, MessageCircle, ArrowUpRight, ArrowDownLeft, Check, ArrowLeft, Trash2 } from 'lucide-react'
import { getTradeMatch } from '@/services/trades.service'
import { TradeStickerGroup } from '@/features/intercambios/TradeStickerGroup'
import { TradeBalanceBar } from '@/features/intercambios/TradeBalanceBar'
import { describeStickerCode, formatStickerDisplayId, getStickerByCanonicalCode } from '@/lib/album'
import type { LeaderboardEntry } from '@/types/user'
import type { TradeMatch, TradeProposalSticker } from '@/types/trade'
import { UserAvatar } from '@/components/ui/UserAvatar'
import type { AlbumSection, Sticker } from '@/types/album'

interface Props {
  user: LeaderboardEntry
  albumData: AlbumSection[]
  onClose: () => void
  onStartChat: (otherUserId: string, otherUsername: string, prefill?: string) => void
  onCreateTradeProposal: (targetUserId: string, creatorWillReceive: TradeProposalSticker[], creatorWillGive: TradeProposalSticker[]) => Promise<{ error: string | null }>
  onViewSummary: () => void
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

interface TradeRegistrationItem {
  code: string
  sticker: Sticker
}

function toRegistrationItems(stickers: Record<string, number>): TradeRegistrationItem[] {
  return Object.keys(stickers)
    .map(code => {
      const sticker = getStickerByCanonicalCode(code)
      return sticker ? { code, sticker } : null
    })
    .filter((item): item is TradeRegistrationItem => item !== null)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }))
}

function getCurrentCount(albumData: AlbumSection[], sticker: Sticker): number {
  const section = albumData.find(item => item.section === sticker.subseccion)
  return section?.collected[sticker.codigoFigura] ?? 0
}

function TradeSelectableRow({
  item,
  selected,
  onToggle,
}: {
  item: TradeRegistrationItem
  selected: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 ${
        selected ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-zinc-200 bg-white hover:bg-zinc-50'
      }`}
    >
      <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 ${
        selected ? 'border-amber-500 bg-amber-500 text-white' : 'border-zinc-300 bg-white'
      }`}>
        {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <span className="flex h-9 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-xs font-black text-zinc-800 shadow-sm">
        {formatStickerDisplayId(item.code)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-zinc-900">{item.sticker.nombreFigura || formatStickerDisplayId(item.code)}</span>
        <span className="block truncate text-xs font-semibold text-zinc-500">{item.sticker.paisEquipo || item.sticker.subseccion}</span>
      </span>
    </button>
  )
}

function TradeReviewRow({ item, onRemove }: { item: TradeRegistrationItem; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3">
      <span className="flex h-9 w-14 flex-shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-black text-zinc-800">
        {formatStickerDisplayId(item.code)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-black text-zinc-900">{item.sticker.nombreFigura || formatStickerDisplayId(item.code)}</span>
        <span className="block truncate text-xs font-semibold text-zinc-500">{item.sticker.paisEquipo || item.sticker.subseccion}</span>
      </span>
      <button type="button" onClick={onRemove} className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-600">
        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  )
}

function toProposalSticker(item: TradeRegistrationItem): TradeProposalSticker {
  return {
    normalizedCode: item.sticker.codigoFigura,
    visualCode: formatStickerDisplayId(item.code),
    name: item.sticker.nombreFigura || formatStickerDisplayId(item.code),
    section: item.sticker.paisEquipo || item.sticker.subseccion,
    quantity: 1,
  }
}

export function PublicProfileDrawer({ user, albumData, onClose, onStartChat, onCreateTradeProposal, onViewSummary }: Props) {
  const completed = user.completed ?? 0
  const needed = user.needed ?? 0
  const repeated = user.repeated ?? 0
  const percentage = needed > 0 ? Math.round((completed / needed) * 100) : 0
  const [matchState, setMatchState] = useState<MatchState>({ status: 'loading' })
  const [tradeStep, setTradeStep] = useState<'profile' | 'select' | 'review' | 'success'>('profile')
  const [mobileTradeTab, setMobileTradeTab] = useState<'receive' | 'deliver'>('receive')
  const [selectedReceive, setSelectedReceive] = useState<Set<string>>(() => new Set())
  const [selectedDeliver, setSelectedDeliver] = useState<Set<string>>(() => new Set())
  const [tradeError, setTradeError] = useState<string | null>(null)

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

  useEffect(() => {
    setTradeStep('profile')
    setSelectedReceive(new Set())
    setSelectedDeliver(new Set())
    setTradeError(null)
    setMobileTradeTab('receive')
  }, [user.id])

  const noMatch = matchState.status === 'ok' &&
    matchState.match.theyOfferCount === 0 && matchState.match.iOfferCount === 0

  const groupedTheyOffer = matchState.status === 'ok' ? groupBySubsection(matchState.match.theyOffer) : {}
  const groupedIOffer = matchState.status === 'ok' ? groupBySubsection(matchState.match.iOffer) : {}
  const receiveItems = matchState.status === 'ok' ? toRegistrationItems(matchState.match.theyOffer) : []
  const deliverItems = matchState.status === 'ok' ? toRegistrationItems(matchState.match.iOffer) : []
  const selectedReceiveItems = receiveItems.filter(item => selectedReceive.has(item.code))
  const selectedDeliverItems = deliverItems.filter(item => selectedDeliver.has(item.code))
  const selectedTotal = selectedReceive.size + selectedDeliver.size
  const countsMismatch = selectedReceive.size !== selectedDeliver.size
  const canRegisterTrade = matchState.status === 'ok' && (matchState.match.theyOfferCount > 0 || matchState.match.iOfferCount > 0)

  const toggleSelection = (kind: 'receive' | 'deliver', code: string) => {
    const setter = kind === 'receive' ? setSelectedReceive : setSelectedDeliver
    setter(current => {
      const next = new Set(current)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
    setTradeError(null)
  }

  const removeSelection = (kind: 'receive' | 'deliver', code: string) => {
    const setter = kind === 'receive' ? setSelectedReceive : setSelectedDeliver
    setter(current => {
      const next = new Set(current)
      next.delete(code)
      return next
    })
    setTradeError(null)
  }

  const startTradeRegistration = () => {
    setSelectedReceive(new Set())
    setSelectedDeliver(new Set())
    setTradeError(null)
    setMobileTradeTab('receive')
    setTradeStep('select')
  }

  const confirmTrade = async () => {
    for (const item of selectedDeliverItems) {
      if (getCurrentCount(albumData, item.sticker) <= 1) {
        setTradeError('Ya no tenés repetidas de esta figurita. Quitala del canje para continuar.')
        return
      }
    }

    const { error } = await onCreateTradeProposal(
      String(user.id),
      selectedReceiveItems.map(toProposalSticker),
      selectedDeliverItems.map(toProposalSticker),
    )
    if (error) {
      console.error('[trade proposal] create failed:', error)
      setTradeError(
        error.includes('create_trade_proposal')
          ? 'Falta configurar las propuestas de canje en la base. Aplicá la migración y probá de nuevo.'
          : 'No pudimos enviar la propuesta. Probá de nuevo.'
      )
      return
    }
    setTradeError(null)
    setTradeStep('success')
  }

  const renderEmptyState = (title: string, description: string) => (
    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-center">
      <p className="text-sm font-black text-zinc-700">{title}</p>
      <p className="mt-1 text-xs font-medium text-zinc-500">{description}</p>
    </div>
  )

  const renderSelectionList = (kind: 'receive' | 'deliver', items: TradeRegistrationItem[]) => {
    const selected = kind === 'receive' ? selectedReceive : selectedDeliver
    const empty = kind === 'receive'
      ? renderEmptyState('No hay figuritas para recibir', 'Esta persona no tiene repetidas que te falten.')
      : renderEmptyState('No tenés figuritas para entregar', 'No tenés repetidas que le sirvan a esta persona.')

    if (!items.length) return empty

    return (
      <div className="space-y-2">
        {items.map(item => (
          <TradeSelectableRow
            key={item.code}
            item={item}
            selected={selected.has(item.code)}
            onToggle={() => toggleSelection(kind, item.code)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className={`w-full ${tradeStep === 'profile' ? 'md:w-[400px]' : 'md:w-[760px]'} bg-zinc-50 h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right-8 duration-300 rounded-l-[2rem] md:rounded-l-none overflow-hidden`}>
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="rounded-full border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
            <UserAvatar avatarKey={user.avatarKey} className="w-10 h-10" />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <p className="text-base font-black text-zinc-900 tracking-tight truncate">@{user.name || 'usuario'}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-90 flex-shrink-0">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {tradeStep === 'profile' && (
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
        )}

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide bg-white">
          {tradeStep === 'profile' && matchState.status === 'loading' && (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-zinc-100 rounded-xl animate-pulse" />)}
            </div>
          )}

          {tradeStep === 'profile' && matchState.status === 'not_accessible' && (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full gap-3">
              <Lock className="w-8 h-8 text-zinc-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-500 max-w-[260px]">Este coleccionista mantiene su perfil privado. Solo es visible si compartis un grupo con el.</p>
            </div>
          )}

          {tradeStep === 'profile' && matchState.status === 'error' && (
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

          {tradeStep === 'profile' && matchState.status === 'ok' && noMatch && (
            <div className="flex flex-col items-center justify-center text-center p-8 h-full">
              <Trophy className="w-10 h-10 mb-3 text-zinc-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-500">No hay cruce de figuritas con este coleccionista por ahora.</p>
            </div>
          )}

          {tradeStep === 'profile' && matchState.status === 'ok' && !noMatch && (
            <div className="p-4 space-y-4">
              <TradeBalanceBar theyCount={matchState.match.theyOfferCount} iCount={matchState.match.iOfferCount} />
              <button
                type="button"
                onClick={startTradeRegistration}
                disabled={!canRegisterTrade}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98] disabled:bg-zinc-200 disabled:text-zinc-400"
              >
                <RefreshCcw className="h-5 w-5" strokeWidth={2.5} />
                Proponer canje
              </button>

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

          {tradeStep === 'select' && (
            <div className="p-4 md:p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900">Proponer canje</h2>
                <p className="mt-1 text-sm font-medium text-zinc-500">Seleccioná qué figuritas vas a recibir y cuáles vas a entregar.</p>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-100 p-1 md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileTradeTab('receive')}
                  className={`rounded-xl px-3 py-2 text-sm font-black ${mobileTradeTab === 'receive' ? 'bg-white text-amber-700 shadow-sm' : 'text-zinc-500'}`}
                >
                  Recibís
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTradeTab('deliver')}
                  className={`rounded-xl px-3 py-2 text-sm font-black ${mobileTradeTab === 'deliver' ? 'bg-white text-blue-700 shadow-sm' : 'text-zinc-500'}`}
                >
                  Entregás
                </button>
              </div>

              <div className="hidden md:grid md:grid-cols-2 md:gap-4">
                <section className="min-h-0 space-y-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">Recibís</h3>
                    <p className="mt-0.5 text-xs font-medium text-zinc-500">Figuritas que esta persona tiene y a vos te faltan.</p>
                  </div>
                  <div className="max-h-[58vh] overflow-y-auto pr-1 scrollbar-hide">{renderSelectionList('receive', receiveItems)}</div>
                </section>
                <section className="min-h-0 space-y-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">Entregás</h3>
                    <p className="mt-0.5 text-xs font-medium text-zinc-500">Tus repetidas que le sirven a esta persona.</p>
                  </div>
                  <div className="max-h-[58vh] overflow-y-auto pr-1 scrollbar-hide">{renderSelectionList('deliver', deliverItems)}</div>
                </section>
              </div>

              <div className="md:hidden">
                {mobileTradeTab === 'receive' ? (
                  <section className="space-y-3">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">Recibís</h3>
                      <p className="mt-0.5 text-xs font-medium text-zinc-500">Figuritas que esta persona tiene y a vos te faltan.</p>
                    </div>
                    {renderSelectionList('receive', receiveItems)}
                  </section>
                ) : (
                  <section className="space-y-3">
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">Entregás</h3>
                      <p className="mt-0.5 text-xs font-medium text-zinc-500">Tus repetidas que le sirven a esta persona.</p>
                    </div>
                    {renderSelectionList('deliver', deliverItems)}
                  </section>
                )}
              </div>
            </div>
          )}

          {tradeStep === 'review' && (
            <div className="p-4 md:p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900">Revisá la propuesta</h2>
                <p className="mt-1 text-sm font-medium text-zinc-500">Confirmá qué figuritas querés proponer para el canje.</p>
              </div>
              {tradeError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
                  {tradeError}
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">Vas a recibir</h3>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-700">{selectedReceiveItems.length} figuritas</span>
                  </div>
                  {selectedReceiveItems.length ? (
                    <div className="space-y-2">
                      {selectedReceiveItems.map(item => (
                        <TradeReviewRow key={item.code} item={item} onRemove={() => removeSelection('receive', item.code)} />
                      ))}
                    </div>
                  ) : renderEmptyState('No seleccionaste recibidas', 'Podés volver y elegir figuritas para recibir.')}
                </section>
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-blue-900">Vas a entregar</h3>
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-700">{selectedDeliverItems.length} figuritas</span>
                  </div>
                  {selectedDeliverItems.length ? (
                    <div className="space-y-2">
                      {selectedDeliverItems.map(item => (
                        <TradeReviewRow key={item.code} item={item} onRemove={() => removeSelection('deliver', item.code)} />
                      ))}
                    </div>
                  ) : renderEmptyState('No seleccionaste entregas', 'Podés registrar un canje sin entregar figuritas si corresponde.')}
                </section>
              </div>
            </div>
          )}

          {tradeStep === 'success' && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Check className="h-8 w-8" strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-zinc-900">Propuesta enviada</h2>
              <p className="mt-2 text-sm font-medium text-zinc-500">Cuando el otro usuario la acepte, actualizamos los dos álbumes.</p>
              <p className="mt-2 text-sm font-bold text-zinc-700">
                Pendiente de confirmación
              </p>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 bg-white border-t border-zinc-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {tradeStep === 'profile' && (
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
          )}

          {tradeStep === 'select' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-zinc-500">
                  {selectedTotal === 0 ? 'Seleccioná figuritas para registrar el canje' : `Recibís ${selectedReceive.size} · Entregás ${selectedDeliver.size}`}
                </p>
                <button
                  type="button"
                  onClick={() => setTradeStep('review')}
                  disabled={selectedTotal === 0}
                  className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-black text-white transition-all hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  Revisar canje
                </button>
              </div>
              {selectedTotal > 0 && countsMismatch && (
                <p className="text-xs font-bold text-amber-700">Las cantidades no coinciden. Revisá antes de confirmar.</p>
              )}
            </div>
          )}

          {tradeStep === 'review' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setTradeStep('select')}
                  className="flex items-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
                  Volver
                </button>
                <button
                  type="button"
                  onClick={confirmTrade}
                  disabled={selectedTotal === 0}
                  className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-black text-white transition-all hover:bg-amber-600 disabled:bg-zinc-200 disabled:text-zinc-400"
                >
                  Enviar propuesta
                </button>
              </div>
              <p className="text-xs font-bold text-zinc-500">Recibís {selectedReceive.size} · Entregás {selectedDeliver.size}</p>
              {countsMismatch && <p className="text-xs font-bold text-amber-700">Las cantidades no coinciden.</p>}
            </div>
          )}

          {tradeStep === 'success' && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTradeStep('profile')
                  onViewSummary()
                }}
                className="flex-1 rounded-2xl border-2 border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 hover:bg-zinc-50"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setTradeStep('profile')
                  onClose()
                }}
                className="flex-1 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-black text-white hover:bg-zinc-800"
              >
                Ver resumen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
