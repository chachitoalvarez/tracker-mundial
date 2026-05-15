import rawData from './panini_mundial_2026_980_limpio.json'
import type { Sticker, AlbumSection, StickerType, TipoColeccion, Acabado } from '@/types/album'

interface RawSticker {
  numero_orden: number
  seccion: string
  subseccion: string
  codigo_figura: string
  pais_equipo: string
  nombre_figura: string
  nombre_jugador: string
  tipo_figura: string
  tipo_coleccion: string
  es_especial: boolean
  acabado: string
}

// ── Album metadata ──

export const albumMeta = {
  slug: rawData.album.slug,
  nombre: rawData.album.nombre,
  totalFiguritas: rawData.album.total_figuritas,
}

// ── Parse all 980 stickers ──

export const albumStickers: Sticker[] = (rawData.figuritas as RawSticker[]).map(f => ({
  id: `wc2026:base:${f.codigo_figura}`,
  numeroOrden: f.numero_orden,
  seccion: f.seccion,
  subseccion: f.subseccion,
  codigoFigura: f.codigo_figura,
  paisEquipo: f.pais_equipo,
  nombreFigura: f.nombre_figura,
  nombreJugador: f.nombre_jugador,
  tipoFigura: f.tipo_figura as StickerType,
  tipoColeccion: f.tipo_coleccion as TipoColeccion,
  esEspecial: f.es_especial,
  acabado: f.acabado as Acabado,
}))

// Integrity check
if (albumStickers.length !== 980) {
  console.error('Album integrity check failed: expected 980, got', albumStickers.length)
}

// ── Build sections from sticker groupings ──

function buildSections(): AlbumSection[] {
  const sectionMap = new Map<string, { stickers: Sticker[]; seccion: string }>()

  for (const s of albumStickers) {
    const existing = sectionMap.get(s.subseccion)
    if (existing) {
      existing.stickers.push(s)
    } else {
      sectionMap.set(s.subseccion, { stickers: [s], seccion: s.seccion })
    }
  }

  const sections: AlbumSection[] = []
  for (const [subseccion, { stickers, seccion }] of sectionMap) {
    const sorted = stickers.sort((a, b) => a.numeroOrden - b.numeroOrden)
    const first = sorted[0]
    const last = sorted[sorted.length - 1]
    // Extract code prefix: "ARG001" → "ARG", "PL000" → "PL"
    const prefixMatch = first.codigoFigura.match(/^([A-Z]+)/)
    const codigoBase = prefixMatch ? prefixMatch[1] : ''

    sections.push({
      section: subseccion,
      needed: stickers.length,
      collected: {},
      seccion,
      subseccion,
      codigoBase,
      ordenInicio: first.numeroOrden,
      ordenFin: last.numeroOrden,
      cantidad: stickers.length,
    })
  }

  return sections.sort((a, b) => a.ordenInicio - b.ordenInicio)
}

export const albumSections: AlbumSection[] = buildSections()
export const albumData: AlbumSection[] = albumSections

// ── Indices for O(1) lookups ──

export const stickersByCode: Map<string, Sticker> = new Map(
  albumStickers.map(s => [s.codigoFigura, s])
)

export const stickersBySubseccion: Map<string, Sticker[]> = albumStickers.reduce(
  (acc, sticker) => {
    const arr = acc.get(sticker.subseccion) ?? []
    arr.push(sticker)
    acc.set(sticker.subseccion, arr)
    return acc
  },
  new Map<string, Sticker[]>()
)

export const stickerCodesBySubseccion: Map<string, Set<string>> = albumStickers.reduce(
  (acc, sticker) => {
    const codes = acc.get(sticker.subseccion) ?? new Set<string>()
    codes.add(sticker.codigoFigura)
    acc.set(sticker.subseccion, codes)
    return acc
  },
  new Map<string, Set<string>>()
)
