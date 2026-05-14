import { ChevronRight } from 'lucide-react'
import { SectionAvatar } from '@/components/ui/SectionAvatar'
import { getSectionUniqueCount, getSectionRepeatedCount, getSectionPercentage } from '@/lib/stats'
import type { AlbumSection } from '@/types/album'

interface Props {
  data: AlbumSection[]
  onGoToDetail: (section: string) => void
}

export function SectionsCardList({ data, onGoToDetail }: Props) {
  return (
    <div className="flex flex-col divide-y divide-zinc-100">
      {data.map((item, index) => {
        const uniqueCount = getSectionUniqueCount(item)
        const repeatedCount = getSectionRepeatedCount(item)
        const percentage = getSectionPercentage(item)

        return (
          <div
            key={index}
            className="p-5 lg:p-4 bg-white hover:bg-zinc-50 active:bg-zinc-100 transition-colors cursor-pointer group"
            onClick={() => onGoToDetail(item.section)}
          >
            <div className="flex items-center justify-between mb-4 lg:mb-3">
              <div className="flex items-center gap-3">
                <SectionAvatar section={item} size="md" />
                <span className="font-black text-zinc-900 text-lg lg:text-base tracking-tight">{item.section}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${
                  percentage === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                  percentage > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                }`}>{percentage}%</span>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-active:translate-x-1 transition-transform" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 bg-zinc-50/50 p-3 lg:p-2.5 rounded-2xl text-center border border-zinc-200/50">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Total</p>
                <p className="text-sm font-semibold text-zinc-600">{item.needed}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Pegadas</p>
                <p className="text-sm font-black text-zinc-900">{uniqueCount}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-0.5">Repetidas</p>
                <p className="text-sm font-semibold">
                  {repeatedCount > 0 ? (
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-black text-xs border border-amber-200/50">+{repeatedCount}</span>
                  ) : <span className="text-zinc-300">-</span>}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
