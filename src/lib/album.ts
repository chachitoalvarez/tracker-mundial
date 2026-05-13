import { stickersByCode, stickersBySubseccion, albumStickers } from '@/data/albumData'
import type { Sticker } from '@/types/album'

interface PlayerInfo {
  number: number
  name: string
  role?: 'captain' | 'coach' | 'special'
}

/**
 * Normaliza un código de figurita ingresado por el usuario al formato canónico.
 * Acepta: ARG1, ARG01, ARG001, arg17, etc.
 * Devuelve: ARG001, ARG017, etc. (uppercase + 3 dígitos)
 * Devuelve null si el formato es inválido o el código no existe.
 */
export function normalizeStickerCode(input: string): string | null {
  if (!input) return null
  const cleaned = input.trim().toUpperCase().replace(/[\s\-_]/g, '')
  const match = cleaned.match(/^([A-Z]{2,4})(\d+)$/)
  if (!match) return null

  const [, prefix, num] = match
  const paddedNum = num.padStart(3, '0')
  const canonical = `${prefix}${paddedNum}`

  // Validar que el código existe en el catálogo
  return stickersByCode.has(canonical) ? canonical : null
}

/**
 * Busca una figurita por código canónico o alias.
 * Acepta ARG1, ARG017, etc.
 */
export function findStickerByCode(input: string): Sticker | null {
  const canonical = normalizeStickerCode(input)
  if (!canonical) return null
  return stickersByCode.get(canonical) ?? null
}

export function getStickerByCanonicalCode(code: string): Sticker | null {
  return stickersByCode.get(code) ?? null
}

/**
 * Devuelve el ID legible para mostrar en la UI (sin padding).
 * Útil para chips: "ARG001" → "ARG1", "FWC008" → "FWC8".
 * Si querés el canónico (con padding), usá sticker.codigoFigura directamente.
 */
export function formatStickerDisplayId(codigoFigura: string): string {
  const match = codigoFigura.match(/^([A-Z]+)(\d+)$/)
  if (!match) return codigoFigura
  const [, prefix, num] = match
  return `${prefix}${parseInt(num, 10)}`
}

/**
 * Búsqueda libre: por código, alias, nombre del jugador, o país/equipo.
 * Devuelve sticker matches ordenados por relevancia simple.
 */
export function searchStickers(query: string): Sticker[] {
  if (!query.trim()) return []
  const q = query.trim().toLowerCase()

  // Si parece un código, intentar matchear exacto primero
  const codeMatch = findStickerByCode(query)
  if (codeMatch) return [codeMatch]

  // Si no, búsqueda libre por nombre o país
  return albumStickers.filter(s =>
    s.nombreFigura.toLowerCase().includes(q) ||
    s.paisEquipo.toLowerCase().includes(q) ||
    s.subseccion.toLowerCase().includes(q)
  ).slice(0, 50) // limitar resultados
}

export function describeStickerCode(code: string): string {
  const sticker = getStickerByCanonicalCode(code)
  if (!sticker) return code
  return `${formatStickerDisplayId(code)} de ${sticker.subseccion}`
}

export function getPlayerInfo(section: string, number: number): PlayerInfo | null {
  const sticker = stickersBySubseccion.get(section)?.[number - 1]
  if (!sticker) return null

  return {
    number,
    name: sticker.nombreFigura || sticker.codigoAlias || `Figurita ${number}`,
    role: sticker.tipoFigura === 'especial' ? 'special' : undefined,
  }
}
