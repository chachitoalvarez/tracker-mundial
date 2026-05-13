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
