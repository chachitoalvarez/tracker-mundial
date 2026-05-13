import { createContext, useContext, type ReactNode } from 'react'
import { useChat as useChatInternal } from '@/hooks/useChat'

type ChatContextValue = ReturnType<typeof useChatInternal>

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useChatInternal()
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
