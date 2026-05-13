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

export interface Sticker {
  numeroOrden: number          // 1..980
  seccion: string              // "Apertura" | "Grupo A" .. "Grupo L" | "Cierre"
  subseccion: string           // "Intro torneo" | "México" | "Argentina" | "Historia de la Copa"
  codigoFigura: string         // canónico con padding: "ARG001"
  codigoAlias: string          // sin padding: "ARG1"
  paisEquipo: string           // "Argentina" o "" para secciones especiales
  nombreFigura: string         // descripción/placeholder del jugador
  tipoFigura: StickerType
  notas: string
  albumLayer: string           // siempre "album_base_980"
}

export interface AlbumSection {
  section: string
  needed: number
  collected: StickerCount
  seccion: string              // "Apertura" | "Grupo A" .. "Cierre"
  subseccion: string           // identifica la subsección/país
  codigoBase: string           // prefijo del código: "ARG", "MEX", "FWC", "PL"
  ordenInicio: number
  ordenFin: number
  cantidad: number             // cantidad de figuritas en esta subsección
}

// El estado del álbum del usuario usa código canónico como clave plana.
export type StickerCount = Record<string, number>
export type UserStickerCount = Record<string, number>
// Ejemplo: { "ARG001": 2, "MEX010": 1, "FWC008": 1 }

export type StickerStatus = 'missing' | 'unique' | 'repeated'
export type DetailFilter = 'repeated' | 'unique' | 'missing' | null

export interface AlbumStats {
  totalNeeded: number
  totalCompleted: number
  percentage: number
  missing: number
  totalRepeated: number
}
