import Tesseract from 'tesseract.js'
import { albumStickers } from '@/data/albumData'
import type { Sticker } from '@/types/album'
import { findStickerByCode, getStickerByCanonicalCode, formatStickerDisplayId } from '@/lib/album'

export interface DetectedSticker {
  id: string
  code: string
  quantity: number
  status: 'detected' | 'needs_review' | 'unreadable'
  sticker?: Sticker
  rawText?: string
  confidence?: number
}

export interface ScanDebugInfo {
  originalSize: { width: number; height: number }
  approximateRegion: { x: number; y: number; width: number; height: number }
  capsuleRegion?: { x: number; y: number; width: number; height: number } | null
  cropFinalSize?: { width: number; height: number } | null
  ocrInputSize?: { width: number; height: number } | null
  rawText: string
  cleanedText: string
  regexMatch: string | null
  normalizedCode: string | null
  existsInCatalog: boolean
  confidence: number
  decision: DetectedSticker['status']
  originalUrl?: string
  approxUrl?: string
  capsuleUrl?: string
  preprocessedUrl?: string
}

export interface StickerScanResult {
  detection: DetectedSticker | null
  debug: ScanDebugInfo
}

export type ScanMockMode = 'normal' | 'empty'

interface OcrWord {
  text: string
  confidence: number
}

interface PageLike {
  text?: string
  confidence?: number
  words?: OcrWord[]
}

const OCR_TIMEOUT_MS = 35000
const CODE_REGEX = /([A-Z]{3})\s?(\d{1,3})/
const CONFIDENCE_THRESHOLD = 85
const AVOID_PREFIXES = new Set(['CHW', 'CUV', 'CUWB'])

function prefixExists(prefix: string): boolean {
  return albumStickers.some(sticker => sticker.codigoFigura.startsWith(prefix))
}

function cleanText(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function normalizeCode(prefix: string, number: string): string {
  return `${prefix.toUpperCase()}${number.padStart(3, '0')}`
}

function getWords(page: PageLike): OcrWord[] {
  return page.words ?? []
}

function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png')
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('OCR timeout')), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  }) as Promise<T>
}

function extractCandidate(rawText: string, confidence: number): { match: string | null; normalizedCode: string | null; sticker?: Sticker; status: DetectedSticker['status'] } {
  const cleanedText = cleanText(rawText)
  const match = cleanedText.match(CODE_REGEX)
  if (!match) {
    return { match: null, normalizedCode: null, status: 'unreadable' }
  }

  const prefix = match[1]
  if (!prefixExists(prefix) || AVOID_PREFIXES.has(prefix)) {
    return {
      match: match[0],
      normalizedCode: normalizeCode(prefix, match[2]),
      status: 'needs_review',
    }
  }

  const normalizedCode = normalizeCode(prefix, match[2])
  const sticker = getStickerByCanonicalCode(normalizedCode)
  if (!sticker) {
    return {
      match: match[0],
      normalizedCode,
      status: 'needs_review',
    }
  }

  return {
    match: match[0],
    normalizedCode,
    sticker,
    status: confidence >= CONFIDENCE_THRESHOLD ? 'detected' : 'needs_review',
  }
}

function debugLog(debug: ScanDebugInfo) {
  if (!import.meta.env.DEV) return
  console.groupCollapsed('[Sticker OCR] single-capsule')
  console.log('originalSize:', debug.originalSize)
  console.log('approximateRegion:', debug.approximateRegion)
  console.log('capsuleRegion:', debug.capsuleRegion)
  console.log('cropFinalSize:', debug.cropFinalSize)
  console.log('ocrInputSize:', debug.ocrInputSize)
  console.log('rawText:', debug.rawText)
  console.log('cleanedText:', debug.cleanedText)
  console.log('regexMatch:', debug.regexMatch)
  console.log('normalizedCode:', debug.normalizedCode)
  console.log('existsInCatalog:', debug.existsInCatalog)
  console.log('confidence:', debug.confidence)
  console.log('decision:', debug.decision)
  console.log('originalUrl:', debug.originalUrl)
  console.log('approxUrl:', debug.approxUrl)
  console.log('capsuleUrl:', debug.capsuleUrl)
  console.log('preprocessedUrl:', debug.preprocessedUrl)
  console.groupEnd()
}

function getImageSize(img: HTMLImageElement) {
  return { width: img.naturalWidth, height: img.naturalHeight }
}

function imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(image, 0, 0)
  return canvas
}

function cropCanvas(source: HTMLCanvasElement, rect: { x: number; y: number; width: number; height: number }): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(rect.width))
  canvas.height = Math.max(1, Math.round(rect.height))
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, canvas.width, canvas.height)
  return canvas
}

function toGrayscaleInPlace(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    data[i] = gray
    data[i + 1] = gray
    data[i + 2] = gray
  }
  ctx.putImageData(imageData, 0, 0)
}

function scaleCanvas(source: HTMLCanvasElement, scale: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale))
  canvas.height = Math.max(1, Math.round(source.height * scale))
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height)
  }
  return canvas
}

function addWhitePadding(source: HTMLCanvasElement, padding: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = source.width + padding * 2
  canvas.height = source.height + padding * 2
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(source, padding, padding)
  }
  return canvas
}

function preprocessCapsuleForOcr(source: HTMLCanvasElement): HTMLCanvasElement {
  const grayscale = cropCanvas(source, { x: 0, y: 0, width: source.width, height: source.height })
  toGrayscaleInPlace(grayscale)
  const scaled = scaleCanvas(grayscale, 5)
  return addWhitePadding(scaled, 20)
}

function detectDarkCapsule(source: HTMLCanvasElement): { capsule: { x: number; y: number; width: number; height: number } | null; approx: { x: number; y: number; width: number; height: number } } {
  const approx = {
    x: Math.round(source.width * 0.55),
    y: Math.round(source.height * 0.06),
    width: Math.round(source.width * 0.4),
    height: Math.round(source.height * 0.16),
  }

  const ctx = source.getContext('2d', { willReadFrequently: true })
  if (!ctx) return { capsule: null, approx }

  const imageData = ctx.getImageData(approx.x, approx.y, approx.width, approx.height)
  const { data } = imageData
  const visited = new Uint8Array(approx.width * approx.height)

  const isDark = (x: number, y: number) => {
    const index = (y * approx.width + x) * 4
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    return (r + g + b) / 3 < 100
  }

  let best: { x0: number; y0: number; x1: number; y1: number; area: number } | null = null
  const queue: Array<[number, number]> = []

  for (let y = 0; y < approx.height; y += 1) {
    for (let x = 0; x < approx.width; x += 1) {
      const index = y * approx.width + x
      if (visited[index] || !isDark(x, y)) continue

      visited[index] = 1
      queue.length = 0
      queue.push([x, y])
      let head = 0
      let x0 = x
      let x1 = x
      let y0 = y
      let y1 = y
      let area = 0

      while (head < queue.length) {
        const [cx, cy] = queue[head]
        head += 1
        area += 1
        x0 = Math.min(x0, cx)
        x1 = Math.max(x1, cx)
        y0 = Math.min(y0, cy)
        y1 = Math.max(y1, cy)

        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (nx < 0 || ny < 0 || nx >= approx.width || ny >= approx.height) continue
          const nIndex = ny * approx.width + nx
          if (visited[nIndex] || !isDark(nx, ny)) continue
          visited[nIndex] = 1
          queue.push([nx, ny])
        }
      }

      const width = x1 - x0 + 1
      const height = y1 - y0 + 1
      const ratio = width / Math.max(height, 1)
      if (area > 100 && ratio > 1.8 && width > approx.width * 0.25) {
        if (!best || area > best.area) best = { x0, y0, x1, y1, area }
      }
    }
  }

  if (!best) return { capsule: null, approx }

  const padding = Math.round(Math.min(source.width, source.height) * 0.01)
  const capsule = {
    x: Math.max(0, approx.x + best.x0 - padding),
    y: Math.max(0, approx.y + best.y0 - padding),
    width: Math.min(source.width - (approx.x + best.x0 - padding), best.x1 - best.x0 + 1 + padding * 2),
    height: Math.min(source.height - (approx.y + best.y0 - padding), best.y1 - best.y0 + 1 + padding * 2),
  }

  return { capsule, approx }
}

async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function runOcrOnPreprocessedCanvas(canvas: HTMLCanvasElement): Promise<{ rawText: string; confidence: number; words: OcrWord[] }> {
  const worker = await Tesseract.createWorker('eng')
  try {
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    })

    const result = await withTimeout(worker.recognize(canvas), OCR_TIMEOUT_MS)
    const page = result.data as PageLike
    return {
      rawText: page.text ?? '',
      confidence: page.confidence ?? 0,
      words: getWords(page),
    }
  } finally {
    await worker.terminate()
  }
}

function buildDebugUrls(source: HTMLCanvasElement, approx: { x: number; y: number; width: number; height: number }, capsule: { x: number; y: number; width: number; height: number } | null, preprocessed: HTMLCanvasElement | null): Pick<ScanDebugInfo, 'originalUrl' | 'approxUrl' | 'capsuleUrl' | 'preprocessedUrl'> {
  const approxCanvas = cropCanvas(source, approx)
  const capsuleCanvas = capsule ? cropCanvas(source, capsule) : null
  return {
    originalUrl: canvasToDataUrl(source),
    approxUrl: canvasToDataUrl(approxCanvas),
    capsuleUrl: capsuleCanvas ? canvasToDataUrl(capsuleCanvas) : undefined,
    preprocessedUrl: preprocessed ? canvasToDataUrl(preprocessed) : undefined,
  }
}

function mockDetectStickersFromPhoto(file: File, mode: ScanMockMode = 'normal'): StickerScanResult {
  if (mode === 'empty' || file.name.toLowerCase().includes('empty')) {
    return {
      detection: null,
      debug: {
        originalSize: { width: 0, height: 0 },
        approximateRegion: { x: 0, y: 0, width: 0, height: 0 },
        rawText: '',
        cleanedText: '',
        regexMatch: null,
        normalizedCode: null,
        existsInCatalog: false,
        confidence: 0,
        decision: 'unreadable',
      },
    }
  }

  const sticker = findStickerByCode(file.name)
  if (!sticker) {
    return {
      detection: null,
      debug: {
        originalSize: { width: 0, height: 0 },
        approximateRegion: { x: 0, y: 0, width: 0, height: 0 },
        rawText: '',
        cleanedText: '',
        regexMatch: null,
        normalizedCode: null,
        existsInCatalog: false,
        confidence: 0,
        decision: 'unreadable',
      },
    }
  }

  const detection: DetectedSticker = {
    id: sticker.codigoFigura,
    code: sticker.codigoFigura,
    quantity: 1,
    status: 'detected',
    sticker,
    rawText: formatStickerDisplayId(sticker.codigoFigura),
    confidence: 100,
  }

  return {
    detection,
    debug: {
      originalSize: { width: 0, height: 0 },
      approximateRegion: { x: 0, y: 0, width: 0, height: 0 },
      rawText: formatStickerDisplayId(sticker.codigoFigura),
      cleanedText: formatStickerDisplayId(sticker.codigoFigura),
      regexMatch: formatStickerDisplayId(sticker.codigoFigura),
      normalizedCode: sticker.codigoFigura,
      existsInCatalog: true,
      confidence: 100,
      decision: 'detected',
    },
  }
}

export async function detectStickerFromPhoto(file: File): Promise<StickerScanResult> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_SCAN_MOCK === 'true') {
    return mockDetectStickersFromPhoto(file)
  }

  const image = await fileToImage(file)
  const source = imageToCanvas(image)
  const size = getImageSize(image)
  const { capsule, approx } = detectDarkCapsule(source)

  if (!capsule) {
    const debug: ScanDebugInfo = {
      originalSize: size,
      approximateRegion: approx,
      capsuleRegion: null,
      cropFinalSize: null,
      ocrInputSize: null,
      rawText: '',
      cleanedText: '',
      regexMatch: null,
      normalizedCode: null,
      existsInCatalog: false,
      confidence: 0,
      decision: 'unreadable',
      ...buildDebugUrls(source, approx, null, null),
    }
    debugLog(debug)
    return { detection: null, debug }
  }

  const finalCrop = cropCanvas(source, capsule)
  const preprocessed = preprocessCapsuleForOcr(finalCrop)
  const ocr = await runOcrOnPreprocessedCanvas(preprocessed)
  const candidate = extractCandidate(ocr.rawText, ocr.confidence)
  const existsInCatalog = !!candidate.normalizedCode && !!getStickerByCanonicalCode(candidate.normalizedCode)

  const detection: DetectedSticker | null = candidate.normalizedCode
    ? {
        id: candidate.normalizedCode,
        code: candidate.normalizedCode,
        quantity: 1,
        status: candidate.status,
        sticker: candidate.sticker,
        rawText: ocr.rawText,
        confidence: ocr.confidence,
      }
    : null

  const debug: ScanDebugInfo = {
    originalSize: size,
    approximateRegion: approx,
    capsuleRegion: capsule,
    cropFinalSize: { width: finalCrop.width, height: finalCrop.height },
    ocrInputSize: { width: preprocessed.width, height: preprocessed.height },
    rawText: ocr.rawText,
    cleanedText: cleanText(ocr.rawText),
    regexMatch: candidate.match,
    normalizedCode: candidate.normalizedCode,
    existsInCatalog,
    confidence: ocr.confidence,
    decision: detection?.status ?? 'unreadable',
    ...buildDebugUrls(source, approx, capsule, preprocessed),
  }

  debugLog(debug)

  if (!candidate.normalizedCode) {
    return { detection: null, debug }
  }

  if (!existsInCatalog) {
    return {
      detection: {
        id: candidate.normalizedCode,
        code: candidate.normalizedCode,
        quantity: 1,
        status: 'needs_review',
        rawText: ocr.rawText,
        confidence: ocr.confidence,
      },
      debug,
    }
  }

  return {
    detection: {
      id: candidate.normalizedCode,
      code: candidate.normalizedCode,
      quantity: 1,
      status: candidate.status,
      sticker: candidate.sticker,
      rawText: ocr.rawText,
      confidence: ocr.confidence,
    },
    debug,
  }
}
