import { Trophy } from 'lucide-react'

interface Props {
  unlockedCount: number
  totalCount: number
}

export function LogrosHeader({ unlockedCount, totalCount }: Props) {
  return (
    <section className="bg-white border border-zinc-200/70 rounded-3xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner border border-amber-200">
          <Trophy className="w-8 h-8 text-amber-600" strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <p className="text-xs font-black text-amber-600 uppercase tracking-wider mb-1">Medallero</p>
              <h2 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">Convertí avance en medallas</h2>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-2 w-fit">
              <p className="text-2xl font-black text-amber-700 leading-none">{unlockedCount}/{totalCount}</p>
              <p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wider mt-1">Ganadas</p>
            </div>
          </div>

          <p className="text-sm text-zinc-500 mt-3 font-medium leading-relaxed max-w-2xl">
            Cada medalla marca un hito real de tu álbum: completar, repetir, canjear y avanzar.
          </p>
        </div>
      </div>
    </section>
  )
}
