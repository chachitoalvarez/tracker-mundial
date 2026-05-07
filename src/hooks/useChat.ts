import { useState } from 'react'
import type { Connection } from '@/types/trade'
import type { ChatHistory } from '@/types/chat'

export function useChat(
  markConnectionRead: (userId: number) => void,
  markConnectionUnread: (userId: number) => void
) {
  const [activeChatUser, setActiveChatUser] = useState<Connection | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatHistory>({})
  const [isTyping, setIsTyping] = useState(false)

  const handleOpenChat = (user: Connection) => {
    setActiveChatUser(user)
    markConnectionRead(user.id)

    if (!chatHistory[user.id]) {
      setChatHistory(prev => ({
        ...prev,
        [user.id]: [
          { sender: 'system', text: 'Para tu seguridad, te recomendamos realizar los intercambios en lugares públicos y en horarios diurnos. Nunca transfieras dinero por adelantado ni compartas datos bancarios.' },
        ],
      }))
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim() || !activeChatUser) return

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setChatHistory(prev => ({
      ...prev,
      [activeChatUser.id]: [
        ...(prev[activeChatUser.id] ?? []),
        { sender: 'me', text: chatMessage, time: currentTime },
      ],
    }))
    setChatMessage('')
    markConnectionUnread(activeChatUser.id)

    // TODO: send message via Supabase realtime
    setIsTyping(false)
  }

  return {
    activeChatUser,
    setActiveChatUser,
    chatMessage,
    setChatMessage,
    chatHistory,
    isTyping,
    handleOpenChat,
    handleSendMessage,
  }
}
