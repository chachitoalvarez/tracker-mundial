import { useMemo, useRef, useState } from 'react'
import { AlertCircle, Camera, Check, ImagePlus, Minus, Plus, RotateCcw, Search, Trash2, X } from 'lucide-react'
import { albumStickers } from '@/data/albumData'
import { findStickerByCode, formatStickerDisplayId, searchStickers } from '@/lib/album'
import { detectStickerFromPhoto, type DetectedSticker, type ScanDebugInfo } from '@/services/stickerScan.service'
import type { Sticker } from '@/types/album'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (items: Array<{ sticker: Sticker; quantity: number }>) => void
}

type FlowState =
  | { step: 'intro' }
  | { step: 'crop'; file: File; previewUrl: string }
  | { step: 'detecting' }
  | { step: 'review'; detections: DetectedSticker[] }
  | { step: 'unreadable' }
  | { step: 'manual' }
  | { step: 'success' }

interface CropBox {
  x: number
  y: number
  width: number
  height: number
}

function normalizeDetections(detections: DetectedSticker[]): DetectedSticker[] {
  const grouped = new Map<string, DetectedSticker>()
  for (const detection of detections) {
    const current = grouped.get(detection.code)
    grouped.set(detection.code, {
      id: current?.id ?? detection.id,
      code: detection.code,
      quantity: (current?.quantity ?? 0) + detection.quantity,
      status: detection.status,
      sticker: detection.sticker ?? current?.sticker,
      rawText: current?.rawText ? `${current.rawText}, ${detection.rawText ?? detection.code}` : detection.rawText,
      confidence: Math.max(current?.confidence ?? 0, detection.confidence ?? 0) || undefined,
    })
  }
  return Array.from(grouped.values())
}

export function ScanStickersDrawer({ isOpen, onClose, onConfirm }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const cropNextRef = useRef(false)
  const [flow, setFlow] = useState<FlowState>({ step: 'intro' })
  const [searchById, setSearchById] = useState<Record<string, string>>({})
  const [cropBox, setCropBox] = useState<CropBox>({ x: 15, y: 35, width: 70, height: 30 })
  const [manualCode, setManualCode] = useState('')
  const [scanDebug, setScanDebug] = useState<ScanDebugInfo | null>(null)

  const allStickerOptions = useMemo(() => albumStickers, [])

  if (!isOpen) return null

  const pickPhoto = (crop = false) => {
    cropNextRef.current = crop
    inputRef.current?.click()
  }

  const processFile = async (file?: File) => {
    if (!file) return
    setFlow({ step: 'detecting' })
    try {
      const result = await detectStickerFromPhoto(file)
      setScanDebug(result.debug)

      if (!result.detection) {
        setFlow({ step: 'unreadable' })
        return
      }

      setFlow({ step: 'review', detections: normalizeDetections([result.detection]) })
    } catch {
      setFlow({ step: 'unreadable' })
    }
  }

  const handleFile = (file?: File) => {
    if (!file) return
    if (cropNextRef.current) {
      cropNextRef.current = false
      setFlow({ step: 'crop', file, previewUrl: URL.createObjectURL(file) })
      return
    }
    void processFile(file)
  }

  const cropFile = async (file: File, crop: CropBox): Promise<File> => {
    const url = URL.createObjectURL(file)
    try {
      const image = new Image()
      image.src = url
      await image.decode()

      const sourceX = Math.round(image.naturalWidth * crop.x / 100)
      const sourceY = Math.round(image.naturalHeight * crop.y / 100)
      const sourceWidth = Math.round(image.naturalWidth * crop.width / 100)
      const sourceHeight = Math.round(image.naturalHeight * crop.height / 100)
      const canvas = document.createElement('canvas')
      canvas.width = sourceWidth
      canvas.height = sourceHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) return file
      ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, sourceWidth, sourceHeight)

      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'))
      return blob ? new File([blob], `crop-${file.name}.png`, { type: 'image/png' }) : file
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  const processCroppedFile = async () => {
    if (flow.step !== 'crop') return
    const cropped = await cropFile(flow.file, cropBox)
    URL.revokeObjectURL(flow.previewUrl)
    await processFile(cropped)
  }

  const parseManualCode = (input: string): string | null => {
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const match = cleaned.match(/^([A-Z]{3})(\d{1,3})$/)
    if (!match) return null
    return `${match[1]}${match[2].padStart(3, '0')}`
  }

  const handleManualConfirm = () => {
    const normalized = parseManualCode(manualCode)
    if (!normalized) return
    const sticker = findStickerByCode(normalized)
    setFlow({
      step: 'review',
      detections: normalizeDetections([{
        id: normalized,
        code: normalized,
        quantity: 1,
        status: sticker ? 'needs_review' : 'unreadable',
        sticker: sticker ?? undefined,
        rawText: manualCode,
        confidence: 100,
      }]),
    })
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
    const readyDetections = normalizeDetections(flow.detections).filter(item => item.status === 'detected' && item.sticker)
    if (readyDetections.length !== flow.detections.length) return
    onConfirm(readyDetections.map(({ sticker, quantity }) => ({ sticker: sticker!, quantity })))
    setFlow({ step: 'success' })
  }

  const retry = () => {
    setSearchById({})
    setManualCode('')
    setFlow({ step: 'intro' })
    window.setTimeout(() => pickPhoto(false), 0)
  }

  const getSuggestions = (id: string) => {
    const query = searchById[id] ?? ''
    if (!query.trim()) return allStickerOptions.slice(0, 12)
    const exact = findStickerByCode(query)
    const results = exact ? [exact] : searchStickers(query)
    return results.slice(0, 12)
  }

  const hasPendingReview = flow.step === 'review' && flow.detections.some(item => item.status === 'needs_review' || !item.sticker)
  const hasLowConfidenceResult = flow.step === 'review' && flow.detections.some(item => item.status === 'needs_review' && item.sticker)
  const debugVisible = import.meta.env.DEV && !!scanDebug

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
              {flow.step === 'review' ? 'Revisá la carga' : flow.step === 'success' ? 'Figurita guardada' : 'Escaneá tu figurita'}
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
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Escaneá tu figurita</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Sacá una foto del dorso de una figurita. Para este MVP leemos solo el código superior derecho.
                </p>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-4 space-y-3">
                {[
                  'Sacá una foto donde se vea clara la cápsula negra del código.',
                  'Ubicá la figurita derecha y evitá reflejos o sombras.',
                  'Si no se lee bien, usá Ajustar área para recortar el código.',
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
              <p className="text-sm font-medium text-zinc-500 mt-1">Estamos leyendo el código.</p>
            </div>
          )}

          {flow.step === 'crop' && (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Ajustá el área del código</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Recortá la zona donde se ve el código para que el OCR lea menos ruido.
                </p>
              </div>

              <div className="relative bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-200">
                <img src={flow.previewUrl} alt="" className="w-full max-h-[320px] object-contain" />
                <div
                  className="absolute border-2 border-amber-500 bg-amber-400/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
                  style={{
                    left: `${cropBox.x}%`,
                    top: `${cropBox.y}%`,
                    width: `${cropBox.width}%`,
                    height: `${cropBox.height}%`,
                  }}
                />
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 space-y-3">
                {([
                  ['x', 'Izquierda'],
                  ['y', 'Arriba'],
                  ['width', 'Ancho'],
                  ['height', 'Alto'],
                ] as const).map(([key, label]) => (
                  <label key={key} className="grid grid-cols-[72px_1fr_40px] items-center gap-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    <span>{label}</span>
                    <input
                      type="range"
                      min={key === 'width' || key === 'height' ? 10 : 0}
                      max={key === 'x' ? 90 - cropBox.width : key === 'y' ? 90 - cropBox.height : 100 - (key === 'width' ? cropBox.x : cropBox.y)}
                      value={cropBox[key]}
                      onChange={e => setCropBox(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="accent-amber-500"
                    />
                    <span className="text-right text-zinc-700">{cropBox[key]}%</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {flow.step === 'unreadable' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <AlertCircle className="w-10 h-10 text-zinc-300 mb-3" strokeWidth={2} />
              <h2 className="text-xl font-black text-zinc-900">No pudimos leerlo bien</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">Podés intentarlo de nuevo o ingresar el código manualmente.</p>
            </div>
          )}

          {flow.step === 'manual' && (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Ingresá el código</h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  Escribí el código tal como aparece en la cápsula. Lo normalizamos antes de validar.
                </p>
              </div>

              <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                <input
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value)}
                  placeholder="CUW 8"
                  className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500"
                />
                <p className="text-xs font-medium text-zinc-500 mt-2">Ejemplo: `CUW 8` → `CUW008`</p>
              </div>
            </div>
          )}

          {flow.step === 'success' && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <Check className="w-8 h-8" strokeWidth={3} />
              </div>
              <h2 className="text-xl font-black text-zinc-900">Figurita guardada</h2>
              <p className="text-sm font-medium text-zinc-500 mt-2 max-w-[320px]">Actualizamos tu álbum y sumamos la repetida si ya la tenías.</p>
            </div>
          )}

          {flow.step === 'review' && (
            <div className="p-5 space-y-4">
              <div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                  {hasLowConfidenceResult ? 'Revisá el código detectado' : 'Revisá la carga'}
                </h2>
                <p className="text-sm text-zinc-500 font-medium mt-2 leading-relaxed">
                  {hasLowConfidenceResult
                    ? 'Leímos este código, pero puede no ser correcto. Confirmalo o corregilo antes de guardarlo.'
                    : 'Detectamos este código en la foto. Confirmá cuál querés guardar en tu álbum.'}
                </p>
              </div>

              <div className="space-y-3">
                {flow.detections.map(item => (
                  <div key={item.id} className="bg-zinc-50 border border-zinc-200 rounded-2xl p-3 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-11 bg-white border border-zinc-200 rounded-xl flex items-center justify-center font-black text-amber-600 shadow-sm">
                        {formatStickerDisplayId(item.code)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-zinc-900 truncate">
                          {item.sticker ? (item.sticker.nombreFigura || formatStickerDisplayId(item.sticker.codigoFigura)) : 'Necesita revisión'}
                        </p>
                        <p className={`text-xs font-bold truncate ${item.status === 'needs_review' ? 'text-amber-600' : 'text-zinc-400'}`}>
                          {item.status === 'needs_review'
                            ? `Código leído: ${item.rawText ?? item.code}${item.confidence ? ` · ${Math.round(item.confidence)}%` : ''}`
                            : item.sticker?.subseccion}
                        </p>
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
                              updateDetection(item.id, { sticker, code: sticker.codigoFigura, status: 'detected', rawText: item.rawText ?? item.code })
                              setSearchById(prev => ({ ...prev, [item.id]: '' }))
                            }}
                            className="text-left bg-white border border-zinc-200 rounded-xl px-3 py-2 hover:border-amber-300 hover:bg-amber-50 transition-colors"
                          >
                            <span className="text-xs font-black text-amber-600 mr-2">{formatStickerDisplayId(sticker.codigoFigura)}</span>
                            <span className="text-sm font-bold text-zinc-800">{sticker.nombreFigura || formatStickerDisplayId(sticker.codigoFigura)}</span>
                            <span className="text-xs font-medium text-zinc-400 ml-2">{sticker.subseccion}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {item.status === 'needs_review' && item.sticker && (
                      <button
                        onClick={() => updateDetection(item.id, { status: 'detected' })}
                        className="w-full bg-amber-500 text-white font-bold py-2.5 px-3 rounded-xl hover:bg-amber-600 transition-all active:scale-[0.98]"
                      >
                        Confirmar código
                      </button>
                    )}
                    {item.status === 'unreadable' && (
                      <div className="bg-zinc-100 border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-500">
                        No pudimos validar este código.
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {hasPendingReview && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-xs font-bold text-amber-800 leading-relaxed">
                    Hay códigos que necesitan revisión. Corregilos o elimínalos antes de guardar.
                  </p>
                </div>
              )}

              {debugVisible && scanDebug && (
                <div className="space-y-3 border border-dashed border-zinc-300 rounded-2xl p-3 bg-zinc-50">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Debug OCR</p>
                    <a className="text-xs font-bold text-amber-600" href={scanDebug.originalUrl} download="ocr-original.png">Descargar original</a>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[['Original', scanDebug.originalUrl], ['Región', scanDebug.approxUrl], ['Cápsula', scanDebug.capsuleUrl], ['OCR', scanDebug.preprocessedUrl]].map(([label, url]) => (
                      <div key={label} className="bg-white border border-zinc-200 rounded-xl p-2 space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
                        {url ? <img src={url} alt={label} className="w-full h-28 object-contain bg-zinc-50 rounded-lg" /> : <div className="h-28 rounded-lg bg-zinc-100" />}
                      </div>
                    ))}
                  </div>
                  <div className="text-[11px] font-medium text-zinc-600 space-y-1">
                    <p><strong>Coordenadas:</strong> x={scanDebug.approximateRegion.x}, y={scanDebug.approximateRegion.y}, w={scanDebug.approximateRegion.width}, h={scanDebug.approximateRegion.height}</p>
                    <p><strong>Raw:</strong> {scanDebug.rawText || 'vacío'}</p>
                    <p><strong>Limpio:</strong> {scanDebug.cleanedText || 'vacío'}</p>
                    <p><strong>Regex:</strong> {scanDebug.regexMatch || 'sin match'}</p>
                    <p><strong>Normalizado:</strong> {scanDebug.normalizedCode || 'sin código'}</p>
                    <p><strong>Catálogo:</strong> {scanDebug.existsInCatalog ? 'true' : 'false'}</p>
                    <p><strong>Decisión:</strong> {scanDebug.decision}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 p-4 md:pb-8 bg-white border-t border-zinc-200/60 shadow-[0_-4px_15px_rgba(0,0,0,0.02)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {flow.step === 'intro' && (
            <div className="flex gap-2">
              <button onClick={() => pickPhoto(false)} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-4 rounded-2xl hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                <ImagePlus className="w-5 h-5" strokeWidth={2.5} />
                Subir foto
              </button>
              <button onClick={() => pickPhoto(true)} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                Ajustar área
              </button>
            </div>
          )}
          {flow.step === 'crop' && (
            <div className="flex gap-2">
              <button onClick={() => { URL.revokeObjectURL(flow.previewUrl); setFlow({ step: 'intro' }) }} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                Volver
              </button>
              <button onClick={processCroppedFile} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all">
                Leer área
              </button>
            </div>
          )}
          {flow.step === 'review' && (
            <div className="flex gap-2">
              <button onClick={retry} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all flex items-center justify-center gap-2">
                <RotateCcw className="w-5 h-5" strokeWidth={2.5} />
                Escanear otra vez
              </button>
              <button onClick={confirm} disabled={flow.detections.length === 0 || hasPendingReview} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all">
                Guardar figurita
              </button>
            </div>
          )}
          {flow.step === 'unreadable' && (
            <div className="flex gap-2">
              <button onClick={retry} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all">
                Escanear otra vez
              </button>
              <button onClick={() => setFlow({ step: 'manual' })} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                Ingresar código
              </button>
            </div>
          )}
          {flow.step === 'manual' && (
            <div className="flex gap-2">
              <button onClick={() => { setManualCode(''); setFlow({ step: 'unreadable' }) }} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                Volver
              </button>
              <button onClick={handleManualConfirm} className="flex-1 bg-zinc-900 text-white font-bold py-3 px-3 rounded-2xl hover:bg-zinc-800 transition-all">
                Confirmar
              </button>
            </div>
          )}
          {flow.step === 'success' && (
            <div className="flex gap-2">
              <button onClick={retry} className="flex-1 bg-white border-2 border-zinc-200 text-zinc-700 font-bold py-3 px-3 rounded-2xl hover:bg-zinc-50 transition-all">
                Escanear otra vez
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
