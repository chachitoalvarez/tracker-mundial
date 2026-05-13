import { useEffect, useRef } from 'react'
import { X, User, Send, ShieldAlert, MessageCircle } from 'lucide-react'
import { useChat } from '@/contexts/ChatContext'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function ChatDrawer() {
  const {
    activeConnection, messages, chatInput, setChatInput,
    isLoadingMessages, sessionUserId, sendMessage, closeChat,
  } = useChat()

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (!activeConnection) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  const isEmpty = !isLoadingMessages && messages.length === 0

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-sm transition-all duration-300 animate-in fade-in">
      <div className="absolute inset-0" onClick={closeChat} />
      <div className="w-full md:w-[450px] bg-zinc-50 h-[100dvh] shadow-2xl flex flex-col relative z-10 animate-in slide-in-from-right-8 duration-300 rounded-l-[2rem] md:rounded-l-none overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200/60 flex justify-between items-center bg-white shadow-sm z-20 pt-[calc(1rem+env(safe-area-inset-top))]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
              <User className="w-6 h-6 text-zinc-400" />
            </div>
            <div>
              <p className="font-black text-zinc-900 text-lg tracking-tight">@{activeConnection.otherUsername}</p>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Coleccionista</p>
            </div>
          </div>
          <button onClick={closeChat} className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-90">
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 flex flex-col bg-zinc-50 pb-28">

          {/* Safety notice */}
          <div className="flex gap-3 items-start bg-blue-50 border border-blue-100 text-blue-800 text-sm p-4 rounded-2xl mx-auto my-2 shadow-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
            <p className="leading-relaxed font-medium">
              Para tu seguridad, te recomendamos realizar los intercambios en lugares públicos y en horarios diurnos.
            </p>
          </div>

          {isLoadingMessages && messages.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
            </div>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center text-center py-12 flex-1 gap-3">
              <MessageCircle className="w-10 h-10 text-zinc-300" strokeWidth={1.5} />
              <p className="text-sm font-medium text-zinc-400">Iniciá la conversación</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === sessionUserId
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] p-3.5 text-[15px] font-medium shadow-sm whitespace-pre-line ${
                  isMe
                    ? 'bg-emerald-500 text-white rounded-[1.2rem] rounded-tr-sm'
                    : 'bg-white border border-zinc-200 text-zinc-800 rounded-[1.2rem] rounded-tl-sm'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] font-bold text-zinc-400 mt-1 px-1">
                  {formatTime(msg.createdAt)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-white border-t border-zinc-200/60 shadow-[0_-10px_20px_rgb(0,0,0,0.03)] pb-[calc(1rem+env(safe-area-inset-bottom))] absolute bottom-0 w-full z-20"
        >
          <div className="flex gap-2 items-center bg-zinc-100 rounded-full p-1.5 border border-zinc-200 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all focus-within:bg-white">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 bg-transparent border-transparent px-4 py-2 focus:outline-none text-[15px] font-medium text-zinc-800 placeholder-zinc-400"
              placeholder="Escribe un mensaje..."
              autoFocus
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="bg-emerald-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-emerald-600 disabled:bg-zinc-300 transition-all flex-shrink-0 active:scale-90"
            >
              <Send className="w-4 h-4 ml-0.5" strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
