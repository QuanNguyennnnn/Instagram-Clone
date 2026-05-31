import api from '../lib/axios'

export const friendApi = {
  getFriends: (userId, params) => api.get(`/friends/${userId}`, { params }),
  getFriendRequests: (params) => api.get('/friends/requests', { params }),
  getSentRequests: (params) => api.get('/friends/requests/sent', { params }),
  getSuggestions: (limit = 10) => api.get('/friends/suggestions', { params: { limit } }),
  sendRequest: (userId) => api.post(`/friends/${userId}/request`),
  acceptRequest: (requestId) => api.patch(`/friends/requests/${requestId}/accept`),
  declineRequest: (requestId) => api.patch(`/friends/requests/${requestId}/decline`),
  cancelRequest: (requestId) => api.delete(`/friends/requests/${requestId}/cancel`),
  removeFriend: (userId) => api.delete(`/friends/${userId}/remove`),
}
