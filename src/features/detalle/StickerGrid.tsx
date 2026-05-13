import { Globe, Layers, Plus, Minus } from 'lucide-react'
import { stickersBySubseccion } from '@/data/albumData'
import { findStickerByCode, formatStickerDisplayId } from '@/lib/album'
import type { AlbumSection, DetailFilter, Sticker } from '@/types/album'

interface Props {
  sectionData: AlbumSection
  detailFilter: DetailFilter
  stickerSearchTerm: string
  onUpdateCount: (section: string, code: string, delta: number) => void
}

function matchesSearch(sticker: Sticker, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return true

  const exactCode = findStickerByCode(trimmed)
  if (exactCode) return exactCode.codigoFigura === sticker.codigoFigura

  const q = trimmed.toLowerCase()
  return (
    sticker.codigoFigura.toLowerCase().includes(q) ||
    sticker.codigoAlias.toLowerCase().includes(q) ||
    sticker.nombreFigura.toLowerCase().includes(q) ||
    sticker.paisEquipo.toLowerCase().includes(q)
  )
}

export function StickerGrid({ sectionData, detailFilter, stickerSearchTerm, onUpdateCount }: Props) {
  const uniqueCount = Object.values(sectionData.collected).filter(v => v > 0).length
  const allStickers = stickersBySubseccion.get(sectionData.section) ?? []

  const stickersToRender = allStickers.filter(sticker => {
    const count = sectionData.collected[sticker.codigoFigura] ?? 0
    if (!matchesSearch(sticker, stickerSearchTerm)) return false
    if (detailFilter === 'repeated') return count > 1
    if (detailFilter === 'unique') return count >= 1
    if (detailFilter === 'missing') return count === 0
    return true
  })

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-zinc-200/60 shadow-sm">
      <div className="flex justify-between items-center mb-5 sm:mb-6 border-b border-zinc-100 pb-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex-shrink-0 shadow-inner overflow-hidden flex items-center justify-center">
            <Globe className="w-5 h-5 text-zinc-300" />
          </div>
          <span className="text-base sm:text-lg font-bold text-zinc-800 uppercase tracking-tight truncate">{sectionData.section}</span>
        </div>
        <div className="bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100/50">
          <span className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">
            {uniqueCount} <span className="text-sm font-bold text-amber-600/50">/ {sectionData.needed}</span>
          </span>
        </div>
      </div>

      {stickersToRender.length === 0 ? (
        <div className="py-10 flex flex-col items-center justify-center text-center">
          <Layers className="w-8 h-8 text-zinc-300 mb-3" strokeWidth={2} />
          <p className="text-zinc-500 font-medium">No hay figuritas que coincidan con este filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3 sm:gap-4">
          {stickersToRender.map(sticker => {
            const count = sectionData.collected[sticker.codigoFigura] ?? 0
            const hasSticker = count > 0
            const displayId = formatStickerDisplayId(sticker.codigoFigura)

            return (
              <div
                key={sticker.codigoFigura}
                onClick={() => !hasSticker && onUpdateCount(sectionData.section, sticker.codigoFigura, 1)}
                title={sticker.nombreFigura}
                className={`aspect-[3/4] relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 ease-out select-none overflow-hidden ${
                  hasSticker
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-300/50 transform hover:-translate-y-1 hover:shadow-xl'
                    : 'bg-zinc-50/50 border-2 border-dashed border-zinc-200 text-zinc-400 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/50 cursor-pointer active:scale-95'
                }`}
              >
                {hasSticker ? (
                  <>
                    {count > 1 && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] sm:text-xs font-black min-w-[22px] sm:min-w-[26px] h-[22px] sm:h-[26px] flex items-center justify-center px-1 rounded-full shadow-md z-10 border-2 border-white/80">
                        +{count - 1}
                      </div>
                    )}
                    <div className="flex-1 flex items-center justify-center font-black text-base sm:text-lg mt-1 tracking-tight drop-shadow-sm px-1 text-center">
                      {displayId}
                    </div>
                    <div className="w-full bg-black/10 backdrop-blur-sm flex items-stretch h-9 sm:h-10 border-t border-white/20">
                      <button
                        onClick={e => { e.stopPropagation(); onUpdateCount(sectionData.section, sticker.codigoFigura, -1) }}
                        className="flex-1 flex items-center justify-center hover:bg-black/20 transition-colors active:bg-black/30 border-r border-white/10"
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="font-bold text-sm flex items-center justify-center w-8">{count}</span>
                      <button
                        onClick={e => { e.stopPropagation(); onUpdateCount(sectionData.section, sticker.codigoFigura, 1) }}
                        className="flex-1 flex items-center justify-center hover:bg-black/20 transition-colors active:bg-black/30 border-l border-white/10"
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                  </>
                ) : (
                  <span className="font-bold text-base sm:text-lg opacity-70 px-1 text-center">{displayId}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
