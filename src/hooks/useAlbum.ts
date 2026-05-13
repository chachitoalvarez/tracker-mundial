import { useState, useMemo, useRef, useEffect } from 'react'
import { albumData as initialAlbumData } from '@/data/albumData'
import type { AlbumSection, DetailFilter, Sticker } from '@/types/album'
import { computeStats } from '@/lib/stats'
import { findStickerByCode, formatStickerDisplayId } from '@/lib/album'
import { type Tab } from '@/lib/constants'
import * as albumService from '@/services/album.service'

export function useAlbum(triggerCelebration: (type: 'sticker' | 'achievement' | 'match', msg: string, icon: string) => void) {
  const [albumData, setAlbumData] = useState<AlbumSection[]>(initialAlbumData)
  const [isLoadingAlbum, setIsLoadingAlbum] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stickerSearchTerm, setStickerSearchTerm] = useState('')
  const [selectedSection, setSelectedSection] = useState<string>('all')
  const [detailFilter, setDetailFilter] = useState<DetailFilter>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestAlbumRef = useRef<AlbumSection[]>(initialAlbumData)

  useEffect(() => {
    albumService.getAlbumState().then(({ data, error }) => {
      if (!error && data) {
        setAlbumData(data)
        latestAlbumRef.current = data
      }
      setIsLoadingAlbum(false)
    })
  }, [])

  const scheduleSync = (data: AlbumSection[]) => {
    latestAlbumRef.current = data
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      albumService.saveAlbumState(latestAlbumRef.current)
    }, 300)
  }

  const stats = useMemo(() => computeStats(albumData), [albumData])

  const filteredData = useMemo(
    () => albumData.filter(item => item.section.toLowerCase().includes(searchTerm.toLowerCase())),
    [albumData, searchTerm]
  )

  const currentSectionData = selectedSection !== 'all'
    ? albumData.find(s => s.section === selectedSection) ?? null
    : null

  const updateStickerCount = (sectionName: string, stickerCode: string, delta: number) => {
    setAlbumData(prev => {
      const next = prev.map(item => {
        if (item.section !== sectionName) return item
        const currentCount = item.collected[stickerCode] ?? 0
        const newCount = Math.max(0, currentCount + delta)

        if (currentCount === 0 && newCount === 1) {
          triggerCelebration('sticker', `Figurita pegada!\n${sectionName} ${formatStickerDisplayId(stickerCode)}`, 'star')
        }

        const newCollected = { ...item.collected }
        if (newCount === 0) {
          delete newCollected[stickerCode]
        } else {
          newCollected[stickerCode] = newCount
        }
        return { ...item, collected: newCollected }
      })
      scheduleSync(next)
      return next
    })
  }

  const addScannedStickers = (items: Array<{ sticker: Sticker; quantity: number }>) => {
    const validItems = items.filter(item => item.quantity > 0)
    if (!validItems.length) return

    setAlbumData(prev => {
      const additionsBySection = validItems.reduce<Record<string, Record<string, number>>>((acc, item) => {
        const section = item.sticker.subseccion
        acc[section] = {
          ...(acc[section] ?? {}),
          [item.sticker.codigoFigura]: (acc[section]?.[item.sticker.codigoFigura] ?? 0) + item.quantity,
        }
        return acc
      }, {})

      let newlyCompleted = 0
      const next = prev.map(section => {
        const additions = additionsBySection[section.section]
        if (!additions) return section

        const collected = { ...section.collected }
        for (const [code, quantity] of Object.entries(additions)) {
          if ((collected[code] ?? 0) === 0) newlyCompleted += 1
          collected[code] = (collected[code] ?? 0) + quantity
        }
        return { ...section, collected }
      })

      if (newlyCompleted > 0) {
        triggerCelebration('sticker', `Figuritas guardadas!\n${newlyCompleted} nuevas en tu álbum`, 'star')
      }

      scheduleSync(next)
      return next
    })
  }

  const handleGoToDetail = (sectionName: string, setActiveTab: (tab: Tab) => void) => {
    setSelectedSection(sectionName)
    setStickerSearchTerm('')
    setActiveTab('detalle')
  }

  const jumpToStickerCode = (query: string) => {
    const sticker = findStickerByCode(query)
    if (!sticker) return false
    setSelectedSection(sticker.subseccion)
    setStickerSearchTerm(query)
    return true
  }

  return {
    albumData,
    isLoadingAlbum,
    stats,
    filteredData,
    currentSectionData,
    searchTerm,
    setSearchTerm,
    stickerSearchTerm,
    setStickerSearchTerm,
    selectedSection,
    setSelectedSection,
    detailFilter,
    setDetailFilter,
    updateStickerCount,
    addScannedStickers,
    handleGoToDetail,
    jumpToStickerCode,
  }
}
