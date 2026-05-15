export type StickerType =
  | 'jugador'
  | 'escudo'
  | 'equipo'
  | 'leyenda / histórico'
  | 'país'
  | 'portada / introducción'
  | 'especial'
  | 'mascota'
  | 'logo'
  | 'estadio'

export type TipoColeccion = 'normal' | 'especial'
export type Acabado = 'standard' | 'foil'

export interface Sticker {
  /** Internal ID: wc2026:base:${codigoFigura} */
  id: string
  numeroOrden: number          // 1..980
  seccion: string              // "Apertura" | "Grupo A" .. "Grupo L" | "Cierre"
  subseccion: string           // "Intro torneo" | "México" | "Argentina" | "Historia de la Copa"
  codigoFigura: string         // canónico con padding: "ARG001"
  paisEquipo: string           // "Argentina" o "" para secciones especiales
  nombreFigura: string         // descripción visible
  nombreJugador: string        // nombre del jugador (solo cuando tipoFigura === 'jugador')
  tipoFigura: StickerType
  tipoColeccion: TipoColeccion
  esEspecial: boolean
  acabado: Acabado
}

export interface AlbumSection {
  section: string              // subseccion — used as display name / lookup key
  needed: number               // cantidad de figuritas en esta subsección
  collected: StickerCount      // user state: { "ARG001": 2, "ARG002": 0, ... }
  seccion: string              // "Apertura" | "Grupo A" .. "Cierre"
  subseccion: string           // identifica la subsección/país
  codigoBase: string           // prefijo del código: "ARG", "MEX", "FWC", "PL"
  ordenInicio: number
  ordenFin: number
  cantidad: number
}

// User album state: canonical code → count (0 = faltante, 1 = la_tengo, 2+ = repetida)
export type StickerCount = Record<string, number>
export type UserStickerCount = Record<string, number>

export type StickerStatus = 'missing' | 'unique' | 'repeated'
export type DetailFilter = 'repeated' | 'unique' | 'missing' | null

export interface AlbumStats {
  totalNeeded: number
  totalCompleted: number
  percentage: number
  missing: number
  totalRepeated: number
}
