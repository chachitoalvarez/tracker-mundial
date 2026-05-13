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
}

export type ScanMockMode = 'normal' | 'empty' | 'too_many'

const OCR_TIMEOUT_MS = 30000
const STRICT_CODE_REGEX = /\b([A-Z]{3})[\s-]?(\d{1,3})\b/g

function normalizeOcrCandidate(prefix: string, number: string): string {
  return `${prefix.toUpperCase()}${number.padStart(3, '0')}`
}

export function extractStickerCodesFromText(text: string): DetectedSticker[] {
  const upperText = text.toUpperCase()
  const matches = Array.from(upperText.matchAll(STRICT_CODE_REGEX))
  const grouped = new Map<string, DetectedSticker>()
  const debugRows: Array<{ rawMatch: string; normalizedCode: string; exactCatalogMatch: boolean }> = []

  for (const match of matches) {
    const rawText = match[0]
    const code = normalizeOcrCandidate(match[1], match[2])
    const sticker = getStickerByCanonicalCode(code)
    const current = grouped.get(code)

    grouped.set(code, {
      id: current?.id ?? code,
      code,
      quantity: (current?.quantity ?? 0) + 1,
      status: sticker ? 'detected' : 'needs_review',
      sticker: sticker ?? current?.sticker,
      rawText: current?.rawText ? `${current.rawText}, ${rawText}` : rawText,
    })

    debugRows.push({
      rawMatch: rawText,
      normalizedCode: code,
      exactCatalogMatch: !!sticker,
    })
  }

  const detections = Array.from(grouped.values())

  if (import.meta.env.DEV) {
    console.groupCollapsed('[Sticker OCR] strict extraction')
    console.log('rawText:', text)
    console.table(debugRows)
    console.log('detections:', detections.map(item => ({
      code: item.code,
      quantity: item.quantity,
      status: item.status,
      sticker: item.sticker?.codigoFigura ?? null,
      rawText: item.rawText,
    })))
    console.groupEnd()
  }

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

async function runClientOcr(file: File): Promise<string> {
  const result = await withTimeout(
    Tesseract.recognize(file, 'eng'),
    OCR_TIMEOUT_MS,
  )
  return result.data.text ?? ''
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
  }]
}

export async function detectStickersFromPhoto(file: File): Promise<DetectedSticker[]> {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_SCAN_MOCK === 'true') {
    return mockDetectStickersFromPhoto(file)
  }

  // OCR client-side: no API keys, no generative AI. The service boundary lets us swap this later.
  const text = await runClientOcr(file)
  if (!text.trim()) return []
  return extractStickerCodesFromText(text)
}
