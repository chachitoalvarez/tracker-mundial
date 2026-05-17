import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Pencil, Plus, SquareStack, Trash2, X } from 'lucide-react'
import { getDisplayStickerCode, parseStickerCode, validateStickerCode } from '@/lib/stickerCode'
import { formatStickerDisplayId } from '@/lib/album'
import type { AlbumSection, Sticker } from '@/types/album'

interface Props {
  isOpen: boolean
  albumData: AlbumSection[]
  onClose: () => void
  onConfirm: (items: Array<{ sticker: Sticker; quantity: number }>) => void
}

type FlowState = 'form' | 'review' | 'success'

interface PendingSticker {
  id: number
  sticker: Sticker
  updatedAt: number
}

interface PendingStickerView extends PendingSticker {
  status: 'Nueva' | 'Repetida'
}

interface BatchSummary {
  total: number
  newCount: number
  repeatedCount: number
}

function getCurrentCount(albumData: AlbumSection[], sticker: Sticker): number {
  const section = albumData.find(item => item.section === sticker.subseccion)
  return section?.collected[sticker.codigoFigura] ?? 0
}

function getStatusLabel(currentCount: number) {
  return currentCount <= 0 ? 'Nueva' : 'Repetida'
}

function getValidationError(status: ReturnType<typeof validateStickerCode>['status'] | undefined) {
  if (status === 'prefix_invalid') {
    return 'No encontramos ese codigo. Revisa las letras del codigo o elegi una opcion valida.'
  }
  if (status === 'number_invalid') {
    return 'No encontramos esa figurita. Ese numero no existe para este codigo.'
  }
  return 'No encontramos esta figurita. Revisa que el codigo este bien escrito. Ejemplo: ARG10.'
}

function aggregatePendingItems(items: PendingSticker[]) {
  const grouped = new Map<string, { sticker: Sticker; quantity: number }>()
  items.forEach(item => {
    const existing = grouped.get(item.sticker.codigoFigura)
    grouped.set(item.sticker.codigoFigura, {
      sticker: item.sticker,
      quantity: (existing?.quantity ?? 0) + 1,
    })
  })
  return [...grouped.values()]
}

export function CodeEntryDrawer({ isOpen, albumData, onClose, onConfirm }: Props) {
  const [flow, setFlow] = useState<FlowState>('form')
  const [prefix, setPrefix] = useState('')
  const [number, setNumber] = useState('')
  const [lastPrefix, setLastPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null)
  const [currentCount, setCurrentCount] = useState(0)
  const [savedWasRepeated, setSavedWasRepeated] = useState(false)
  const [pendingItems, setPendingItems] = useState<PendingSticker[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [lastBatchSummary, setLastBatchSummary] = useState<BatchSummary | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  const prefixInputRef = useRef<HTMLInputElement>(null)
  const numberInputRef = useRef<HTMLInputElement>(null)
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const loadAnotherButtonRef = useRef<HTMLButtonElement>(null)
  const prevPrefixLengthRef = useRef(0)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 768px)')
    const sync = () => setIsDesktop(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    requestAnimationFrame(() => prefixInputRef.current?.focus())
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || isDesktop) return
    if (flow === 'review') requestAnimationFrame(() => saveButtonRef.current?.focus())
    if (flow === 'success') requestAnimationFrame(() => loadAnotherButtonRef.current?.focus())
  }, [flow, isDesktop, isOpen])

  useEffect(() => {
    if (prefix.length === 3 && prevPrefixLengthRef.current < 3) {
      requestAnimationFrame(() => numberInputRef.current?.focus())
    }
    prevPrefixLengthRef.current = prefix.length
  }, [prefix])

  const pendingViews = useMemo<PendingStickerView[]>(() => {
    const seenCounts = new Map<string, number>()
    return [...pendingItems]
      .sort((a, b) => a.updatedAt - b.updatedAt)
      .map(item => {
        const code = item.sticker.codigoFigura
        const priorCount = getCurrentCount(albumData, item.sticker) + (seenCounts.get(code) ?? 0)
        seenCounts.set(code, (seenCounts.get(code) ?? 0) + 1)
        return { ...item, status: priorCount > 0 ? 'Repetida' as const : 'Nueva' as const }
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }, [albumData, pendingItems])

  const batchSummary = useMemo<BatchSummary>(() => ({
    total: pendingViews.length,
    newCount: pendingViews.filter(item => item.status === 'Nueva').length,
    repeatedCount: pendingViews.filter(item => item.status === 'Repetida').length,
  }), [pendingViews])

  if (!isOpen) return null

  const canSearch = prefix.length === 3 && number.length > 0
  const validation = canSearch ? validateStickerCode(`${prefix}${number}`) : null
  const displayCode = canSearch ? getDisplayStickerCode(prefix, number) : ''

  const syncParsedInput = (input: string) => {
    const parsed = parseStickerCode(input)
    if (!parsed) return false
    setPrefix(parsed.prefix)
    setNumber(parsed.number)
    setError(null)
    return true
  }

  const handlePrefixChange = (value: string) => {
    if (syncParsedInput(value)) return
    setPrefix(value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))
    setError(null)
  }

  const handleNumberChange = (value: string) => {
    if (syncParsedInput(value)) return
    setNumber(value.replace(/\D/g, '').slice(0, 3))
    setError(null)
  }

  const handlePrefixFocus = () => {
    setPrefix('')
    setError(null)
    prevPrefixLengthRef.current = 0
  }

  const resetFieldsAfterEntry = (nextPrefix: string) => {
    setPrefix(nextPrefix)
    setNumber('')
    setError(null)
    requestAnimationFrame(() => numberInputRef.current?.focus())
  }

  const resetMobileForm = (preservePrefix = true) => {
    setFlow('form')
    setSelectedSticker(null)
    setCurrentCount(0)
    setError(null)
    const nextPrefix = preservePrefix && lastPrefix ? lastPrefix : ''
    setPrefix(nextPrefix)
    setNumber('')
    requestAnimationFrame(() => {
      if (nextPrefix) numberInputRef.current?.focus()
      else prefixInputRef.current?.focus()
    })
  }

  const getValidatedSticker = () => {
    if (!canSearch) {
      setError('Completa el codigo y el numero.')
      return null
    }
    if (validation?.status !== 'valid' || !validation.sticker) {
      setError(getValidationError(validation?.status))
      return null
    }
    return validation.sticker
  }

  const searchSticker = () => {
    const sticker = getValidatedSticker()
    if (!sticker) return
    setSelectedSticker(sticker)
    setCurrentCount(getCurrentCount(albumData, sticker))
    setLastPrefix(validation?.prefix ?? prefix)
    setFlow('review')
    setError(null)
  }

  const addOrUpdatePendingSticker = () => {
    const sticker = getValidatedSticker()
    if (!sticker) return
    const timestamp = Date.now()
    const nextPrefix = validation?.prefix ?? prefix
    setLastPrefix(nextPrefix)
    setPendingItems(current => {
      if (editingId === null) return [...current, { id: timestamp, sticker, updatedAt: timestamp }]
      return current.map(item => item.id === editingId ? { ...item, sticker, updatedAt: timestamp } : item)
    })
    setEditingId(null)
    resetFieldsAfterEntry(nextPrefix)
  }

  const startEditing = (item: PendingSticker) => {
    const parsed = parseStickerCode(item.sticker.codigoFigura)
    if (!parsed) return
    setEditingId(item.id)
    setPrefix(parsed.prefix)
    setNumber(parsed.number.replace(/^0+(?=\d)/, ''))
    setError(null)
    requestAnimationFrame(() => numberInputRef.current?.focus())
  }

  const cancelEditing = () => {
    setEditingId(null)
    resetFieldsAfterEntry(lastPrefix)
  }

  const saveBatch = () => {
    if (!pendingItems.length) return
    setLastBatchSummary(batchSummary)
    onConfirm(aggregatePendingItems(pendingItems))
    setPendingItems([])
    setEditingId(null)
    setFlow('success')
  }

  const confirmSingle = () => {
    if (!selectedSticker) return
    setSavedWasRepeated(currentCount > 0)
    onConfirm([{ sticker: selectedSticker, quantity: 1 }])
    setFlow('success')
  }

  const startAnotherBatch = () => {
    setFlow('form')
    setLastBatchSummary(null)
    resetFieldsAfterEntry(lastPrefix)
  }

  const handlePrimaryAction = () => {
    if (isDesktop) {
      if (flow === 'form') addOrUpdatePendingSticker()
      if (flow === 'success') startAnotherBatch()
      return
    }
    if (flow === 'form') searchSticker()
    if (flow === 'review') confirmSingle()
    if (flow === 'success') resetMobileForm(true)
  }

  const handleDrawerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    handlePrimaryAction()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-zinc-900/60 md:backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        onKeyDown={handleDrawerKeyDown}
        className="w-full md:w-[560px] bg-zinc-50 max-h-[92dvh] md:max-h-none md:h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-300 rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem] overflow-hidden"
      >
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="relative w-10 h-10 rounded-full bg-amber-100 text-amber-600 shadow-inner flex items-center justify-center flex-shrink-0">
            <SquareStack className="w-5 h-5" strokeWidth={2.5} />
            <Plus className="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 bg-amber-100 rounded-full p-0.5" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-zinc-900 tracking-tight truncate">
              <span className="md:hidden">Cargar figurita</span>
              <span className="hidden md:inline">Cargar figuritas</span>
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-90 flex-shrink-0">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide bg-white">
          {flow === 'form' && (
            <div className={isDesktop ? 'p-5 space-y-4' : 'p-5 space-y-5'}>
              <div>
                <h2 className={isDesktop ? 'text-lg font-black text-zinc-900 tracking-tight' : 'text-2xl font-black text-zinc-900 tracking-tight'}>
                  <span className="md:hidden">Ingresá el código</span>
                  <span className="hidden md:inline">Ingresá los códigos</span>
                </h2>
                <p className="md:hidden text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Estan en el dorso, arriba a la derecha.
                </p>
                <p className="md:hidden text-xs font-semibold text-zinc-500 mt-2">Ejemplo: ARG10</p>
              </div>

              <div className={`bg-zinc-50 border border-zinc-200 rounded-2xl ${isDesktop ? 'p-3' : 'p-4 space-y-4'}`}>
                <div className={isDesktop ? 'grid grid-cols-[1fr_112px_auto] items-end gap-3' : 'grid grid-cols-[1fr_112px] gap-3'}>
                  <label className="space-y-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Código</span>
                    <input
                      ref={prefixInputRef}
                      value={prefix}
                      onFocus={handlePrefixFocus}
                      onChange={e => handlePrefixChange(e.target.value)}
                      onPaste={e => {
                        const text = e.clipboardData.getData('text')
                        if (syncParsedInput(text)) e.preventDefault()
                      }}
                      placeholder="ARG"
                      maxLength={3}
                      autoComplete="off"
                      autoCapitalize="characters"
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-base font-black uppercase focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Número</span>
                    <input
                      ref={numberInputRef}
                      value={number}
                      onChange={e => handleNumberChange(e.target.value)}
                      onPaste={e => {
                        const text = e.clipboardData.getData('text')
                        if (syncParsedInput(text)) e.preventDefault()
                      }}
                      placeholder="10"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={3}
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-base font-black focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </label>
                  {isDesktop && (
                    <button
                      onClick={handlePrimaryAction}
                      disabled={!canSearch}
                      className="h-[50px] bg-zinc-900 text-white font-bold px-4 rounded-xl hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all whitespace-nowrap"
                    >
                      {editingId !== null ? 'Actualizar en la lista' : 'Agregar a la lista'}
                    </button>
                  )}
                </div>
                <p className="md:hidden text-sm font-semibold text-zinc-500">
                  Codigo a cargar: <span className="text-zinc-900">{displayCode || '-'}</span>
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {isDesktop && (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-zinc-900">Figuritas por guardar</h3>
                    {editingId !== null && (
                      <button type="button" onClick={cancelEditing} className="text-xs font-bold text-zinc-500 hover:text-zinc-900">
                        Cancelar edicion
                      </button>
                    )}
                  </div>

                  {pendingViews.length > 0 ? (
                    <div className="space-y-2">
                      {pendingViews.map(item => (
                        <div key={item.id} className="rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-zinc-900">{formatStickerDisplayId(item.sticker.codigoFigura)}</p>
                            <p className="text-xs font-semibold text-zinc-500 truncate">
                              {item.sticker.nombreFigura || 'Figurita'} · {item.sticker.paisEquipo || item.sticker.subseccion}
                            </p>
                            <span className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                              item.status === 'Nueva' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => startEditing(item)} className="p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-xl">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button type="button" onClick={() => setPendingItems(current => current.filter(row => row.id !== item.id))} className="p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600 rounded-xl">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-zinc-200 p-4 text-sm font-medium text-zinc-400">
                      Todavia no agregaste figuritas.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!isDesktop && flow === 'review' && selectedSticker && (
            <div className="p-5 space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Revisa antes de guardar</h2>
              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-zinc-900 truncate">
                      {selectedSticker.nombreFigura || formatStickerDisplayId(selectedSticker.codigoFigura)}
                    </p>
                    <p className="text-xs font-bold text-zinc-400 truncate">
                      {selectedSticker.paisEquipo || selectedSticker.subseccion}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    currentCount <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {getStatusLabel(currentCount)}
                  </span>
                </div>
                <div className="text-sm font-bold text-zinc-900">
                  Codigo: <span className="text-amber-600">{formatStickerDisplayId(selectedSticker.codigoFigura)}</span>
                </div>
              </div>
            </div>
          )}

          {flow === 'success' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Check className="w-8 h-8" strokeWidth={3} />
              </div>
              {isDesktop && lastBatchSummary ? (
                <>
                  <h2 className="text-xl font-black text-zinc-900">Figuritas guardadas</h2>
                  <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">
                    Guardamos {lastBatchSummary.total} {lastBatchSummary.total === 1 ? 'figurita' : 'figuritas'} en tu album.
                  </p>
                  <p className="text-sm font-bold text-zinc-700 mt-2">
                    {lastBatchSummary.newCount} {lastBatchSummary.newCount === 1 ? 'nueva' : 'nuevas'} · {lastBatchSummary.repeatedCount} {lastBatchSummary.repeatedCount === 1 ? 'repetida' : 'repetidas'}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-black text-zinc-900">
                    {savedWasRepeated ? 'Repetida guardada' : 'Figurita guardada'}
                  </h2>
                  <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">
                    {savedWasRepeated ? 'La sumamos a tus repetidas para futuros canjes.' : 'La sumamos a tu album.'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 md:pt-4 md:pb-8 bg-white border-t border-zinc-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {flow === 'form' && (
            <>
              {!isDesktop && (
                <button
                  onClick={handlePrimaryAction}
                  disabled={!canSearch}
                  className="w-full bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all"
                >
                  Buscar figurita
                </button>
              )}
              {isDesktop && batchSummary.total > 0 && (
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold text-zinc-500">
                      {batchSummary.newCount} {batchSummary.newCount === 1 ? 'nueva' : 'nuevas'} · {batchSummary.repeatedCount} {batchSummary.repeatedCount === 1 ? 'repetida' : 'repetidas'}
                    </p>
                    <button onClick={saveBatch} className="bg-amber-500 text-white font-bold py-3 px-4 rounded-2xl hover:bg-amber-600 transition-all">
                      {batchSummary.total === 1 ? 'Guardar figurita' : `Guardar ${batchSummary.total} figuritas`}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {!isDesktop && flow === 'review' && selectedSticker && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFlow('form')
                  setSelectedSticker(null)
                  setCurrentCount(0)
                  setError(null)
                  requestAnimationFrame(() => numberInputRef.current?.focus())
                }}
                className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                Editar codigo
              </button>
              <button
                onClick={confirmSingle}
                ref={saveButtonRef}
                className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all"
              >
                Guardar figurita
              </button>
            </div>
          )}
          {flow === 'success' && (
            <div className="flex gap-2">
              <button
                onClick={isDesktop ? startAnotherBatch : () => resetMobileForm(true)}
                ref={loadAnotherButtonRef}
                className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all"
              >
                {isDesktop ? 'Cargar mas figuritas' : 'Cargar otra figurita'}
              </button>
              {isDesktop && (
                <button onClick={onClose} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                  Cerrar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
