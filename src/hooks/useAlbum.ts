import { useState, useMemo } from 'react'
import { albumData as initialAlbumData } from '@/data/albumData'
import type { AlbumSection, DetailFilter } from '@/types/album'
import { computeStats } from '@/lib/stats'
import { useLocalStorage } from './useLocalStorage'
import { LOCAL_STORAGE_KEY, type Tab } from '@/lib/constants'

export function useAlbum(triggerCelebration: (type: 'sticker' | 'achievement' | 'match', msg: string, icon: string) => void) {
  const [albumData, setAlbumData] = useLocalStorage<AlbumSection[]>(LOCAL_STORAGE_KEY, initialAlbumData)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [detailFilter, setDetailFilter] = useState<DetailFilter>(null)

  const stats = useMemo(() => computeStats(albumData), [albumData])

  const filteredData = useMemo(
    () => albumData.filter(item => item.section.toLowerCase().includes(searchTerm.toLowerCase())),
    [albumData, searchTerm]
  )

  const currentSectionData = selectedSection !== 'all'
    ? albumData.find(s => s.section === selectedSection) ?? null
    : null

  const updateStickerCount = (sectionName: string, stickerNum: number, delta: number) => {
    setAlbumData(prev => prev.map(item => {
      if (item.section !== sectionName) return item
      const currentCount = item.collected[stickerNum] ?? 0
      const newCount = Math.max(0, currentCount + delta)

      if (currentCount === 0 && newCount === 1) {
        triggerCelebration('sticker', `¡Figurita pegada!\n${sectionName} #${stickerNum}`, 'star')
      }

      const newCollected = { ...item.collected }
      if (newCount === 0) {
        delete newCollected[stickerNum]
      } else {
        newCollected[stickerNum] = newCount
      }
      return { ...item, collected: newCollected }
    }))
  }

  const handleGoToDetail = (sectionName: string, setActiveTab: (tab: Tab) => void) => {
    setSelectedSection(sectionName)
    setActiveTab('detalle')
  }

  return {
    albumData,
    stats,
    filteredData,
    currentSectionData,
    searchTerm,
    setSearchTerm,
    selectedSection,
    setSelectedSection,
    detailFilter,
    setDetailFilter,
    updateStickerCount,
    handleGoToDetail,
  }
}
