import rawData from './panini_mundial_2026_album_base_980.json'
import type { Sticker, AlbumSection, StickerType } from '@/types/album'

interface RawSection {
  seccion: string
  subseccion: string
  codigo_rango: string
  orden_inicio: number
  orden_fin: number
  cantidad: number
}

interface RawSticker {
  numero_orden: number
  seccion: string
  subseccion: string
  codigo_figura: string
  codigo_alias: string
  pais_equipo: string
  nombre_figura: string
  tipo_figura: string
  notas: string
  album_layer: string
}

// Extraer el prefijo del código_rango (ej: "ARG001-ARG020" → "ARG", "PL000" → "PL")
function extractBaseCode(rango: string): string {
  return rango.split(/\d/)[0]
}

export const albumMeta = {
  id: rawData.album.id,
  nombre: rawData.album.nombre,
  totalFiguritas: rawData.album.total_figuritas_base,
  totalSelecciones: rawData.album.total_selecciones,
}

export const albumSections: AlbumSection[] = (rawData.secciones as RawSection[]).map(s => ({
  section: s.subseccion,
  needed: s.cantidad,
  collected: {},
  seccion: s.seccion,
  subseccion: s.subseccion,
  codigoBase: extractBaseCode(s.codigo_rango),
  ordenInicio: s.orden_inicio,
  ordenFin: s.orden_fin,
  cantidad: s.cantidad,
}))

export const albumData: AlbumSection[] = albumSections

export const albumStickers: Sticker[] = (rawData.figuritas as RawSticker[]).map(f => ({
  numeroOrden: f.numero_orden,
  seccion: f.seccion,
  subseccion: f.subseccion,
  codigoFigura: f.codigo_figura,
  codigoAlias: f.codigo_alias,
  paisEquipo: f.pais_equipo,
  nombreFigura: f.nombre_figura,
  tipoFigura: f.tipo_figura as StickerType,
  notas: f.notas,
  albumLayer: f.album_layer,
}))

// Integrity check
if (albumStickers.length !== 980) {
  console.error('Album integrity check failed:', albumStickers.length)
}

// Índice por código canónico para lookup O(1)
export const stickersByCode: Map<string, Sticker> = new Map(
  albumStickers.map(s => [s.codigoFigura, s])
)

// Índice por subsección para agrupar
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
