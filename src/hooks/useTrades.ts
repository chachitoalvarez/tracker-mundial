import { useState } from 'react'
import type { TradeUser, Connection } from '@/types/trade'

export function useTrades(
  _triggerCelebration: (type: 'sticker' | 'achievement' | 'match', msg: string, icon: string) => void
) {
  const [tradeUsers] = useState<TradeUser[]>([])
  const [swipeIndex, setSwipeIndex] = useState(0)
  const [likedByMe, setLikedByMe] = useState<TradeUser[]>([])
  const [likedByThem, setLikedByThem] = useState<TradeUser[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [showMatchAnimation, setShowMatchAnimation] = useState(false)

  const handleSwipe = (direction: 'left' | 'right', user: TradeUser) => {
    if (direction === 'right') {
      setLikedByMe(prev => [...prev, user])
    }
    setSwipeIndex(prev => prev + 1)
  }

  const handleAcceptLike = (user: TradeUser) => {
    setConnections(prev => [...prev, { ...user, isNew: true, hasUnread: false }])
    setLikedByThem(prev => prev.filter(u => u.id !== user.id))
    setShowMatchAnimation(true)
    setTimeout(() => setShowMatchAnimation(false), 1500)
  }

  const handleRejectLike = (user: TradeUser) => {
    setLikedByThem(prev => prev.filter(u => u.id !== user.id))
  }

  const markConnectionRead = (userId: number) => {
    setConnections(prev => prev.map(c =>
      c.id === userId ? { ...c, isNew: false, hasUnread: false } : c
    ))
  }

  const markConnectionUnread = (userId: number) => {
    setConnections(prev => prev.map(c =>
      c.id === userId ? { ...c, hasUnread: true } : c
    ))
  }

  const currentTradeUser = tradeUsers[swipeIndex] ?? null
  const unreadConnectionsCount = connections.filter(c => c.isNew || c.hasUnread).length

  return {
    swipeIndex,
    likedByMe,
    likedByThem,
    connections,
    showMatchAnimation,
    currentTradeUser,
    unreadConnectionsCount,
    handleSwipe,
    handleAcceptLike,
    handleRejectLike,
    markConnectionRead,
    markConnectionUnread,
  }
}
