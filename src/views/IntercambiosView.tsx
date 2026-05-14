import { Heart, Loader2 } from 'lucide-react'
import { IntercambiosTabs } from '@/features/intercambios/IntercambiosTabs'
import { SwipeableCard } from '@/features/intercambios/SwipeableCard'
import { ConnectionCard } from '@/features/intercambios/ConnectionCard'
import { LikeSentCard } from '@/features/intercambios/LikeSentCard'
import { LikeReceivedCard } from '@/features/intercambios/LikeReceivedCard'
import { MatchAnimation } from '@/components/overlays/MatchAnimation'
import type { IntercambiosTab } from '@/lib/constants'
import type { TradeUser, Connection } from '@/types/trade'

interface Props {
  intercambiosTab: IntercambiosTab
  setIntercambiosTab: (tab: IntercambiosTab) => void
  currentTradeUser: TradeUser | null
  isLoadingCandidates: boolean
  showMatchAnimation: boolean
  connections: Connection[]
  likedByMe: TradeUser[]
  likedByThem: TradeUser[]
  unreadConnectionsCount: number
  onSwipe: (dir: 'left' | 'right', user: TradeUser) => void
  onOpenChat: (user: Connection) => void
  onAcceptLike: (user: TradeUser) => void
  onRejectLike: (user: TradeUser) => void
}

export function IntercambiosView({
  intercambiosTab, setIntercambiosTab,
  currentTradeUser, isLoadingCandidates, showMatchAnimation,
  connections, likedByMe, likedByThem, unreadConnectionsCount,
  onSwipe, onOpenChat, onAcceptLike, onRejectLike,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-0 lg:py-2 sm:py-4 animate-in slide-in-from-right-4 duration-300 w-full max-w-3xl mx-auto">
      <IntercambiosTabs
        activeTab={intercambiosTab}
        onTabChange={setIntercambiosTab}
        unreadConnectionsCount={unreadConnectionsCount}
        likedByThemCount={likedByThem.length}
      />

      {/* Explorar */}
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

      {/* Conexiones */}
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
                Aún no tienes conexiones. ¡Sigue explorando para encontrar con quién cambiar!
              </div>
            ) : connections.map(user => (
              <ConnectionCard key={user.id} connection={user} onOpenChat={onOpenChat} />
            ))}
          </div>
        </div>
      )}

      {/* Dados */}
      {intercambiosTab === 'dados' && (
        <div className="w-full bg-white rounded-[2rem] shadow-sm border border-zinc-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 lg:p-4 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="text-xl lg:text-lg font-black text-zinc-900 tracking-tight">Likes enviados</h3>
            <p className="text-sm text-zinc-500 font-medium mt-1">Esperando a que ellos también te den like.</p>
          </div>
          <div className="p-2 sm:p-4 space-y-2">
            {likedByMe.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-medium">Aún no te interesa nadie. Ve a Explorar para ver quién tiene las figuritas que te faltan.</div>
            ) : likedByMe.map(user => <LikeSentCard key={user.id} user={user} />)}
          </div>
        </div>
      )}

      {/* Recibidos */}
      {intercambiosTab === 'recibidos' && (
        <div className="w-full bg-white rounded-[2rem] shadow-sm border border-zinc-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="p-5 lg:p-4 border-b border-zinc-100 bg-gradient-to-r from-red-50 to-white">
            <h3 className="text-xl lg:text-lg font-black text-zinc-900 tracking-tight">Les interesan tus figuritas</h3>
            <p className="text-sm text-zinc-500 font-medium mt-1">Acepta para abrir un chat e intercambiar.</p>
          </div>
          {showMatchAnimation && <MatchAnimation label="¡NUEVA CONEXIÓN!" />}
          <div className="p-2 sm:p-4 space-y-2">
            {likedByThem.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 font-medium leading-relaxed max-w-md mx-auto">
                No tienes solicitudes nuevas.<br />Mantén tus repetidas al día para atraer más canjes.
              </div>
            ) : likedByThem.map(user => (
              <LikeReceivedCard key={user.id} user={user} onAccept={onAcceptLike} onReject={onRejectLike} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
