import { supabase } from '@/services/supabase'
import type { Group, GroupMember } from '@/types/group'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseEmails(raw: string): string[] {
  return [...new Set(
    raw.split(/[\s,;]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => EMAIL_RE.test(e))
  )]
}

function rowToGroup(row: Record<string, unknown>): Group {
  const members = (row.group_members as Record<string, unknown>[] ?? [])
  return {
    id: row.id as string,
    name: row.name as string,
    ownerId: row.owner_id as string,
    members: members.map((m): GroupMember => ({
      email: m.email as string,
      userId: (m.user_id as string) ?? null,
      joinedAt: (m.joined_at as string) ?? null,
    })),
  }
}

export async function listGroups(): Promise<{ data: Group[]; error: string | null }> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members(*)')
    .order('created_at', { ascending: false })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []).map(rowToGroup), error: null }
}

export async function createGroup(
  name: string,
  invitedEmails: string[],
): Promise<{ data: Group | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No hay sesión activa' }

  // TODO: wrap in RPC for atomicity
  const { data: groupRow, error: groupErr } = await supabase
    .from('groups')
    .insert({ name: name.trim(), owner_id: user.id })
    .select()
    .single()

  if (groupErr) return { data: null, error: groupErr.message }

  const groupId = (groupRow as Record<string, unknown>).id as string
  const ownerEmail = (user.email ?? '').toLowerCase()

  // Insert owner directly (always exists in auth.users)
  const { error: ownerErr } = await supabase.from('group_members').insert({
    group_id: groupId, email: ownerEmail, user_id: user.id, joined_at: new Date().toISOString(),
  })
  if (ownerErr) {
    await supabase.from('groups').delete().eq('id', groupId)
    return { data: null, error: ownerErr.message }
  }

  // Invite remaining emails via RPC (resolves user_id if already registered)
  const uniqueInvited = invitedEmails.filter(e => e !== ownerEmail)
  if (uniqueInvited.length) {
    const results = await Promise.all(
      uniqueInvited.map(email => supabase.rpc('invite_to_group', { p_group_id: groupId, p_email: email }))
    )
    const failed = results.filter(r => r.error).map(r => r.error!.message)
    if (failed.length) {
      await supabase.from('groups').delete().eq('id', groupId)
      return { data: null, error: failed.join('; ') }
    }
  }

  const { data: full, error: fetchErr } = await supabase
    .from('groups')
    .select('*, group_members(*)')
    .eq('id', groupId)
    .single()

  if (fetchErr) return { data: null, error: fetchErr.message }
  return { data: rowToGroup(full as Record<string, unknown>), error: null }
}

export async function addMembersToGroup(
  groupId: string,
  emails: string[],
): Promise<{ error: string | null }> {
  if (!emails.length) return { error: 'No se encontraron emails válidos' }

  const results = await Promise.all(
    emails.map(email => supabase.rpc('invite_to_group', { p_group_id: groupId, p_email: email }))
  )

  const failed = results.filter(r => r.error).map(r => r.error!.message)
  return { error: failed.length ? failed.join('; ') : null }
}

export async function removeMember(
  groupId: string,
  email: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('email', email)

  return { error: error?.message ?? null }
}

export async function deleteGroup(groupId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)
  return { error: error?.message ?? null }
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email?.toLowerCase() ?? null
}

export async function resolveUsernameToEmail(username: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_email_by_username', { p_username: username })
  if (error || !data) return null
  return data as string
}

export interface UserSuggestion {
  userId: string
  username: string
}

export async function searchUsersByUsername(query: string): Promise<{ data: UserSuggestion[]; error: string | null }> {
  const normalizedQuery = query.trim().replace(/^@/, '')
  if (normalizedQuery.length < 2) return { data: [], error: null }

  const { data, error } = await supabase.rpc('search_users_by_username', {
    p_query: normalizedQuery,
    p_limit: 5,
  })

  if (error) return { data: [], error: error.message }

  return {
    data: ((data ?? []) as Array<{ user_id: string; username: string }>).map(row => ({
      userId: row.user_id,
      username: row.username,
    })),
    error: null,
  }
}

export async function addMemberByEmail(groupId: string, email: string): Promise<{ error: string | null }> {
  const { error } = await supabase.rpc('invite_to_group', { p_group_id: groupId, p_email: email })
  return { error: error?.message ?? null }
}
