import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getOrCreateConnection,
  listConnections as fetchConnections,
  listMessages,
  sendMessage as sendMsg,
  markAsRead,
  subscribeToMessages,
} from '@/services/chat.service'
import type { ChatMessage, ChatConnection } from '@/types/chat'

interface ActiveConnection {
  connectionId: string
  otherUserId: string
  otherUsername: string
}

export function useChat() {
  const { sessionUserId } = useAuth()

  const [activeConnection, setActiveConnection] = useState<ActiveConnection | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [connections, setConnections] = useState<ChatConnection[]>([])

  const unsubRef = useRef<(() => void) | null>(null)

  /* ── Connections list ── */

  const refreshConnections = useCallback(async () => {
    const { data } = await fetchConnections()
    setConnections(data)
  }, [])

  // Load connections on mount
  useEffect(() => {
    if (sessionUserId) refreshConnections()
  }, [sessionUserId, refreshConnections])

  /* ── Active conversation: load messages + realtime ── */

  useEffect(() => {
    if (!activeConnection) {
      setMessages([])
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null }
      return
    }

    let cancelled = false
    setIsLoadingMessages(true)

    const connId = activeConnection.connectionId

    listMessages(connId).then(({ data }) => {
      if (cancelled) return
      setMessages(data)
      setIsLoadingMessages(false)
      markAsRead(connId)
    })

    // Realtime subscription — single source of truth for new messages
    const unsub = subscribeToMessages(connId, (msg) => {
      setMessages(prev => {
        // Dedup: skip if already present
        if (prev.some(m => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      if (msg.senderId !== sessionUserId) {
        markAsRead(connId)
      }
    })
    unsubRef.current = unsub

    return () => {
      cancelled = true
      unsub()
      unsubRef.current = null
    }
  }, [activeConnection?.connectionId, sessionUserId])

  /* ── Actions ── */

  const openChatWithUser = useCallback(async (otherUserId: string, otherUsername: string, prefillInput?: string) => {
    const { connectionId, error } = await getOrCreateConnection(otherUserId)
    if (error || !connectionId) {
      console.error('[useChat] Failed to get/create connection:', error)
      return
    }
    setActiveConnection({ connectionId, otherUserId, otherUsername })
    setChatInput(prefillInput ?? '')
    refreshConnections()
  }, [refreshConnections])

  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || !activeConnection) return

    const contentToSend = chatInput.trim()
    setChatInput('') // optimistic clear

    const { error } = await sendMsg(activeConnection.connectionId, contentToSend)
    if (error) {
      console.error('[useChat] Send failed:', error)
      setChatInput(contentToSend) // restore input on failure
      return
    }
    // Do NOT append message here — realtime subscription handles it
    refreshConnections()
  }, [chatInput, activeConnection, refreshConnections])

  const closeChat = useCallback(() => {
    setActiveConnection(null)
    setChatInput('')
  }, [])

  return {
    activeConnection,
    messages,
    chatInput,
    setChatInput,
    isLoadingMessages,
    connections,
    sessionUserId,
    refreshConnections,
    openChatWithUser,
    sendMessage,
    closeChat,
  }
}
