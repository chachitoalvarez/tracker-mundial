import { Trophy } from 'lucide-react'
import { APP_NAME } from '@/lib/constants'
import { UserAvatar } from '@/components/ui/UserAvatar'

interface Props {
  userName: string
  avatarKey?: string | null
  onProfileOpen: () => void
}

export function MainHeader({ userName, avatarKey, onProfileOpen }: Props) {
  return (
    <header className="bg-white rounded-3xl px-4 sm:px-6 py-5 sm:py-6 shadow-sm border border-zinc-200/60 flex items-center justify-between gap-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4 relative overflow-hidden">
      <div className="absolute right-0 top-0 w-64 h-64 bg-amber-50 rounded-full blur-[80px] -z-10 pointer-events-none" />
      <div className="flex-1 min-w-0">
        <h1 className="text-xl sm:text-3xl font-black text-zinc-900 flex items-center gap-2 sm:gap-3 tracking-tight truncate">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg sm:rounded-xl shadow-sm border border-amber-200/50 rotate-3 shrink-0">
            <Trophy className="text-amber-600 h-5 w-5 sm:h-7 sm:w-7" strokeWidth={2.5} />
          </div>
          <span className="truncate">{APP_NAME}</span>
        </h1>
        <p className="text-zinc-500 mt-1 text-xs sm:text-sm font-medium ml-1 truncate">Gestiona tu colección oficial</p>
      </div>
      <button
        className="flex items-center gap-3 sm:gap-4 shrink-0 hover:bg-zinc-100/50 p-2 -mr-2 rounded-2xl transition-all active:scale-95 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20"
        onClick={onProfileOpen}
      >
        <div className="flex flex-col items-end text-right hidden sm:flex">
          <p className="text-sm font-bold text-zinc-900 group-hover:text-amber-600 transition-colors leading-tight">@{userName}</p>
        </div>
        <div className="flex-shrink-0 rounded-full border-2 border-white shadow-md">
          <UserAvatar
            avatarKey={avatarKey}
            className="h-10 w-10 sm:h-12 sm:w-12"
            iconClassName="h-5 w-5 sm:h-6 sm:w-6"
            fallbackClassName="bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600"
          />
        </div>
      </button>
    </header>
  )
}
