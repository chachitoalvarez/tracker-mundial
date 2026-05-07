export type StickerCount = Record<number, number>

export interface AlbumSection {
  section: string
  needed: number
  collected: StickerCount
}

export type StickerStatus = 'missing' | 'unique' | 'repeated'
export type DetailFilter = 'repeated' | 'unique' | 'missing' | null

export interface AlbumStats {
  totalNeeded: number
  totalCompleted: number
  percentage: number
  missing: number
  totalRepeated: number
}
