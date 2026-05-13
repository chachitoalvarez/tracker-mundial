import { Camera } from 'lucide-react'

interface Props {
  onOpen: () => void
}

export function ScanStickersCard({ onOpen }: Props) {
  return (
    <button
      onClick={onOpen}
      className="w-full bg-white border border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all active:scale-[0.99] text-left flex items-start gap-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 shadow-inner">
        <Camera className="w-6 h-6" strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <h2 className="text-lg font-black text-zinc-900 tracking-tight">Escanear figuritas</h2>
        <p className="text-sm text-zinc-500 font-medium mt-1 leading-relaxed">
          Sacá una foto del dorso de hasta 10 figuritas y actualizá tu álbum en segundos.
        </p>
      </div>
    </button>
  )
}
