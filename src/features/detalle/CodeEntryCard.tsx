import { Plus, SquareStack } from 'lucide-react'

interface Props {
  onOpen: () => void
}

export function CodeEntryCard({ onOpen }: Props) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onOpen}
        className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 hover:shadow-lg hover:-translate-y-0.5 text-white font-bold rounded-2xl transition-all w-full md:w-auto active:scale-[0.98] shadow-sm"
      >
        <span className="relative inline-flex items-center justify-center w-5 h-5">
          <SquareStack className="w-5 h-5" strokeWidth={2.5} />
          <Plus className="w-3 h-3 absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5" strokeWidth={3} />
        </span>
        Cargar figurita
      </button>
    </div>
  )
}
