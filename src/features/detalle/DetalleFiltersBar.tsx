import { Layers, Package, Search } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import type { AlbumSection, AlbumStats, DetailFilter } from '@/types/album'

interface Props {
  albumData: AlbumSection[]
  selectedSection: string
  setSelectedSection: (v: string) => void
  stickerSearchTerm: string
  setStickerSearchTerm: (v: string) => void
  onJumpToStickerCode: (query: string) => boolean
  detailFilter: DetailFilter
  setDetailFilter: (v: DetailFilter) => void
  stats: AlbumStats
}

const BTN_BASE = 'px-4 py-3 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-95 focus-visible:ring-4 focus-visible:ring-amber-500/20'
const BTN_ACTIVE = 'bg-amber-500 text-white shadow-md'
const BTN_INACTIVE = 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm'

export function DetalleFiltersBar({
  albumData, selectedSection, setSelectedSection,
  stickerSearchTerm, setStickerSearchTerm, onJumpToStickerCode,
  detailFilter, setDetailFilter, stats,
}: Props) {
  const toggle = (filter: DetailFilter) =>
    setDetailFilter(detailFilter === filter ? null : filter)

  const handleStickerSearch = (value: string) => {
    setStickerSearchTerm(value)
    if (value.trim()) onJumpToStickerCode(value)
  }

  return (
    <div className="sticky top-[72px] sm:top-2 z-30 bg-zinc-50/80 sm:bg-white/80 backdrop-blur-xl py-3 sm:py-4 -mx-3 px-3 sm:-mx-6 sm:px-6 mb-6 sm:border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] sm:rounded-3xl transition-all">
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4 items-center justify-between max-w-6xl mx-auto">
        <div className="w-full md:w-auto flex items-center gap-3">
          <label className="font-bold text-zinc-700 hidden sm:block text-sm uppercase tracking-wider">Seccion</label>
          <select
            className="w-full md:w-64 px-4 py-3 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 font-bold text-zinc-900 transition-all cursor-pointer shadow-sm appearance-none"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right .5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            <option value="all">Ver todo el album ({stats.totalCompleted}/{stats.totalNeeded})</option>
            {albumData.map(s => {
              const uniqueCount = Object.values(s.collected).filter(v => v > 0).length
              return <option key={s.section} value={s.section}>{s.section} ({uniqueCount}/{s.needed})</option>
            })}
          </select>
        </div>

        <SearchInput
          value={stickerSearchTerm}
          onChange={handleStickerSearch}
          placeholder="Buscar ARG17 o ARG017..."
          className="w-full md:w-72"
        />

        <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:flex-row sm:w-auto">
          <button
            onClick={() => toggle('unique')}
            className={`${BTN_BASE} ${detailFilter === 'unique' ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Package className="w-4 h-4" strokeWidth={2.5} />
            Pegadas
          </button>
          <button
            onClick={() => toggle('missing')}
            className={`${BTN_BASE} ${detailFilter === 'missing' ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Search className="w-4 h-4" strokeWidth={2.5} />
            Faltantes
          </button>
          <button
            onClick={() => toggle('repeated')}
            className={`${BTN_BASE} ${detailFilter === 'repeated' ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Layers className="w-4 h-4" strokeWidth={2.5} />
            Repetidas
          </button>
        </div>
      </div>
    </div>
  )
}
