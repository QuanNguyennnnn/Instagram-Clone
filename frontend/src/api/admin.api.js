import api from '../lib/axios'

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (userId, data) => api.patch(`/admin/users/${userId}/ban`, data),
  unbanUser: (userId) => api.patch(`/admin/users/${userId}/unban`),
  getPosts: (params) => api.get('/admin/posts', { params }),
  hidePost: (postId) => api.patch(`/admin/posts/${postId}/hide`),
  unhidePost: (postId) => api.patch(`/admin/posts/${postId}/unhide`),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (reportId, data) => api.patch(`/admin/reports/${reportId}/resolve`, data),
  getHashtags: (params) => api.get('/admin/hashtags', { params }),
}
