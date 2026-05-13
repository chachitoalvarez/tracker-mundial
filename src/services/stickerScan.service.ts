import { albumStickers } from '@/data/albumData'
import { findStickerByCode } from '@/lib/album'
import type { Sticker } from '@/types/album'

export interface DetectedSticker {
  id: string
  sticker: Sticker
  quantity: number
}

export type ScanMockMode = 'normal' | 'empty' | 'too_many'

function findStickerCodeInFileName(fileName: string): Sticker | null {
  const matches = fileName.toUpperCase().match(/[A-Z]{2,4}[\s_-]?\d{1,3}/g) ?? []
  for (const match of matches) {
    const sticker = findStickerByCode(match)
    if (sticker) return sticker
  }
  return null
}

function pickDemoSticker(file: File): Sticker {
  const seedText = `${file.name}:${file.size}:${file.lastModified}`
  const seed = Array.from(seedText).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return albumStickers[Math.abs(seed) % albumStickers.length]
}

export async function mockDetectStickersFromPhoto(file: File, mode: ScanMockMode = 'normal'): Promise<DetectedSticker[]> {
  await new Promise(resolve => setTimeout(resolve, 700))

  // Mock temporal: reemplazar esta función por OCR/IA real cuando exista el backend de detección.
  if (mode === 'empty' || file.name.toLowerCase().includes('empty')) return []

  if (mode === 'too_many' || file.name.toLowerCase().includes('many')) {
    return albumStickers.slice(0, 11).map((sticker, index) => ({
      id: `${sticker.codigoFigura}-${index}`,
      sticker,
      quantity: 1,
    }))
  }

  const sticker = findStickerCodeInFileName(file.name) ?? pickDemoSticker(file)

  return [{
    id: `${sticker.codigoFigura}-0`,
    sticker,
    quantity: 1,
  }]
}
