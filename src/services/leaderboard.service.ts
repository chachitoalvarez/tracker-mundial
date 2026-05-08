import { supabase } from '@/services/supabase'
import type { LeaderboardEntry } from '@/types/user'

interface LeaderboardRow {
  user_id: string
  username: string
  unique_count: number
  repeated_count: number
  total_needed: number
  percentage: number
}

async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

function rowToEntry(row: LeaderboardRow, currentUserId: string | null): LeaderboardEntry {
  return {
    id: row.user_id,
    name: row.username ?? `#${row.user_id.slice(-4)}`,
    email: '',
    completed: row.unique_count,
    needed: row.total_needed,
    repeated: row.repeated_count,
    isMe: row.user_id === currentUserId,
  }
}

export async function getGlobalLeaderboard(limit = 100): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const [currentUserId, { data, error }] = await Promise.all([
    getCurrentUserId(),
    supabase.rpc('get_leaderboard_global', { limit_count: limit }),
  ])

  if (error) return { data: [], error: error.message }

  const entries = ((data ?? []) as LeaderboardRow[]).map((row: LeaderboardRow) => rowToEntry(row, currentUserId))

  // Append current user at the bottom if outside top N
  if (currentUserId && !entries.some((e: LeaderboardEntry) => e.isMe)) {
    const { data: extra } = await supabase.rpc('get_leaderboard_global', { limit_count: 10000 })
    const myRow = ((extra ?? []) as LeaderboardRow[]).find((r: LeaderboardRow) => r.user_id === currentUserId)
    if (myRow) entries.push(rowToEntry(myRow, currentUserId))
  }

  return { data: entries, error: null }
}

export async function getGroupLeaderboard(groupId: string): Promise<{ data: LeaderboardEntry[]; error: string | null }> {
  const [currentUserId, { data, error }] = await Promise.all([
    getCurrentUserId(),
    supabase.rpc('get_group_leaderboard', { p_group_id: groupId }),
  ])

  if (error) return { data: [], error: error.message }

  const entries = ((data ?? []) as LeaderboardRow[])
    .map(row => rowToEntry(row, currentUserId))
    .sort((a, b) => b.completed - a.completed)

  return { data: entries, error: null }
}
