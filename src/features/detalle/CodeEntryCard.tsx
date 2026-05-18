import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Minus, Plus, SquareStack, X } from 'lucide-react'
import { DESKTOP_PRIMARY_BUTTON_BASE } from '@/lib/toolbarStyles'

type EntryMode = 'add' | 'subtract'

interface Props {
  onSelectMode: (mode: EntryMode) => void
}

export function CodeEntryCard({ onSelectMode }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) return
      setIsOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const selectMode = (mode: EntryMode) => {
    setIsOpen(false)
    onSelectMode(mode)
  }

  return (
    <div className="relative flex justify-end w-full lg:w-auto" ref={menuRef}>
      <button
        onClick={() => setIsOpen(open => !open)}
        className={`w-full md:w-auto px-5 lg:px-4 xl:px-5 h-12 lg:h-11 ${DESKTOP_PRIMARY_BUTTON_BASE}`}
      >
        <span className="relative inline-flex items-center justify-center w-5 h-5">
          <SquareStack className="w-5 h-5 lg:w-[18px] lg:h-[18px]" strokeWidth={2.5} />
          <Plus className="w-3 h-3 lg:w-3 lg:h-3 absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5" strokeWidth={3} />
        </span>
        <span className="md:hidden">Actualizar figurita</span>
        <span className="hidden md:inline xl:hidden">Actualizar</span>
        <span className="hidden xl:inline">Actualizar figuritas</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-zinc-900/40 md:absolute md:inset-auto md:right-0 md:top-[calc(100%+0.5rem)] md:block md:w-[320px] md:bg-transparent"
          onClick={() => setIsOpen(false)}
        >
          <div className="w-full rounded-t-[2rem] bg-white p-4 shadow-2xl md:rounded-3xl md:border md:border-zinc-200 md:p-2" onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between px-1 md:hidden">
              <h3 className="text-base font-black text-zinc-900">¿Qué querés hacer?</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                <X className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => selectMode('add')}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <SquareStack className="h-5 w-5" strokeWidth={2.5} />
                <Plus className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-emerald-600 p-0.5 text-white" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-zinc-900 md:hidden">Agregar figurita</span>
                <span className="hidden text-sm font-black text-zinc-900 md:block">Agregar figuritas</span>
                <span className="block text-xs font-medium text-zinc-500 md:hidden">Sumá una nueva o repetida a tu álbum.</span>
                <span className="hidden text-xs font-medium text-zinc-500 md:block">Sumá nuevas o repetidas a tu álbum.</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => selectMode('subtract')}
              className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <SquareStack className="h-5 w-5" strokeWidth={2.5} />
                <Minus className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-amber-600 p-0.5 text-white" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-zinc-900 md:hidden">Descontar figurita</span>
                <span className="hidden text-sm font-black text-zinc-900 md:block">Descontar figuritas</span>
                <span className="block text-xs font-medium text-zinc-500 md:hidden">Restá una figurita que entregaste.</span>
                <span className="hidden text-xs font-medium text-zinc-500 md:block">Restá las que entregaste en un canje.</span>
              </span>
            </button>

            <button type="button" onClick={() => setIsOpen(false)} className="mt-2 w-full rounded-2xl border border-zinc-200 py-3 text-sm font-bold text-zinc-600 md:hidden">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
