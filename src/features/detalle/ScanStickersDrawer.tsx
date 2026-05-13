import { useMemo, useRef, useState } from 'react'
import { AlertCircle, Camera, Check, ImagePlus, Minus, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { albumStickers } from '@/data/albumData'
import { findStickerByCode, formatStickerDisplayId, searchStickers } from '@/lib/album'
import { mockDetectStickersFromPhoto, type DetectedSticker } from '@/services/stickerScan.service'
import type { Sticker } from '@/types/album'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (items: Array<{ sticker: Sticker; quantity: number }>) => void
  onManualLoad: () => void
}

type FlowState =
  | { step: 'intro' }
  | { step: 'detecting' }
  | { step: 'review'; detections: DetectedSticker[] }
  | { step: 'too_many' }
  | { step: 'empty' }
  | { step: 'success' }

function normalizeDetections(detections: DetectedSticker[]): DetectedSticker[] {
  const grouped = new Map<string, DetectedSticker>()
  for (const detection of detections) {
    const current = grouped.get(detection.sticker.codigoFigura)
    grouped.set(detection.sticker.codigoFigura, {
      id: current?.id ?? detection.id,
      sticker: detection.sticker,
      quantity: (current?.quantity ?? 0) + detection.quantity,
    })
  }
  return Array.from(grouped.values())
}

export function ScanStickersDrawer({ isOpen, onClose, onConfirm, onManualLoad }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [flow, setFlow] = useState<FlowState>({ step: 'intro' })
  const [searchById, setSearchById] = useState<Record<string, string>>({})

  const allStickerOptions = useMemo(() => albumStickers, [])

  if (!isOpen) return null

  const pickPhoto = () => inputRef.current?.click()

  const handleFile = async (file?: File) => {
    if (!file) return
    setFlow({ step: 'detecting' })
    const detections = await mockDetectStickersFromPhoto(file)
    const totalDetected = detections.reduce((acc, item) => acc + item.quantity, 0)

    if (totalDetected > 10) {
      setFlow({ step: 'too_many' })
      return
    }
    if (detections.length === 0) {
      setFlow({ step: 'empty' })
      return
    }
    setFlow({ step: 'review', detections: normalizeDetections(detections) })
  }

  const updateDetection = (id: string, patch: Partial<DetectedSticker>) => {
    if (flow.step !== 'review') return
    setFlow({
      step: 'review',
      detections: flow.detections.map(item => item.id === id ? { ...item, ...patch } : item),
    })
  }

  const removeDetection = (id: string) => {
    if (flow.step !== 'review') return
    setFlow({ step: 'review', detections: flow.detections.filter(item => item.id !== id) })
  }

  const confirm = () => {
    if (flow.step !== 'review') return
    if (flow.detections.reduce((acc, item) => acc + item.quantity, 0) > 10) {
      setFlow({ step: 'too_many' })
      return
    }
    onConfirm(normalizeDetections(flow.detections).map(({ sticker, quantity }) => ({ sticker, quantity })))
    setFlow({ step: 'success' })
  }

  const retry = () => {
    setSearchById({})
    setFlow({ step: 'intro' })
    window.setTimeout(pickPhoto, 0)
  }

  const getSuggestions = (id: string) => {
    const query = searchById[id] ?? ''
    if (!query.trim()) return allStickerOptions.slice(0, 12)
    const exact = findStickerByCode(query)
    const results = exact ? [exact] : searchStickers(query)
    return results.slice(0, 12)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-stretch md:justify-end bg-zinc-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="w-full md:w-[460px] bg-zinc-50 max-h-[92dvh] md:max-h-none md:h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 duration-300 rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem] overflow-hidden">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            void handleFile(e.target.files?.[0])
            e.currentTarget.value = ''
          }}
        />

        <div className="flex-shrink-0 px-5 py-4 bg-white border-b border-zinc-200/60 flex items-center gap-3 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 shadow-inner flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-black text-zinc-900 tracking-tight truncate">
              {flow.step === 'review' ? 'Revisá la carga' : flow.step === 'success' ? 'Figuritas guardadas' : 'Escaneá tus figuritas'}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-90 flex-shrink-0">
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-hide bg-white">
          {flow.step === 'intro' && (
            <div className="p-5 space-y-5">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Escaneá tus figuritas</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Sacá una foto del dorso de una o varias figuritas. Podés cargar hasta 10 por vez.
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-4 space-y-3">
                {[
                  'Sacá una foto donde se vea bien el dorso de cada figurita.',
                  'Podés cargar hasta 10 por foto.',
                  'Separalas un poco y evitá reflejos o sombras.',
                ].map(text => (
                  <div key={text} className="flex items-start gap-3 text-sm font-medium text-zinc-600">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {flow.step === 'detecting' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-black text-zinc-900">Leyendo la foto...</p>
              <p className="text-sm font-medium text-zinc-500 mt-1">Estamos detectando las figuritas.</p>
            </div>
          )}

          {flow.step === 'too_many' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <AlertCircle className="w-10 h-10 text-amber-500 mb-3" strokeWidth={2} />
              <h2 className="text-xl font-black text-zinc-900">Hay demasiadas figuritas en la foto</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">Para leerlas mejor, escaneá hasta 10 por vez. Podés hacer varias cargas seguidas.</p>
            </div>
          )}

          {flow.step === 'empty' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <AlertCircle className="w-10 h-10 text-zinc-300 mb-3" strokeWidth={2} />
              <h2 className="text-xl font-black text-zinc-900">No pudimos leer la foto</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">Probá sacarla de nuevo con más luz, enfocando bien el dorso y dejando espacio entre figuritas.</p>
            </div>
          )}

          {flow.step === 'success' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Check className="w-8 h-8" strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-zinc-900">Figuritas guardadas</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">Actualizamos tu álbum y sumamos las repetidas que detectamos.</p>
            </div>
          )}

          {flow.step === 'review' && (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Revisá la carga</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Detectamos estas figuritas en la foto. Confirmá cuáles querés guardar en tu álbum.
                </p>
              </div>

              <div className="space-y-3">
                {flow.detections.map(item => (
                  <div key={item.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-11 bg-white border border-zinc-200 rounded-xl flex items-center justify-center font-black text-amber-600 shadow-sm">
                        {formatStickerDisplayId(item.sticker.codigoFigura)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-zinc-900 truncate">{item.sticker.nombreFigura || item.sticker.codigoAlias}</p>
                        <p className="text-xs font-bold text-zinc-400 truncate">{item.sticker.subseccion}</p>
                      </div>
                      <button onClick={() => removeDetection(item.id)} className="w-9 h-9 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center">
                        <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" strokeWidth={2.5} />
                        <input
                          value={searchById[item.id] ?? ''}
                          onChange={e => setSearchById(prev => ({ ...prev, [item.id]: e.target.value }))}
                          placeholder="Corregir: ARG17, Messi..."
                          className="w-full pl-9 pr-3 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500"
                        />
                      </div>
                      <div className="flex items-center bg-white border border-zinc-200 rounded-xl overflow-hidden">
                        <button onClick={() => updateDetection(item.id, { quantity: Math.max(1, item.quantity - 1) })} className="w-9 h-11 flex items-center justify-center text-zinc-500 hover:bg-zinc-50">
                          <Minus className="w-4 h-4" strokeWidth={3} />
                        </button>
                        <span className="w-7 text-center text-sm font-black">{item.quantity}</span>
                        <button onClick={() => updateDetection(item.id, { quantity: Math.min(10, item.quantity + 1) })} className="w-9 h-11 flex items-center justify-center text-zinc-500 hover:bg-zinc-50">
                          <Plus className="w-4 h-4" strokeWidth={3} />
                        </button>
                      </div>
                    </div>

                    {(searchById[item.id] ?? '').trim() && (
                      <div className="grid gap-1.5">
                        {getSuggestions(item.id).map(sticker => (
                          <button
                            key={sticker.codigoFigura}
                            onClick={() => {
                              updateDetection(item.id, { sticker })
                              setSearchById(prev => ({ ...prev, [item.id]: '' }))
                            }}
                            className="text-left bg-white border border-zinc-200 rounded-xl px-3 py-2 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                          >
                            <span className="text-xs font-black text-amber-600 mr-2">{formatStickerDisplayId(sticker.codigoFigura)}</span>
                            <span className="text-sm font-bold text-zinc-800">{sticker.nombreFigura || sticker.codigoAlias}</span>
                            <span className="text-xs font-medium text-zinc-400 ml-2">{sticker.subseccion}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 md:pb-8 bg-white border-t border-zinc-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {flow.step === 'intro' && (
            <button onClick={pickPhoto} className="w-full bg-zinc-900 text-white font-bold py-3 px-4 rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
              <ImagePlus className="w-5 h-5" strokeWidth={2.5} />
              Subir foto
            </button>
          )}
          {flow.step === 'review' && (
            <div className="flex gap-2">
              <button onClick={retry} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
                Escanear otra foto
              </button>
              <button onClick={confirm} disabled={flow.detections.length === 0} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all">
                Guardar figuritas
              </button>
            </div>
          )}
          {flow.step === 'too_many' && (
            <button onClick={retry} className="w-full bg-zinc-900 text-white font-bold py-3 px-4 rounded-2xl hover:bg-zinc-800 transition-all">
              Sacar otra foto
            </button>
          )}
          {flow.step === 'empty' && (
            <div className="flex gap-2">
              <button onClick={retry} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all">
                Intentar de nuevo
              </button>
              <button onClick={onManualLoad} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                Cargar manualmente
              </button>
            </div>
          )}
          {flow.step === 'success' && (
            <div className="flex gap-2">
              <button onClick={retry} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                Escanear otra foto
              </button>
              <button onClick={onClose} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all">
                Listo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
