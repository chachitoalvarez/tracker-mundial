import Tesseract from 'tesseract.js'
import { albumStickers } from '@/data/albumData'
import { findStickerByCode, getStickerByCanonicalCode } from '@/lib/album'
import type { Sticker } from '@/types/album'

export interface DetectedSticker {
  id: string
  code: string
  quantity: number
  status: 'detected' | 'needs_review'
  sticker?: Sticker
  rawText?: string
  confidence?: number
}

export type ScanMockMode = 'normal' | 'empty' | 'too_many'

interface OcrWord {
  text: string
  confidence: number
}

interface OcrVariantResult {
  variant: string
  rawText: string
  words: OcrWord[]
  detections: DetectedSticker[]
}

interface WordContainer {
  words?: OcrWord[]
  paragraphs?: Array<{ lines?: Array<{ words?: OcrWord[] }> }>
}

interface PageLike {
  text?: string
  confidence?: number
  words?: OcrWord[]
  blocks?: WordContainer[] | null
}

const OCR_TIMEOUT_MS = 45000
const STRICT_CODE_REGEX = /\b([A-Z]{3})[\s-]?(\d{1,3})\b/g
const DETECTED_CONFIDENCE_THRESHOLD = 88

function normalizeOcrCandidate(prefix: string, number: string): string {
  return `${prefix.toUpperCase()}${number.padStart(3, '0')}`
}

function cleanToken(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function getWords(page: PageLike): OcrWord[] {
  if (Array.isArray(page.words)) return page.words

  const words: OcrWord[] = []
  for (const block of page.blocks ?? []) {
    for (const paragraph of block.paragraphs ?? []) {
      for (const line of paragraph.lines ?? []) {
        words.push(...(line.words ?? []))
      }
    }
  }
  return words
}

function getMatchConfidence(rawText: string, words: OcrWord[]): number | undefined {
  const parts = rawText.split(/[\s-]+/).map(cleanToken).filter(Boolean)
  if (!parts.length) return undefined

  const confidences = parts.map(part => {
    const matchingWords = words.filter(word => cleanToken(word.text) === part)
    if (!matchingWords.length) return undefined
    return Math.max(...matchingWords.map(word => word.confidence))
  })

  const validConfidences = confidences.filter((confidence): confidence is number => confidence != null)
  if (validConfidences.length !== confidences.length) return undefined
  return validConfidences.reduce((acc, confidence) => acc + confidence, 0) / validConfidences.length
}

function debugExtraction(rawText: string, words: OcrWord[], detections: DetectedSticker[], variant?: string) {
  if (!import.meta.env.DEV) return

  console.groupCollapsed(`[Sticker OCR] ${variant ?? 'strict extraction'}`)
  console.log('rawText:', rawText)
  console.table(words.map(word => ({ text: word.text, confidence: word.confidence })))
  console.table(detections.map(item => ({
    rawText: item.rawText,
    normalizedCode: item.code,
    quantity: item.quantity,
    confidence: item.confidence ?? null,
    exactCatalogMatch: !!item.sticker,
    status: item.status,
  })))
  console.groupEnd()
}

export function extractStickerCodesFromText(text: string, words: OcrWord[] = []): DetectedSticker[] {
  const upperText = text.toUpperCase()
  const matches = Array.from(upperText.matchAll(STRICT_CODE_REGEX))
  const grouped = new Map<string, DetectedSticker>()

  for (const match of matches) {
    const rawText = match[0]
    const code = normalizeOcrCandidate(match[1], match[2])
    const sticker = getStickerByCanonicalCode(code)
    const confidence = getMatchConfidence(rawText, words)
    const current = grouped.get(code)
    const nextConfidence = Math.max(current?.confidence ?? 0, confidence ?? 0)

    grouped.set(code, {
      id: current?.id ?? code,
      code,
      quantity: (current?.quantity ?? 0) + 1,
      status: sticker && confidence != null && confidence >= DETECTED_CONFIDENCE_THRESHOLD ? 'detected' : 'needs_review',
      sticker: sticker ?? current?.sticker,
      rawText: current?.rawText ? `${current.rawText}, ${rawText}` : rawText,
      confidence: nextConfidence || undefined,
    })
  }

  const detections = Array.from(grouped.values())
  debugExtraction(text, words, detections)
  return detections
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('OCR timeout')), timeoutMs)
  })

  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
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

function createPreprocessedCanvas(
  image: HTMLImageElement,
  options: { scale: number; rotateDeg: number; threshold: boolean },
): HTMLCanvasElement {
  const radians = options.rotateDeg * Math.PI / 180
  const scaledWidth = image.naturalWidth * options.scale
  const scaledHeight = image.naturalHeight * options.scale
  const sin = Math.abs(Math.sin(radians))
  const cos = Math.abs(Math.cos(radians))
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(scaledWidth * cos + scaledHeight * sin)
  canvas.height = Math.ceil(scaledWidth * sin + scaledHeight * cos)

  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return canvas

  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(radians)
  ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
    const contrasted = Math.max(0, Math.min(255, (gray - 128) * 1.7 + 128))
    const value = options.threshold ? (contrasted > 150 ? 255 : 0) : contrasted
    data[i] = value
    data[i + 1] = value
    data[i + 2] = value
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas
}

async function runOcrVariants(file: File): Promise<OcrVariantResult[]> {
  const image = await fileToImage(file)
  const variants = [
    { label: 'contrast-0', scale: 2.5, rotateDeg: 0, threshold: false },
    { label: 'threshold-0', scale: 2.5, rotateDeg: 0, threshold: true },
    { label: 'threshold--5', scale: 2.5, rotateDeg: -5, threshold: true },
    { label: 'threshold-5', scale: 2.5, rotateDeg: 5, threshold: true },
  ]

  const worker = await Tesseract.createWorker('eng')
  try {
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789- ',
      tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
      preserve_interword_spaces: '1',
    })

    const results: OcrVariantResult[] = []
    for (const variant of variants) {
      const canvas = createPreprocessedCanvas(image, variant)
      const result = await withTimeout(worker.recognize(canvas), OCR_TIMEOUT_MS)
      const page = result.data as PageLike
      const rawText = page.text ?? ''
      const words = getWords(page)
      const detections = extractStickerCodesFromText(rawText, words)
      debugExtraction(rawText, words, detections, variant.label)
      results.push({ variant: variant.label, rawText, words, detections })
    }
    return results
  } finally {
    await worker.terminate()
  }
}

function selectConservativeDetections(variants: OcrVariantResult[]): DetectedSticker[] {
  const variantWithMostCodes = [...variants].sort((a, b) => b.detections.length - a.detections.length)[0]
  const primaryDetections = variantWithMostCodes?.detections ?? []

  return primaryDetections.map(detection => {
    const appearances = variants
      .flatMap(variant => variant.detections)
      .filter(item => item.code === detection.code)
    const agreementCount = new Set(
      variants
        .filter(variant => variant.detections.some(item => item.code === detection.code))
        .map(variant => variant.variant)
    ).size
    const maxConfidence = Math.max(...appearances.map(item => item.confidence ?? 0), detection.confidence ?? 0)
    const sticker = detection.sticker ?? getStickerByCanonicalCode(detection.code)
    const isReliable = !!sticker && maxConfidence >= DETECTED_CONFIDENCE_THRESHOLD && agreementCount >= 2

    return {
      ...detection,
      status: isReliable ? 'detected' : 'needs_review',
      sticker: sticker ?? detection.sticker,
      confidence: maxConfidence || detection.confidence,
      rawText: detection.rawText,
    }
  })
}

function mockDetectStickersFromPhoto(file: File, mode: ScanMockMode = 'normal'): DetectedSticker[] {
  if (mode === 'empty' || file.name.toLowerCase().includes('empty')) return []

  if (mode === 'too_many' || file.name.toLowerCase().includes('many')) {
    return albumStickers.slice(0, 11).map(sticker => ({
      id: sticker.codigoFigura,
      code: sticker.codigoFigura,
      quantity: 1,
      status: 'detected',
      sticker,
      rawText: sticker.codigoAlias,
      confidence: 100,
    }))
  }

  const sticker = findStickerByCode(file.name)
  if (!sticker) return []

  return [{
    id: sticker.codigoFigura,
    code: sticker.codigoFigura,
    quantity: 1,
    status: 'detected',
    sticker,
    rawText: sticker.codigoAlias,
    confidence: 100,
  }]
}

export async function detectStickersFromPhoto(file: File): Promise<DetectedSticker[]> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_SCAN_MOCK === 'true') {
    return mockDetectStickersFromPhoto(file)
  }

  // OCR client-side: no API keys, no generative AI. The service boundary lets us swap this later.
  const variants = await runOcrVariants(file)
  const hasAnyText = variants.some(variant => variant.rawText.trim())
  if (!hasAnyText) return []
  return selectConservativeDetections(variants)
}
