import api from '../lib/axios'

export const commentApi = {
  getComments: (postId, params) => api.get(`/comments/post/${postId}`, { params }),
  getReplies: (commentId, params) => api.get(`/comments/${commentId}/replies`, { params }),
  createComment: (postId, data) => api.post(`/comments/post/${postId}`, data),
  updateComment: (commentId, data) => api.patch(`/comments/${commentId}`, data),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  toggleLike: (commentId) => api.post(`/comments/${commentId}/like`),
}
