// TODO: replace with Supabase calls when integrating
import type { TradeUser } from '@/types/trade'

export async function listTradeCandidates(): Promise<TradeUser[]> {
  // TODO: supabase.from('profiles').select(...).not('id', 'eq', currentUserId)
  return []
}

export async function sendLike(_userId: number): Promise<void> {
  // TODO: supabase.from('likes').insert(...)
}

export async function acceptLike(_userId: number): Promise<void> {
  // TODO: supabase.from('connections').insert(...)
}
