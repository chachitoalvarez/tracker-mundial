import { LayoutGrid, Package, Layers } from 'lucide-react'
import { ProgressBar } from '@/components/ui/ProgressBar'
import type { AlbumStats } from '@/types/album'

export function StatsCards({ stats }: { stats: AlbumStats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5">
      <div className="bg-white rounded-3xl p-5 lg:p-3.5 shadow-sm border border-zinc-200/60 flex flex-col lg:flex-row items-center lg:items-center gap-4 lg:gap-3 text-center lg:text-left hover:shadow-md transition-shadow lg:h-[84px]">
        <div className="p-3 lg:p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
          <LayoutGrid className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Total</p>
          <p className="text-2xl lg:text-xl font-black text-zinc-900 tracking-tight">{stats.totalNeeded}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 lg:p-3.5 shadow-sm border border-zinc-200/60 flex flex-col lg:flex-row items-center lg:items-center gap-4 lg:gap-3 text-center lg:text-left hover:shadow-md transition-shadow lg:h-[84px]">
        <div className="p-3 lg:p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
          <Package className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Pegadas</p>
          <p className="text-2xl lg:text-xl font-black text-zinc-900 tracking-tight">{stats.totalCompleted}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 lg:p-3.5 shadow-sm border border-zinc-200/60 flex flex-col lg:flex-row items-center lg:items-center gap-4 lg:gap-3 text-center lg:text-left hover:shadow-md transition-shadow lg:h-[84px]">
        <div className="p-3 lg:p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
          <Layers className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={2.5} />
        </div>
        <div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Repetidas</p>
          <p className="text-2xl lg:text-xl font-black text-zinc-900 tracking-tight">{stats.totalRepeated}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-5 lg:p-3.5 shadow-sm border border-zinc-200/60 flex flex-col justify-center relative overflow-hidden lg:h-[84px]">
        <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl -z-10" />
        <div className="flex justify-between items-end mb-2">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progreso</p>
          <p className="text-xl lg:text-lg font-black text-emerald-600 tracking-tight">{stats.percentage}%</p>
        </div>
        <ProgressBar percentage={stats.percentage} height="h-2" />
        <p className="text-xs text-zinc-500 mt-2 text-right font-medium">
          Faltan <span className="font-bold text-zinc-700">{stats.missing}</span>
        </p>
      </div>
    </div>
  )
}
