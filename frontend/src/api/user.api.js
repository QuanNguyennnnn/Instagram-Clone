import api from '../lib/axios'

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  changePassword: (data) => api.patch('/users/me/password', data),
  uploadAvatar: (file) => {
    const form = new FormData()
    form.append('avatar', file)
    return api.post('/users/me/avatar', form)
  },
  uploadCover: (file) => {
    const form = new FormData()
    form.append('cover', file)
    return api.post('/users/me/cover', form)
  },
  getUserProfile: (username) => api.get(`/users/${username}`),
  toggleFollow: (userId) => api.post(`/users/${userId}/follow`),
  getFollowers: (userId, params) => api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (userId, params) => api.get(`/users/${userId}/following`, { params }),
  getSuggestions: (limit = 10) => api.get('/users/suggestions', { params: { limit } }),
  searchUsers: (q, params) => api.get('/users/search', { params: { q, ...params } }),
}
