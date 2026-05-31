import api from '../lib/axios'

export const messageApi = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (userId) => api.post(`/messages/conversations/${userId}`),
  getMessages: (conversationId, params) => api.get(`/messages/conversations/${conversationId}`, { params }),
  sendMessage: (conversationId, content) => api.post(`/messages/conversations/${conversationId}/send`, { content }),
  markRead: (conversationId) => api.patch(`/messages/conversations/${conversationId}/read`),
}
