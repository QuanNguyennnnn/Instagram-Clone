import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Edit } from 'lucide-react'
import toast from 'react-hot-toast'
import { messageApi } from '../../api/message.api'
import { useAuthStore } from '../../stores/authStore'
import { useSocketStore } from '../../stores/socketStore'
import { useSocketEvent, useJoinConversation } from '../../hooks/useSocket'
import { timeAgo, getErrorMessage } from '../../lib/utils'
import Avatar from '../../components/ui/Avatar'
import Spinner from '../../components/ui/Spinner'

export default function MessagesPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [conversations, setConversations] = useState([])
  const [convsLoading, setConvsLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setConvsLoading(true)
    try {
      const { data } = await messageApi.getConversations()
      setConversations(data.data.conversations)
    } catch { } finally {
      setConvsLoading(false)
    }
  }

  useSocketEvent('new-message', useCallback((msg) => {
    setConversations((prev) => prev.map((c) =>
      c._id === msg.conversation
        ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
        : c
    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
  }, []))

  const activeConv = conversations.find((c) => c._id === conversationId)

  return (
    <div className="max-w-[935px] mx-auto h-[calc(100vh-4rem)] flex border border-[#dbdbdb] rounded-lg overflow-hidden bg-white">
      {/* Conversation list */}
      <div className={`${conversationId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[350px] border-r border-[#dbdbdb] shrink-0`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#dbdbdb]">
          <span className="font-semibold text-[#262626]">{user?.username}</span>
          <button className="p-1 hover:bg-gray-100 rounded-full">
            <Edit size={20} className="text-[#262626]" />
          </button>
        </div>

        <p className="px-4 py-3 text-sm font-semibold text-[#262626]">Tin nhắn</p>

        {convsLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-[#8e8e8e] p-4">
            <p className="text-sm text-center">Chưa có tin nhắn nào</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            {conversations.map((conv) => {
              const other = conv.participants?.find((p) => p._id !== user?._id)
              const isActive = conv._id === conversationId
              return (
                <button
                  key={conv._id}
                  onClick={() => navigate(`/messages/${conv._id}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${isActive ? 'bg-gray-50' : ''}`}
                >
                  <Avatar src={other?.avatar} size={44} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-semibold text-[#262626] truncate">{other?.username}</p>
                    {conv.lastMessage && (
                      <p className="text-xs text-[#8e8e8e] truncate">
                        {conv.lastMessage.sender === user?._id ? 'Bạn: ' : ''}{conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <span className="text-xs text-[#8e8e8e] shrink-0">{timeAgo(conv.lastMessage.createdAt)}</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Chat window */}
      {conversationId ? (
        <ChatWindow
          conversationId={conversationId}
          currentUser={user}
          partner={activeConv?.participants?.find((p) => p._id !== user?._id)}
          onBack={() => navigate('/messages')}
          onNewMessage={(msg) => {
            setConversations((prev) => prev.map((c) =>
              c._id === conversationId
                ? { ...c, lastMessage: msg, updatedAt: msg.createdAt }
                : c
            ))
          }}
        />
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-3 text-[#8e8e8e]">
          <div className="w-16 h-16 rounded-full border-2 border-[#262626] flex items-center justify-center">
            <Send size={28} className="text-[#262626]" />
          </div>
          <p className="font-semibold text-[#262626]">Tin nhắn của bạn</p>
          <p className="text-sm">Gửi ảnh và tin nhắn riêng tư cho bạn bè.</p>
        </div>
      )}
    </div>
  )
}

function ChatWindow({ conversationId, currentUser, partner, onBack, onNewMessage }) {
  const [messages, setMessages] = useState([])
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()
  const socket = useSocketStore((s) => s.socket)
  const typingTimer = useRef()

  useJoinConversation(conversationId)

  useEffect(() => {
    setMessages([])
    setCursor(null)
    setHasMore(true)
    setLoading(true)
    loadMessages()
    markAsRead()
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async (cur = null) => {
    try {
      const { data } = await messageApi.getMessages(conversationId, { limit: 30, cursor: cur })
      const fetched = data.data.messages.reverse()
      setMessages((prev) => cur ? [...fetched, ...prev] : fetched)
      setCursor(data.data.nextCursor)
      setHasMore(!!data.data.nextCursor)
    } catch { } finally {
      setLoading(false)
    }
  }

  const markAsRead = () => {
    messageApi.markRead(conversationId).catch(() => {})
  }

  useSocketEvent('new-message', useCallback((msg) => {
    if (msg.conversation !== conversationId) return
    setMessages((prev) => [...prev, msg])
    markAsRead()
  }, [conversationId]))

  useSocketEvent('typing', useCallback(({ conversationId: cid, userId }) => {
    if (cid !== conversationId || userId === currentUser?._id) return
    setTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 3000)
  }, [conversationId, currentUser]))

  const emitTyping = () => {
    socket?.emit('typing', { conversationId })
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    try {
      const { data } = await messageApi.sendMessage(conversationId, content)
      const msg = data.data.message
      setMessages((prev) => [...prev, msg])
      onNewMessage(msg)
    } catch (err) {
      setText(content)
      toast.error(getErrorMessage(err))
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#dbdbdb]">
        <button onClick={onBack} className="md:hidden p-1">
          <ArrowLeft size={20} />
        </button>
        {partner && (
          <>
            <Link to={`/${partner.username}`}>
              <Avatar src={partner.avatar} size={36} />
            </Link>
            <Link to={`/${partner.username}`} className="font-semibold text-sm text-[#262626]">
              {partner.username}
            </Link>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {hasMore && (
          <div className="flex justify-center">
            <button onClick={() => loadMessages(cursor)} className="text-xs text-[#0095f6] hover:underline">
              Tải thêm tin nhắn
            </button>
          </div>
        )}
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender?._id === currentUser?._id || msg.sender === currentUser?._id
            return (
              <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                {!isMine && <Avatar src={partner?.avatar} size={24} className="mr-2 self-end" />}
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm break-words ${isMine ? 'bg-[#0095f6] text-white' : 'bg-[#efefef] text-[#262626]'}`}
                >
                  {msg.content}
                </div>
              </div>
            )
          })
        )}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-[#efefef] px-4 py-2 rounded-2xl text-sm text-[#8e8e8e]">Đang nhập...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-3 px-4 py-3 border-t border-[#dbdbdb]">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => { setText(e.target.value); emitTyping() }}
          placeholder="Nhắn tin..."
          className="flex-1 text-sm bg-[#efefef] rounded-full px-4 py-2 outline-none placeholder:text-[#8e8e8e]"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="text-sm font-semibold text-[#0095f6] hover:text-[#1877f2] disabled:opacity-40"
        >
          Gửi
        </button>
      </form>
    </div>
  )
}
