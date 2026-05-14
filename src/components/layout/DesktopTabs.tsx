import { ListChecks, CheckCircle2, Users, RefreshCcw, Award } from 'lucide-react'
import type { Tab } from '@/lib/constants'

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
  intercambiosBadge: number
  logrosBadge: number
}

const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode }> = [
  { id: 'resumen', label: 'Resumen', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'detalle', label: 'Detalle', icon: <ListChecks className="w-4 h-4" /> },
  { id: 'comparar', label: 'Ranking', icon: <Users className="w-4 h-4" /> },
  { id: 'intercambios', label: 'Canjes', icon: <RefreshCcw className="w-4 h-4" /> },
  { id: 'logros', label: 'Logros', icon: <Award className="w-4 h-4" /> },
]

export function DesktopTabs({ activeTab, onTabChange, intercambiosBadge, logrosBadge }: Props) {
  return (
    <div className="hidden md:flex items-end gap-1.5 lg:gap-2 border-b border-zinc-100 mb-4 lg:mb-4 pb-1.5 lg:pb-1 px-0 pt-4 lg:pt-3">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        const badge = tab.id === 'intercambios' ? intercambiosBadge : tab.id === 'logros' ? logrosBadge : 0
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 lg:px-3 py-2 text-xs lg:text-sm font-bold flex items-center gap-1.5 lg:gap-2 rounded-t-xl transition-all border-b-2 ${
              isActive
                ? 'border-amber-500 text-amber-600 bg-amber-50/40'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 border-transparent'
            }`}
          >
            <span className="scale-90 lg:scale-100">{tab.icon}</span>
            {tab.label}
            {badge > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1 shadow-sm">
                {badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
