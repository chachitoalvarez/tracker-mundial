import { ChevronRight, Search } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SectionAvatar } from '@/components/ui/SectionAvatar'
import { getSectionUniqueCount, getSectionRepeatedCount, getSectionPercentage } from '@/lib/stats'
import type { AlbumSection } from '@/types/album'

interface Props {
  data: AlbumSection[]
  searchTerm: string
  onGoToDetail: (section: string) => void
}

export function SectionsTable({ data, searchTerm, onGoToDetail }: Props) {
  if (data.length === 0) {
    return (
      <div className="p-12 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <Search className="w-8 h-8 text-zinc-400" />
        </div>
        <h3 className="font-bold text-zinc-800 text-lg">No hay resultados</h3>
        <p className="text-zinc-500 text-sm mt-1">No encontramos el país "{searchTerm}".</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-zinc-200/60">
        <thead className="bg-zinc-50/50">
          <tr>
            <th className="px-6 py-3 lg:py-2.5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Sección</th>
            <th className="px-6 py-3 lg:py-2.5 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell w-1/4">Progreso</th>
            <th className="px-6 py-3 lg:py-2.5 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">Total</th>
            <th className="px-6 py-3 lg:py-2.5 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">Pegadas</th>
            <th className="px-6 py-3 lg:py-2.5 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider">Repetidas</th>
            <th className="px-6 py-3 lg:py-2.5 text-right text-xs font-bold text-zinc-500 uppercase tracking-wider">%</th>
            <th className="relative px-2 py-3 lg:py-2.5"><span className="sr-only">Ir al detalle</span></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-zinc-100">
          {data.map((item, index) => {
            const uniqueCount = getSectionUniqueCount(item)
            const repeatedCount = getSectionRepeatedCount(item)
            const percentage = getSectionPercentage(item)
            return (
              <tr key={index} className="hover:bg-zinc-50/80 transition-colors group cursor-pointer" onClick={() => onGoToDetail(item.section)}>
                <td className="px-6 py-3 lg:py-2.5 whitespace-nowrap text-sm font-bold text-zinc-900">
                  <div className="flex items-center gap-3">
                    <SectionAvatar section={item} />
                    {item.section}
                  </div>
                </td>
                <td className="px-6 py-3 lg:py-2.5 whitespace-nowrap hidden md:table-cell">
                  <ProgressBar percentage={percentage} height="h-2" />
                </td>
                <td className="px-6 py-3 lg:py-2.5 whitespace-nowrap text-sm text-zinc-500 font-medium text-center">{item.needed}</td>
                <td className="px-6 py-3 lg:py-2.5 whitespace-nowrap text-sm text-zinc-900 text-center font-black">{uniqueCount}</td>
                <td className="px-6 py-3 lg:py-2.5 whitespace-nowrap text-sm text-center">
                  {repeatedCount > 0 ? (
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-black text-xs border border-amber-200/50 shadow-sm">+{repeatedCount}</span>
                  ) : <span className="text-zinc-300 font-medium">-</span>}
                </td>
                <td className="px-6 py-3 lg:py-2.5 whitespace-nowrap text-sm text-right font-medium">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shadow-sm ${
                    percentage === 100 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    percentage > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-zinc-50 text-zinc-500 border-zinc-200'
                  }`}>{percentage}%</span>
                </td>
                <td className="px-2 py-3 lg:py-2.5 whitespace-nowrap text-right text-sm font-medium pr-6">
                  <div className="text-zinc-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all p-1.5 rounded-lg group-hover:bg-amber-50">
                    <ChevronRight className="w-5 h-5" strokeWidth={3} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
