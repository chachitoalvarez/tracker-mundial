import { Check, RefreshCcw, X } from 'lucide-react'
import type { TradeProposal, TradeProposalSticker } from '@/types/trade'

interface Props {
  proposal: TradeProposal
  onAccept?: (proposal: TradeProposal) => void
  onReject?: (proposal: TradeProposal) => void
  onCancel?: (proposal: TradeProposal) => void
}

const STATUS_LABEL: Record<TradeProposal['status'], string> = {
  pending: 'Pendiente',
  accepted: 'Canje registrado',
  rejected: 'Rechazada',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

function StickerList({ title, stickers }: { title: string; stickers: TradeProposalSticker[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-black uppercase tracking-wider text-zinc-400">{title}</p>
      <div className="space-y-1">
        {stickers.length ? stickers.slice(0, 4).map(sticker => (
          <div key={sticker.normalizedCode} className="flex items-center gap-2 rounded-xl bg-zinc-50 px-2 py-1.5">
            <span className="w-12 shrink-0 text-xs font-black text-zinc-800">{sticker.visualCode}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-500">{sticker.name}</span>
          </div>
        )) : (
          <p className="rounded-xl bg-zinc-50 px-2 py-2 text-xs font-medium text-zinc-400">Sin figuritas</p>
        )}
        {stickers.length > 4 && (
          <p className="px-2 text-xs font-bold text-zinc-400">+{stickers.length - 4} más</p>
        )}
      </div>
    </div>
  )
}

export function TradeProposalCard({ proposal, onAccept, onReject, onCancel }: Props) {
  const isReceived = proposal.direction === 'received'
  const receive = isReceived ? proposal.creatorWillGive : proposal.creatorWillReceive
  const deliver = isReceived ? proposal.creatorWillReceive : proposal.creatorWillGive
  const isPending = proposal.status === 'pending'

  return (
    <article className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-zinc-900">
            {isReceived ? 'Propuesta de canje' : 'Propuesta enviada'}
          </p>
          <p className="mt-0.5 truncate text-xs font-bold text-zinc-500">@{proposal.otherUsername}</p>
        </div>
        <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wider ${
          proposal.status === 'pending' ? 'bg-amber-100 text-amber-700' :
          proposal.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
          'bg-zinc-100 text-zinc-500'
        }`}>
          {STATUS_LABEL[proposal.status]}
        </span>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <StickerList title="Vas a recibir" stickers={receive} />
        <StickerList title="Vas a entregar" stickers={deliver} />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-100 pt-3">
        <p className="text-xs font-bold text-zinc-500">Recibís {receive.length} · Entregás {deliver.length}</p>
        {isPending && isReceived && (
          <div className="flex gap-2">
            <button onClick={() => onReject?.(proposal)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50">
              <X className="h-3.5 w-3.5" strokeWidth={3} />
              Rechazar
            </button>
            <button onClick={() => onAccept?.(proposal)} className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-black text-white hover:bg-amber-600">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
              Aceptar canje
            </button>
          </div>
        )}
        {isPending && !isReceived && (
          <button onClick={() => onCancel?.(proposal)} className="flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-600 hover:bg-zinc-50">
            <RefreshCcw className="h-3.5 w-3.5" strokeWidth={3} />
            Cancelar
          </button>
        )}
      </div>
    </article>
  )
}
