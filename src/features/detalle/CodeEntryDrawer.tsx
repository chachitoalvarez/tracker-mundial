import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Plus, SquareStack, X } from 'lucide-react'
import { parseStickerCode, validateStickerCode } from '@/lib/stickerCode'
import { formatStickerDisplayId } from '@/lib/album'
import type { AlbumSection, Sticker } from '@/types/album'

interface Props {
  isOpen: boolean
  albumData: AlbumSection[]
  onClose: () => void
  onConfirm: (items: Array<{ sticker: Sticker; quantity: number }>) => void
}

type FlowState = 'form' | 'review'

function getCurrentCount(albumData: AlbumSection[], sticker: Sticker): number {
  const section = albumData.find(item => item.section === sticker.subseccion)
  return section?.collected[sticker.codigoFigura] ?? 0
}

function getStatusLabel(currentCount: number) {
  if (currentCount <= 0) return 'Nueva'
  return 'Repetida'
}

export function CodeEntryDrawer({ isOpen, albumData, onClose, onConfirm }: Props) {
  const [flow, setFlow] = useState<FlowState>('form')
  const [prefix, setPrefix] = useState('')
  const [number, setNumber] = useState('')
  const [lastPrefix, setLastPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null)
  const [currentCount, setCurrentCount] = useState(0)
  const prefixInputRef = useRef<HTMLInputElement>(null)
  const numberInputRef = useRef<HTMLInputElement>(null)
  const prevPrefixLengthRef = useRef(0)

  useEffect(() => {
    if (prefix.length === 3 && prevPrefixLengthRef.current < 3) {
      requestAnimationFrame(() => numberInputRef.current?.focus())
    }
    prevPrefixLengthRef.current = prefix.length
  }, [prefix])

  if (!isOpen) return null

  const canSearch = prefix.length === 3 && number.length > 0
  const validation = canSearch ? validateStickerCode(`${prefix}${number}`) : null

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
    const cleaned = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
    setPrefix(cleaned)
    setError(null)
  }

  const handleNumberChange = (value: string) => {
    if (syncParsedInput(value)) return
    const cleaned = value.replace(/\D/g, '').slice(0, 3)
    setNumber(cleaned)
    setError(null)
  }

  const resetForm = (preservePrefix = true) => {
    setFlow('form')
    setSelectedSticker(null)
    setCurrentCount(0)
    setError(null)

    const nextPrefix = preservePrefix && lastPrefix ? lastPrefix : ''
    setPrefix(nextPrefix)
    setNumber('')

    requestAnimationFrame(() => {
      if (nextPrefix) {
        numberInputRef.current?.focus()
      } else {
        prefixInputRef.current?.focus()
      }
    })
  }

  const searchSticker = () => {
    if (!canSearch) {
      setError('Completá el código y el número.')
      return
    }

    if (validation?.status === 'prefix_invalid') {
      setError('No encontramos ese código. Revisá las letras del código o elegí una opción válida.')
      return
    }

    if (validation?.status === 'number_invalid') {
      setError('No encontramos esa figurita. Ese número no existe para este código.')
      return
    }

    if (validation?.status !== 'valid' || !validation.sticker) {
      setError('No encontramos esta figurita. Revisá que el código esté bien escrito. Ejemplo: ARG10.')
      return
    }

    setSelectedSticker(validation.sticker)
    setCurrentCount(getCurrentCount(albumData, validation.sticker))
    setLastPrefix(validation.prefix ?? prefix)
    setFlow('review')
    setError(null)
  }

  const confirm = () => {
    if (!selectedSticker) return
    onConfirm([{ sticker: selectedSticker, quantity: 1 }])
    resetForm(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full md:w-[460px] bg-zinc-50 max-h-[92dvh] md:max-h-none md:h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-300 rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem] overflow-hidden">
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="relative w-10 h-10 rounded-full bg-amber-100 text-amber-600 shadow-inner flex items-center justify-center flex-shrink-0">
            <SquareStack className="w-5 h-5" strokeWidth={2.5} />
            <Plus className="w-3.5 h-3.5 absolute -bottom-0.5 -right-0.5 bg-amber-100 rounded-full p-0.5" strokeWidth={3} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-zinc-900 tracking-tight truncate">
              Cargar figurita
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-90 flex-shrink-0">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide bg-white">
          {flow === 'form' && (
            <div className="p-5 space-y-5">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Ingresá el código</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Está en el dorso, arriba a la derecha.
                </p>
                <p className="text-xs font-semibold text-zinc-500 mt-2">Ejemplo: ARG10</p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-[1fr_112px] gap-3">
                  <label className="space-y-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Código</span>
                    <input
                      ref={prefixInputRef}
                      value={prefix}
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
                </div>

              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}
            </div>
          )}

          {flow === 'review' && selectedSticker && (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Revisá antes de guardar</h2>
              </div>

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
                  Código: <span className="text-amber-600">{formatStickerDisplayId(selectedSticker.codigoFigura)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 md:pb-8 bg-white border-t border-zinc-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {flow === 'form' && (
            <div className="flex gap-2">
              <button
                onClick={searchSticker}
                disabled={!canSearch}
                className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all"
              >
                Buscar figurita
              </button>
            </div>
          )}
          {flow === 'review' && selectedSticker && (
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
                Editar código
              </button>
              <button
                onClick={confirm}
                className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all"
              >
                Guardar figurita
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
