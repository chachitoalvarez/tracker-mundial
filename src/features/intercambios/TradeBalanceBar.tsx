interface Props {
  theyCount: number
  iCount: number
}

export function TradeBalanceBar({ theyCount, iCount }: Props) {
  if (theyCount === 0 || iCount === 0) return null

  const total = theyCount + iCount
  const theyPct = Math.round((theyCount / total) * 100)
  const iPct = 100 - theyPct
  const balance = Math.abs(theyPct - iPct)
  const label = balance < 20 ? 'Trato balanceado' : balance < 50 ? 'Levemente desbalanceado' : 'Muy desbalanceado'

  return (
    <div className="bg-zinc-50 border border-zinc-200/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Balance del trato</span>
        <span className="text-[10px] font-bold text-zinc-400">{label}</span>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 flex items-center gap-1 text-xs">
          <span className="font-black text-amber-700">{theyCount}</span>
          <span className="text-zinc-400 font-medium">recibís</span>
        </div>
        <div className="flex-1 flex items-center gap-1 text-xs justify-end">
          <span className="text-zinc-400 font-medium">entregás</span>
          <span className="font-black text-blue-700">{iCount}</span>
        </div>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden bg-zinc-200">
        <div className="bg-amber-500 transition-all duration-500" style={{ width: `${theyPct}%` }} />
        <div className="bg-blue-500 transition-all duration-500" style={{ width: `${iPct}%` }} />
      </div>
    </div>
  )
}
