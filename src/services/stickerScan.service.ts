import { albumStickers } from '@/data/albumData'
import type { Sticker } from '@/types/album'

export interface DetectedSticker {
  id: string
  sticker: Sticker
  quantity: number
}

export type ScanMockMode = 'normal' | 'empty' | 'too_many'

function pickSticker(seed: number): Sticker {
  const index = Math.abs(seed) % albumStickers.length
  return albumStickers[index]
}

function getSeed(file: File): number {
  return Array.from(file.name).reduce((acc, char) => acc + char.charCodeAt(0), file.size || 1)
}

export async function mockDetectStickersFromPhoto(file: File, mode: ScanMockMode = 'normal'): Promise<DetectedSticker[]> {
  await new Promise(resolve => setTimeout(resolve, 700))

  // Mock temporal: reemplazar esta función por OCR/IA real cuando exista el backend de detección.
  if (mode === 'empty' || file.name.toLowerCase().includes('empty')) return []

  const seed = getSeed(file)
  const total = mode === 'too_many' || file.name.toLowerCase().includes('many')
    ? 12
    : Math.min(6, Math.max(2, (seed % 5) + 2))

  const counts = new Map<string, { sticker: Sticker; quantity: number }>()
  for (let i = 0; i < total; i += 1) {
    const sticker = pickSticker(seed + i * 37)
    const current = counts.get(sticker.codigoFigura)
    counts.set(sticker.codigoFigura, {
      sticker,
      quantity: (current?.quantity ?? 0) + 1,
    })
  }

  return Array.from(counts.values()).map((item, index) => ({
    id: `${item.sticker.codigoFigura}-${index}`,
    sticker: item.sticker,
    quantity: item.quantity,
  }))
}
