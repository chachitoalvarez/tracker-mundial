import type { ReactNode } from 'react'
import { Award, CircleGauge, Layers, Package } from 'lucide-react'
import type { AlbumStats } from '@/types/album'

const CARD_CLASS = 'bg-white rounded-3xl p-5 lg:p-3.5 shadow-sm border border-zinc-200/60 flex items-center gap-4 lg:gap-3 text-left hover:shadow-md transition-shadow h-[104px] lg:h-[96px] min-w-0'
const LABEL_CLASS = 'text-xs font-bold text-zinc-400 uppercase tracking-wider mb-0.5 leading-4 whitespace-nowrap'
const VALUE_CLASS = 'text-2xl lg:text-xl font-black text-zinc-900 tracking-tight leading-7 lg:leading-6 whitespace-nowrap'

interface MetricCardProps {
  icon: ReactNode
  iconClassName: string
  label: string
  value: ReactNode
  ariaLabel?: string
}

function MetricCard({ icon, iconClassName, label, value, ariaLabel }: MetricCardProps) {
  return (
    <div className={CARD_CLASS} aria-label={ariaLabel}>
      <div className={`p-3 lg:p-2.5 rounded-2xl border flex-shrink-0 ${iconClassName}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={LABEL_CLASS}>{label}</p>
        <p className={VALUE_CLASS}>{value}</p>
      </div>
    </div>
  )
}

interface Props {
  stats: AlbumStats
  unlockedAchievementsCount: number
  totalAchievementsCount: number
}

export function StatsCards({ stats, unlockedAchievementsCount, totalAchievementsCount }: Props) {
  const achievementsValue = totalAchievementsCount > 0
    ? `${unlockedAchievementsCount}/${totalAchievementsCount}`
    : unlockedAchievementsCount

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-3.5">
      <MetricCard
        icon={<CircleGauge className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={2.5} />}
        iconClassName="bg-amber-50 text-amber-600 border-amber-100"
        label="Avance"
        value={`${stats.percentage}%`}
        ariaLabel={`Avance del album: ${stats.percentage} por ciento`}
      />

      <MetricCard
        icon={<Package className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={2.5} />}
        iconClassName="bg-emerald-50 text-emerald-600 border-emerald-100"
        label="Pegadas"
        value={`${stats.totalCompleted}/${stats.totalNeeded}`}
        ariaLabel={`Figuritas pegadas: ${stats.totalCompleted} de ${stats.totalNeeded}`}
      />

      <MetricCard
        icon={<Layers className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={2.5} />}
        iconClassName="bg-orange-50 text-orange-600 border-orange-100"
        label="Repetidas"
        value={stats.totalRepeated}
        ariaLabel={`Figuritas repetidas: ${stats.totalRepeated}`}
      />

      <MetricCard
        icon={<Award className="h-6 w-6 lg:h-5 lg:w-5" strokeWidth={2.5} />}
        iconClassName="bg-yellow-50 text-yellow-600 border-yellow-100"
        label="Logros"
        value={achievementsValue}
        ariaLabel={
          totalAchievementsCount > 0
            ? `Logros desbloqueados: ${unlockedAchievementsCount} de ${totalAchievementsCount}`
            : `Logros desbloqueados: ${unlockedAchievementsCount}`
        }
      />
    </div>
  )
}
