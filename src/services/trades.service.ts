import { supabase } from '@/services/supabase'
import { LEGACY_PROJECT_SLUG, PROJECT_SLUG } from '@/lib/constants'
import type { TradeMatch, TradeCandidate, TradeUser } from '@/types/trade'

interface TradeMatchRow {
  they_offer: Record<string, number>
  i_offer: Record<string, number>
  they_offer_count: number
  i_offer_count: number
}

interface TradeCandidateRow {
  user_id: string
  username: string
  unique_count: number
  percentage: number
  they_offer_count: number
  i_offer_count: number
  match_score: number
}

type TradeMatchResult =
  | { ok: true; match: TradeMatch }
  | { ok: false; reason: 'not_accessible' | 'unknown'; message: string }

export async function getTradeMatch(otherUserId: string): Promise<TradeMatchResult> {
  const { data, error } = await supabase.rpc('get_trade_match', { p_other_user_id: otherUserId })

  if (error) {
    const reason = error.message?.includes('User not accessible') ? 'not_accessible' : 'unknown'
    return { ok: false, reason, message: error.message }
  }

  // RETURNS TABLE(...) comes back as array; RETURNS json/record comes back as object
  const row = (Array.isArray(data) ? data[0] : data) as TradeMatchRow | undefined

  if (!row) return { ok: true, match: { theyOffer: {}, iOffer: {}, theyOfferCount: 0, iOfferCount: 0 } }

  return {
    ok: true,
    match: {
      theyOffer: row.they_offer ?? {},
      iOffer: row.i_offer ?? {},
      theyOfferCount: row.they_offer_count ?? 0,
      iOfferCount: row.i_offer_count ?? 0,
    },
  }
}

export async function getTradeCandidates(limit = 20): Promise<{ data: TradeCandidate[]; error: string | null }> {
  const { data, error } = await supabase.rpc('get_trade_candidates', { p_limit: limit })
  if (error) {
    console.error('[getTradeCandidates] ERROR:', { message: error.message, details: error.details, hint: error.hint, code: error.code })
    return { data: [], error: error.message }
  }
  const rows = (data ?? []) as TradeCandidateRow[]
  return {
    data: rows.map(r => ({
      userId: r.user_id,
      username: r.username,
      uniqueCount: r.unique_count,
      percentage: r.percentage,
      theyOfferCount: r.they_offer_count,
      iOfferCount: r.i_offer_count,
      matchScore: r.match_score,
    })),
    error: null,
  }
}

function localSentKey(userId: string) {
  return `${PROJECT_SLUG}-trade-likes-sent:${userId}`
}

function legacyLocalSentKey(userId: string) {
  return `${LEGACY_PROJECT_SLUG}-trade-likes-sent:${userId}`
}

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? ''
}

function readLocalSent(userId: string): TradeUser[] {
  try {
    const stored = localStorage.getItem(localSentKey(userId)) ?? localStorage.getItem(legacyLocalSentKey(userId))
    const parsed = JSON.parse(stored ?? '[]') as TradeUser[]
    if (stored && !localStorage.getItem(localSentKey(userId))) {
      localStorage.setItem(localSentKey(userId), stored)
    }
    return parsed
  } catch {
    return []
  }
}

function writeLocalSent(userId: string, users: TradeUser[]) {
  localStorage.setItem(localSentKey(userId), JSON.stringify(users))
}

export async function listSentLikes(): Promise<{ data: TradeUser[]; error: string | null }> {
  const userId = await getCurrentUserId()
  return { data: userId ? readLocalSent(userId) : [], error: null }
}

export async function listReceivedLikes(): Promise<{ data: TradeUser[]; error: string | null }> {
  return { data: [], error: null }
}

export async function sendTradeLike(user: TradeUser): Promise<{ matched: boolean; error: string | null }> {
  const userId = await getCurrentUserId()
  if (userId) {
    const current = readLocalSent(userId)
    if (!current.some(item => String(item.id) === String(user.id))) {
      writeLocalSent(userId, [...current, user])
    }
  }
  return { matched: false, error: null }
}

export async function acceptTradeLike(user: TradeUser): Promise<{ error: string | null }> {
  void user
  return { error: null }
}

export async function rejectTradeLike(user: TradeUser): Promise<{ error: string | null }> {
  void user
  return { error: null }
}
