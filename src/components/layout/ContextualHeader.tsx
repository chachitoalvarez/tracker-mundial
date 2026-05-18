import { ListChecks, CheckCircle2, Users, RefreshCcw, Award } from 'lucide-react'
import type { Tab } from '@/lib/constants'
import { UserAvatar } from '@/components/ui/UserAvatar'

const TAB_META: Record<Tab, { icon: React.ReactNode; label: string }> = {
  resumen: { icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />, label: 'Resumen de progreso' },
  detalle: { icon: <ListChecks className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />, label: 'Detalle por figurita' },
  comparar: { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />, label: 'Ranking' },
  intercambios: { icon: <RefreshCcw className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />, label: 'Canjes' },
  logros: { icon: <Award className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.5} />, label: 'Logros' },
}

interface Props {
  activeTab: Tab
  userName: string
  avatarKey?: string | null
  notificationsCount: number
  onProfileOpen: () => void
}

export function ContextualHeader({ activeTab, userName, avatarKey, notificationsCount, onProfileOpen }: Props) {
  const meta = TAB_META[activeTab]

  return (
    <header className="sticky top-2 z-40 bg-white/80 backdrop-blur-xl rounded-3xl px-4 sm:px-6 py-3 sm:py-4 shadow-sm border border-white flex justify-between items-center gap-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="bg-amber-100 p-2 lg:p-1.5 sm:p-2.5 rounded-xl text-amber-600 shadow-inner shrink-0">
          {meta.icon}
        </div>
        <h1 className="text-lg lg:text-[17px] sm:text-xl font-black text-zinc-900 tracking-tight truncate">{meta.label}</h1>
      </div>
      <button
        className="flex items-center gap-3 lg:gap-3 sm:gap-4 shrink-0 hover:bg-zinc-100/50 p-2 -mr-2 rounded-2xl transition-all active:scale-95 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20"
        onClick={onProfileOpen}
      >
        <div className="flex flex-col items-end text-right hidden sm:flex">
          <p className="text-sm lg:text-[13px] font-bold text-zinc-900 group-hover:text-amber-600 transition-colors leading-tight">@{userName}</p>
        </div>
        <div className="relative flex-shrink-0 rounded-full border-2 border-white shadow-md">
          <UserAvatar
            avatarKey={avatarKey}
            className="h-10 w-10 lg:h-9 lg:w-9 sm:h-12 sm:w-12"
            iconClassName="h-5 w-5 lg:h-4 lg:w-4 sm:h-6 sm:w-6"
            fallbackClassName="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600"
          />
          {notificationsCount > 0 && (
            <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {notificationsCount}
            </div>
          )}
        </div>
      </button>
    </header>
  )
}
