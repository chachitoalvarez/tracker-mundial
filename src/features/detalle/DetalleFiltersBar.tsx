import type { ReactNode } from 'react'
import { Layers, Package, Search } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { DESKTOP_CHIP_BASE, DESKTOP_ICON_SIZE } from '@/lib/toolbarStyles'
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
  action?: ReactNode
}

const BTN_ACTIVE = 'bg-amber-500 text-white shadow-md'
const BTN_INACTIVE = 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-sm'

export function DetalleFiltersBar({
  albumData, selectedSection, setSelectedSection,
  stickerSearchTerm, setStickerSearchTerm, onJumpToStickerCode,
  detailFilter, setDetailFilter, stats, action,
}: Props) {
  const toggle = (filter: DetailFilter) =>
    setDetailFilter(detailFilter === filter ? null : filter)

  const handleStickerSearch = (value: string) => {
    setStickerSearchTerm(value)
    if (value.trim()) onJumpToStickerCode(value)
  }

  return (
    <div className="w-full bg-zinc-50/80 sm:bg-white/80 backdrop-blur-xl py-3 lg:py-2.5 px-3 sm:px-4 lg:px-0 mb-4 lg:mb-5 sm:border border-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] sm:rounded-3xl transition-all">
      <div className="flex flex-col lg:flex-row lg:flex-nowrap gap-3 lg:gap-2 items-stretch lg:items-center justify-between w-full min-h-[72px]">
        <div className="w-full lg:w-auto flex items-center shrink-0">
          <select
            className="w-full lg:w-[340px] xl:w-[360px] max-w-full px-4 py-3 lg:py-0 bg-white border border-zinc-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 font-semibold text-zinc-900 transition-all cursor-pointer shadow-sm appearance-none shrink-0 h-11 lg:h-11"
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right .5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
            }}
          >
            <option value="all">Sección · Ver todo el álbum ({stats.totalCompleted}/{stats.totalNeeded})</option>
            {albumData.map(s => {
              const uniqueCount = Object.values(s.collected).filter(v => v > 0).length
              return <option key={s.section} value={s.section}>Sección · {s.section} ({uniqueCount}/{s.needed})</option>
            })}
          </select>
        </div>

        <SearchInput
          value={stickerSearchTerm}
          onChange={handleStickerSearch}
          placeholder="Buscar ARG10..."
          className="w-full lg:w-[260px] xl:w-[280px] shrink-0"
        />

        <div className="grid grid-cols-3 gap-2 w-full lg:w-auto sm:flex sm:flex-row sm:w-auto shrink-0">
          <button
            onClick={() => toggle('unique')}
            className={`${DESKTOP_CHIP_BASE} lg:px-2.5 lg:text-[13px] ${detailFilter === 'unique' ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Package className={`${DESKTOP_ICON_SIZE}`} strokeWidth={2.5} />
            Pegadas
          </button>
          <button
            onClick={() => toggle('missing')}
            className={`${DESKTOP_CHIP_BASE} lg:px-2.5 lg:text-[13px] ${detailFilter === 'missing' ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Search className={`${DESKTOP_ICON_SIZE}`} strokeWidth={2.5} />
            Faltantes
          </button>
          <button
            onClick={() => toggle('repeated')}
            className={`${DESKTOP_CHIP_BASE} lg:px-2.5 lg:text-[13px] ${detailFilter === 'repeated' ? BTN_ACTIVE : BTN_INACTIVE}`}
          >
            <Layers className={`${DESKTOP_ICON_SIZE}`} strokeWidth={2.5} />
            Repetidas
          </button>
        </div>

        {action && (
          <div className="w-full lg:w-auto lg:ml-auto shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  )
}
