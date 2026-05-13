import { supabase } from '@/services/supabase'
import type { ChatConnection, ChatMessage } from '@/types/chat'

/* ── Connections ── */

interface ConnectionRow {
  connection_id: string
  other_user_id: string
  other_username: string
  last_message_content: string | null
  last_message_at: string | null
  last_message_sender: string | null
  unread_count: number
}

export async function getOrCreateConnection(otherUserId: string): Promise<{ connectionId: string | null; error: string | null }> {
  const { data, error } = await supabase.rpc('get_or_create_connection', { p_other_user_id: otherUserId })
  if (error) return { connectionId: null, error: error.message }
  const row = Array.isArray(data) ? data[0] : data
  return { connectionId: row?.connection_id ?? row ?? null, error: null }
}

export async function listConnections(): Promise<{ data: ChatConnection[]; error: string | null }> {
  const { data, error } = await supabase.rpc('list_my_connections')
  if (error) return { data: [], error: error.message }
  const rows = (Array.isArray(data) ? data : [data].filter(Boolean)) as ConnectionRow[]
  return {
    data: rows.map(r => ({
      connectionId: r.connection_id,
      otherUserId: r.other_user_id,
      otherUsername: r.other_username,
      lastMessageContent: r.last_message_content,
      lastMessageAt: r.last_message_at,
      lastMessageSender: r.last_message_sender,
      unreadCount: r.unread_count,
    })),
    error: null,
  }
}

/* ── Messages ── */

export async function listMessages(connectionId: string, limit = 50): Promise<{ data: ChatMessage[]; error: string | null }> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, connection_id, sender_id, content, created_at, read_at')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) return { data: [], error: error.message }
  return {
    data: (data ?? []).map(r => ({
      id: r.id,
      connectionId: r.connection_id,
      senderId: r.sender_id,
      content: r.content,
      createdAt: r.created_at,
      readAt: r.read_at,
    })),
    error: null,
  }
}

export async function sendMessage(connectionId: string, content: string): Promise<{ data: ChatMessage | null; error: string | null }> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No hay sesión activa' }

  const { data, error } = await supabase
    .from('messages')
    .insert({ connection_id: connectionId, sender_id: user.id, content })
    .select('id, connection_id, sender_id, content, created_at, read_at')
    .single()

  if (error) return { data: null, error: error.message }
  return {
    data: {
      id: data.id,
      connectionId: data.connection_id,
      senderId: data.sender_id,
      content: data.content,
      createdAt: data.created_at,
      readAt: data.read_at,
    },
    error: null,
  }
}

export async function markAsRead(connectionId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('connection_id', connectionId)
    .neq('sender_id', user.id)
    .is('read_at', null)
}

/* ── Realtime ── */

export function subscribeToMessages(
  connectionId: string,
  onNewMessage: (msg: ChatMessage) => void,
) {
  const channel = supabase
    .channel(`messages:${connectionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `connection_id=eq.${connectionId}`,
      },
      (payload) => {
        const r = payload.new as Record<string, unknown>
        onNewMessage({
          id: r.id as string,
          connectionId: r.connection_id as string,
          senderId: r.sender_id as string,
          content: r.content as string,
          createdAt: r.created_at as string,
          readAt: (r.read_at as string) ?? null,
        })
      },
    )
    .subscribe()

  return () => { supabase.removeChannel(channel) }
}
