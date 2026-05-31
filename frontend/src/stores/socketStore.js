import { create } from 'zustand'
import { io } from 'socket.io-client'

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: [],
  notifications: [],
  unreadCount: 0,

  connect: (token) => {
    const existing = get().socket
    if (existing?.connected) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket']
    })

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })

    socket.on('notification', (notification) => {
      set((state) => ({
        notifications: [notification, ...state.notifications],
        unreadCount: state.unreadCount + 1
      }))
    })

    set({ socket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null })
    }
  },

  setUnreadCount: (count) => set({ unreadCount: count }),
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}))
