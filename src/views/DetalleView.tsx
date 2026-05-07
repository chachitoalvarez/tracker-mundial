import { DetalleFiltersBar } from '@/features/detalle/DetalleFiltersBar'
import { StickerGrid } from '@/features/detalle/StickerGrid'
import type { AlbumSection, AlbumStats, DetailFilter } from '@/types/album'

interface Props {
  albumData: AlbumSection[]
  selectedSection: string
  setSelectedSection: (v: string) => void
  detailFilter: DetailFilter
  setDetailFilter: (v: DetailFilter) => void
  currentSectionData: AlbumSection | null
  stats: AlbumStats
  onUpdateCount: (section: string, num: number, delta: number) => void
}

export function DetalleView({
  albumData, selectedSection, setSelectedSection,
  detailFilter, setDetailFilter,
  currentSectionData, stats, onUpdateCount,
}: Props) {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 relative">
      <DetalleFiltersBar
        albumData={albumData}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
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
                onUpdateCount={onUpdateCount}
              />
            ))
          : currentSectionData && (
              <StickerGrid
                sectionData={currentSectionData}
                detailFilter={detailFilter}
                onUpdateCount={onUpdateCount}
              />
            )
        }
      </div>
    </div>
  )
}
