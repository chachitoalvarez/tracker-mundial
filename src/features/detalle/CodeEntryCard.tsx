import { Keyboard } from 'lucide-react'

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
        <Keyboard className="w-5 h-5" strokeWidth={2.5} />
        Ingresar figuritas
      </button>
    </div>
  )
}
