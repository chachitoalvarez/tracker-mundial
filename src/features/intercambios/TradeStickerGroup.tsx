import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { formatStickerDisplayId, getStickerByCanonicalCode } from '@/lib/album'

interface Props {
  sectionName: string
  stickers: Record<string, number>
  variant: 'theyOffer' | 'iOffer'
  defaultOpen?: boolean
}

export function TradeStickerGroup({ sectionName, stickers, variant, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const isAmber = variant === 'theyOffer'
  const stickerEntries = Object.entries(stickers)

  return (
    <div className="overflow-hidden rounded-xl">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 transition-colors active:scale-[0.98] ${isAmber ? 'bg-amber-100/60 hover:bg-amber-100' : 'bg-blue-100/60 hover:bg-blue-100'}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronRight
            className={`w-4 h-4 transition-transform flex-shrink-0 ${isAmber ? 'text-amber-700' : 'text-blue-700'} ${open ? 'rotate-90' : ''}`}
            strokeWidth={3}
          />
          <span className={`text-sm font-black tracking-tight truncate ${isAmber ? 'text-amber-900' : 'text-blue-900'}`}>
            {sectionName}
          </span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isAmber ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}>
          {stickerEntries.length}
        </span>
      </button>

      {open && (
        <ul className={`divide-y animate-in fade-in slide-in-from-top-1 ${isAmber ? 'bg-amber-50/30 divide-amber-100/60' : 'bg-blue-50/30 divide-blue-100/60'}`}>
          {stickerEntries
            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
            .map(([code, count]) => {
              const sticker = getStickerByCanonicalCode(code)
              const displayName = sticker ? (sticker.nombreFigura || formatStickerDisplayId(sticker.codigoFigura)) : code

              return (
                <li key={code} className="flex items-center gap-3 px-3 py-2.5">
                  <div className={`w-14 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs shadow-sm border ${isAmber ? 'bg-white border-amber-200 text-amber-700' : 'bg-white border-blue-200 text-blue-700'}`}>
                    {formatStickerDisplayId(code)}
                  </div>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={`text-sm font-bold tracking-tight truncate ${isAmber ? 'text-amber-900' : 'text-blue-900'}`}>
                      {displayName}
                    </span>
                  </div>

                  {count > 1 && (
                    <span className={`text-xs font-black tracking-tight flex-shrink-0 ${isAmber ? 'text-amber-600' : 'text-blue-600'}`}>
                      x{count}
                    </span>
                  )}
                </li>
              )
            })
          }
        </ul>
      )}
    </div>
  )
}
