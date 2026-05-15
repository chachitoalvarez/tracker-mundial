import { Plus, SquareStack } from 'lucide-react'
import { DESKTOP_PRIMARY_BUTTON_BASE } from '@/lib/toolbarStyles'

interface Props {
  onOpen: () => void
}

export function CodeEntryCard({ onOpen }: Props) {
  return (
    <div className="flex justify-end w-full lg:w-auto">
      <button
        onClick={onOpen}
        className={`w-full md:w-auto px-5 lg:px-4 xl:px-5 h-12 lg:h-11 ${DESKTOP_PRIMARY_BUTTON_BASE}`}
      >
        <span className="relative inline-flex items-center justify-center w-5 h-5">
          <SquareStack className="w-5 h-5 lg:w-[18px] lg:h-[18px]" strokeWidth={2.5} />
          <Plus className="w-3 h-3 lg:w-3 lg:h-3 absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5" strokeWidth={3} />
        </span>
        <span className="lg:hidden xl:inline">Cargar figurita</span>
        <span className="hidden lg:inline xl:hidden">Cargar</span>
      </button>
    </div>
  )
}
