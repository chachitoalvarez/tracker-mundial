import { Heart, Loader2 } from 'lucide-react'
import { IntercambiosTabs } from '@/features/intercambios/IntercambiosTabs'
import { SwipeableCard } from '@/features/intercambios/SwipeableCard'
import { ConnectionCard } from '@/features/intercambios/ConnectionCard'
import { LikeSentCard } from '@/features/intercambios/LikeSentCard'
import { LikeReceivedCard } from '@/features/intercambios/LikeReceivedCard'
import { TradeProposalCard } from '@/features/intercambios/TradeProposalCard'
import { MatchAnimation } from '@/components/overlays/MatchAnimation'
import type { IntercambiosTab } from '@/lib/constants'
import type { TradeProposal, TradeUser, Connection } from '@/types/trade'

interface Props {
  intercambiosTab: IntercambiosTab
  setIntercambiosTab: (tab: IntercambiosTab) => void
  currentTradeUser: TradeUser | null
  isLoadingCandidates: boolean
  showMatchAnimation: boolean
  connections: Connection[]
  likedByMe: TradeUser[]
  likedByThem: TradeUser[]
  sentProposals: TradeProposal[]
  receivedProposals: TradeProposal[]
  unreadConnectionsCount: number
  onSwipe: (dir: 'left' | 'right', user: TradeUser) => void
  onOpenChat: (user: Connection) => void
  onAcceptLike: (user: TradeUser) => void
  onRejectLike: (user: TradeUser) => void
  onAcceptProposal: (proposal: TradeProposal) => void
  onRejectProposal: (proposal: TradeProposal) => void
  onCancelProposal: (proposal: TradeProposal) => void
}

export function IntercambiosView({
  intercambiosTab, setIntercambiosTab,
  currentTradeUser, isLoadingCandidates, showMatchAnimation,
  connections, likedByMe, likedByThem, sentProposals, receivedProposals, unreadConnectionsCount,
  onSwipe, onOpenChat, onAcceptLike, onRejectLike,
  onAcceptProposal, onRejectProposal, onCancelProposal,
}: Props) {
  const pendingReceivedCount = receivedProposals.filter(item => item.status === 'pending').length

  return (
    <div className="flex flex-col items-center justify-center py-0 lg:py-2 sm:py-4 animate-in slide-in-from-right-4 duration-300 w-full max-w-3xl mx-auto">
      <IntercambiosTabs
        activeTab={intercambiosTab}
        onTabChange={setIntercambiosTab}
        unreadConnectionsCount={unreadConnectionsCount}
        likedByThemCount={likedByThem.length + pendingReceivedCount}
      />

      {intercambiosTab === 'explorar' && (
        <div className="w-full max-w-[360px] mx-auto mt-2 lg:mt-1">
          {isLoadingCandidates ? (
            <div className="flex flex-col items-center justify-center min-h-[640px] gap-3 text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin" strokeWidth={2} />
              <p className="text-sm font-medium">Buscando coleccionistas...</p>
            </div>
          ) : (
            <SwipeableCard user={currentTradeUser} showMatchAnimation={showMatchAnimation} onSwipe={onSwipe} />
          )}
        </div>
      )}

      {intercambiosTab === 'conexiones' && (
        <div className="w-full bg-white rounded-[2rem] shadow-sm border border-zinc-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 lg:p-4 border-b border-zinc-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
            <h3 className="text-xl lg:text-lg font-black text-zinc-900 flex items-center gap-2.5 tracking-tight">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Heart className="w-5 h-5 text-emerald-500 fill-emerald-500" strokeWidth={2.5} />
              </div>
              Matches Confirmados
            </h3>
          </div>
          <div className="p-2 sm:p-4 space-y-2">
            {connections.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-medium">
                Aún no tienes conexiones. Seguí explorando para encontrar con quién cambiar.
              </div>
            ) : connections.map(user => (
              <ConnectionCard key={user.id} connection={user} onOpenChat={onOpenChat} />
            ))}
          </div>
        </div>
      )}

      {intercambiosTab === 'dados' && (
        <div className="w-full bg-white rounded-[2rem] shadow-sm border border-zinc-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 lg:p-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-xl lg:text-lg font-black text-zinc-900 tracking-tight">Enviados</h3>
            <p className="text-sm text-zinc-500 font-medium mt-1">Propuestas pendientes y solicitudes enviadas.</p>
          </div>
          <div className="p-2 sm:p-4 space-y-2">
            {sentProposals.map(proposal => (
              <TradeProposalCard key={proposal.id} proposal={proposal} onCancel={onCancelProposal} />
            ))}
            {likedByMe.map(user => <LikeSentCard key={user.id} user={user} />)}
            {sentProposals.length === 0 && likedByMe.length === 0 && (
              <div className="p-12 text-center text-zinc-500 font-medium">Aún no enviaste propuestas. Abrí el perfil de otro usuario para proponer un canje.</div>
            )}
          </div>
        </div>
      )}

      {intercambiosTab === 'recibidos' && (
        <div className="w-full bg-white rounded-[2rem] shadow-sm border border-zinc-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 lg:p-4 border-b border-zinc-100 bg-gradient-to-r from-red-50 to-white">
            <h3 className="text-xl lg:text-lg font-black text-zinc-900 tracking-tight">Recibidos</h3>
            <p className="text-sm text-zinc-500 font-medium mt-1">Revisá propuestas y solicitudes pendientes.</p>
          </div>
          {showMatchAnimation && <MatchAnimation label="NUEVA CONEXIÓN" />}
          <div className="p-2 sm:p-4 space-y-2">
            {receivedProposals.map(proposal => (
              <TradeProposalCard
                key={proposal.id}
                proposal={proposal}
                onAccept={onAcceptProposal}
                onReject={onRejectProposal}
              />
            ))}
            {likedByThem.map(user => (
              <LikeReceivedCard key={user.id} user={user} onAccept={onAcceptLike} onReject={onRejectLike} />
            ))}
            {receivedProposals.length === 0 && likedByThem.length === 0 && (
              <div className="p-12 text-center text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">
                No tienes solicitudes nuevas.<br />Mantené tus repetidas al día para atraer más canjes.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
