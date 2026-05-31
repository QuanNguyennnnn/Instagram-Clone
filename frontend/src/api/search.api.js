import api from '../lib/axios'

export const searchApi = {
  search: (q, type, params) => api.get('/search', { params: { q, type, ...params } }),
  getTrendingHashtags: (limit = 10) => api.get('/search/trending-hashtags', { params: { limit } }),
}
