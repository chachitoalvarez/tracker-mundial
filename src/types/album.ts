export type StickerCount = Record<number, number>

export interface PlayerInfo {
  number: number
  name: string
  role?: 'captain' | 'coach' | 'special'
}

export interface AlbumSection {
  section: string
  needed: number
  collected: StickerCount
  players?: PlayerInfo[]
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
