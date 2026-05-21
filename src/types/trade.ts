export interface TradeUser {
  id: string | number
  name: string
  distance: string
  hasForYou: number
  youHaveForThem: number
  offers: string[]
}

export interface Connection extends TradeUser {
  isNew: boolean
  hasUnread: boolean
}

export interface TradeMatch {
  theyOffer: Record<string, number>
  iOffer: Record<string, number>
  theyOfferCount: number
  iOfferCount: number
}

export interface TradeCandidate {
  userId: string
  username: string
  uniqueCount: number
  percentage: number
  theyOfferCount: number
  iOfferCount: number
  matchScore: number
}

export type TradeProposalStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
export type TradeProposalDirection = 'sent' | 'received'

export interface TradeProposalSticker {
  normalizedCode: string
  visualCode: string
  name: string
  section: string
  quantity: number
}

export interface TradeProposal {
  id: string
  direction: TradeProposalDirection
  status: TradeProposalStatus
  otherUserId: string
  otherUsername: string
  creatorWillReceive: TradeProposalSticker[]
  creatorWillGive: TradeProposalSticker[]
  createdAt: string
  updatedAt: string
  acceptedAt?: string | null
  rejectedAt?: string | null
  cancelledAt?: string | null
  expiredAt?: string | null
}
