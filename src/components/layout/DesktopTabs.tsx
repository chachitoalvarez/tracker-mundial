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
    <div className="hidden md:flex space-x-2 border-b border-zinc-100 mb-6 pb-2 px-6 sm:px-0 pt-6 sm:pt-0">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        const badge = tab.id === 'intercambios' ? intercambiosBadge : tab.id === 'logros' ? logrosBadge : 0
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-4 py-3 text-sm font-bold flex items-center gap-2 rounded-t-xl transition-all ${
              isActive
                ? 'border-b-4 border-amber-500 text-amber-600 bg-amber-50/50'
                : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 border-b-4 border-transparent'
            }`}
          >
            {tab.icon}
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
