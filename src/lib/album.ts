import { albumData } from '@/data/albumData'
import type { PlayerInfo } from '@/types/album'

export function getPlayerInfo(section: string, number: number): PlayerInfo | null {
  const sectionData = albumData.find(s => s.section === section)
  if (!sectionData?.players) return null
  return sectionData.players.find(p => p.number === number) ?? null
}
