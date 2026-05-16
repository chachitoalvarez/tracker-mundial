import { StatsCards } from '@/features/resumen/StatsCards'
import { SectionsTable } from '@/features/resumen/SectionsTable'
import { SectionsCardList } from '@/features/resumen/SectionsCardList'
import { SearchInput } from '@/components/ui/SearchInput'
import type { AlbumSection, AlbumStats } from '@/types/album'

interface Props {
  stats: AlbumStats
  unlockedAchievementsCount: number
  totalAchievementsCount: number
  filteredData: AlbumSection[]
  searchTerm: string
  setSearchTerm: (v: string) => void
  onGoToDetail: (section: string) => void
}

export function ResumenView({
  stats,
  unlockedAchievementsCount,
  totalAchievementsCount,
  filteredData,
  searchTerm,
  setSearchTerm,
  onGoToDetail,
}: Props) {
  return (
    <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
      <StatsCards
        stats={stats}
        unlockedAchievementsCount={unlockedAchievementsCount}
        totalAchievementsCount={totalAchievementsCount}
      />

      <SearchInput
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Buscar país o sección..."
      />

      <div className="border border-zinc-200/60 rounded-3xl bg-white overflow-hidden shadow-sm">
        <div className="hidden md:block overflow-x-auto">
          <SectionsTable data={filteredData} searchTerm={searchTerm} onGoToDetail={onGoToDetail} />
        </div>
        <div className="md:hidden">
          {filteredData.length === 0 ? (
            <div className="p-12 text-center text-zinc-500">No encontramos el país "{searchTerm}".</div>
          ) : (
            <SectionsCardList data={filteredData} onGoToDetail={onGoToDetail} />
          )}
        </div>
      </div>
    </div>
  )
}
