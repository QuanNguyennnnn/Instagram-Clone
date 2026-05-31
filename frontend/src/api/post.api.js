import api from '../lib/axios'

export const postApi = {
  createPost: (data) => {
    const form = new FormData()
    if (data.content) form.append('content', data.content)
    if (data.privacy) form.append('privacy', data.privacy)
    if (data.location) form.append('location', data.location)
    if (data.media) data.media.forEach((file) => form.append('media', file))
    return api.post('/posts', form)
  },
  getFeed: (params) => api.get('/posts/feed', { params }),
  getExplore: (params) => api.get('/posts/explore', { params }),
  getPostById: (postId) => api.get(`/posts/${postId}`),
  updatePost: (postId, data) => api.patch(`/posts/${postId}`, data),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  toggleLike: (postId) => api.post(`/posts/${postId}/like`),
  toggleSave: (postId) => api.post(`/posts/${postId}/save`),
  getSavedPosts: (params) => api.get('/posts/saved', { params }),
  getPostsByHashtag: (hashtag, params) => api.get(`/posts/hashtag/${hashtag}`, { params }),
  getPostsByUser: (userId, params) => api.get(`/posts/user/${userId}`, { params }),
}
