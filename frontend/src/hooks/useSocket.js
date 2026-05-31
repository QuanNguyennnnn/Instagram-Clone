import { useEffect } from 'react'
import { useSocketStore } from '../stores/socketStore'

export function useSocketEvent(event, handler) {
  const socket = useSocketStore((s) => s.socket)

  useEffect(() => {
    if (!socket) return
    socket.on(event, handler)
    return () => socket.off(event, handler)
  }, [socket, event, handler])
}

export function useJoinConversation(conversationId) {
  const socket = useSocketStore((s) => s.socket)

  useEffect(() => {
    if (!socket || !conversationId) return
    socket.emit('join-conversation', conversationId)
    return () => socket.emit('leave-conversation', conversationId)
  }, [socket, conversationId])
}
