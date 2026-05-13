import { useState } from 'react'
import { DetalleFiltersBar } from '@/features/detalle/DetalleFiltersBar'
import { ScanStickersCard } from '@/features/detalle/ScanStickersCard'
import { ScanStickersDrawer } from '@/features/detalle/ScanStickersDrawer'
import { StickerGrid } from '@/features/detalle/StickerGrid'
import type { AlbumSection, AlbumStats, DetailFilter, Sticker } from '@/types/album'

interface Props {
  albumData: AlbumSection[]
  selectedSection: string
  setSelectedSection: (v: string) => void
  stickerSearchTerm: string
  setStickerSearchTerm: (v: string) => void
  detailFilter: DetailFilter
  setDetailFilter: (v: DetailFilter) => void
  currentSectionData: AlbumSection | null
  stats: AlbumStats
  onUpdateCount: (section: string, code: string, delta: number) => void
  onAddScannedStickers: (items: Array<{ sticker: Sticker; quantity: number }>) => void
  onJumpToStickerCode: (query: string) => boolean
}

export function DetalleView({
  albumData, selectedSection, setSelectedSection,
  stickerSearchTerm, setStickerSearchTerm,
  detailFilter, setDetailFilter,
  currentSectionData, stats, onUpdateCount, onAddScannedStickers, onJumpToStickerCode,
}: Props) {
  const [isScanOpen, setIsScanOpen] = useState(false)

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 relative">
      <ScanStickersCard onOpen={() => setIsScanOpen(true)} />

      <DetalleFiltersBar
        albumData={albumData}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        stickerSearchTerm={stickerSearchTerm}
        setStickerSearchTerm={setStickerSearchTerm}
        onJumpToStickerCode={onJumpToStickerCode}
        detailFilter={detailFilter}
        setDetailFilter={setDetailFilter}
        stats={stats}
      />

      <div className="space-y-8 sm:space-y-10">
        {selectedSection === 'all'
          ? albumData.map(section => (
              <StickerGrid
                key={section.section}
                sectionData={section}
                detailFilter={detailFilter}
                stickerSearchTerm={stickerSearchTerm}
                onUpdateCount={onUpdateCount}
              />
            ))
          : currentSectionData && (
              <StickerGrid
                sectionData={currentSectionData}
                detailFilter={detailFilter}
                stickerSearchTerm={stickerSearchTerm}
                onUpdateCount={onUpdateCount}
              />
            )
        }
      </div>

      {isScanOpen && (
        <ScanStickersDrawer
          isOpen
          onClose={() => setIsScanOpen(false)}
          onConfirm={onAddScannedStickers}
          onManualLoad={() => setIsScanOpen(false)}
        />
      )}
    </div>
  )
}
