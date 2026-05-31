import api from '../lib/axios'

export const aiApi = {
  generateCaption: (imageFile) => {
    const form = new FormData()
    form.append('image', imageFile)
    return api.post('/ai/caption', form)
  },
  getSmartReply: (conversationId) => api.get(`/ai/smart-reply/${conversationId}`),
}
