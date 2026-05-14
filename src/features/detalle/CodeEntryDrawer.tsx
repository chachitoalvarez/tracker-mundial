import { useState } from 'react'
import { ArrowLeft, Check, Keyboard, X } from 'lucide-react'
import { formatStickerDisplayId } from '@/lib/album'
import { parseStickerCode, validateStickerCode } from '@/lib/stickerCode'
import type { AlbumSection, Sticker } from '@/types/album'

interface Props {
  isOpen: boolean
  albumData: AlbumSection[]
  onClose: () => void
  onConfirm: (items: Array<{ sticker: Sticker; quantity: number }>) => void
}

type FlowState = 'form' | 'review' | 'success'

function getCurrentCount(albumData: AlbumSection[], sticker: Sticker): number {
  const section = albumData.find(item => item.section === sticker.subseccion)
  return section?.collected[sticker.codigoFigura] ?? 0
}

function getStatusLabel(currentCount: number) {
  if (currentCount <= 0) return 'Nueva'
  if (currentCount === 1) return 'Ya la tenías'
  return 'Repetida'
}

function getSuccessCopy(currentCount: number) {
  return currentCount <= 0
    ? {
        title: 'Figurita guardada',
        description: 'La sumamos a tu álbum.',
      }
    : {
        title: 'Repetida guardada',
        description: 'La sumamos a tus repetidas para futuros canjes.',
      }
}

export function CodeEntryDrawer({ isOpen, albumData, onClose, onConfirm }: Props) {
  const [flow, setFlow] = useState<FlowState>('form')
  const [prefix, setPrefix] = useState('')
  const [number, setNumber] = useState('')
  const [keepPrefix, setKeepPrefix] = useState(true)
  const [lastPrefix, setLastPrefix] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null)
  const [currentCount, setCurrentCount] = useState(0)

  if (!isOpen) return null

  const normalizedPreview = prefix && number ? `${prefix}${number.padStart(3, '0')}` : ''
  const validation = prefix && number ? validateStickerCode(`${prefix}${number}`) : null
  const canSearch = !!prefix && !!number
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
      setError('No encontramos esta figurita. Revisá que el código esté bien escrito. Ejemplo: CUW 8.')
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
    setFlow('success')
  }

  const resetForm = (preservePrefix = true) => {
    setFlow('form')
    setSelectedSticker(null)
    setCurrentCount(0)
    setError(null)
    if (preservePrefix && keepPrefix && lastPrefix) {
      setPrefix(lastPrefix)
      setNumber('')
      return
    }
    setPrefix('')
    setNumber('')
    setLastPrefix('')
  }

  const successCopy = selectedSticker ? getSuccessCopy(currentCount) : getSuccessCopy(0)

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full md:w-[460px] bg-zinc-50 max-h-[92dvh] md:max-h-none md:h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-300 rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem] overflow-hidden">
        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 shadow-inner flex items-center justify-center flex-shrink-0">
            <Keyboard className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-zinc-900 tracking-tight truncate">
              {flow === 'review' ? 'Encontramos esta figurita' : flow === 'success' ? successCopy.title : 'Ingresá figuritas'}
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
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Ingresá figuritas</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Lo encontrás en el dorso de la figurita, arriba a la derecha.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-4">
                <div className="grid grid-cols-[1fr_112px] gap-3">
                  <label className="space-y-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Código</span>
                    <input
                      id="sticker-code-prefix"
                      value={prefix}
                      onChange={e => handlePrefixChange(e.target.value)}
                      onPaste={e => {
                        const text = e.clipboardData.getData('text')
                        if (syncParsedInput(text)) e.preventDefault()
                      }}
                      placeholder="CUW"
                      maxLength={3}
                      autoComplete="off"
                      autoCapitalize="characters"
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-base font-black uppercase focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-zinc-500">Número</span>
                    <input
                      value={number}
                      onChange={e => handleNumberChange(e.target.value)}
                      onPaste={e => {
                        const text = e.clipboardData.getData('text')
                        if (syncParsedInput(text)) e.preventDefault()
                      }}
                      placeholder="8"
                      inputMode="numeric"
                      maxLength={3}
                      autoComplete="off"
                      className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-base font-black focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </label>
                </div>

                <p className="text-sm font-bold text-zinc-900">
                  Código a cargar: <span className="text-amber-600">{normalizedPreview || '—'}</span>
                </p>

                <p className="text-xs font-medium text-zinc-500">Ejemplo: CUW 8</p>

                <label className="flex items-center gap-3 text-sm font-semibold text-zinc-700">
                  <input
                    type="checkbox"
                    checked={keepPrefix}
                    onChange={e => setKeepPrefix(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-300 text-amber-500 focus:ring-amber-500/20"
                  />
                  Mantener este código para la próxima carga
                </label>
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
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Encontramos esta figurita</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Revisala antes de guardarla en tu álbum.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-11 bg-white border border-zinc-200 rounded-xl flex items-center justify-center font-black text-amber-600 shadow-sm">
                    {formatStickerDisplayId(selectedSticker.codigoFigura)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-zinc-900 truncate">
                      {selectedSticker.nombreFigura || selectedSticker.codigoAlias}
                    </p>
                    <p className="text-xs font-bold text-zinc-400 truncate">{selectedSticker.subseccion}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-zinc-700">
                  <div className="bg-white border border-zinc-200 rounded-xl px-3 py-2">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Código</span>
                    {selectedSticker.codigoFigura}
                  </div>
                  <div className="bg-white border border-zinc-200 rounded-xl px-3 py-2">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-zinc-400">Estado</span>
                    {getStatusLabel(currentCount)}
                  </div>
                </div>

                <p className="text-sm font-medium text-zinc-600 leading-relaxed">
                  {currentCount <= 0
                    ? 'Vamos a sumarla a tu álbum.'
                    : 'Ya la tenías. Si confirmás, la vamos a sumar como repetida.'}
                </p>
              </div>
            </div>
          )}

          {flow === 'success' && selectedSticker && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Check className="w-8 h-8" strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-zinc-900">{successCopy.title}</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">{successCopy.description}</p>
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
                }}
                className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                Cambiar código
              </button>
              <button
                onClick={confirm}
                className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all"
              >
                Guardar figurita
              </button>
            </div>
          )}
          {flow === 'success' && (
            <div className="flex gap-2">
              <button
                onClick={() => resetForm(true)}
                className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all"
              >
                Cargar otra
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all"
              >
                Listo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
