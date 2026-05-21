import { supabase } from '@/services/supabase'
import type { TradeProposal, TradeProposalSticker } from '@/types/trade'

interface TradeProposalRow {
  id: string
  direction: 'sent' | 'received'
  status: TradeProposal['status']
  other_user_id: string
  other_username: string
  creator_will_receive: TradeProposalSticker[]
  creator_will_give: TradeProposalSticker[]
  created_at: string
  updated_at: string
  accepted_at: string | null
  rejected_at: string | null
  cancelled_at: string | null
  expired_at: string | null
}

function rowToProposal(row: TradeProposalRow): TradeProposal {
  return {
    id: row.id,
    direction: row.direction,
    status: row.status,
    otherUserId: row.other_user_id,
    otherUsername: row.other_username,
    creatorWillReceive: row.creator_will_receive ?? [],
    creatorWillGive: row.creator_will_give ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    rejectedAt: row.rejected_at,
    cancelledAt: row.cancelled_at,
    expiredAt: row.expired_at,
  }
}

export async function createTradeProposal(
  targetUserId: string,
  creatorWillReceive: TradeProposalSticker[],
  creatorWillGive: TradeProposalSticker[],
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('create_trade_proposal', {
    p_target_user_id: targetUserId,
    p_creator_will_receive: creatorWillReceive,
    p_creator_will_give: creatorWillGive,
  })

  return { id: (data as string | null) ?? null, error: error?.message ?? null }
}

export async function listTradeProposals(): Promise<{ data: TradeProposal[]; error: string | null }> {
  const { data, error } = await supabase.rpc('list_my_trade_proposals')
  if (error) return { data: [], error: error.message }
  return { data: ((data ?? []) as TradeProposalRow[]).map(rowToProposal), error: null }
}

export async function acceptTradeProposal(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('accept_trade_proposal', { p_proposal_id: id })
  return { error: error?.message ?? null }
}

export async function rejectTradeProposal(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('reject_trade_proposal', { p_proposal_id: id })
  return { error: error?.message ?? null }
}

export async function cancelTradeProposal(id: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('cancel_trade_proposal', { p_proposal_id: id })
  return { error: error?.message ?? null }
}
