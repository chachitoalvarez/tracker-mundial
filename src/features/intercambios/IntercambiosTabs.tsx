import { Compass, MessageCircle, ArrowUpRight, Inbox } from 'lucide-react'
import type { IntercambiosTab } from '@/lib/constants'
import { DESKTOP_CHIP_BASE, DESKTOP_ICON_SIZE } from '@/lib/toolbarStyles'

interface Props {
  activeTab: IntercambiosTab
  onTabChange: (tab: IntercambiosTab) => void
  unreadConnectionsCount: number
  likedByThemCount: number
}

export function IntercambiosTabs({ activeTab, onTabChange, unreadConnectionsCount, likedByThemCount }: Props) {
  const tabs: Array<{ id: IntercambiosTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'explorar', label: 'Explorar', icon: <Compass className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.5} /> },
    { id: 'conexiones', label: 'Conexiones', icon: <MessageCircle className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2.5} />, badge: unreadConnectionsCount },
    { id: 'dados', label: 'Enviados', icon: <ArrowUpRight className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.5} /> },
    { id: 'recibidos', label: 'Recibidos', icon: <Inbox className="w-5 h-5 sm:w-4 sm:h-4" strokeWidth={2.5} />, badge: likedByThemCount },
  ]

  return (
    <div className="bg-zinc-100/80 backdrop-blur-md rounded-2xl shadow-inner border border-zinc-200/60 p-1.5 mb-6 w-full flex gap-1.5 overflow-x-auto scrollbar-hide z-10">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${DESKTOP_CHIP_BASE} flex-1 rounded-xl duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isActive ? 'bg-white text-amber-600 shadow-sm border border-zinc-200/50 flex-[2]' : 'bg-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
            }`}
          >
            <div className="relative shrink-0 flex items-center justify-center">
              <span className={DESKTOP_ICON_SIZE}>{tab.icon}</span>
              {(tab.badge ?? 0) > 0 && (
                <span className="absolute -top-2 -right-2.5 bg-amber-500 text-white text-[9px] font-black min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full border-2 border-white shadow-sm">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className={`${isActive ? 'block' : 'hidden sm:block'} whitespace-nowrap`}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
