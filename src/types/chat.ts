export interface ChatMessage {
  id: string
  connectionId: string
  senderId: string
  content: string
  createdAt: string
  readAt: string | null
}

export interface ChatConnection {
  connectionId: string
  otherUserId: string
  otherUsername: string
  lastMessageContent: string | null
  lastMessageAt: string | null
  lastMessageSender: string | null
  unreadCount: number
}
